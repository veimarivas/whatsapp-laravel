<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\ApiKey;
use App\Models\Contact;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Filtro server-side `?tag_id=` de /api/v1/contacts — lo consume
 * meta_ads (Fase 7) para armar Custom Audiences desde un tag sin
 * paginar el catálogo completo.
 */
class ApiContactsTagFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_contacts_filtra_por_tag_id(): void
    {
        $user = User::create(['name' => 'Admin', 'email' => 'admin@test.com', 'password' => bcrypt('password')]);
        $account = Account::create(['name' => 'Empresa', 'owner_user_id' => $user->id]);
        $user->update(['account_id' => $account->id, 'account_role' => 'owner']);

        $tag = Tag::create(['account_id' => $account->id, 'name' => 'VIP']);

        $vip = Contact::create(['account_id' => $account->id, 'phone' => '584125550001', 'name' => 'Ana']);
        $vip->tags()->attach($tag->id);

        Contact::create(['account_id' => $account->id, 'phone' => '584125550002', 'name' => 'Beto']);

        [, $plaintext] = ApiKey::issue($account->id, $user->id, 'meta_ads', ['contacts:read']);

        $this->withToken($plaintext)->getJson("/api/v1/contacts?tag_id={$tag->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Ana');

        // Sin filtro devuelve ambos.
        $this->withToken($plaintext)->getJson('/api/v1/contacts')->assertJsonCount(2, 'data');

        // Un tag inexistente devuelve vacío (no error).
        $this->withToken($plaintext)->getJson('/api/v1/contacts?tag_id=00000000-0000-0000-0000-000000000000')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
