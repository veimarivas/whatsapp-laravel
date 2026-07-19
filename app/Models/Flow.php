<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'account_id', 'name', 'description', 'status', 'trigger_type', 'trigger_config',
    'entry_node_id', 'fallback_policy', 'execution_count', 'last_executed_at',
])]
class Flow extends Model
{
    use BelongsToAccount, HasUuids;

    public const DEFAULT_FALLBACK_POLICY = [
        'on_unknown_reply' => 'reprompt',
        'max_reprompts' => 2,
        'on_timeout_hours' => 24,
        'on_exhaust' => 'handoff',
    ];

    protected function casts(): array
    {
        return [
            'trigger_config' => 'array',
            'fallback_policy' => 'array',
            'last_executed_at' => 'datetime',
        ];
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(FlowNode::class);
    }

    public function runs(): HasMany
    {
        return $this->hasMany(FlowRun::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
