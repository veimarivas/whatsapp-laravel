<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        DB::transaction(function () {
            $user = User::create([
                'name' => 'Admin',
                'email' => 'admin',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
                'remember_token' => Str::random(10),
            ]);

            $account = Account::create([
                'name' => 'Default Account',
                'owner_user_id' => $user->id,
            ]);

            $user->account_id = $account->id;
            $user->account_role = User::ROLE_OWNER;
            $user->save();
        });
    }
}
