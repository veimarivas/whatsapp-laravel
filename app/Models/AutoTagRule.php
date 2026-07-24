<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['account_id', 'tag_id', 'keyword', 'first_message_only', 'is_active'])]
class AutoTagRule extends Model
{
    use BelongsToAccount, HasUuids;

    protected function casts(): array
    {
        return [
            'first_message_only' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function tag(): BelongsTo
    {
        return $this->belongsTo(Tag::class);
    }
}
