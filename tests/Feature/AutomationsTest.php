<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Automation;
use App\Models\AutomationPendingExecution;
use App\Models\AutomationStep;
use App\Models\Contact;
use App\Models\Message;
use App\Models\Tag;
use App\Models\User;
use App\Models\WhatsappConfig;
use App\Services\Automations\Engine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AutomationsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Account $account;

    private Contact $contact;

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

        $this->contact = Contact::create([
            'account_id' => $this->account->id,
            'phone' => '584125550001',
            'name' => 'Ana',
        ]);
    }

    private function engine(): Engine
    {
        return app(Engine::class);
    }

    private function makeAutomation(string $trigger, array $triggerConfig = []): Automation
    {
        return Automation::create([
            'account_id' => $this->account->id,
            'name' => 'Test',
            'trigger_type' => $trigger,
            'trigger_config' => $triggerConfig,
            'is_active' => true,
        ]);
    }

    public function test_keyword_dispara_solo_si_coincide(): void
    {
        Http::fake(['graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.A1']]])]);

        $automation = $this->makeAutomation('keyword', ['keywords' => ['precio']]);
        AutomationStep::create([
            'automation_id' => $automation->id,
            'step_type' => 'send_message',
            'step_config' => ['text' => 'Hola {name}, aquí va la lista de precios.'],
            'position' => 0,
        ]);

        // No coincide → no ejecuta.
        $this->engine()->fire('keyword', $this->contact, null, 'buenas tardes');
        $this->assertSame(0, $automation->fresh()->execution_count);

        // Coincide (case-insensitive, substring) → ejecuta y envía.
        $this->engine()->fire('keyword', $this->contact, null, '¿Cuál es el PRECIO?');
        $this->assertSame(1, $automation->fresh()->execution_count);

        $sent = Message::where('sender_type', 'bot')->first();
        $this->assertSame('Hola Ana, aquí va la lista de precios.', $sent->content_text);
        $this->assertSame('sent', $sent->status);
    }

    public function test_condicion_ejecuta_la_rama_correcta_y_tags(): void
    {
        $vip = Tag::create(['account_id' => $this->account->id, 'name' => 'VIP']);
        $normal = Tag::create(['account_id' => $this->account->id, 'name' => 'Normal']);

        $automation = $this->makeAutomation('inbound_message');
        $condition = AutomationStep::create([
            'automation_id' => $automation->id,
            'step_type' => 'condition',
            'step_config' => ['field' => 'message_text', 'operator' => 'contains', 'value' => 'urgente'],
            'position' => 0,
        ]);
        AutomationStep::create([
            'automation_id' => $automation->id,
            'parent_step_id' => $condition->id,
            'branch' => 'yes',
            'step_type' => 'add_tag',
            'step_config' => ['tag_id' => $vip->id],
            'position' => 0,
        ]);
        AutomationStep::create([
            'automation_id' => $automation->id,
            'parent_step_id' => $condition->id,
            'branch' => 'no',
            'step_type' => 'add_tag',
            'step_config' => ['tag_id' => $normal->id],
            'position' => 0,
        ]);

        $this->engine()->fire('inbound_message', $this->contact, null, 'esto es URGENTE');

        $this->assertTrue($this->contact->tags()->where('tags.id', $vip->id)->exists());
        $this->assertFalse($this->contact->tags()->where('tags.id', $normal->id)->exists());

        $log = $automation->logs()->first();
        $this->assertSame('success', $log->status);
        $this->assertSame('yes', $log->steps_executed[0]['result']);
    }

    public function test_wait_crea_pendiente_y_el_resume_continua(): void
    {
        Http::fake(['graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.A2']]])]);

        $automation = $this->makeAutomation('new_contact');
        AutomationStep::create([
            'automation_id' => $automation->id,
            'step_type' => 'wait',
            'step_config' => ['minutes' => 30],
            'position' => 0,
        ]);
        AutomationStep::create([
            'automation_id' => $automation->id,
            'step_type' => 'send_message',
            'step_config' => ['text' => 'Seguimiento después de la espera'],
            'position' => 1,
        ]);

        $this->engine()->fire('new_contact', $this->contact);

        // La espera corta la ejecución: nada enviado, pendiente creado.
        $this->assertSame(0, Message::where('sender_type', 'bot')->count());
        $pending = AutomationPendingExecution::first();
        $this->assertSame('pending', $pending->status);
        $this->assertSame(1, $pending->next_step_position);
        $this->assertTrue($pending->run_at->greaterThan(now()->addMinutes(25)));

        // Simula el cron: vence la espera y reanuda.
        $pending->update(['run_at' => now()->subMinute()]);
        $this->engine()->resume($pending->fresh());

        $this->assertSame('done', $pending->fresh()->status);
        $this->assertSame(
            'Seguimiento después de la espera',
            Message::where('sender_type', 'bot')->first()->content_text,
        );
    }

    public function test_webhook_step_hace_post_con_datos_del_contacto(): void
    {
        Http::fake(['hooks.test/*' => Http::response(['ok' => true])]);

        $automation = $this->makeAutomation('inbound_message');
        AutomationStep::create([
            'automation_id' => $automation->id,
            'step_type' => 'webhook',
            'step_config' => ['url' => 'https://hooks.test/crm'],
            'position' => 0,
        ]);

        $this->engine()->fire('inbound_message', $this->contact, null, 'hola');

        Http::assertSent(function ($request) {
            return $request->url() === 'https://hooks.test/crm'
                && $request['contact']['phone'] === '584125550001'
                && $request['message_text'] === 'hola';
        });
    }

    public function test_webhook_entrante_encola_los_eventos(): void
    {
        \Illuminate\Support\Facades\Queue::fake();
        config(['services.meta.app_secret' => 'secret']);

        $payload = json_encode([
            'entry' => [['changes' => [['field' => 'messages', 'value' => [
                'metadata' => ['phone_number_id' => '111222333'],
                'contacts' => [['profile' => ['name' => 'Nuevo'], 'wa_id' => '584125559999']],
                'messages' => [[
                    'from' => '584125559999',
                    'id' => 'wamid.NEW1',
                    'type' => 'text',
                    'text' => ['body' => 'hola precio'],
                ]],
            ]]]]],
        ]);

        $this->call('POST', '/webhooks/whatsapp', [], [], [], [
            'HTTP_X-Hub-Signature-256' => 'sha256='.hash_hmac('sha256', $payload, 'secret'),
            'CONTENT_TYPE' => 'application/json',
        ], $payload)->assertOk();

        // Contacto nuevo por webhook → new_contact + inbound_message + keyword.
        \Illuminate\Support\Facades\Queue::assertPushed(
            \App\Jobs\ProcessAutomationEventJob::class,
            3,
        );
    }

    public function test_crud_del_builder_guarda_el_arbol(): void
    {
        $tag = Tag::create(['account_id' => $this->account->id, 'name' => 'VIP']);

        $this->actingAs($this->user)
            ->post(route('automations.store'), [
                'name' => 'Bienvenida',
                'trigger_type' => 'keyword',
                'trigger_config' => ['keywords' => ['hola']],
                'steps' => [
                    ['type' => 'send_message', 'config' => ['text' => 'Hola!'], 'children_yes' => [], 'children_no' => []],
                    [
                        'type' => 'condition',
                        'config' => ['field' => 'message_text', 'operator' => 'contains', 'value' => 'vip'],
                        'children_yes' => [
                            ['type' => 'add_tag', 'config' => ['tag_id' => $tag->id], 'children_yes' => [], 'children_no' => []],
                        ],
                        'children_no' => [],
                    ],
                ],
            ])
            ->assertRedirect();

        $automation = Automation::first();
        $this->assertSame(3, $automation->steps()->count());
        $this->assertSame(1, $automation->steps()->where('branch', 'yes')->count());

        // Activar funciona porque tiene pasos.
        $this->actingAs($this->user)
            ->post(route('automations.toggle', $automation))
            ->assertSessionHasNoErrors();
        $this->assertTrue($automation->fresh()->is_active);

        // Tipo de paso inválido → rechazado.
        $this->actingAs($this->user)
            ->patch(route('automations.update', $automation), [
                'name' => 'Bienvenida',
                'trigger_type' => 'inbound_message',
                'steps' => [['type' => 'hackear', 'config' => []]],
            ])
            ->assertSessionHasErrors('steps');
    }
}
