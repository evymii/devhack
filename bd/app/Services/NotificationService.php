<?php

namespace App\Services;

use App\Exceptions\AxiomException;
use App\Models\Event;
use App\Events\NotificationSent;

class NotificationService
{
    public function sendNotification(array $data, $createdBy)
    {
        $event = Event::where('id', $data['event_id'])->first();

        if (!$event) {
            throw new AxiomException('Event not found');
        }

        $notification = $event->notifications()->create([
            'user_id' => $data['user_id'] ?? null,
            'title' => $data['title'],
            'body' => $data['body'],
            'type' => $data['type'],
            'is_broadcast' => $data['is_broadcast'] ?? false,
            'sent_at' => now(),
            'created_by' => $createdBy,
        ]);

        NotificationSent::dispatch($notification);

        return $notification;
    }
}
