<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SyncCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $deviceId;
    public $summary;

    /**
     * Create a new event instance.
     */
    public function __construct($deviceId, array $summary)
    {
        $this->deviceId = $deviceId;
        $this->summary = $summary;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('device.' . $this->deviceId),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'summary' => $this->summary,
        ];
    }
}
