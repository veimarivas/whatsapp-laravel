<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\WhatsappConfig;
use App\Services\WhatsApp\Messenger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * API pública v1 — equivalente a /api/v1 del original.
 * Autenticada por API key (middleware api.key) con scopes.
 */
class ApiController extends Controller
{
    private function accountId(Request $request): string
    {
        return $request->attributes->get('account_id');
    }

    public function me(Request $request): JsonResponse
    {
        $key = $request->attributes->get('api_key');
        $account = Account::find($this->accountId($request));

        return response()->json([
            'account' => ['id' => $account->id, 'name' => $account->name],
            'key' => ['name' => $key->name, 'scopes' => $key->scopes],
        ]);
    }

    public function contacts(Request $request): JsonResponse
    {
        $contacts = Contact::forAccount($this->accountId($request))
            ->with('tags:id,name')
            ->when($request->query('q'), fn ($q, $term) => $q
                ->where(fn ($w) => $w->where('name', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%")))
            // Filtro server-side por tag — lo usa meta_ads para armar
            // Custom Audiences sin paginar el catálogo completo.
            ->when($request->query('tag_id'), fn ($q, $tagId) => $q
                ->whereHas('tags', fn ($t) => $t->where('tags.id', $tagId)))
            ->orderByDesc('created_at')
            ->paginate(min((int) $request->query('per_page', 25), 100));

        return response()->json($contacts);
    }

    public function storeContact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string|max:32',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'company' => 'nullable|string|max:255',
        ]);

        $accountId = $this->accountId($request);
        $normalized = Contact::normalizePhone($validated['phone']);

        $existing = Contact::forAccount($accountId)->where('phone_normalized', $normalized)->first();

        if ($existing) {
            return response()->json(['message' => 'Contact already exists.', 'contact' => $existing], 409);
        }

        $contact = Contact::create([...$validated, 'account_id' => $accountId]);

        return response()->json($contact, 201);
    }

    public function showContact(Request $request, string $id): JsonResponse
    {
        $contact = Contact::forAccount($this->accountId($request))
            ->with(['tags:id,name', 'customValues'])
            ->findOrFail($id);

        return response()->json($contact);
    }

    public function updateContact(Request $request, string $id): JsonResponse
    {
        $contact = Contact::forAccount($this->accountId($request))->findOrFail($id);

        $contact->update($request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'company' => 'nullable|string|max:255',
        ]));

        return response()->json($contact->fresh());
    }

    public function destroyContact(Request $request, string $id): JsonResponse
    {
        Contact::forAccount($this->accountId($request))->findOrFail($id)->delete();

        return response()->json(['deleted' => true]);
    }

    public function conversations(Request $request): JsonResponse
    {
        $conversations = Conversation::forAccount($this->accountId($request))
            ->with('contact:id,name,phone')
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('last_message_at')
            ->paginate(min((int) $request->query('per_page', 25), 100));

        return response()->json($conversations);
    }

    public function messages(Request $request, string $id): JsonResponse
    {
        $conversation = Conversation::forAccount($this->accountId($request))->findOrFail($id);

        return response()->json(
            $conversation->messages()->orderByDesc('created_at')->paginate(50),
        );
    }

    public function broadcasts(Request $request): JsonResponse
    {
        return response()->json(
            \App\Models\Broadcast::forAccount($this->accountId($request))
                ->orderByDesc('created_at')
                ->paginate(min((int) $request->query('per_page', 25), 100)),
        );
    }

    public function showBroadcast(Request $request, string $id): JsonResponse
    {
        $broadcast = \App\Models\Broadcast::forAccount($this->accountId($request))->findOrFail($id);

        return response()->json([
            ...$broadcast->toArray(),
            'recipients_by_status' => $broadcast->recipients()
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
        ]);
    }

    /** Crea y envía (o programa) un broadcast con una plantilla aprobada. */
    public function storeBroadcast(Request $request, \App\Services\Broadcasts\Creator $creator): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'template_name' => 'required|string',
            'template_language' => 'required|string|max:10',
            'template_variables' => 'nullable|array',
            'template_variables.*' => 'string|max:500',
            'header_media_url' => 'nullable|url|max:2048',
            'audience' => 'required|in:all,tags',
            'tag_ids' => 'required_if:audience,tags|array',
            'tag_ids.*' => 'uuid',
            'scheduled_at' => 'nullable|date|after:now',
        ]);

        $connected = WhatsappConfig::forAccount($this->accountId($request))
            ->where('status', 'connected')
            ->exists();

        if (! $connected) {
            return response()->json(['message' => 'WhatsApp is not connected.'], 422);
        }

        try {
            $broadcast = $creator->create($this->accountId($request), $validated);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($broadcast, 201);
    }

    /** Envía un texto a un teléfono (crea contacto/conversación si no existen). */
    public function sendMessage(Request $request, Messenger $messenger): JsonResponse
    {
        $validated = $request->validate([
            'to' => 'required|string|max:32',
            'text' => 'required|string|max:4096',
        ]);

        $accountId = $this->accountId($request);

        $connected = WhatsappConfig::forAccount($accountId)->where('status', 'connected')->exists();

        if (! $connected) {
            return response()->json(['message' => 'WhatsApp is not connected.'], 422);
        }

        $contact = Contact::firstOrCreate(
            ['account_id' => $accountId, 'phone_normalized' => Contact::normalizePhone($validated['to'])],
            ['phone' => $validated['to']],
        );

        $conversation = $messenger->resolveConversation($contact);

        try {
            $message = $messenger->sendText($conversation, $validated['text'], Message::SENDER_AGENT);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json($message, 201);
    }
}
