<?php

namespace App\Jobs;

use App\Models\AiConfig;
use App\Models\Conversation;
use App\Models\FlowRun;
use App\Services\Ai\ReplyGenerator;
use App\Services\WhatsApp\Messenger;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Bot de auto-respuesta IA. Reglas (idénticas al original):
 *  - Solo si la config está activa y auto_reply_enabled.
 *  - Respeta el apagado por conversación (ai_autoreply_disabled,
 *    que se activa al responder un agente — handoff humano limpio).
 *  - Tope de respuestas por conversación (auto_reply_max_per_conversation).
 *  - No interfiere con un flow activo (el chatbot tiene prioridad).
 */
class AiAutoReplyJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(public readonly string $conversationId)
    {
    }

    public function handle(ReplyGenerator $generator, Messenger $messenger): void
    {
        $conversation = Conversation::find($this->conversationId);

        if (! $conversation || $conversation->ai_autoreply_disabled) {
            return;
        }

        $config = AiConfig::forAccount($conversation->account_id)
            ->where('is_active', true)
            ->where('auto_reply_enabled', true)
            ->first();

        if (! $config || $conversation->ai_reply_count >= $config->auto_reply_max_per_conversation) {
            return;
        }

        $flowActive = FlowRun::where('conversation_id', $conversation->id)
            ->where('status', FlowRun::STATUS_ACTIVE)
            ->exists();

        if ($flowActive) {
            return;
        }

        try {
            $reply = $generator->generate($config, $conversation);

            if ($reply === '') {
                return;
            }

            $messenger->sendText($conversation, $reply);
            $conversation->increment('ai_reply_count');
        } catch (\Throwable $e) {
            Log::warning('Auto-respuesta IA falló', [
                'conversation_id' => $conversation->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
