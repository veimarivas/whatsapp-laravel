<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Guarda la transcripción de los mensajes de audio del cliente.
 * Se llena de forma asíncrona por TranscribeAudioJob usando whisper.cpp
 * en el servidor (o cualquier otro backend definido en config/services.php).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->text('transcript')->nullable()->after('content_text');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('transcript');
        });
    }
};
