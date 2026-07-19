<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['flow_id', 'node_key', 'node_type', 'config', 'position_x', 'position_y'])]
class FlowNode extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['config' => 'array'];
    }

    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
    }
}
