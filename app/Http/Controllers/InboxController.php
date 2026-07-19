<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\WhatsappConfig;
use App\Services\WhatsApp\MetaApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    public function index(Request $request): Response
    {
        $accountId = $request->user()->account_id;

        return Inertia::render('Inbox/Index', [
            'hasWhatsappConfig' => WhatsappConfig::forAccount($accountId)
                ->where('status', 'connected')
                ->exists(),
            'hasAi' => \App\Models\AiConfig::forAccount($accountId)->where('is_active', true)->exists(),
            'members' => \App\Models\User::where('account_id', $accountId)->get(['id', 'name']),
        ]);
    }

    /** Lista de conversaciones (JSON, la UI hace polling). */
    public function conversations(Request $request): JsonResponse
    {
        $conversations = Conversation::forAccount($request->user()->account_id)
            ->with(['contact:id,name,phone,avatar_url', 'assignedAgent:id,name'])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->orderByDesc('last_message_at')
            ->limit(100)
            ->get();

        return response()->json($conversations);
    }

    /** Mensajes de una conversación (JSON, la UI hace polling). */
    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $messages = $conversation->messages()
            ->with([
                'reactions:id,message_id,emoji,actor_type',
                'replyTo:id,content_text,content_type,sender_type',
            ])
            ->orderBy('created_at')
            ->limit(500)
            ->get();

        return response()->json($messages);
    }

    /** Envía un mensaje de texto y lo persiste. */
    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $validated = $request->validate([
            'text' => 'required|string|max:4096',
            'reply_to_message_id' => 'nullable|uuid',
        ]);

        // Mensaje citado: debe ser de esta misma conversación.
        $replyTo = null;
        if ($validated['reply_to_message_id'] ?? null) {
            $replyTo = $conversation->messages()->find($validated['reply_to_message_id']);
        }

        $config = WhatsappConfig::forAccount($request->user()->account_id)
            ->where('status', 'connected')
            ->firstOrFail();

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_type' => Message::SENDER_AGENT,
            'sender_id' => $request->user()->id,
            'content_type' => 'text',
            'content_text' => $validated['text'],
            'reply_to_message_id' => $replyTo?->id,
            'status' => 'sending',
        ]);

        try {
            $result = MetaApi::for($config)->sendText(
                $conversation->contact->phone_normalized ?? $conversation->contact->phone,
                $validated['text'],
                $replyTo?->message_id,
            );

            $message->update([
                'message_id' => $result['messages'][0]['id'] ?? null,
                'status' => 'sent',
            ]);
        } catch (\RuntimeException $e) {
            $message->update(['status' => 'failed']);

            return response()->json(['message' => $e->getMessage()], 502);
        }

        $conversation->update([
            'last_message_text' => $validated['text'],
            'last_message_at' => now(),
        ]);

        // Handoff humano: el flow cede el control y el bot IA se apaga
        // en esta conversación (mismo comportamiento que el original).
        app(\App\Services\Flows\Runner::class)->pauseForConversation($conversation);

        if (! $conversation->ai_autoreply_disabled) {
            $conversation->update(['ai_autoreply_disabled' => true]);
        }

        return response()->json($message->fresh());
    }

    /** Marca la conversación como leída. */
    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $conversation->update(['unread_count' => 0]);

        return response()->json(['ok' => true]);
    }

    /** Reacciona con un emoji a un mensaje (o la quita con emoji vacío). */
    public function react(Request $request, Message $message): JsonResponse
    {
        $conversation = $message->conversation;
        $this->authorizeConversation($request, $conversation);

        $validated = $request->validate(['emoji' => 'nullable|string|max:16']);
        $emoji = $validated['emoji'] ?? '';

        if (! $message->message_id) {
            return response()->json(['message' => 'Este mensaje no se puede reaccionar (sin wamid).'], 422);
        }

        $config = WhatsappConfig::forAccount($conversation->account_id)
            ->where('status', 'connected')
            ->firstOrFail();

        try {
            MetaApi::for($config)->sendReaction(
                $conversation->contact->phone_normalized ?? $conversation->contact->phone,
                $message->message_id,
                $emoji, // vacío = retirar la reacción (contrato de Meta)
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        if ($emoji === '') {
            $message->reactions()
                ->where('actor_type', 'agent')
                ->where('actor_id', $request->user()->id)
                ->delete();
        } else {
            \App\Models\MessageReaction::updateOrCreate(
                ['message_id' => $message->id, 'actor_type' => 'agent', 'actor_id' => $request->user()->id],
                ['conversation_id' => $conversation->id, 'emoji' => $emoji],
            );
        }

        return response()->json(['ok' => true]);
    }

    /** Notas internas del contacto de la conversación. */
    public function notes(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        return response()->json(
            \App\Models\ContactNote::where('contact_id', $conversation->contact_id)
                ->with('author:id,name')
                ->orderByDesc('created_at')
                ->limit(50)
                ->get(),
        );
    }

    public function addNote(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $validated = $request->validate(['text' => 'required|string|max:2000']);

        $note = \App\Models\ContactNote::create([
            'account_id' => $conversation->account_id,
            'contact_id' => $conversation->contact_id,
            'user_id' => $request->user()->id,
            'note_text' => $validated['text'],
        ]);

        return response()->json($note->load('author:id,name'), 201);
    }

    /** Envía un archivo (imagen, video, audio o documento). */
    public function sendMedia(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $validated = $request->validate([
            'file' => 'required|file|max:16384', // 16 MB (límite de Meta para la mayoría de tipos)
            'caption' => 'nullable|string|max:1024',
        ]);

        $file = $validated['file'];

        try {
            $message = app(\App\Services\WhatsApp\Messenger::class)->sendMedia(
                $conversation,
                $file->get(),
                $file->getMimeType() ?? 'application/octet-stream',
                $file->getClientOriginalName(),
                $validated['caption'] ?? null,
                Message::SENDER_AGENT,
                $request->user()->id,
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        app(\App\Services\Flows\Runner::class)->pauseForConversation($conversation);

        return response()->json($message);
    }

    /** Asigna la conversación a un agente y le notifica. */
    public function assign(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $validated = $request->validate(['agent_id' => 'nullable|uuid']);
        $agentId = $validated['agent_id'] ?? null;

        if ($agentId !== null) {
            $isMember = \App\Models\User::where('id', $agentId)
                ->where('account_id', $request->user()->account_id)
                ->exists();
            abort_unless($isMember, 422);
        }

        $conversation->update(['assigned_agent_id' => $agentId]);

        if ($agentId && $agentId !== $request->user()->id) {
            \App\Models\Notification::create([
                'account_id' => $conversation->account_id,
                'user_id' => $agentId,
                'type' => 'conversation_assigned',
                'conversation_id' => $conversation->id,
                'contact_id' => $conversation->contact_id,
                'actor_user_id' => $request->user()->id,
                'title' => 'Conversación asignada',
                'body' => 'Te asignaron la conversación con '.
                    ($conversation->contact->name ?? $conversation->contact->phone),
            ]);
        }

        return response()->json($conversation->fresh()->load('assignedAgent:id,name'));
    }

    /** Borrador IA para el cuadro de respuesta. */
    public function aiDraft(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $request->merge(['conversation_id' => $conversation->id]);

        return app(AiController::class)->draft($request, app(\App\Services\Ai\ReplyGenerator::class));
    }

    /** Cambia el estado (open / pending / closed). */
    public function updateStatus(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $validated = $request->validate(['status' => 'required|in:open,pending,closed']);

        $conversation->update(['status' => $validated['status']]);

        return response()->json($conversation->fresh());
    }

    private function authorizeConversation(Request $request, Conversation $conversation): void
    {
        abort_if($conversation->account_id !== $request->user()->account_id, 403);
    }
}
