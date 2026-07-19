<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'account_id', 'name', 'description', 'trigger_type', 'trigger_config',
    'is_active', 'execution_count', 'last_executed_at',
])]
class Automation extends Model
{
    use BelongsToAccount, HasUuids;

    protected function casts(): array
    {
        return [
            'trigger_config' => 'array',
            'is_active' => 'boolean',
            'last_executed_at' => 'datetime',
        ];
    }

    public function steps(): HasMany
    {
        return $this->hasMany(AutomationStep::class)->orderBy('position');
    }

    /** Pasos raíz (fuera de ramas de condición). */
    public function rootSteps(): HasMany
    {
        return $this->steps()->whereNull('parent_step_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(AutomationLog::class);
    }

    public function pendingExecutions(): HasMany
    {
        return $this->hasMany(AutomationPendingExecution::class);
    }
}
