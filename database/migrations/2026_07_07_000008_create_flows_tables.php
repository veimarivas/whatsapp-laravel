<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Flows: chatbot conversacional con estado y ramas.
// Los edges viven dentro del config JSON de cada nodo (cada botón
// lleva su next_node_key) — igual que el original: el runner solo
// pregunta "estando en el nodo X, ¿a dónde va la respuesta Y?".
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status', 10)->default('draft'); // draft | active | archived
            $table->string('trigger_type', 30); // keyword | first_inbound_message | manual
            $table->json('trigger_config');
            // Referencia a flow_nodes.node_key (string estable, no UUID).
            $table->string('entry_node_id')->nullable();
            $table->json('fallback_policy');
            $table->integer('execution_count')->default(0);
            $table->timestamp('last_executed_at')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'status', 'trigger_type']);
        });

        Schema::create('flow_nodes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('flow_id')->constrained()->cascadeOnDelete();
            $table->string('node_key');
            // start|send_buttons|send_list|send_message|send_media|
            // collect_input|condition|set_tag|handoff|http_fetch|end
            $table->string('node_type', 20);
            $table->json('config');
            $table->integer('position_x')->default(0);
            $table->integer('position_y')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['flow_id', 'node_key']);
        });

        Schema::create('flow_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('flow_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('conversation_id')->nullable()->constrained()->nullOnDelete();
            // active|completed|handed_off|timed_out|paused_by_agent|failed
            $table->string('status', 20)->default('active');
            $table->string('current_node_key')->nullable();
            $table->foreignUuid('last_prompt_message_id')->nullable()->constrained('messages')->nullOnDelete();
            $table->json('vars'); // valores de collect_input + respuestas http_fetch
            $table->integer('reprompt_count')->default(0);
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('last_advanced_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            // Equivalente MySQL del índice único parcial de Postgres
            // (idx_one_active_run_per_contact): como máximo UN run activo
            // por (account, contacto). El motor la rellena con
            // "account_id:contact_id" al crear el run y la pone en NULL
            // al terminarlo; los NULL no chocan en un índice UNIQUE, y dos
            // webhooks concurrentes que intenten iniciar un run reciben
            // un duplicate-key en el segundo INSERT — sin locks.
            $table->string('active_contact_key', 80)->nullable()->unique();

            $table->index(['flow_id', 'started_at']);
            $table->index(['status', 'last_advanced_at']);
        });

        Schema::create('flow_run_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('flow_run_id')->constrained()->cascadeOnDelete();
            // started|node_entered|message_sent|reply_received|
            // fallback_fired|handoff|timeout|error|completed
            $table->string('event_type', 20);
            $table->string('node_key')->nullable();
            $table->json('payload');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['flow_run_id', 'event_type']);
            $table->index(['flow_run_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flow_run_events');
        Schema::dropIfExists('flow_runs');
        Schema::dropIfExists('flow_nodes');
        Schema::dropIfExists('flows');
    }
};
