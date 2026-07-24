<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Índice FULLTEXT sobre messages.content_text para el buscador global del
 * Inbox. Permite buscar cualquier palabra en cualquier conversación pasada
 * (endpoint /inbox/search) con velocidad decente aún con millones de filas.
 * Motor debe ser InnoDB con MariaDB 10.0.5+ (default en nuestro server).
 */
return new class extends Migration
{
    public function up(): void
    {
        // Cuidado con datos vacíos/nulls: FULLTEXT los ignora sin problemas.
        DB::statement('ALTER TABLE messages ADD FULLTEXT INDEX messages_content_fulltext (content_text)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE messages DROP INDEX messages_content_fulltext');
    }
};
