<?php

namespace App\Services\Ai;

use App\Models\AiConfig;
use App\Models\AiKnowledgeDocument;
use Illuminate\Support\Facades\Log;

/** Trocea documentos en fragmentos indexables (~800 caracteres). */
class Chunker
{
    // Chunks grandes: un programa académico completo (metadata + hasta 8
    // módulos con sus docentes y horarios) cabe entero en un solo chunk,
    // así el retrieval trae toda la info del programa junta y la IA no
    // pierde contexto ni tiene que "adivinar" datos ausentes.
    private const MAX_CHUNK = 3000;

    public function __construct(private readonly Embeddings $embeddings)
    {
    }

    public function reindex(AiKnowledgeDocument $document): int
    {
        $document->chunks()->delete();

        $chunks = $this->split($document->content);

        // Modo semántico: si la cuenta tiene clave de embeddings, cada
        // fragmento se vectoriza. Un fallo aquí no bloquea el guardado —
        // el modo léxico (FULLTEXT) sigue funcionando sin vectores.
        $vectors = [];
        $config = AiConfig::forAccount($document->account_id)->first();

        if ($config?->hasSemanticSearch()) {
            try {
                $vectors = $this->embeddings->embed($chunks, $config->embeddings_api_key);
            } catch (\Throwable $e) {
                Log::warning('Embeddings fallaron; el documento queda solo con índice léxico', [
                    'document_id' => $document->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        foreach ($chunks as $index => $content) {
            $document->chunks()->create([
                'account_id' => $document->account_id,
                'chunk_index' => $index,
                'content' => $content,
                'embedding' => $vectors[$index] ?? null,
            ]);
        }

        return count($chunks);
    }

    /** Corta por párrafos y agrupa sin pasarse del tamaño máximo. */
    public function split(string $content): array
    {
        $paragraphs = preg_split('/\n{2,}/', trim($content)) ?: [];
        $chunks = [];
        $current = '';

        foreach ($paragraphs as $paragraph) {
            $paragraph = trim($paragraph);

            if ($paragraph === '') {
                continue;
            }

            // Un párrafo gigante se corta duro.
            while (mb_strlen($paragraph) > self::MAX_CHUNK) {
                if ($current !== '') {
                    $chunks[] = $current;
                    $current = '';
                }
                $chunks[] = mb_substr($paragraph, 0, self::MAX_CHUNK);
                $paragraph = mb_substr($paragraph, self::MAX_CHUNK);
            }

            if ($current !== '' && mb_strlen($current."\n\n".$paragraph) > self::MAX_CHUNK) {
                $chunks[] = $current;
                $current = $paragraph;
            } else {
                $current = $current === '' ? $paragraph : $current."\n\n".$paragraph;
            }
        }

        if ($current !== '') {
            $chunks[] = $current;
        }

        return $chunks;
    }
}
