<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();  // Хэн илгээсэн
            $table->string('title');                              // Мэдэгдлийн гарчиг
            $table->text('body');                                 // Мэдэгдлийн агуулга
            $table->string('type')->default('info');             // info / warning / emergency / schedule
            $table->boolean('is_broadcast')->default(false);     // Бүгдэд явуулсан эсэх
            $table->timestamp('sent_at')->nullable();            // Явуулсан цаг
            $table->integer('statusid')->default(1);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
