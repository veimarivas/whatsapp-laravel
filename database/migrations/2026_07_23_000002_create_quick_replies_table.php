<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Plantillas de respuesta rápida por cuenta. Cada agente puede tener las
 * suyas propias (user_id) o compartir con todo el equipo (user_id=null).
 * Se accede desde el composer del Inbox con "/" o el botón 📋.
 * Admiten variables {name} {phone} {email} {company} que se substituyen
 * con datos del contacto al insertar.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quick_replies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('shortcut', 40); // ej. "precios", "horario", "gracias"
            $table->text('content');
            $table->timestamps();

            $table->index(['account_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quick_replies');
    }
};
