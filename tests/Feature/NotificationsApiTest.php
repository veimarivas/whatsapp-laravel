<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\ApiKey;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_expone_notificaciones_del_user_dueño_de_la_key(): void
    {
        $hubUser = User::create(['name' => 'Hub', 'email' => 'hub@test.com', 'password' => bcrypt('p')]);
        $account = Account::create(['name' => 'A', 'owner_user_id' => $hubUser->id]);
        $hubUser->update(['account_id' => $account->id, 'account_role' => 'owner']);

        $otro = User::create(['name' => 'Otro', 'account_id' => $account->id, 'email' => 'otro@test.com', 'password' => bcrypt('p')]);

        Notification::create(['account_id' => $account->id, 'user_id' => $hubUser->id, 'type' => 'assigned', 'title' => 'Para el hub']);
        Notification::create(['account_id' => $account->id, 'user_id' => $otro->id, 'type' => 'assigned', 'title' => 'Para otro']);

        [, $plain] = ApiKey::issue($account->id, $hubUser->id, 'Hub', ['notifications:read']);

        $this->withToken($plain)->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Para el hub')
            ->assertJsonPath('data.0.link_path', '/notifications');

        // Scope faltante → 403.
        [, $sinScope] = ApiKey::issue($account->id, $hubUser->id, 'X', ['contacts:read']);
        $this->withToken($sinScope)->getJson('/api/v1/notifications')->assertForbidden();
    }
}
