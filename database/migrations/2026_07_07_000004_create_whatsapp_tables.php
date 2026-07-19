<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('phone_number_id')->unique();
            $table->string('waba_id')->nullable();
            $table->text('access_token'); // cifrado con Crypt (AES-256)
            $table->string('verify_token')->nullable();
            $table->string('status', 15)->default('disconnected'); // connected | disconnected
            $table->timestamp('connected_at')->nullable();
            $table->timestamp('registered_at')->nullable();
            $table->timestamp('subscribed_apps_at')->nullable();
            $table->text('last_registration_error')->nullable();
            $table->timestamps();
        });

        Schema::create('message_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('category', 20)->default('Marketing'); // Marketing | Utility | Authentication
            $table->string('language', 10)->default('en_US');
            $table->string('header_type', 10)->nullable(); // text | image | video | document
            $table->text('header_content')->nullable();
            $table->text('body_text');
            $table->string('footer_text')->nullable();
            $table->json('buttons')->nullable();
            $table->json('sample_values')->nullable();
            // Integración con Meta (migración 014 del original)
            $table->string('meta_template_id')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->string('quality_score', 10)->nullable(); // GREEN | YELLOW | RED
            $table->text('header_handle')->nullable();
            $table->string('header_media_url', 2048)->nullable();
            $table->text('submission_error')->nullable();
            $table->timestamp('last_submitted_at')->nullable();
            // DRAFT | PENDING | APPROVED | REJECTED | PAUSED | DISABLED
            $table->string('status', 15)->default('DRAFT');
            $table->timestamps();

            $table->unique(['account_id', 'name', 'language']);
            $table->index('meta_template_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_templates');
        Schema::dropIfExists('whatsapp_configs');
    }
};
