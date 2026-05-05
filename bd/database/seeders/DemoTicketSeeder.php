<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\User;
use App\Services\TicketService;
use Illuminate\Database\Seeder;

class DemoTicketSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Admin Tester',
                'password' => bcrypt('12345678'),
                'role' => 'admin',
            ],
        );

        $event = Event::firstOrCreate(
            ['name' => 'DevHack 2026'],
            [
                'description' => 'Монголын хамгийн том хакатон',
                'start_time' => '2026-06-01 09:00:00',
                'end_time' => '2026-06-02 18:00:00',
                'location' => 'Улаанбаатар, Монгол',
            ],
        );

        $service = app(TicketService::class);

        if ($event->tickets()->where('tier_name', 'VIP')->count() === 0) {
            $service->generate(['count' => 20, 'tier_name' => 'VIP', 'price_paid' => 50000], $event);
        }

        if ($event->tickets()->where('tier_name', 'General')->count() === 0) {
            $service->generate(['count' => 50, 'tier_name' => 'General', 'price_paid' => 20000], $event);
        }
    }
}
