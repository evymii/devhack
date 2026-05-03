<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_id')->unique();         // Unique device identifier
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('event_id')->nullable()->constrained()->nullOnDelete();
            $table->string('platform')->nullable();        // ios / android
            $table->boolean('is_admin')->default(false);  // Admin device эсэх
            $table->timestamp('last_seen_at')->nullable(); // Сүүлд online болсон цаг
            $table->integer('statusid')->default(1);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
