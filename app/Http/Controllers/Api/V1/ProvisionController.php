<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\ApiKey;
use App\Models\User;
use App\Models\WebhookEndpoint;
use App\Services\Webhooks\Dispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Provisión del ecosistema (Fase 3 del Komo Hub): crea usuario+cuenta,
 * emite una API key y registra el webhook saliente hacia el komo — todo
 * en una llamada, para que el hub cablee el ecosistema sin pasos manuales.
 *
 * Protegido por firma HMAC del body con HUB_PROVISION_SECRET (secreto
 * maestro compartido con el hub; NUNCA viaja al navegador). Idempotente
 * por email: si el usuario existe se reutiliza su cuenta.
 */
class ProvisionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $secret = config('services.hub.provision_secret');

        if (! $secret) {
            return response()->json(['message' => 'Provisioning no está habilitado (falta HUB_PROVISION_SECRET).'], 503);
        }

        $signature = $request->header('X-Provision-Signature', '');

        if (! hash_equals('sha256='.hash_hmac('sha256', $request->getContent(), $secret), $signature)) {
            return response()->json(['message' => 'Invalid signature.'], 401);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255',
            'password' => 'nullable|string|min:8|max:255',
            'api_key' => 'nullable|array',
            'api_key.name' => 'required_with:api_key|string|max:100',
            'api_key.scopes' => 'required_with:api_key|array|min:1',
            'api_key.scopes.*' => Rule::in([
                'contacts:read', 'contacts:write', 'conversations:read',
                'messages:write', 'broadcasts:read', 'broadcasts:write',
            ]),
            'webhook' => 'nullable|array',
            'webhook.url' => 'required_with:webhook|url|max:2048',
            'webhook.secret' => 'required_with:webhook|string|max:255',
            'webhook.events' => 'required_with:webhook|array|min:1',
            'webhook.events.*' => Rule::in(Dispatcher::EVENTS),
        ]);

        $user = User::where('email', $validated['email'])->first();
        $userCreated = false;

        if (! $user) {
            // Mismo flujo que el registro web: usuario owner de su cuenta.
            $user = DB::transaction(function () use ($validated) {
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    // Sin contraseña explícita se genera una aleatoria — el
                    // acceso normal será por el SSO del hub.
                    'password' => Hash::make($validated['password'] ?? Str::random(40)),
                    'email_verified_at' => now(),
                ]);

                $account = Account::create([
                    'name' => $validated['name'],
                    'owner_user_id' => $user->id,
                ]);

                $user->update(['account_id' => $account->id, 'account_role' => User::ROLE_OWNER]);

                return $user;
            });

            $userCreated = true;
        }

        $plaintext = null;
        if ($validated['api_key'] ?? null) {
            [, $plaintext] = ApiKey::issue(
                $user->account_id,
                $user->id,
                $validated['api_key']['name'],
                $validated['api_key']['scopes'],
            );
        }

        if ($webhook = $validated['webhook'] ?? null) {
            WebhookEndpoint::updateOrCreate(
                ['account_id' => $user->account_id, 'url' => $webhook['url']],
                [
                    'secret' => $webhook['secret'],
                    'events' => $webhook['events'],
                    'is_active' => true,
                    'failure_count' => 0,
                ],
            );
        }

        return response()->json([
            'account_id' => $user->account_id,
            'user_id' => $user->id,
            'user_created' => $userCreated,
            'api_key' => $plaintext,
        ], $userCreated ? 201 : 200);
    }
}
