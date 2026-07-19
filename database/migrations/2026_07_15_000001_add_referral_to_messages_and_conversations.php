<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Atribución de anuncios Click-to-WhatsApp: Meta envía un bloque
// `referral` en el mensaje entrante cuando el usuario llegó tocando
// un anuncio. Se guarda el bloque completo en el mensaje y el ad_id
// de entrada en la conversación (solo la primera vez).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->json('referral')->nullable()->after('media_url');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->string('entry_ad_id', 64)->nullable()->index()->after('assigned_agent_id');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('referral');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn('entry_ad_id');
        });
    }
};
