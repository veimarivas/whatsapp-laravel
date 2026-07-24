<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Reglas de auto-tagging: si un mensaje entrante contiene la palabra clave,
 * el contacto recibe automáticamente el tag asociado. Se aplica el mismo
 * mensaje puede matchear varias reglas → se aplican todos los tags.
 * Case-insensitive, matching por LIKE %keyword% (substring).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auto_tag_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('tag_id')->constrained('tags')->cascadeOnDelete();
            $table->string('keyword', 60);
            $table->boolean('first_message_only')->default(false); // solo aplicar en el 1er mensaje del contacto
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['account_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auto_tag_rules');
    }
};
