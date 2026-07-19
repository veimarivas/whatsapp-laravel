<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'conversation_id', 'sender_type', 'sender_id', 'content_type',
    'content_text', 'media_url', 'referral', 'template_name', 'message_id',
    'interactive_reply_id', 'reply_to_message_id', 'status',
])]
class Message extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'referral' => 'array',
        ];
    }

    public const SENDER_CUSTOMER = 'customer';
    public const SENDER_AGENT = 'agent';
    public const SENDER_BOT = 'bot';

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_message_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class);
    }
}
