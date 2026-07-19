<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete(); // creador
            $table->string('phone', 32);
            // Dígitos sin formato para deduplicación (equivalente a
            // contacts.phone_normalized del original, migración 022).
            $table->string('phone_normalized', 32)->nullable();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('company')->nullable();
            $table->string('avatar_url', 2048)->nullable();
            $table->timestamps();

            $table->unique(['account_id', 'phone_normalized']);
            $table->index('phone');
        });

        Schema::create('tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('color', 20)->default('#3b82f6');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('contact_tags', function (Blueprint $table) {
            $table->foreignUuid('contact_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('tag_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['contact_id', 'tag_id']);
        });

        Schema::create('custom_fields', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->string('field_name');
            $table->string('field_type', 20)->default('text');
            $table->json('field_options')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('contact_custom_values', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contact_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('custom_field_id')->constrained()->cascadeOnDelete();
            $table->text('value')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['contact_id', 'custom_field_id']);
        });

        Schema::create('contact_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('contact_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('note_text');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_notes');
        Schema::dropIfExists('contact_custom_values');
        Schema::dropIfExists('custom_fields');
        Schema::dropIfExists('contact_tags');
        Schema::dropIfExists('tags');
        Schema::dropIfExists('contacts');
    }
};
