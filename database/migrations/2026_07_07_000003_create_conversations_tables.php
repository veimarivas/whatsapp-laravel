<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('contact_id')->constrained()->cascadeOnDelete();
            $table->string('status', 10)->default('open'); // open | pending | closed
            $table->foreignUuid('assigned_agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('last_message_text')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->integer('unread_count')->default(0);
            // Bot de auto-respuesta IA (migración 029 del original):
            // apagado manual por conversación + contador contra el tope.
            $table->boolean('ai_autoreply_disabled')->default(false);
            $table->integer('ai_reply_count')->default(0);
            $table->timestamps();

            $table->index(['account_id', 'status']);
            $table->index('last_message_at');
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('sender_type', 10); // customer | agent | bot
            $table->uuid('sender_id')->nullable();
            // text|image|document|audio|video|location|template|interactive
            $table->string('content_type', 20)->default('text');
            $table->text('content_text')->nullable();
            $table->string('media_url', 2048)->nullable();
            $table->string('template_name')->nullable();
            $table->string('message_id')->nullable(); // wamid de Meta
            $table->string('interactive_reply_id')->nullable(); // id del botón/fila tocado
            $table->foreignUuid('reply_to_message_id')->nullable()->constrained('messages')->nullOnDelete();
            $table->string('status', 10)->default('sent'); // sending|sent|delivered|read|failed
            $table->timestamp('created_at')->useCurrent();

            $table->index(['conversation_id', 'created_at']);
            $table->index('message_id');
        });

        Schema::create('message_reactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('message_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('actor_type', 10); // customer | agent
            $table->uuid('actor_id')->nullable();
            $table->string('emoji', 32);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['message_id', 'actor_type', 'actor_id']);
            $table->index('conversation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_reactions');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
    }
};
