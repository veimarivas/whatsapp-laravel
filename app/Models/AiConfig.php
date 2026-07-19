<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'account_id', 'created_by', 'provider', 'model', 'api_key', 'embeddings_api_key',
    'system_prompt', 'is_active', 'auto_reply_enabled', 'auto_reply_max_per_conversation',
])]
class AiConfig extends Model
{
    use BelongsToAccount, HasUuids;

    protected function casts(): array
    {
        return [
            'api_key' => 'encrypted',            // clave BYO del proveedor
            'embeddings_api_key' => 'encrypted', // opcional, habilita búsqueda semántica
            'is_active' => 'boolean',
            'auto_reply_enabled' => 'boolean',
        ];
    }

    public function hasSemanticSearch(): bool
    {
        return ! empty($this->embeddings_api_key);
    }
}
