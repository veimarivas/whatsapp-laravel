<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Flag efímero: TRUE mientras un AiAutoReplyJob está generando respuesta.
     * La UI del Inbox lo usa para mostrar una burbuja "✨ IA pensando..."
     * al cliente y agente, así el silencio de 30-60s no se siente eterno.
     * Se resetea a FALSE al terminar (o al fallar) el job.
     */
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->boolean('ai_pending')->default(false)->after('ai_reply_count');
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn('ai_pending');
        });
    }
};
