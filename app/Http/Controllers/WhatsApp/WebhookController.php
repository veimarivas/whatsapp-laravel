<?php

namespace App\Http\Controllers\WhatsApp;

use App\Http\Controllers\Controller;
use App\Models\WhatsappConfig;
use App\Services\WhatsApp\InboundProcessor;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * GET — verificación del webhook (hub.challenge). Meta lo llama al
     * configurar la URL. El verify_token debe coincidir con el guardado
     * en alguna configuración de WhatsApp.
     */
    public function verify(Request $request): Response
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $known = $token !== null
            && WhatsappConfig::where('verify_token', $token)->exists();

        if ($mode === 'subscribe' && $known) {
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response('Forbidden', 403);
    }

    /**
     * POST — entrega de eventos. Firma HMAC-SHA256 verificada contra
     * META_APP_SECRET (igual que webhook-signature.ts del original):
     * sin firma válida, la petición se rechaza.
     */
    public function receive(Request $request, InboundProcessor $processor): Response
    {
        $secret = config('services.meta.app_secret');

        if (! $secret) {
            Log::error('Webhook WhatsApp rechazado: META_APP_SECRET no configurado');

            return response('Server misconfigured', 500);
        }

        $signature = $request->header('X-Hub-Signature-256', '');
        $expected = 'sha256='.hash_hmac('sha256', $request->getContent(), $secret);

        if (! hash_equals($expected, $signature)) {
            Log::warning('Webhook WhatsApp rechazado: firma inválida');

            return response('Invalid signature', 401);
        }

        try {
            $processor->process($request->json()->all());
        } catch (\Throwable $e) {
            // Responder 200 igualmente: si devolvemos 5xx Meta reintenta
            // en bucle y puede desactivar el webhook. El error queda en logs.
            Log::error('Error procesando webhook WhatsApp', ['exception' => $e]);
        }

        return response('OK', 200);
    }
}
