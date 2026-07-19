<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'account_id', 'phone_number_id', 'waba_id', 'access_token', 'verify_token',
    'status', 'connected_at', 'registered_at', 'subscribed_apps_at', 'last_registration_error',
])]
class WhatsappConfig extends Model
{
    use BelongsToAccount, HasUuids;

    protected function casts(): array
    {
        return [
            // Reemplazo del AES-256-GCM manual del original: cast
            // "encrypted" de Laravel (usa APP_KEY). Rotar APP_KEY
            // invalida los tokens guardados, igual que en el original.
            'access_token' => 'encrypted',
            'connected_at' => 'datetime',
            'registered_at' => 'datetime',
            'subscribed_apps_at' => 'datetime',
        ];
    }

    public function isConnected(): bool
    {
        return $this->status === 'connected';
    }
}
