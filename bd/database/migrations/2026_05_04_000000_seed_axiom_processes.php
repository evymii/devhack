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
            ['process_code' => 'lo0101', 'name' => 'Нэвтрэх', 'name2' => 'Login', 'controller' => 'AuthController@login'],
            ['process_code' => 'lo0102', 'name' => 'Бүртгүүлэх', 'name2' => 'Register', 'controller' => 'AuthController@register'],
            ['process_code' => 'lo0103', 'name' => 'Гарах', 'name2' => 'Logout', 'controller' => 'AuthController@logout'],
            
            // Events
            ['process_code' => 'ev0101', 'name' => 'Эвэнтүүд харах', 'name2' => 'List events', 'controller' => 'EventController@index'],
            ['process_code' => 'ev0102', 'name' => 'Эвэнт үүсгэх', 'name2' => 'Create event', 'controller' => 'EventController@store'],
            ['process_code' => 'ev0103', 'name' => 'Эвэнт засах', 'name2' => 'Update event', 'controller' => 'EventController@update'],
            ['process_code' => 'ev0104', 'name' => 'Эвэнт устгах', 'name2' => 'Delete event', 'controller' => 'EventController@destroy'],

            // Schedules
            ['process_code' => 'sc0101', 'name' => 'Хөтөлбөрүүд харах', 'name2' => 'List schedules', 'controller' => 'ScheduleController@index'],
            ['process_code' => 'sc0102', 'name' => 'Хөтөлбөр үүсгэх', 'name2' => 'Create schedule', 'controller' => 'ScheduleController@store'],
            
            // Tickets
            ['process_code' => 'ti0101', 'name' => 'Тасалбар шалгах', 'name2' => 'Verify ticket', 'controller' => 'TicketController@verify'],
            ['process_code' => 'ti0102', 'name' => 'Тасалбар үүсгэх', 'name2' => 'Create ticket', 'controller' => 'TicketController@store'],

            // Checkin
            ['process_code' => 'ch0101', 'name' => 'Чек-ин хийх', 'name2' => 'Checkin', 'controller' => 'CheckinController@ch0101'],

            // Messages
            ['process_code' => 'ms0101', 'name' => 'Мессежүүд харах', 'name2' => 'List messages', 'controller' => 'MessageController@ms0101'],
            ['process_code' => 'ms0102', 'name' => 'Мессеж илгээх', 'name2' => 'Send message', 'controller' => 'MessageController@ms0102'],
            
            // Notifications
            ['process_code' => 'nt0101', 'name' => 'Мэдэгдэл илгээх', 'name2' => 'Send notification', 'controller' => 'NotificationController@nt0101'],

            // Sync
            ['process_code' => 'sy0101', 'name' => 'Оффлайн дата Sync хийх', 'name2' => 'Sync offline data', 'controller' => 'SyncController@sy0101'],
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
