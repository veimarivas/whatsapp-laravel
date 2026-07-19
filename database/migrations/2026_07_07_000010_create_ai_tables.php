<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Asistente IA (BYO key) + base de conocimiento.
// Búsqueda: FULLTEXT de MySQL sobre los chunks (equivalente al modo
// lexical del original). El embedding se guarda como JSON para el
// modo semántico (cosine similarity calculado en PHP).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('provider', 20); // openai | anthropic
            $table->string('model', 100);
            $table->text('api_key'); // clave del proveedor, cifrada con Crypt
            $table->text('embeddings_api_key')->nullable(); // opcional: habilita búsqueda semántica
            $table->text('system_prompt')->nullable(); // contexto del negocio / tono
            $table->boolean('is_active')->default(false);
            $table->boolean('auto_reply_enabled')->default(false);
            $table->unsignedTinyInteger('auto_reply_max_per_conversation')->default(3);
            $table->timestamps();
        });

        Schema::create('ai_knowledge_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->longText('content');
            $table->timestamps();
        });

        Schema::create('ai_knowledge_chunks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('document_id')->constrained('ai_knowledge_documents')->cascadeOnDelete();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->integer('chunk_index')->default(0);
            $table->text('content');
            $table->json('embedding')->nullable(); // vector 1536d serializado
            $table->timestamp('created_at')->useCurrent();

            $table->fullText('content');
            $table->index(['account_id', 'document_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_knowledge_chunks');
        Schema::dropIfExists('ai_knowledge_documents');
        Schema::dropIfExists('ai_configs');
    }
};
