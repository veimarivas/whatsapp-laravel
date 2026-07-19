<?php

namespace App\Jobs;

use App\Models\Broadcast;
use App\Models\BroadcastRecipient;
use App\Models\Contact;
use App\Models\WhatsappConfig;
use App\Services\WhatsApp\MetaApi;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Envía un broadcast completo: recorre los destinatarios pendientes,
 * sustituye variables por contacto y envía la plantilla vía Meta.
 * Equivalente al motor de src/lib/whatsapp/broadcast-core.ts.
 */
class SendBroadcastJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 3600;

    public int $tries = 1;

    private ?string $headerType = null;

    private bool $headerTypeResolved = false;

    public function __construct(public readonly string $broadcastId)
    {
    }

    public function handle(): void
    {
        $broadcast = Broadcast::find($this->broadcastId);

        if (! $broadcast || ! in_array($broadcast->status, ['scheduled', 'sending'], true)) {
            return;
        }

        $config = WhatsappConfig::forAccount($broadcast->account_id)
            ->where('status', 'connected')
            ->first();

        if (! $config) {
            $broadcast->update(['status' => 'failed']);

            return;
        }

        $broadcast->update(['status' => 'sending']);
        $api = MetaApi::for($config);

        $broadcast->recipients()
            ->where('status', 'pending')
            ->with('contact')
            ->chunkById(50, function ($recipients) use ($broadcast, $api) {
                foreach ($recipients as $recipient) {
                    $this->sendToRecipient($broadcast, $api, $recipient);
                }
            });

        $broadcast->refresh();
        $broadcast->update(['status' => $broadcast->sent_count > 0 ? 'sent' : 'failed']);

        app(\App\Services\Webhooks\Dispatcher::class)->dispatch($broadcast->account_id, 'broadcast.completed', [
            'broadcast' => $broadcast->only([
                'id', 'name', 'status', 'total_recipients', 'sent_count', 'failed_count',
            ]),
        ]);
    }

    private function sendToRecipient(Broadcast $broadcast, MetaApi $api, BroadcastRecipient $recipient): void
    {
        $contact = $recipient->contact;

        if (! $contact) {
            $recipient->update(['status' => 'failed', 'error_message' => 'Contacto eliminado']);
            $broadcast->increment('failed_count');

            return;
        }

        try {
            $components = $this->buildComponents($broadcast, $contact);

            $result = $api->sendTemplate(
                $contact->phone_normalized ?? $contact->phone,
                $broadcast->template_name,
                $broadcast->template_language,
                $components,
            );

            $recipient->update([
                'status' => 'sent',
                'sent_at' => now(),
                'whatsapp_message_id' => $result['messages'][0]['id'] ?? null,
            ]);
            $broadcast->increment('sent_count');
        } catch (\Throwable $e) {
            Log::warning('Broadcast: fallo enviando a destinatario', [
                'recipient_id' => $recipient->id,
                'error' => $e->getMessage(),
            ]);

            $recipient->update([
                'status' => 'failed',
                'error_message' => mb_substr($e->getMessage(), 0, 500),
            ]);
            $broadcast->increment('failed_count');
        }
    }

    /**
     * template_variables es un array posicional de strings para los
     * parámetros {{1}}, {{2}}… del body. Cada valor admite tokens
     * {name}, {phone}, {email}, {company} sustituidos por contacto.
     * Si el broadcast trae header_media_url, se añade el componente de
     * encabezado (imagen/video/documento por link) que Meta exige para
     * plantillas con header multimedia.
     */
    private function buildComponents(Broadcast $broadcast, Contact $contact): array
    {
        $components = [];

        if ($broadcast->header_media_url) {
            if (! $this->headerTypeResolved) {
                $this->headerType = \App\Models\MessageTemplate::forAccount($broadcast->account_id)
                    ->where('name', $broadcast->template_name)
                    ->where('language', $broadcast->template_language)
                    ->value('header_type');
                $this->headerTypeResolved = true;
            }
            $headerType = $this->headerType;

            if (in_array($headerType, ['image', 'video', 'document'], true)) {
                $components[] = [
                    'type' => 'header',
                    'parameters' => [[
                        'type' => $headerType,
                        $headerType => ['link' => $broadcast->header_media_url],
                    ]],
                ];
            }
        }

        $variables = $broadcast->template_variables ?? [];

        if (! empty($variables)) {
            $replacements = [
                '{name}' => $contact->name ?? '',
                '{phone}' => $contact->phone ?? '',
                '{email}' => $contact->email ?? '',
                '{company}' => $contact->company ?? '',
            ];

            $components[] = [
                'type' => 'body',
                'parameters' => array_map(fn (string $value) => [
                    'type' => 'text',
                    'text' => strtr($value, $replacements),
                ], array_values($variables)),
            ];
        }

        return $components;
    }
}
