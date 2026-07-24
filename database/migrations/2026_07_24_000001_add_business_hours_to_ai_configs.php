<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Horario de atención + mensaje fuera de horario para la IA.
 * Si business_hours está seteado y el momento actual cae fuera de esos
 * rangos, la IA no genera respuesta con Ollama sino que envía el
 * `after_hours_message` (una vez por conversación por día para no spamear).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_configs', function (Blueprint $table) {
            // {"mon":[["08:00","19:00"]],"tue":[["08:00","19:00"]],...}
            // Días ausentes o array vacío = cerrado ese día.
            $table->json('business_hours')->nullable()->after('auto_reply_max_per_conversation');
            $table->text('after_hours_message')->nullable();
            $table->string('timezone', 60)->default('America/La_Paz');
        });
    }

    public function down(): void
    {
        Schema::table('ai_configs', function (Blueprint $table) {
            $table->dropColumn(['business_hours', 'after_hours_message', 'timezone']);
        });
    }
};
