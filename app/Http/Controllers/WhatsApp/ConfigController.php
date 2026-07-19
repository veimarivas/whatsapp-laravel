<?php

namespace App\Http\Controllers\WhatsApp;

use App\Http\Controllers\Controller;
use App\Models\WhatsappConfig;
use App\Services\WhatsApp\MetaApi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ConfigController extends Controller
{
    public function edit(Request $request): Response
    {
        $config = WhatsappConfig::forAccount($request->user()->account_id)->first();

        return Inertia::render('Settings/WhatsApp', [
            'config' => $config ? [
                'phone_number_id' => $config->phone_number_id,
                'waba_id' => $config->waba_id,
                'verify_token' => $config->verify_token,
                'status' => $config->status,
                'connected_at' => $config->connected_at?->toIso8601String(),
                // El token nunca vuelve al navegador; solo una pista.
                'has_token' => true,
            ] : null,
            'webhookUrl' => route('webhooks.whatsapp'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'phone_number_id' => 'required|string|max:64',
            'waba_id' => 'nullable|string|max:64',
            'access_token' => 'nullable|string',
        ]);

        $accountId = $request->user()->account_id;
        $existing = WhatsappConfig::forAccount($accountId)->first();

        if (! $existing && empty($validated['access_token'])) {
            return back()->withErrors(['access_token' => 'El access token es obligatorio.']);
        }

        $data = [
            'phone_number_id' => $validated['phone_number_id'],
            'waba_id' => $validated['waba_id'] ?? null,
        ];

        // Token vacío en el form = conservar el actual.
        if (! empty($validated['access_token'])) {
            $data['access_token'] = $validated['access_token'];
        }

        $config = WhatsappConfig::updateOrCreate(
            ['account_id' => $accountId],
            $data + ['verify_token' => $existing->verify_token ?? Str::random(32)],
        );

        // Prueba de conexión: pedir los datos del número a Meta.
        try {
            MetaApi::for($config)->getMediaUrl('0'); // cualquier llamada autenticada sirve; 400 esperado
            $config->update(['status' => 'connected', 'connected_at' => now()]);
        } catch (\RuntimeException $e) {
            // 400 = token válido pero media inexistente → conectado.
            // 401/403 = token inválido.
            if (str_contains($e->getMessage(), '(400)')) {
                $config->update(['status' => 'connected', 'connected_at' => now()]);
            } else {
                $config->update(['status' => 'disconnected']);

                return back()->withErrors(['access_token' => 'Meta rechazó el token: '.$e->getMessage()]);
            }
        }

        return back()->with('success', 'Configuración de WhatsApp guardada.');
    }
}
