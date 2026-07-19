<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Embeddings vía OpenAI (text-embedding-3-small, 1536 dims) — igual
 * que el original: la clave de embeddings es independiente de la del
 * chat, y habilita el modo semántico de la base de conocimiento.
 */
class Embeddings
{
    public const MODEL = 'text-embedding-3-small';

    /**
     * @param  string[]  $texts
     * @return array<int, array<int, float>>
     */
    public function embed(array $texts, string $apiKey): array
    {
        if (empty($texts)) {
            return [];
        }

        $response = Http::withToken($apiKey)
            ->timeout(30)
            ->post('https://api.openai.com/v1/embeddings', [
                'model' => self::MODEL,
                'input' => array_map(fn ($t) => mb_substr($t, 0, 8000), array_values($texts)),
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Embeddings: '.($response->json('error.message') ?? $response->status()));
        }

        return collect($response->json('data') ?? [])
            ->sortBy('index')
            ->pluck('embedding')
            ->all();
    }
}
