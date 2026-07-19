<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'flow_id', 'account_id', 'contact_id', 'conversation_id', 'status',
    'current_node_key', 'last_prompt_message_id', 'vars', 'reprompt_count',
    'started_at', 'last_advanced_at', 'ended_at', 'active_contact_key',
])]
class FlowRun extends Model
{
    use BelongsToAccount, HasUuids;

    public $timestamps = false;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_HANDED_OFF = 'handed_off';
    public const STATUS_TIMED_OUT = 'timed_out';
    public const STATUS_PAUSED_BY_AGENT = 'paused_by_agent';
    public const STATUS_FAILED = 'failed';

    protected function casts(): array
    {
        return [
            'vars' => 'array',
            'started_at' => 'datetime',
            'last_advanced_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Mantiene la garantía "un solo run activo por contacto": la
        // columna única se rellena mientras el run está activo y se
        // vacía al terminar. Dos INSERTs concurrentes → el segundo
        // recibe duplicate-key (mismo contrato que el índice parcial
        // de Postgres del original).
        static::saving(function (FlowRun $run) {
            $run->active_contact_key = ($run->status === self::STATUS_ACTIVE && $run->contact_id)
                ? "{$run->account_id}:{$run->contact_id}"
                : null;
        });
    }

    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function lastPromptMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'last_prompt_message_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(FlowRunEvent::class);
    }
}
