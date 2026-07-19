<?php

namespace Tests\Feature;

use App\Events\InboxUpdated;
use App\Models\Account;
use App\Models\AiConfig;
use App\Models\AiKnowledgeDocument;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Pipeline;
use App\Models\User;
use App\Models\WhatsappConfig;
use App\Services\Ai\Chunker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ImprovementsTest extends TestCase
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
    }

    private function makeConversation(): Conversation
    {
        $contact = Contact::create([
            'account_id' => $this->account->id,
            'phone' => '584125550001',
            'name' => 'Ana',
        ]);

        return Conversation::create([
            'account_id' => $this->account->id,
            'contact_id' => $contact->id,
        ]);
    }

    private function connectWhatsapp(): void
    {
        WhatsappConfig::create([
            'account_id' => $this->account->id,
            'phone_number_id' => '111222333',
            'access_token' => 'token',
            'status' => 'connected',
        ]);
    }

    public function test_mensaje_nuevo_emite_evento_de_broadcast(): void
    {
        Event::fake([InboxUpdated::class]);

        $conversation = $this->makeConversation();
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'customer',
            'content_text' => 'Hola',
        ]);

        Event::assertDispatched(InboxUpdated::class, function (InboxUpdated $event) use ($conversation) {
            return $event->accountId === $this->account->id
                && $event->conversationId === $conversation->id
                && $event->broadcastOn()->name === 'private-account.'.$this->account->id;
        });
    }

    public function test_envio_de_media_sube_a_meta_y_persiste(): void
    {
        $this->connectWhatsapp();
        $conversation = $this->makeConversation();

        Http::fake([
            'graph.facebook.com/*/media' => Http::response(['id' => 'MEDIA_123']),
            'graph.facebook.com/*/messages' => Http::response(['messages' => [['id' => 'wamid.M1']]]),
        ]);

        $file = UploadedFile::fake()->image('foto.jpg', 640, 480);

        $this->actingAs($this->user)
            ->post(
                route('inbox.send-media', $conversation->id),
                ['file' => $file],
                ['Accept' => 'application/json'],
            )
            ->assertOk()
            ->assertJsonPath('content_type', 'image')
            ->assertJsonPath('media_url', 'MEDIA_123')
            ->assertJsonPath('status', 'sent');

        $this->assertSame('[image]', $conversation->fresh()->last_message_text);
    }

    public function test_reindex_genera_embeddings_cuando_hay_clave(): void
    {
        AiConfig::create([
            'account_id' => $this->account->id,
            'provider' => 'openai',
            'model' => 'gpt-4o-mini',
            'api_key' => 'sk-chat',
            'embeddings_api_key' => 'sk-embed',
            'is_active' => true,
        ]);

        Http::fake([
            'api.openai.com/v1/embeddings' => Http::response([
                'data' => [['index' => 0, 'embedding' => array_fill(0, 8, 0.5)]],
            ]),
        ]);

        $document = AiKnowledgeDocument::create([
            'account_id' => $this->account->id,
            'title' => 'FAQ',
            'content' => 'Nuestro horario es de 8 a 5.',
        ]);

        app(Chunker::class)->reindex($document);

        $chunk = $document->chunks()->first();
        $this->assertNotNull($chunk->embedding);
        $this->assertCount(8, $chunk->embedding);
    }

    public function test_reordenar_etapas_del_pipeline(): void
    {
        $this->actingAs($this->user)->post(route('pipelines.store'), ['name' => 'Ventas']);
        $pipeline = Pipeline::first();
        $stages = $pipeline->stages()->orderBy('position')->get();

        // "Contactado" (posición 1) sube a la posición 0.
        $this->actingAs($this->user)
            ->patch(route('stages.move', $stages[1]->id), ['direction' => 'up'])
            ->assertRedirect();

        $ordered = $pipeline->stages()->orderBy('position')->pluck('name');
        $this->assertSame('Contactado', $ordered[0]);
        $this->assertSame('Nuevo', $ordered[1]);
    }

    public function test_transferencia_de_ownership(): void
    {
        $admin = User::create([
            'name' => 'Segundo',
            'email' => 'segundo@test.com',
            'password' => bcrypt('password'),
            'account_id' => $this->account->id,
            'account_role' => 'admin',
        ]);

        // Un no-owner no puede transferir.
        $this->actingAs($admin)
            ->post(route('team.members.transfer', $this->user->id))
            ->assertForbidden();

        // El owner sí.
        $this->actingAs($this->user)
            ->post(route('team.members.transfer', $admin->id))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame($admin->id, $this->account->fresh()->owner_user_id);
        $this->assertSame('owner', $admin->fresh()->account_role);
        $this->assertSame('admin', $this->user->fresh()->account_role);
    }
}
