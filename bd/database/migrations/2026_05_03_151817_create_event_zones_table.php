<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('name');                        // Монгол нэр (Stage A, Гадна талбай г.м)
            $table->string('name2')->nullable();           // Англи нэр
            $table->string('type')->default('general');   // general / emergency_exit / stage / parking
            $table->json('coordinates')->nullable();       // Map дотрох байрлалын координат
            $table->string('color')->nullable();           // Map дэлгэцэнд харуулах өнгө
            $table->integer('capacity')->nullable();       // Хэдэн хүн багтах вэ
            $table->integer('statusid')->default(1);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_zones');
    }
};
