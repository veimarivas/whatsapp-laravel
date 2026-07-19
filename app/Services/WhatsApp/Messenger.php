<?php

namespace App\Services\WhatsApp;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\WhatsappConfig;
use RuntimeException;

/**
 * Envío de mensajes salientes con persistencia: crea la fila en
 * `messages`, llama a Meta y actualiza la conversación. Lo usan el
 * inbox (agentes) y el motor de automatizaciones (bot).
 */
class Messenger
{
    /** Sustituye tokens {name} {phone} {email} {company} del contacto. */
    public static function interpolate(string $text, Contact $contact): string
    {
        return strtr($text, [
            '{name}' => $contact->name ?? '',
            '{phone}' => $contact->phone ?? '',
            '{email}' => $contact->email ?? '',
            '{company}' => $contact->company ?? '',
        ]);
    }

    /**
     * Envía texto en una conversación. Lanza RuntimeException si Meta
     * rechaza; la fila del mensaje queda con status=failed.
     */
    public function sendText(
        Conversation $conversation,
        string $text,
        string $senderType = Message::SENDER_BOT,
        ?string $senderId = null,
    ): Message {
        $config = WhatsappConfig::forAccount($conversation->account_id)
            ->where('status', 'connected')
            ->first();

        if (! $config) {
            throw new RuntimeException('WhatsApp no está conectado en esta cuenta.');
        }

        $contact = $conversation->contact;

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_type' => $senderType,
            'sender_id' => $senderId,
            'content_type' => 'text',
            'content_text' => $text,
            'status' => 'sending',
        ]);

        try {
            $result = MetaApi::for($config)->sendText(
                $contact->phone_normalized ?? $contact->phone,
                $text,
            );
        } catch (\Throwable $e) {
            $message->update(['status' => 'failed']);

            throw new RuntimeException($e->getMessage(), previous: $e);
        }

        $message->update([
            'message_id' => $result['messages'][0]['id'] ?? null,
            'status' => 'sent',
        ]);

        $conversation->update([
            'last_message_text' => $text,
            'last_message_at' => now(),
        ]);

        return $message->fresh();
    }

    /**
     * Sube y envía un archivo (imagen, video, audio o documento).
     * El tipo de WhatsApp se deduce del MIME.
     */
    public function sendMedia(
        Conversation $conversation,
        string $contents,
        string $mimeType,
        string $filename,
        ?string $caption = null,
        string $senderType = Message::SENDER_AGENT,
        ?string $senderId = null,
    ): Message {
        $config = WhatsappConfig::forAccount($conversation->account_id)
            ->where('status', 'connected')
            ->first();

        if (! $config) {
            throw new RuntimeException('WhatsApp no está conectado en esta cuenta.');
        }

        $type = match (true) {
            str_starts_with($mimeType, 'image/') => 'image',
            str_starts_with($mimeType, 'video/') => 'video',
            str_starts_with($mimeType, 'audio/') => 'audio',
            default => 'document',
        };

        $api = MetaApi::for($config);
        $contact = $conversation->contact;

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_type' => $senderType,
            'sender_id' => $senderId,
            'content_type' => $type,
            'content_text' => $caption ?? ($type === 'document' ? $filename : null),
            'status' => 'sending',
        ]);

        try {
            $mediaId = $api->uploadMedia($contents, $mimeType, $filename);
            $result = $api->sendMedia(
                $contact->phone_normalized ?? $contact->phone,
                $type,
                $mediaId,
                $caption,
                $filename,
            );
        } catch (\Throwable $e) {
            $message->update(['status' => 'failed']);

            throw new RuntimeException($e->getMessage(), previous: $e);
        }

        $message->update([
            'media_url' => $mediaId, // se sirve vía el proxy /whatsapp/media/{id}
            'message_id' => $result['messages'][0]['id'] ?? null,
            'status' => 'sent',
        ]);

        $conversation->update([
            'last_message_text' => $caption ?? "[{$type}]",
            'last_message_at' => now(),
        ]);

        return $message->fresh();
    }

    /**
     * Envía un mensaje interactivo (botones o lista) y lo persiste.
     * $send recibe el MetaApi ya configurado y devuelve la respuesta.
     */
    public function sendInteractive(Conversation $conversation, string $text, callable $send): Message
    {
        $config = WhatsappConfig::forAccount($conversation->account_id)
            ->where('status', 'connected')
            ->first();

        if (! $config) {
            throw new RuntimeException('WhatsApp no está conectado en esta cuenta.');
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_type' => Message::SENDER_BOT,
            'content_type' => 'interactive',
            'content_text' => $text,
            'status' => 'sending',
        ]);

        try {
            $result = $send(MetaApi::for($config), $conversation->contact);
        } catch (\Throwable $e) {
            $message->update(['status' => 'failed']);

            throw new RuntimeException($e->getMessage(), previous: $e);
        }

        $message->update([
            'message_id' => $result['messages'][0]['id'] ?? null,
            'status' => 'sent',
        ]);

        $conversation->update([
            'last_message_text' => $text,
            'last_message_at' => now(),
        ]);

        return $message->fresh();
    }

    /** Busca o crea la conversación abierta de un contacto. */
    public function resolveConversation(Contact $contact): Conversation
    {
        return Conversation::firstOrCreate(
            ['account_id' => $contact->account_id, 'contact_id' => $contact->id],
            ['status' => Conversation::STATUS_OPEN],
        );
    }
}
