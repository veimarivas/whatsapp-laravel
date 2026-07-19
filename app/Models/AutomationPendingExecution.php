<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'automation_id', 'account_id', 'contact_id', 'log_id', 'parent_step_id',
    'branch', 'next_step_position', 'context', 'status', 'run_at',
])]
class AutomationPendingExecution extends Model
{
    use BelongsToAccount, HasUuids;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'context' => 'array',
            'run_at' => 'datetime',
        ];
    }

    public function scopeDue(Builder $query): Builder
    {
        return $query->where('status', 'pending')->where('run_at', '<=', now());
    }

    public function automation(): BelongsTo
    {
        return $this->belongsTo(Automation::class);
    }

    public function log(): BelongsTo
    {
        return $this->belongsTo(AutomationLog::class, 'log_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
