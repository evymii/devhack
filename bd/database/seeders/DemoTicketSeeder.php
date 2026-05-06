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
            ['name' => 'Aurora Fields 2026'],
            [
                'description' => 'A two-night electronic festival on the open steppe, with three stages, art installations, and a full camp village.',
                'start_time' => '2026-07-18 16:00:00',
                'end_time' => '2026-07-20 06:00:00',
                'location' => 'Khustai Open Grounds, Ulaanbaatar',
                'settings' => [
                    'type' => 'festival',
                    'city' => 'Ulaanbaatar',
                    'tagline' => 'Two nights under the steppe sky.',
                    'lineup' => ['Anyma', 'Mind Against', 'Tale Of Us', 'Innellea', 'MRAK', 'Massano'],
                    'heroGradient' => 'from-fuchsia-500 via-violet-500 to-indigo-600',
                    'tiers' => [
                        [
                            'id' => 'ga',
                            'name' => 'General Admission',
                            'price' => 89000,
                            'perks' => ['Both nights', 'Camp access', 'All stages'],
                            'remaining' => 412,
                        ],
                        [
                            'id' => 'vip',
                            'name' => 'VIP',
                            'price' => 189000,
                            'perks' => ['Front-stage deck', 'Express entry', 'VIP bar'],
                            'remaining' => 78,
                        ]
                    ]
                ]
            ],
        );

        $service = app(TicketService::class);

        if ($event->tickets()->where('tier_name', 'VIP')->count() === 0) {
            $service->generate(['count' => 20, 'tier_name' => 'VIP', 'price_paid' => 189000], $event);
        }

        if ($event->tickets()->where('tier_name', 'General Admission')->count() === 0) {
            $service->generate(['count' => 50, 'tier_name' => 'General Admission', 'price_paid' => 89000], $event);
        }
    }
}
