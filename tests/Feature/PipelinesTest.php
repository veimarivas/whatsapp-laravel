<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PipelinesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Account $account;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Vendedor',
            'email' => 'ventas@test.com',
            'password' => bcrypt('password'),
        ]);
        $this->account = Account::create(['name' => 'Empresa', 'owner_user_id' => $this->user->id]);
        $this->user->update(['account_id' => $this->account->id, 'account_role' => 'owner']);
        $this->user->refresh();
    }

    public function test_crear_pipeline_siembra_etapas_por_defecto(): void
    {
        $this->actingAs($this->user)
            ->post(route('pipelines.store'), ['name' => 'Ventas B2B'])
            ->assertRedirect();

        $pipeline = Pipeline::forAccount($this->account->id)->first();
        $this->assertSame('Ventas B2B', $pipeline->name);
        $this->assertSame(5, $pipeline->stages()->count());
        $this->assertSame('Nuevo', $pipeline->stages()->orderBy('position')->first()->name);
    }

    public function test_ciclo_de_vida_del_deal_y_movimiento_de_etapa(): void
    {
        $this->actingAs($this->user)->post(route('pipelines.store'), ['name' => 'Ventas']);
        $pipeline = Pipeline::first();
        [$primera, $segunda] = $pipeline->stages()->orderBy('position')->take(2)->get();

        $contact = Contact::create([
            'account_id' => $this->account->id,
            'phone' => '584125550001',
            'name' => 'Ana',
        ]);

        // Crear deal.
        $this->actingAs($this->user)
            ->post(route('deals.store'), [
                'pipeline_id' => $pipeline->id,
                'stage_id' => $primera->id,
                'contact_id' => $contact->id,
                'title' => 'Licencia anual',
                'value' => 1200.50,
                'assigned_to' => $this->user->id,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $deal = Deal::first();
        $this->assertSame('1200.50', $deal->value);
        $this->assertSame('open', $deal->status);

        // Drag & drop: PATCH solo con stage_id.
        $this->actingAs($this->user)
            ->patch(route('deals.update', $deal), ['stage_id' => $segunda->id])
            ->assertRedirect();

        $this->assertSame($segunda->id, $deal->fresh()->stage_id);

        // Una etapa de OTRO pipeline se rechaza.
        $this->actingAs($this->user)->post(route('pipelines.store'), ['name' => 'Otro']);
        $etapaAjena = Pipeline::where('name', 'Otro')->first()->stages()->first();

        $this->actingAs($this->user)
            ->patch(route('deals.update', $deal), ['stage_id' => $etapaAjena->id])
            ->assertSessionHasErrors('stage_id');

        // Marcar como ganado (edición completa).
        $this->actingAs($this->user)
            ->patch(route('deals.update', $deal), [
                'stage_id' => $segunda->id,
                'title' => 'Licencia anual',
                'value' => 1500,
                'status' => 'won',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame('won', $deal->fresh()->status);
    }

    public function test_no_se_borra_una_etapa_con_deals(): void
    {
        $this->actingAs($this->user)->post(route('pipelines.store'), ['name' => 'Ventas']);
        $pipeline = Pipeline::first();
        $stage = $pipeline->stages()->first();

        Deal::create([
            'account_id' => $this->account->id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $stage->id,
            'title' => 'Deal activo',
        ]);

        $this->actingAs($this->user)
            ->delete(route('stages.destroy', $stage))
            ->assertSessionHasErrors('stage');

        $this->assertNotNull($stage->fresh());
    }

    public function test_aislamiento_entre_cuentas(): void
    {
        $this->actingAs($this->user)->post(route('pipelines.store'), ['name' => 'Ventas']);
        $pipeline = Pipeline::first();

        $otro = User::create(['name' => 'Otro', 'email' => 'otro@test.com', 'password' => bcrypt('password')]);
        $otraCuenta = Account::create(['name' => 'Otra', 'owner_user_id' => $otro->id]);
        $otro->update(['account_id' => $otraCuenta->id, 'account_role' => 'owner']);

        $this->actingAs($otro->fresh())
            ->patch(route('pipelines.update', $pipeline), ['name' => 'Robado'])
            ->assertForbidden();

        $this->actingAs($otro->fresh())
            ->post(route('stages.store', $pipeline), ['name' => 'Intrusa'])
            ->assertForbidden();

        // Un deal no puede apuntar a un pipeline ajeno (404 del scoping).
        $this->actingAs($otro->fresh())
            ->post(route('deals.store'), [
                'pipeline_id' => $pipeline->id,
                'stage_id' => $pipeline->stages()->first()->id,
                'title' => 'Intruso',
            ])
            ->assertNotFound();
    }
}
