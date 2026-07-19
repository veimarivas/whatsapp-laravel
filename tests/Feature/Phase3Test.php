<?php

namespace Tests\Feature;

use App\Jobs\SendBroadcastJob;
use App\Models\Account;
use App\Models\Broadcast;
use App\Models\Contact;
use App\Models\MessageTemplate;
use App\Models\Tag;
use App\Models\User;
use App\Models\WhatsappConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class Phase3Test extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Account $account;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Agente',
            'email' => 'agente@test.com',
            'password' => bcrypt('password'),
        ]);
        $this->account = Account::create(['name' => 'Empresa', 'owner_user_id' => $this->user->id]);
        $this->user->update(['account_id' => $this->account->id, 'account_role' => 'owner']);
        $this->user->refresh();
    }

    private function connectWhatsapp(): WhatsappConfig
    {
        return WhatsappConfig::create([
            'account_id' => $this->account->id,
            'phone_number_id' => '111222333',
            'waba_id' => 'WABA123',
            'access_token' => 'token',
            'status' => 'connected',
        ]);
    }

    public function test_crud_de_contactos_con_tags(): void
    {
        $tag = Tag::create(['account_id' => $this->account->id, 'name' => 'VIP']);

        $this->actingAs($this->user)
            ->post(route('contacts.store'), [
                'phone' => '+58 412 555 0001',
                'name' => 'Ana',
                'tag_ids' => [$tag->id],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $contact = Contact::forAccount($this->account->id)->first();
        $this->assertSame('Ana', $contact->name);
        $this->assertTrue($contact->tags->contains($tag));

        // Duplicado por teléfono normalizado → error de validación.
        $this->actingAs($this->user)
            ->post(route('contacts.store'), ['phone' => '584125550001'])
            ->assertSessionHasErrors('phone');

        $this->actingAs($this->user)
            ->patch(route('contacts.update', $contact), [
                'phone' => $contact->phone,
                'name' => 'Ana María',
                'tag_ids' => [],
            ])
            ->assertRedirect();

        $contact->refresh();
        $this->assertSame('Ana María', $contact->name);
        $this->assertCount(0, $contact->tags);

        $this->actingAs($this->user)->delete(route('contacts.destroy', $contact))->assertRedirect();
        $this->assertSame(0, Contact::count());
    }

    public function test_importacion_csv_deduplica(): void
    {
        Contact::create(['account_id' => $this->account->id, 'phone' => '584125550001']);

        $csv = "phone,name,email\n"
            ."+58 412 555 0001,Duplicado,dup@test.com\n"
            ."+58 412 555 0002,Nuevo Uno,uno@test.com\n"
            ."sin-telefono,,\n"
            ."+58 412 555 0003,Nuevo Dos,\n";

        $file = UploadedFile::fake()->createWithContent('contactos.csv', $csv);

        $this->actingAs($this->user)
            ->post(route('contacts.import'), ['file' => $file])
            ->assertRedirect()
            ->assertSessionHas('success', fn ($msg) => str_contains($msg, 'Importados: 2'));

        $this->assertSame(3, Contact::forAccount($this->account->id)->count());
    }

    public function test_sincronizacion_de_plantillas_desde_meta(): void
    {
        $this->connectWhatsapp();

        Http::fake([
            'graph.facebook.com/*/message_templates*' => Http::response([
                'data' => [[
                    'id' => 'TPL001',
                    'name' => 'bienvenida',
                    'language' => 'es',
                    'category' => 'MARKETING',
                    'status' => 'APPROVED',
                    'components' => [
                        ['type' => 'BODY', 'text' => 'Hola {{1}}, bienvenido a {{2}}.'],
                        ['type' => 'FOOTER', 'text' => 'Responde STOP para salir'],
                    ],
                ]],
            ]),
        ]);

        $this->actingAs($this->user)
            ->post(route('templates.sync'))
            ->assertRedirect()
            ->assertSessionHas('success');

        $template = MessageTemplate::forAccount($this->account->id)->first();
        $this->assertSame('bienvenida', $template->name);
        $this->assertSame('APPROVED', $template->status);
        $this->assertSame('TPL001', $template->meta_template_id);
        $this->assertStringContainsString('{{1}}', $template->body_text);
    }

    public function test_broadcast_inmediato_encola_el_job(): void
    {
        Queue::fake();
        $this->connectWhatsapp();

        MessageTemplate::create([
            'account_id' => $this->account->id,
            'name' => 'promo',
            'language' => 'es',
            'body_text' => 'Hola {{1}}',
            'status' => 'APPROVED',
        ]);

        $vip = Tag::create(['account_id' => $this->account->id, 'name' => 'VIP']);
        $conTag = Contact::create(['account_id' => $this->account->id, 'phone' => '584125550001', 'name' => 'Ana']);
        $conTag->tags()->attach($vip);
        Contact::create(['account_id' => $this->account->id, 'phone' => '584125550002', 'name' => 'Beto']);

        $this->actingAs($this->user)
            ->post(route('broadcasts.store'), [
                'name' => 'Promo VIP',
                'template_name' => 'promo',
                'template_language' => 'es',
                'template_variables' => ['Hola {name}'],
                'audience' => 'tags',
                'tag_ids' => [$vip->id],
            ])
            ->assertRedirect();

        $broadcast = Broadcast::first();
        $this->assertSame('sending', $broadcast->status);
        $this->assertSame(1, $broadcast->total_recipients); // solo el contacto VIP
        Queue::assertPushed(SendBroadcastJob::class);
    }

    public function test_el_job_envia_plantillas_con_variables_sustituidas(): void
    {
        $this->connectWhatsapp();

        $contact = Contact::create([
            'account_id' => $this->account->id,
            'phone' => '584125550001',
            'name' => 'Ana',
        ]);

        $broadcast = Broadcast::create([
            'account_id' => $this->account->id,
            'name' => 'Promo',
            'template_name' => 'promo',
            'template_language' => 'es',
            'template_variables' => ['Estimada {name}'],
            'status' => 'sending',
            'total_recipients' => 1,
        ]);
        $broadcast->recipients()->create(['contact_id' => $contact->id, 'status' => 'pending']);

        Http::fake([
            'graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.B01']]]),
        ]);

        (new SendBroadcastJob($broadcast->id))->handle();

        $broadcast->refresh();
        $this->assertSame('sent', $broadcast->status);
        $this->assertSame(1, $broadcast->sent_count);
        $this->assertSame('wamid.B01', $broadcast->recipients()->first()->whatsapp_message_id);

        Http::assertSent(function ($request) {
            $body = $request->data();

            return ($body['template']['name'] ?? '') === 'promo'
                && ($body['template']['components'][0]['parameters'][0]['text'] ?? '') === 'Estimada Ana';
        });
    }

    public function test_broadcast_programado_lo_encola_el_comando(): void
    {
        Queue::fake();

        Broadcast::create([
            'account_id' => $this->account->id,
            'name' => 'Programado',
            'template_name' => 'promo',
            'template_language' => 'es',
            'status' => 'scheduled',
            'scheduled_at' => now()->subMinute(),
        ]);

        $this->artisan('broadcasts:process-scheduled')->assertSuccessful();

        Queue::assertPushed(SendBroadcastJob::class);
        $this->assertSame('sending', Broadcast::first()->status);
    }

    public function test_aislamiento_entre_cuentas_en_contactos(): void
    {
        $otro = User::create(['name' => 'Otro', 'email' => 'otro@test.com', 'password' => bcrypt('password')]);
        $otraCuenta = Account::create(['name' => 'Otra', 'owner_user_id' => $otro->id]);
        $otro->update(['account_id' => $otraCuenta->id, 'account_role' => 'owner']);

        $contact = Contact::create(['account_id' => $this->account->id, 'phone' => '584125550001']);

        $this->actingAs($otro->fresh())
            ->patch(route('contacts.update', $contact), ['phone' => '584125550001', 'name' => 'Hackeado'])
            ->assertForbidden();
    }
}
