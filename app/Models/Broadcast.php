<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'account_id', 'name', 'template_name', 'template_language', 'template_variables',
    'header_media_url', 'audience_filter', 'scheduled_at', 'status', 'total_recipients',
    'sent_count', 'delivered_count', 'read_count', 'replied_count', 'failed_count',
])]
class Broadcast extends Model
{
    use BelongsToAccount, HasUuids;

    protected function casts(): array
    {
        return [
            'template_variables' => 'array',
            'audience_filter' => 'array',
            'scheduled_at' => 'datetime',
        ];
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(BroadcastRecipient::class);
    }
}
