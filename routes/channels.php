<?php

use Illuminate\Support\Facades\Broadcast;

// Canal privado por cuenta: todo el equipo del tenant escucha aquí
// los eventos del inbox (mensajes nuevos, conversaciones actualizadas).
Broadcast::channel('account.{accountId}', function ($user, string $accountId) {
    return $user->account_id === $accountId;
});
