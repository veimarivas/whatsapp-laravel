<?php

namespace App\Http\Controllers;

use App\Models\AiConfig;
use App\Models\AiKnowledgeDocument;
use App\Models\Conversation;
use App\Services\Ai\Chunker;
use App\Services\Ai\ReplyGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AiController extends Controller
{
    public function edit(Request $request): Response
    {
        $accountId = $request->user()->account_id;
        $config = AiConfig::forAccount($accountId)->first();

        return Inertia::render('Settings/Ai', [
            'config' => $config ? [
                'provider' => $config->provider,
                'model' => $config->model,
                'system_prompt' => $config->system_prompt,
                'is_active' => $config->is_active,
                'auto_reply_enabled' => $config->auto_reply_enabled,
                'auto_reply_max_per_conversation' => $config->auto_reply_max_per_conversation,
                'has_key' => true,
                'has_embeddings_key' => $config->hasSemanticSearch(),
            ] : null,
            'documents' => AiKnowledgeDocument::forAccount($accountId)
                ->withCount('chunks')
                ->orderByDesc('updated_at')
                ->get(['id', 'title', 'updated_at']),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'provider' => ['required', Rule::in(['openai', 'anthropic'])],
            'model' => 'required|string|max:100',
            'api_key' => 'nullable|string',
            'embeddings_api_key' => 'nullable|string',
            'system_prompt' => 'nullable|string|max:4000',
            'is_active' => 'boolean',
            'auto_reply_enabled' => 'boolean',
            'auto_reply_max_per_conversation' => 'integer|between:1,20',
        ]);

        $accountId = $request->user()->account_id;
        $existing = AiConfig::forAccount($accountId)->first();

        if (! $existing && empty($validated['api_key'])) {
            return back()->withErrors(['api_key' => 'La API key es obligatoria.']);
        }

        if (empty($validated['api_key'])) {
            unset($validated['api_key']); // vacío = conservar la actual
        }

        if (empty($validated['embeddings_api_key'])) {
            unset($validated['embeddings_api_key']); // vacío = conservar la actual
        }

        AiConfig::updateOrCreate(
            ['account_id' => $accountId],
            [...$validated, 'created_by' => $request->user()->id],
        );

        return back()->with('success', 'Configuración de IA guardada.');
    }

    /** Borrador para el inbox: no envía nada, devuelve el texto sugerido. */
    public function draft(Request $request, ReplyGenerator $generator): JsonResponse
    {
        $validated = $request->validate(['conversation_id' => 'required|uuid']);

        $conversation = Conversation::forAccount($request->user()->account_id)
            ->findOrFail($validated['conversation_id']);

        $config = AiConfig::forAccount($request->user()->account_id)
            ->where('is_active', true)
            ->first();

        if (! $config) {
            return response()->json(['message' => 'Configura la IA en Ajustes primero.'], 422);
        }

        try {
            return response()->json(['draft' => $generator->generate($config, $conversation)]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
    }

    public function storeDocument(Request $request, Chunker $chunker): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string|max:100000',
        ]);

        $document = AiKnowledgeDocument::create([
            ...$validated,
            'account_id' => $request->user()->account_id,
            'created_by' => $request->user()->id,
        ]);

        $chunks = $chunker->reindex($document);

        return back()->with('success', "Documento guardado ({$chunks} fragmentos indexados).");
    }

    /** Re-trocea y re-vectoriza toda la base de conocimiento. */
    public function reindex(Request $request, Chunker $chunker): RedirectResponse
    {
        $documents = AiKnowledgeDocument::forAccount($request->user()->account_id)->get();

        $total = 0;
        foreach ($documents as $document) {
            $total += $chunker->reindex($document);
        }

        return back()->with('success', "Reindexados {$documents->count()} documentos ({$total} fragmentos).");
    }

    public function destroyDocument(Request $request, AiKnowledgeDocument $document): RedirectResponse
    {
        abort_if($document->account_id !== $request->user()->account_id, 403);

        $document->delete();

        return back()->with('success', 'Documento eliminado.');
    }
}
