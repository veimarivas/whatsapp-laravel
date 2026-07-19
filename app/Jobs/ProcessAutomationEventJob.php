<?php

namespace App\Jobs;

use App\Models\Contact;
use App\Models\Conversation;
use App\Services\Automations\Engine;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Desacopla el disparo de automatizaciones del request que lo origina
 * (webhook de Meta o creación manual de contacto): el webhook responde
 * rápido y los envíos del bot corren en el worker.
 */
class ProcessAutomationEventJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(
        public readonly string $event,
        public readonly string $contactId,
        public readonly ?string $conversationId = null,
        public readonly ?string $messageText = null,
    ) {
    }

    public function handle(Engine $engine): void
    {
        $contact = Contact::find($this->contactId);

        if (! $contact) {
            return;
        }

        $engine->fire(
            $this->event,
            $contact,
            $this->conversationId ? Conversation::find($this->conversationId) : null,
            $this->messageText,
        );
    }
}
