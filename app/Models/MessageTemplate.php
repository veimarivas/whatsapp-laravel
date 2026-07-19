<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'account_id', 'name', 'category', 'language', 'header_type', 'header_content',
    'body_text', 'footer_text', 'buttons', 'sample_values', 'meta_template_id',
    'rejection_reason', 'quality_score', 'header_handle', 'header_media_url',
    'submission_error', 'last_submitted_at', 'status',
])]
class MessageTemplate extends Model
{
    use BelongsToAccount, HasUuids;

    protected function casts(): array
    {
        return [
            'buttons' => 'array',
            'sample_values' => 'array',
            'last_submitted_at' => 'datetime',
        ];
    }

    public function isApproved(): bool
    {
        return $this->status === 'APPROVED';
    }
}
