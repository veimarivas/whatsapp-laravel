<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Flow;
use App\Models\FlowNode;
use App\Models\FlowRun;
use App\Models\Message;
use App\Models\User;
use App\Models\WhatsappConfig;
use App\Services\Flows\Runner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FlowsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Account $account;

    private Contact $contact;

    private Conversation $conversation;

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

        $this->conversation = Conversation::create([
            'account_id' => $this->account->id,
            'contact_id' => $this->contact->id,
        ]);

        Http::fake(['graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.'.uniqid()]]])]);
    }

    private function runner(): Runner
    {
        return app(Runner::class);
    }

    /** Menú → botones → captura → fin. */
    private function makeMenuFlow(): Flow
    {
        $flow = Flow::create([
            'account_id' => $this->account->id,
            'name' => 'Menú',
            'status' => 'active',
            'trigger_type' => 'keyword',
            'trigger_config' => ['keywords' => ['hola']],
            'entry_node_id' => 'menu',
            'fallback_policy' => ['on_unknown_reply' => 'reprompt', 'max_reprompts' => 1, 'on_timeout_hours' => 24, 'on_exhaust' => 'handoff'],
        ]);

        foreach ([
            ['node_key' => 'menu', 'node_type' => 'send_buttons', 'config' => [
                'text' => 'Hola {name}, elige:',
                'buttons' => [
                    ['id' => 'pedido', 'title' => 'Hacer pedido', 'next' => 'pedir_nombre'],
                    ['id' => 'salir', 'title' => 'Salir', 'next' => 'fin'],
                ],
            ]],
            ['node_key' => 'pedir_nombre', 'node_type' => 'collect_input', 'config' => [
                'text' => '¿Qué producto quieres?',
                'var' => 'producto',
                'next' => 'confirmar',
            ]],
            ['node_key' => 'confirmar', 'node_type' => 'send_message', 'config' => [
                'text' => 'Anotado: {producto}. Un agente confirmará tu pedido.',
                'next' => 'fin',
            ]],
            ['node_key' => 'fin', 'node_type' => 'end', 'config' => ['message' => '¡Gracias!']],
        ] as $node) {
            FlowNode::create(['flow_id' => $flow->id, ...$node]);
        }

        return $flow;
    }

    private function inbound(string $text, ?string $replyId = null): Message
    {
        return Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_type' => Message::SENDER_CUSTOMER,
            'content_text' => $text,
            'content_type' => $replyId ? 'interactive' : 'text',
            'interactive_reply_id' => $replyId,
            'message_id' => 'wamid.in.'.uniqid(),
            'status' => 'delivered',
        ]);
    }

    public function test_keyword_inicia_run_y_envia_el_menu(): void
    {
        $this->makeMenuFlow();

        $this->runner()->handleInbound($this->contact, $this->conversation, $this->inbound('Hola, buenas'));

        $run = FlowRun::first();
        $this->assertSame(FlowRun::STATUS_ACTIVE, $run->status);
        $this->assertSame('menu', $run->current_node_key);
        $this->assertNotNull($run->active_contact_key);

        $prompt = Message::where('sender_type', 'bot')->first();
        $this->assertSame('interactive', $prompt->content_type);
        $this->assertSame('Hola Ana, elige:', $prompt->content_text);
    }

    public function test_conversacion_completa_con_captura_de_variable(): void
    {
        $this->makeMenuFlow();
        $runner = $this->runner();

        $runner->handleInbound($this->contact, $this->conversation, $this->inbound('hola'));

        // Toca el botón "Hacer pedido".
        $runner->handleInbound($this->contact, $this->conversation, $this->inbound('Hacer pedido', 'pedido'));
        $run = FlowRun::first();
        $this->assertSame('pedir_nombre', $run->current_node_key);

        // Responde con el producto → se captura la variable y termina.
        $runner->handleInbound($this->contact, $this->conversation, $this->inbound('Una pizza grande'));
        $run->refresh();
        $this->assertSame(FlowRun::STATUS_COMPLETED, $run->status);
        $this->assertSame('Una pizza grande', $run->vars['producto']);
        $this->assertNull($run->active_contact_key); // libera el candado

        $texts = Message::where('sender_type', 'bot')->orderBy('created_at')->pluck('content_text');
        $this->assertContains('Anotado: Una pizza grande. Un agente confirmará tu pedido.', $texts);
        $this->assertContains('¡Gracias!', $texts);
    }

    public function test_respuesta_desconocida_repregunta_y_luego_handoff(): void
    {
        $this->makeMenuFlow();
        $runner = $this->runner();

        $runner->handleInbound($this->contact, $this->conversation, $this->inbound('hola'));

        // Respuesta que no coincide con ningún botón → reprompt (max 1).
        $runner->handleInbound($this->contact, $this->conversation, $this->inbound('asdfgh'));
        $run = FlowRun::first();
        $this->assertSame(FlowRun::STATUS_ACTIVE, $run->status);
        $this->assertSame(1, $run->reprompt_count);

        // Segunda respuesta inválida → agotado → handoff.
        $runner->handleInbound($this->contact, $this->conversation, $this->inbound('qwerty'));
        $run->refresh();
        $this->assertSame(FlowRun::STATUS_HANDED_OFF, $run->status);
        $this->assertSame(Conversation::STATUS_PENDING, $this->conversation->fresh()->status);
    }

    public function test_solo_un_run_activo_por_contacto(): void
    {
        $flow = $this->makeMenuFlow();
        $runner = $this->runner();

        $first = $runner->start($flow, $this->contact, $this->conversation);
        $this->assertNotNull($first);

        // Segundo intento concurrente → rechazado por el índice único.
        $second = $runner->start($flow, $this->contact, $this->conversation);
        $this->assertNull($second);
        $this->assertSame(1, FlowRun::count());
    }

    public function test_timeout_barre_runs_abandonados(): void
    {
        $this->makeMenuFlow();
        $runner = $this->runner();

        $runner->handleInbound($this->contact, $this->conversation, $this->inbound('hola'));
        FlowRun::query()->update(['last_advanced_at' => now()->subHours(30)]);

        $this->assertSame(1, $runner->sweepTimeouts());
        $this->assertSame(FlowRun::STATUS_TIMED_OUT, FlowRun::first()->status);
    }

    public function test_mensaje_de_agente_pausa_el_run(): void
    {
        $this->makeMenuFlow();
        $this->runner()->handleInbound($this->contact, $this->conversation, $this->inbound('hola'));

        $this->actingAs($this->user)
            ->postJson("/inbox/conversations/{$this->conversation->id}/send", ['text' => 'Te atiendo yo'])
            ->assertOk();

        $this->assertSame(FlowRun::STATUS_PAUSED_BY_AGENT, FlowRun::first()->status);
    }

    public function test_el_editor_valida_edges_rotos(): void
    {
        $flow = Flow::create([
            'account_id' => $this->account->id,
            'name' => 'Test',
            'status' => 'draft',
            'trigger_type' => 'manual',
            'trigger_config' => [],
            'entry_node_id' => 'a',
            'fallback_policy' => Flow::DEFAULT_FALLBACK_POLICY,
        ]);

        $this->actingAs($this->user)
            ->patch(route('flows.update', $flow), [
                'name' => 'Test',
                'trigger_type' => 'manual',
                'entry_node_id' => 'a',
                'nodes' => [
                    ['node_key' => 'a', 'node_type' => 'send_message', 'config' => ['text' => 'Hola', 'next' => 'no_existe']],
                ],
            ])
            ->assertSessionHasErrors('nodes');

        // Con el edge corregido, guarda bien.
        $this->actingAs($this->user)
            ->patch(route('flows.update', $flow), [
                'name' => 'Test',
                'trigger_type' => 'manual',
                'entry_node_id' => 'a',
                'nodes' => [
                    ['node_key' => 'a', 'node_type' => 'send_message', 'config' => ['text' => 'Hola', 'next' => null]],
                ],
            ])
            ->assertSessionHasNoErrors();
    }
}
