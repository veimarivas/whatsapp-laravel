<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('automations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            // inbound_message | new_contact | keyword | schedule
            $table->string('trigger_type', 30);
            $table->json('trigger_config');
            $table->boolean('is_active')->default(false);
            $table->integer('execution_count')->default(0);
            $table->timestamp('last_executed_at')->nullable();
            $table->timestamps();

            // Hot path del motor: automatizaciones activas por trigger.
            $table->index(['account_id', 'trigger_type', 'is_active']);
        });

        Schema::create('automation_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('automation_id')->constrained()->cascadeOnDelete();
            // NULL en pasos raíz; id del paso Condition para los pasos
            // que viven dentro de una de sus ramas.
            $table->foreignUuid('parent_step_id')->nullable()->constrained('automation_steps')->cascadeOnDelete();
            $table->string('branch', 3)->nullable(); // yes | no
            $table->string('step_type', 30);
            $table->json('step_config');
            $table->integer('position');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['automation_id', 'position']);
        });

        Schema::create('automation_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('automation_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->string('trigger_event', 50);
            $table->json('steps_executed');
            $table->string('status', 10); // success | partial | failed
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['automation_id', 'created_at']);
        });

        // Cola de reanudación para pasos "wait". En Laravel el drenaje
        // lo hace el Scheduler (cada minuto) en lugar del endpoint cron.
        Schema::create('automation_pending_executions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('automation_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('log_id')->nullable()->constrained('automation_logs')->cascadeOnDelete();
            $table->foreignUuid('parent_step_id')->nullable()->constrained('automation_steps')->nullOnDelete();
            $table->string('branch', 3)->nullable(); // yes | no
            $table->integer('next_step_position');
            $table->json('context');
            $table->string('status', 10)->default('pending'); // pending|running|done|failed
            $table->timestamp('run_at');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['status', 'run_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('automation_pending_executions');
        Schema::dropIfExists('automation_logs');
        Schema::dropIfExists('automation_steps');
        Schema::dropIfExists('automations');
    }
};
