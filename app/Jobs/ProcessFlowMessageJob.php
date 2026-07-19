<?php

namespace App\Jobs;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\Flows\Runner;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/** Pasa cada mensaje entrante por el runner de flows (avanza o inicia). */
class ProcessFlowMessageJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(
        public readonly string $contactId,
        public readonly string $conversationId,
        public readonly string $messageId,
    ) {
    }

    public function handle(Runner $runner): void
    {
        $contact = Contact::find($this->contactId);
        $conversation = Conversation::find($this->conversationId);
        $message = Message::find($this->messageId);

        if ($contact && $conversation && $message) {
            $runner->handleInbound($contact, $conversation, $message);
        }
    }
}
