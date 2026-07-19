<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// URL pública del media para plantillas con encabezado de imagen /
// video / documento: Meta lo exige como parámetro al enviar.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('broadcasts', function (Blueprint $table) {
            $table->string('header_media_url', 2048)->nullable()->after('template_variables');
        });
    }

    public function down(): void
    {
        Schema::table('broadcasts', function (Blueprint $table) {
            $table->dropColumn('header_media_url');
        });
    }
};
