<?php

namespace Tests\Feature;

use App\Models\ApiKey;
use App\Models\User;
use App\Models\WebhookEndpoint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Provisión del ecosistema (Fase 3 del Komo Hub): POST /api/v1/provision
 * crea usuario+cuenta, emite API key y registra el webhook hacia el komo.
 */
class ProvisionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.hub.provision_secret' => 'prov-secret']);
    }

    private function provision(array $payload, ?string $secret = 'prov-secret')
    {
        $body = json_encode($payload);

        return $this->call('POST', '/api/v1/provision', [], [], [], [
            'HTTP_X-Provision-Signature' => 'sha256='.hash_hmac('sha256', $body, $secret ?? 'x'),
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], $body);
    }

    public function test_firma_invalida_o_sin_secreto_se_rechaza(): void
    {
        $payload = ['name' => 'Hub User', 'email' => 'hub@test.com'];

        // Firmado con otro secreto → 401.
        $this->provision($payload, 'otro-secreto')->assertUnauthorized();

        // App sin HUB_PROVISION_SECRET configurado → 503.
        config(['services.hub.provision_secret' => null]);
        $this->provision($payload)->assertStatus(503);

        $this->assertSame(0, User::count());
    }

    public function test_provisiona_cuenta_key_y_webhook_en_una_llamada(): void
    {
        $response = $this->provision([
            'name' => 'Empresa Hub',
            'email' => 'hub@test.com',
            'password' => 'clave-segura-123',
            'api_key' => ['name' => 'Komo Hub', 'scopes' => ['contacts:read', 'messages:write']],
            'webhook' => [
                'url' => 'http://localhost:8001/webhooks/wacrm/ACC-KOMO',
                'secret' => 'whsec_generado_por_el_hub',
                'events' => ['message.received', 'contact.created'],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('user_created', true);

        $user = User::where('email', 'hub@test.com')->first();
        $this->assertSame('owner', $user->account_role);
        $this->assertNotNull($user->account_id);
        $this->assertSame($user->account_id, $response->json('account_id'));

        // La key devuelta funciona contra la API.
        $plaintext = $response->json('api_key');
        $this->assertStringStartsWith('wacrm_live_', $plaintext);
        $this->withToken($plaintext)->getJson('/api/v1/contacts')->assertOk();

        // Webhook cableado con el secreto del hub.
        $hook = WebhookEndpoint::forAccount($user->account_id)->first();
        $this->assertSame('http://localhost:8001/webhooks/wacrm/ACC-KOMO', $hook->url);
        $this->assertSame('whsec_generado_por_el_hub', $hook->secret);
        $this->assertTrue($hook->is_active);
    }

    public function test_idempotente_por_email_no_duplica_usuario_ni_webhook(): void
    {
        $payload = [
            'name' => 'Empresa Hub',
            'email' => 'hub@test.com',
            'api_key' => ['name' => 'Komo Hub', 'scopes' => ['contacts:read']],
            'webhook' => [
                'url' => 'http://localhost:8001/webhooks/wacrm/ACC',
                'secret' => 'whsec_v1',
                'events' => ['message.received'],
            ],
        ];

        $this->provision($payload)->assertCreated();

        $payload['webhook']['secret'] = 'whsec_v2';
        $this->provision($payload)
            ->assertOk()
            ->assertJsonPath('user_created', false);

        $this->assertSame(1, User::count());
        $this->assertSame(2, ApiKey::count()); // cada provisión emite key nueva
        $this->assertSame(1, WebhookEndpoint::count()); // misma URL se actualiza
        $this->assertSame('whsec_v2', WebhookEndpoint::first()->secret);

        // Scope inventado se rechaza.
        $this->provision([
            'name' => 'X', 'email' => 'otro@test.com',
            'api_key' => ['name' => 'k', 'scopes' => ['admin:todo']],
        ])->assertStatus(422);
    }
}
