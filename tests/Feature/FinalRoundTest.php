<?php

namespace Tests\Feature;

use App\Jobs\SendBroadcastJob;
use App\Models\Account;
use App\Models\ApiKey;
use App\Models\Broadcast;
use App\Models\Contact;
use App\Models\MemberPresence;
use App\Models\MessageTemplate;
use App\Models\User;
use App\Models\WhatsappConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class FinalRoundTest extends TestCase
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
        $this->user->refresh();

        WhatsappConfig::create([
            'account_id' => $this->account->id,
            'phone_number_id' => '111222333',
            'access_token' => 'token',
            'status' => 'connected',
        ]);
    }

    public function test_broadcast_con_encabezado_de_imagen_incluye_el_componente_header(): void
    {
        MessageTemplate::create([
            'account_id' => $this->account->id,
            'name' => 'promo_imagen',
            'language' => 'es',
            'header_type' => 'image',
            'body_text' => 'Hola {{1}}',
            'status' => 'APPROVED',
        ]);

        $contact = Contact::create([
            'account_id' => $this->account->id,
            'phone' => '584125550001',
            'name' => 'Ana',
        ]);

        $broadcast = Broadcast::create([
            'account_id' => $this->account->id,
            'name' => 'Promo con imagen',
            'template_name' => 'promo_imagen',
            'template_language' => 'es',
            'template_variables' => ['Hola {name}'],
            'header_media_url' => 'https://misitio.test/promo.jpg',
            'status' => 'sending',
            'total_recipients' => 1,
        ]);
        $broadcast->recipients()->create(['contact_id' => $contact->id, 'status' => 'pending']);

        Http::fake(['graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.H1']]])]);

        (new SendBroadcastJob($broadcast->id))->handle();

        Http::assertSent(function ($request) {
            $components = collect($request['template']['components'] ?? []);
            $header = $components->firstWhere('type', 'header');
            $body = $components->firstWhere('type', 'body');

            return ($header['parameters'][0]['image']['link'] ?? null) === 'https://misitio.test/promo.jpg'
                && ($body['parameters'][0]['text'] ?? null) === 'Hola Ana';
        });
    }

    public function test_api_publica_crea_y_lista_broadcasts(): void
    {
        Queue::fake();

        MessageTemplate::create([
            'account_id' => $this->account->id,
            'name' => 'promo',
            'language' => 'es',
            'body_text' => 'Oferta',
            'status' => 'APPROVED',
        ]);
        Contact::create(['account_id' => $this->account->id, 'phone' => '584125550001']);

        [, $plaintext] = ApiKey::issue(
            $this->account->id,
            $this->user->id,
            'bot',
            ['broadcasts:read', 'broadcasts:write'],
        );

        $this->withToken($plaintext)
            ->postJson('/api/v1/broadcasts', [
                'name' => 'Desde la API',
                'template_name' => 'promo',
                'template_language' => 'es',
                'audience' => 'all',
            ])
            ->assertCreated()
            ->assertJsonPath('total_recipients', 1);

        Queue::assertPushed(SendBroadcastJob::class);

        $this->withToken($plaintext)
            ->getJson('/api/v1/broadcasts')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Desde la API');

        $id = Broadcast::first()->id;
        $this->withToken($plaintext)
            ->getJson("/api/v1/broadcasts/{$id}")
            ->assertOk()
            ->assertJsonPath('recipients_by_status.pending', 1);

        // Plantilla no aprobada → 422 con mensaje claro.
        $this->withToken($plaintext)
            ->postJson('/api/v1/broadcasts', [
                'name' => 'Mala',
                'template_name' => 'inexistente',
                'template_language' => 'es',
                'audience' => 'all',
            ])
            ->assertStatus(422);

        // Sin el scope → 403.
        [, $soloLectura] = ApiKey::issue($this->account->id, $this->user->id, 'ro', ['broadcasts:read']);
        $this->withToken($soloLectura)
            ->postJson('/api/v1/broadcasts', [
                'name' => 'X',
                'template_name' => 'promo',
                'template_language' => 'es',
                'audience' => 'all',
            ])
            ->assertForbidden();
    }

    public function test_presencia_ping_y_estado_en_equipo(): void
    {
        // El heartbeat marca en línea.
        $this->actingAs($this->user)
            ->postJson(route('presence.ping'))
            ->assertOk();

        $presence = MemberPresence::where('user_id', $this->user->id)->first();
        $this->assertSame('online', $presence->status);

        // Miembro visto hace 10 minutos → desconectado.
        $viejo = User::create([
            'name' => 'Inactivo',
            'email' => 'inactivo@test.com',
            'password' => bcrypt('password'),
            'account_id' => $this->account->id,
            'account_role' => 'agent',
        ]);
        MemberPresence::create([
            'user_id' => $viejo->id,
            'account_id' => $this->account->id,
            'last_seen_at' => now()->subMinutes(10),
        ]);

        $response = $this->actingAs($this->user)->get(route('settings.team'));
        $members = collect($response->original->getData()['page']['props']['members']);

        $this->assertTrue($members->firstWhere('email', 'admin@test.com')['online']);
        $this->assertFalse($members->firstWhere('email', 'inactivo@test.com')['online']);
    }
}
