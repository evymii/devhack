<?php

namespace App\Events;

use App\Models\Checkin;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CheckinRecorded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $checkin;

    /**
     * Create a new event instance.
     */
    public function __construct(Checkin $checkin)
    {
        $this->checkin = $checkin;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('event.' . $this->checkin->event_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'checkin' => $this->checkin->load('ticket', 'ticket.user')->toArray(),
        ];
    }
}
