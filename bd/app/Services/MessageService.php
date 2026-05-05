<?php

namespace App\Services;

use App\Models\Event;
use App\Events\MessageSent;
use App\Events\EmergencyAlert;

class MessageService
{
    public function sendMessage(array $data, Event $event, $userId)
    {
        $message = $event->messages()->create([
            'user_id' => $userId,
            'sender_device_id' => $data['sender_device_id'],
            'message' => $data['message'],
            'is_emergency' => $data['is_emergency'] ?? false,
        ]);

        MessageSent::dispatch($message);

        if ($message->is_emergency) {
            EmergencyAlert::dispatch($message);
        }

        return $message;
    }
}
