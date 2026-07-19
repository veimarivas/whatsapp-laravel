<?php

namespace App\Services\Ai;

use App\Models\AiConfig;
use App\Models\AiKnowledgeChunk;
use App\Models\Conversation;
use App\Models\Message;

/**
 * Construye el contexto (historial + base de conocimiento) y pide la
 * respuesta al proveedor. Lo usan el botón "Borrador IA" del inbox y
 * el bot de auto-respuesta.
 */
class ReplyGenerator
{
    public function __construct(private readonly Embeddings $embeddings)
    {
    }

    public function generate(AiConfig $config, Conversation $conversation): string
    {
        $history = $conversation->messages()
            ->whereNotNull('content_text')
            ->orderByDesc('created_at')
            ->limit(12)
            ->get()
            ->reverse()
            ->values();

        $lastCustomer = $history->last(fn (Message $m) => $m->sender_type === Message::SENDER_CUSTOMER);

        $messages = $history
            ->map(fn (Message $m) => [
                'role' => $m->sender_type === Message::SENDER_CUSTOMER ? 'user' : 'assistant',
                'content' => mb_substr($m->content_text, 0, 1000),
            ])
            ->all();

        // La API exige que el primer mensaje sea del usuario.
        while ($messages && $messages[0]['role'] !== 'user') {
            array_shift($messages);
        }

        if (empty($messages)) {
            $messages = [['role' => 'user', 'content' => 'Hola']];
        }

        return Client::for($config)->chat(
            $messages,
            $this->buildSystemPrompt($config, $conversation, $lastCustomer?->content_text),
        );
    }

    private function buildSystemPrompt(AiConfig $config, Conversation $conversation, ?string $query): string
    {
        $parts = [
            'Eres un asistente de atención al cliente que responde por WhatsApp en nombre del negocio.',
            'Responde en el mismo idioma del cliente, breve y directo (es un chat, no un correo).',
            'Si no sabes la respuesta, dilo y ofrece pasar con un agente humano. No inventes datos.',
        ];

        if ($config->system_prompt) {
            $parts[] = "Contexto del negocio:\n{$config->system_prompt}";
        }

        if ($name = $conversation->contact?->name) {
            $parts[] = "El cliente se llama {$name}.";
        }

        $knowledge = $this->retrieveKnowledge($config, $query);

        if ($knowledge !== '') {
            $parts[] = "Base de conocimiento del negocio (usa esto para responder):\n{$knowledge}";
        }

        return implode("\n\n", $parts);
    }

    /**
     * Recuperación híbrida: semántica (cosine sobre embeddings) cuando
     * la cuenta tiene clave de embeddings, léxica (FULLTEXT) si no —
     * el mismo esquema del original.
     */
    private function retrieveKnowledge(AiConfig $config, ?string $query): string
    {
        $accountId = $config->account_id;
        $query = trim((string) $query);

        if ($query === '') {
            return '';
        }

        if ($config->hasSemanticSearch()) {
            $semantic = $this->retrieveSemantic($config, $query);

            if ($semantic !== '') {
                return $semantic;
            }
            // Sin vectores todavía (o fallo del proveedor) → cae al léxico.
        }

        // Modo booleano con comodines para tolerar variaciones; los
        // términos de <3 letras aportan poco y MySQL suele ignorarlos.
        $terms = collect(preg_split('/\W+/u', $query))
            ->filter(fn ($t) => mb_strlen($t) >= 3)
            ->map(fn ($t) => $t.'*')
            ->take(8);

        if ($terms->isEmpty()) {
            return '';
        }

        $chunks = AiKnowledgeChunk::forAccount($accountId)
            ->whereRaw('MATCH(content) AGAINST(? IN BOOLEAN MODE)', [$terms->join(' ')])
            ->limit(4)
            ->pluck('content');

        // Fallback LIKE: el índice FULLTEXT de InnoDB no ve filas de la
        // transacción en curso y con muy pocos documentos puede quedarse
        // corto; un OR de LIKEs cubre ambos casos.
        if ($chunks->isEmpty()) {
            $chunks = AiKnowledgeChunk::forAccount($accountId)
                ->where(function ($query) use ($terms) {
                    foreach ($terms as $term) {
                        $query->orWhere('content', 'like', '%'.rtrim($term, '*').'%');
                    }
                })
                ->limit(4)
                ->pluck('content');
        }

        return $chunks
            ->map(fn ($c) => '- '.mb_substr($c, 0, 600))
            ->join("\n");
    }

    private function retrieveSemantic(AiConfig $config, string $query): string
    {
        try {
            $queryVector = $this->embeddings->embed([$query], $config->embeddings_api_key)[0] ?? null;
        } catch (\Throwable) {
            return '';
        }

        if (! $queryVector) {
            return '';
        }

        // Ranking en PHP (sin pgvector): suficiente para bases de
        // conocimiento de tamaño razonable; se acota a 500 chunks.
        return AiKnowledgeChunk::forAccount($config->account_id)
            ->whereNotNull('embedding')
            ->limit(500)
            ->get(['content', 'embedding'])
            ->map(fn (AiKnowledgeChunk $chunk) => [
                'content' => $chunk->content,
                'score' => AiKnowledgeChunk::cosineSimilarity($queryVector, $chunk->embedding ?? []),
            ])
            ->sortByDesc('score')
            ->take(4)
            ->filter(fn ($item) => $item['score'] > 0.2)
            ->map(fn ($item) => '- '.mb_substr($item['content'], 0, 600))
            ->join("\n");
    }
}
