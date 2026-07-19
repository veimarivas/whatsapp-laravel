<?php

use App\Http\Controllers\Api\V1\ApiController;
use Illuminate\Support\Facades\Route;

// API pública v1 — Authorization: Bearer wacrm_live_…
// Scopes: contacts:read, contacts:write, conversations:read, messages:write.
Route::prefix('v1')->middleware('throttle:public-api')->group(function () {
    Route::get('/me', [ApiController::class, 'me'])->middleware('api.key');

    // Provisión del ecosistema (Komo Hub) — firma HMAC con secreto
    // maestro, no api.key (crea la cuenta que luego tendrá keys).
    Route::post('/provision', [\App\Http\Controllers\Api\V1\ProvisionController::class, 'store']);

    Route::middleware('api.key:contacts:read')->group(function () {
        Route::get('/contacts', [ApiController::class, 'contacts']);
        Route::get('/contacts/{id}', [ApiController::class, 'showContact']);
    });

    Route::middleware('api.key:contacts:write')->group(function () {
        Route::post('/contacts', [ApiController::class, 'storeContact']);
        Route::patch('/contacts/{id}', [ApiController::class, 'updateContact']);
        Route::delete('/contacts/{id}', [ApiController::class, 'destroyContact']);
    });

    Route::middleware('api.key:conversations:read')->group(function () {
        Route::get('/conversations', [ApiController::class, 'conversations']);
        Route::get('/conversations/{id}/messages', [ApiController::class, 'messages']);
    });

    Route::post('/messages', [ApiController::class, 'sendMessage'])
        ->middleware('api.key:messages:write');

    Route::middleware('api.key:broadcasts:read')->group(function () {
        Route::get('/broadcasts', [ApiController::class, 'broadcasts']);
        Route::get('/broadcasts/{id}', [ApiController::class, 'showBroadcast']);
    });

    Route::post('/broadcasts', [ApiController::class, 'storeBroadcast'])
        ->middleware('api.key:broadcasts:write');
});
