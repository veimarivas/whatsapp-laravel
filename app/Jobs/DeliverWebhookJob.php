<?php

namespace App\Jobs;

use App\Models\WebhookEndpoint;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Entrega un evento a un webhook externo, firmado con HMAC-SHA256
 * (cabecera X-Webhook-Signature) para que el receptor pueda verificar
 * la autenticidad — el espejo de lo que exigimos al webhook de Meta.
 */
class DeliverWebhookJob implements ShouldQueue
{
    use Queueable;

    /** Fallos consecutivos tras los cuales el endpoint se desactiva solo. */
    private const MAX_CONSECUTIVE_FAILURES = 10;

    public int $tries = 1;

    public function __construct(
        public readonly string $endpointId,
        public readonly string $event,
        public readonly array $data,
    ) {
    }

    public function handle(): void
    {
        $endpoint = WebhookEndpoint::find($this->endpointId);

        if (! $endpoint || ! $endpoint->is_active) {
            return;
        }

        $body = json_encode([
            'event' => $this->event,
            'data' => $this->data,
            'sent_at' => now()->toIso8601String(),
        ], JSON_UNESCAPED_UNICODE);

        $signature = 'sha256='.hash_hmac('sha256', $body, $endpoint->secret);

        try {
            Http::timeout(10)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-Webhook-Event' => $this->event,
                    'X-Webhook-Signature' => $signature,
                ])
                ->withBody($body, 'application/json')
                ->post($endpoint->url)
                ->throw();

            $endpoint->update(['last_delivery_at' => now(), 'failure_count' => 0]);
        } catch (\Throwable $e) {
            $endpoint->increment('failure_count');

            // Un endpoint muerto no debe consumir la cola para siempre.
            if ($endpoint->fresh()->failure_count >= self::MAX_CONSECUTIVE_FAILURES) {
                $endpoint->update(['is_active' => false]);
            }

            Log::warning('Webhook saliente falló', [
                'endpoint_id' => $endpoint->id,
                'event' => $this->event,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
