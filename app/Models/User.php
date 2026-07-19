<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'avatar_url', 'account_id', 'account_role', 'beta_features'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuids, Notifiable;

    public const ROLE_OWNER = 'owner';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_AGENT = 'agent';
    public const ROLE_VIEWER = 'viewer';

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'beta_features' => 'array',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function presence(): HasOne
    {
        return $this->hasOne(MemberPresence::class);
    }

    public function assignedConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'assigned_agent_id');
    }

    public function isOwner(): bool
    {
        return $this->account_role === self::ROLE_OWNER;
    }

    /** Jerarquía de roles: owner > admin > agent > viewer. */
    public function hasRoleAtLeast(string $minRole): bool
    {
        $rank = [self::ROLE_VIEWER => 0, self::ROLE_AGENT => 1, self::ROLE_ADMIN => 2, self::ROLE_OWNER => 3];

        return ($rank[$this->account_role] ?? -1) >= ($rank[$minRole] ?? PHP_INT_MAX);
    }
}
