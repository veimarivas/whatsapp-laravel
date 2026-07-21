<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Fase 7 del Komo Hub: /provision acepta account_id + account_role para invitados. */
class ProvisionMemberTest extends TestCase
{
    use RefreshDatabase;

    public function test_provisiona_miembro_en_cuenta_existente(): void
    {
        config(['services.hub.provision_secret' => 'prov-secret']);

        $owner = User::create(['name' => 'O', 'email' => 'o@test.com', 'password' => bcrypt('p')]);
        $ownerAccount = Account::create(['name' => 'Empresa', 'owner_user_id' => $owner->id]);
        $owner->update(['account_id' => $ownerAccount->id, 'account_role' => 'owner']);
        $usersAntes = User::count();
        $accountsAntes = Account::count();

        $body = json_encode([
            'name' => 'Nuevo Agente',
            'email' => 'agente@test.com',
            'account_id' => $ownerAccount->id,
            'account_role' => 'admin',
        ]);

        $this->call('POST', '/api/v1/provision', [], [], [], [
            'HTTP_X-Provision-Signature' => 'sha256='.hash_hmac('sha256', $body, 'prov-secret'),
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], $body)->assertCreated()->assertJsonPath('account_id', $ownerAccount->id);

        $invitee = User::where('email', 'agente@test.com')->first();
        $this->assertSame($ownerAccount->id, $invitee->account_id);
        $this->assertSame('admin', $invitee->account_role);
        // No creó cuenta nueva — se unió a la del owner.
        $this->assertSame($usersAntes + 1, User::count());
        $this->assertSame($accountsAntes, Account::count());
    }
}
