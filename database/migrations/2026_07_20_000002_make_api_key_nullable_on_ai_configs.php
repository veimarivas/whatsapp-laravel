<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Sin doctrine/dbal: ALTER directo. api_key sigue TEXT pero ahora nullable
        // (Ollama corre local y no necesita clave; los demás proveedores sí).
        DB::statement('ALTER TABLE ai_configs MODIFY api_key TEXT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE ai_configs MODIFY api_key TEXT NOT NULL');
    }
};
