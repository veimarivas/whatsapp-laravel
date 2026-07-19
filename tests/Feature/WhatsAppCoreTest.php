<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Models\WhatsappConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WhatsAppCoreTest extends TestCase
{
    use RefreshDatabase;

    private const APP_SECRET = 'test-app-secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.meta.app_secret' => self::APP_SECRET]);
    }

    private function makeAccount(): array
    {
        $user = User::create([
            'name' => 'Agente',
            'email' => 'agente@test.com',
            'password' => bcrypt('password'),
        ]);
        $account = Account::create(['name' => 'Empresa', 'owner_user_id' => $user->id]);
        $user->update(['account_id' => $account->id, 'account_role' => 'owner']);

        $config = WhatsappConfig::create([
            'account_id' => $account->id,
            'phone_number_id' => '111222333',
            'access_token' => 'token-de-prueba',
            'verify_token' => 'mi-verify-token',
            'status' => 'connected',
        ]);

        return [$user->fresh(), $account, $config];
    }

    private function webhookPayload(array $overrides = []): array
    {
        return array_replace_recursive([
            'object' => 'whatsapp_business_account',
            'entry' => [[
                'id' => 'WABA_ID',
                'changes' => [[
                    'field' => 'messages',
                    'value' => [
                        'messaging_product' => 'whatsapp',
                        'metadata' => ['display_phone_number' => '15550001111', 'phone_number_id' => '111222333'],
                        'contacts' => [['profile' => ['name' => 'Cliente Prueba'], 'wa_id' => '584125551234']],
                        'messages' => [[
                            'from' => '584125551234',
                            'id' => 'wamid.TEST001',
                            'timestamp' => (string) time(),
                            'type' => 'text',
                            'text' => ['body' => 'Hola, quiero información'],
                        ]],
                    ],
                ]],
            ]],
        ], $overrides);
    }

    private function postWebhook(array $payload)
    {
        $body = json_encode($payload);

        return $this->call('POST', '/webhooks/whatsapp', [], [], [], [
            'HTTP_X-Hub-Signature-256' => 'sha256='.hash_hmac('sha256', $body, self::APP_SECRET),
            'CONTENT_TYPE' => 'application/json',
        ], $body);
    }

    public function test_el_registro_crea_cuenta_con_rol_owner(): void
    {
        $response = $this->post('/register', [
            'name' => 'Nuevo Usuario',
            'email' => 'nuevo@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect('/dashboard');

        $user = User::where('email', 'nuevo@test.com')->first();
        $this->assertNotNull($user->account_id);
        $this->assertSame('owner', $user->account_role);
        $this->assertSame($user->id, $user->account->owner_user_id);
    }

    public function test_verificacion_del_webhook_con_token_valido(): void
    {
        $this->makeAccount();

        $this->get('/webhooks/whatsapp?hub_mode=subscribe&hub_verify_token=mi-verify-token&hub_challenge=reto-123')
            ->assertOk()
            ->assertSee('reto-123', escape: false);

        $this->get('/webhooks/whatsapp?hub_mode=subscribe&hub_verify_token=incorrecto&hub_challenge=x')
            ->assertForbidden();
    }

    public function test_webhook_rechaza_firma_invalida(): void
    {
        $this->makeAccount();

        $body = json_encode($this->webhookPayload());

        $this->call('POST', '/webhooks/whatsapp', [], [], [], [
            'HTTP_X-Hub-Signature-256' => 'sha256='.hash_hmac('sha256', $body, 'otro-secreto'),
            'CONTENT_TYPE' => 'application/json',
        ], $body)->assertUnauthorized();

        $this->assertSame(0, Message::count());
    }

    public function test_mensaje_entrante_crea_contacto_conversacion_y_mensaje(): void
    {
        [, $account] = $this->makeAccount();

        $this->postWebhook($this->webhookPayload())->assertOk();

        $contact = Contact::forAccount($account->id)->first();
        $this->assertSame('Cliente Prueba', $contact->name);
        $this->assertSame('584125551234', $contact->phone_normalized);

        $conversation = Conversation::forAccount($account->id)->first();
        $this->assertSame('Hola, quiero información', $conversation->last_message_text);
        $this->assertSame(1, $conversation->unread_count);

        $message = $conversation->messages()->first();
        $this->assertSame('customer', $message->sender_type);
        $this->assertSame('wamid.TEST001', $message->message_id);

        // Reenvío del mismo wamid (retry de Meta) → no duplica.
        $this->postWebhook($this->webhookPayload())->assertOk();
        $this->assertSame(1, Message::count());
    }

    public function test_actualizacion_de_estado_avanza_pero_no_retrocede(): void
    {
        [, $account] = $this->makeAccount();
        $contact = Contact::create(['account_id' => $account->id, 'phone' => '584125551234']);
        $conversation = Conversation::create(['account_id' => $account->id, 'contact_id' => $contact->id]);
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'agent',
            'content_text' => 'Respuesta',
            'message_id' => 'wamid.OUT01',
            'status' => 'sent',
        ]);

        $statusPayload = fn (string $status) => $this->webhookPayload([
            'entry' => [['changes' => [['value' => [
                'messages' => [],
                'statuses' => [['id' => 'wamid.OUT01', 'status' => $status, 'timestamp' => (string) time()]],
            ]]]]],
        ]);

        $this->postWebhook($statusPayload('read'))->assertOk();
        $this->assertSame('read', $message->fresh()->status);

        // "delivered" llega tarde → no debe degradar "read".
        $this->postWebhook($statusPayload('delivered'))->assertOk();
        $this->assertSame('read', $message->fresh()->status);
    }

    public function test_agente_envia_mensaje_y_se_persiste(): void
    {
        [$user, $account] = $this->makeAccount();
        $contact = Contact::create(['account_id' => $account->id, 'phone' => '584125551234']);
        $conversation = Conversation::create(['account_id' => $account->id, 'contact_id' => $contact->id]);

        Http::fake([
            'graph.facebook.com/*' => Http::response([
                'messages' => [['id' => 'wamid.SENT01']],
            ]),
        ]);

        $this->actingAs($user)
            ->postJson("/inbox/conversations/{$conversation->id}/send", ['text' => 'Hola desde el CRM'])
            ->assertOk()
            ->assertJsonPath('status', 'sent')
            ->assertJsonPath('message_id', 'wamid.SENT01');

        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/111222333/messages')
                && $request['text']['body'] === 'Hola desde el CRM';
        });
    }

    public function test_un_usuario_no_puede_ver_conversaciones_de_otra_cuenta(): void
    {
        [, $account] = $this->makeAccount();
        $contact = Contact::create(['account_id' => $account->id, 'phone' => '584125551234']);
        $conversation = Conversation::create(['account_id' => $account->id, 'contact_id' => $contact->id]);

        $intruso = User::create(['name' => 'Intruso', 'email' => 'otro@test.com', 'password' => bcrypt('password')]);
        $otraCuenta = Account::create(['name' => 'Otra', 'owner_user_id' => $intruso->id]);
        $intruso->update(['account_id' => $otraCuenta->id, 'account_role' => 'owner']);

        $this->actingAs($intruso->fresh())
            ->getJson("/inbox/conversations/{$conversation->id}/messages")
            ->assertForbidden();
    }
}
