<?php

namespace Tests\Feature;

use App\Jobs\DeliverWebhookJob;
use App\Models\Account;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Models\WebhookEndpoint;
use App\Models\WhatsappConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Atribución de anuncios Click-to-WhatsApp: el `referral` que Meta
 * adjunta al mensaje entrante se guarda en messages.referral, fija
 * conversations.entry_ad_id (solo la primera vez) y viaja en el
 * payload del webhook saliente message.received.
 */
class MessageReferralTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Account $account;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
        ]);
        $this->account = Account::create(['name' => 'Empresa', 'owner_user_id' => $this->user->id]);
        $this->user->update(['account_id' => $this->account->id, 'account_role' => 'owner']);

        config(['services.meta.app_secret' => 'secret']);

        WhatsappConfig::create([
            'account_id' => $this->account->id,
            'phone_number_id' => '111222333',
            'access_token' => 'token',
            'status' => 'connected',
        ]);
    }

    private function postInbound(string $wamid, string $text, ?array $referral = null): void
    {
        $message = [
            'from' => '584125559999',
            'id' => $wamid,
            'type' => 'text',
            'text' => ['body' => $text],
        ];

        if ($referral !== null) {
            $message['referral'] = $referral;
        }

        $payload = json_encode([
            'entry' => [['changes' => [['field' => 'messages', 'value' => [
                'metadata' => ['phone_number_id' => '111222333'],
                'contacts' => [['profile' => ['name' => 'Cliente Ad'], 'wa_id' => '584125559999']],
                'messages' => [$message],
            ]]]]],
        ]);

        $this->call('POST', '/webhooks/whatsapp', [], [], [], [
            'HTTP_X-Hub-Signature-256' => 'sha256='.hash_hmac('sha256', $payload, 'secret'),
            'CONTENT_TYPE' => 'application/json',
        ], $payload)->assertOk();
    }

    public function test_referral_se_guarda_en_mensaje_y_conversacion(): void
    {
        Queue::fake();

        $referral = [
            'source_id' => '120210000000001',
            'source_type' => 'ad',
            'headline' => 'Compra ya',
            'source_url' => 'https://fb.me/xyz',
        ];

        $this->postInbound('wamid.REF1', 'Hola, vi su anuncio', $referral);

        $message = Message::where('message_id', 'wamid.REF1')->first();
        $this->assertSame($referral, $message->referral);

        $conversation = Conversation::first();
        $this->assertSame('120210000000001', $conversation->entry_ad_id);
    }

    public function test_entry_ad_id_preserva_la_atribucion_original(): void
    {
        Queue::fake();

        $this->postInbound('wamid.REF2', 'Vengo del primer anuncio', [
            'source_id' => 'AD_ORIGINAL',
            'source_type' => 'ad',
        ]);

        // Un segundo referral NO pisa el ad de entrada.
        $this->postInbound('wamid.REF3', 'Ahora toqué otro anuncio', [
            'source_id' => 'AD_POSTERIOR',
            'source_type' => 'ad',
        ]);

        // Un mensaje sin referral tampoco lo altera.
        $this->postInbound('wamid.REF4', 'Mensaje normal');

        $conversation = Conversation::first();
        $this->assertSame('AD_ORIGINAL', $conversation->entry_ad_id);

        $this->assertNull(Message::where('message_id', 'wamid.REF4')->first()->referral);
    }

    public function test_webhook_saliente_incluye_el_referral(): void
    {
        Queue::fake();

        WebhookEndpoint::create([
            'account_id' => $this->account->id,
            'url' => 'https://komo.test/webhooks/wacrm/acc',
            'secret' => 'whsec_test',
            'events' => ['message.received'],
        ]);

        $this->postInbound('wamid.REF5', 'Quiero info', [
            'source_id' => 'AD_HOOK',
            'source_type' => 'ad',
            'source_url' => 'https://fb.me/abc',
        ]);

        Queue::assertPushed(DeliverWebhookJob::class, function ($job) {
            return $job->event === 'message.received'
                && ($job->data['message']['referral']['source_id'] ?? null) === 'AD_HOOK';
        });
    }
}
