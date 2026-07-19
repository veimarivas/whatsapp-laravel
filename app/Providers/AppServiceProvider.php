<?php

namespace App\Providers;

use App\Events\InboxUpdated;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Rate limits: generoso para Meta (envía en ráfagas y sus
        // reintentos ante 429 pueden acabar desactivando el webhook),
        // y por clave para la API pública.
        RateLimiter::for('whatsapp-webhook', fn (Request $request) => Limit::perMinute(600)->by($request->ip()));

        RateLimiter::for('public-api', fn (Request $request) => Limit::perMinute(120)
            ->by(sha1($request->bearerToken() ?? $request->ip())));

        // Tiempo real del inbox: cualquier mensaje nuevo o cambio de
        // conversación notifica al canal de la cuenta. `rescue` evita
        // que un Reverb caído rompa el flujo de mensajes (el cliente
        // conserva el polling como respaldo).
        Message::created(function (Message $message) {
            $message->conversation?->loadMissing('account');
            $accountId = $message->conversation?->account_id;

            if ($accountId) {
                rescue(fn () => broadcast(new InboxUpdated($accountId, $message->conversation_id)), report: false);
            }
        });

        Conversation::updated(function (Conversation $conversation) {
            rescue(fn () => broadcast(new InboxUpdated($conversation->account_id, $conversation->id)), report: false);
        });
    }
}
