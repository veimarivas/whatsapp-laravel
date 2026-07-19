<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['document_id', 'account_id', 'chunk_index', 'content', 'embedding'])]
class AiKnowledgeChunk extends Model
{
    use BelongsToAccount, HasUuids;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['embedding' => 'array'];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(AiKnowledgeDocument::class, 'document_id');
    }

    /** Búsqueda léxica — FULLTEXT de MySQL (modo fallback del original). */
    public function scopeSearchLexical(Builder $query, string $term): Builder
    {
        return $query->whereFullText('content', $term);
    }

    /** Similitud coseno para el modo semántico (embeddings en JSON). */
    public static function cosineSimilarity(array $a, array $b): float
    {
        $dot = $normA = $normB = 0.0;
        foreach ($a as $i => $v) {
            $dot += $v * ($b[$i] ?? 0.0);
            $normA += $v * $v;
            $normB += ($b[$i] ?? 0.0) ** 2;
        }

        return ($normA && $normB) ? $dot / (sqrt($normA) * sqrt($normB)) : 0.0;
    }
}
