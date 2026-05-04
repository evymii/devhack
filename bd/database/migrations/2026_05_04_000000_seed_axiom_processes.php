<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\AxiomProcess;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Хөгжүүлэгчид энд шинээр API функцүүдээ нэмээд, 
     * энэ файлынхаа нэрийг (жишээ нь цагийг нь) өөрчлөөд 
     * php artisan migrate хийхэд шинээр нэмэгдсэн функцүүд нь л автоматаар орно.
     */
    public function up(): void
    {
        $processes = [
            // Authentication
            ['process_code' => 'lo0101', 'name' => 'Нэвтрэх', 'name2' => 'Login', 'controller' => 'App\Http\Controllers\AuthController', 'function' => 'login'],
            ['process_code' => 'lo0102', 'name' => 'Бүртгүүлэх', 'name2' => 'Register', 'controller' => 'App\Http\Controllers\AuthController', 'function' => 'register'],
            ['process_code' => 'lo0103', 'name' => 'Гарах', 'name2' => 'Logout', 'controller' => 'App\Http\Controllers\AuthController', 'function' => 'logout'],
            
            // Events
            ['process_code' => 'ev0101', 'name' => 'Эвэнтүүд харах', 'name2' => 'List events', 'controller' => 'App\Http\Controllers\EventController', 'function' => 'index'],
            ['process_code' => 'ev0102', 'name' => 'Эвэнт үүсгэх', 'name2' => 'Create event', 'controller' => 'App\Http\Controllers\EventController', 'function' => 'store'],
            ['process_code' => 'ev0103', 'name' => 'Эвэнт засах', 'name2' => 'Update event', 'controller' => 'App\Http\Controllers\EventController', 'function' => 'update'],
            ['process_code' => 'ev0104', 'name' => 'Эвэнт устгах', 'name2' => 'Delete event', 'controller' => 'App\Http\Controllers\EventController', 'function' => 'destroy'],

            // Schedules
            ['process_code' => 'sc0101', 'name' => 'Хөтөлбөрүүд харах', 'name2' => 'List schedules', 'controller' => 'App\Http\Controllers\ScheduleController', 'function' => 'index'],
            ['process_code' => 'sc0102', 'name' => 'Хөтөлбөр үүсгэх', 'name2' => 'Create schedule', 'controller' => 'App\Http\Controllers\ScheduleController', 'function' => 'store'],
            
            // Tickets
            ['process_code' => 'ti0101', 'name' => 'Тасалбар шалгах', 'name2' => 'Verify ticket', 'controller' => 'App\Http\Controllers\TicketController', 'function' => 'verify'],
            ['process_code' => 'ti0102', 'name' => 'Тасалбар үүсгэх', 'name2' => 'Create ticket', 'controller' => 'App\Http\Controllers\TicketController', 'function' => 'store'],

            // Checkin
            ['process_code' => 'ch0101', 'name' => 'Чек-ин хийх', 'name2' => 'Checkin', 'controller' => 'App\Http\Controllers\CheckinController', 'function' => 'ch0101'],

            // Messages
            ['process_code' => 'ms0101', 'name' => 'Мессежүүд харах', 'name2' => 'List messages', 'controller' => 'App\Http\Controllers\MessageController', 'function' => 'ms0101'],
            ['process_code' => 'ms0102', 'name' => 'Мессеж илгээх', 'name2' => 'Send message', 'controller' => 'App\Http\Controllers\MessageController', 'function' => 'ms0102'],
            
            // Notifications
            ['process_code' => 'nt0101', 'name' => 'Мэдэгдэл илгээх', 'name2' => 'Send notification', 'controller' => 'App\Http\Controllers\NotificationController', 'function' => 'nt0101'],

            // Sync
            ['process_code' => 'sy0101', 'name' => 'Оффлайн дата Sync хийх', 'name2' => 'Sync offline data', 'controller' => 'App\Http\Controllers\SyncController', 'function' => 'sy0101'],
        ];

        foreach ($processes as $process) {
            // firstOrCreate нь process_code-оор хайгаад олдвол юу ч хийхгүй (хуучнаараа үлдэнэ), 
            // олдохгүй бол $process массив доторх утгаар шинээр үүсгэнэ.
            AxiomProcess::firstOrCreate(
                ['process_code' => $process['process_code']],
                [
                    'name' => $process['name'],
                    'name2' => $process['name2'],
                    'controller' => $process['controller'],
                    'function' => $process['function'],
                    'statusid' => 1
                ]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Бид энд системээс process-уудыг drop хийхгүй байхаар орхилоо.
    }
};
