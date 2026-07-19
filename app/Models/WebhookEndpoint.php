<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'account_id', 'created_by', 'url', 'secret', 'events',
    'is_active', 'last_delivery_at', 'failure_count',
])]
class WebhookEndpoint extends Model
{
    use BelongsToAccount, HasUuids;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'secret' => 'encrypted', // secreto HMAC de firma
            'events' => 'array',
            'is_active' => 'boolean',
            'last_delivery_at' => 'datetime',
        ];
    }

    public function subscribesTo(string $event): bool
    {
        return $this->is_active && in_array($event, $this->events ?? [], true);
    }
}
