<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    /**
     * Create a new event instance.
     */
    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        if ($this->notification->is_broadcast) {
            return [
                new Channel('event.' . $this->notification->event_id),
            ];
        }

        return [
            new PrivateChannel('users.' . $this->notification->user_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'notification' => $this->notification->toArray(),
        ];
    }
}
