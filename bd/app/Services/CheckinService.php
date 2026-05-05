<?php

namespace App\Services;

use App\Exceptions\AxiomException;
use App\Models\Event;
use App\Events\CheckinRecorded;
use App\Models\Ticket;

class CheckinService
{
    public function processCheckin(array $data)
    {
        $event = Event::where('id', $data['event_id'])->first();

        if (!$event) {
            throw new AxiomException('Event not found');
        }

        $ticket = Ticket::where('id', $data['ticket_id'])->first();

        if (!$ticket) {
            throw new AxiomException('Тасалбар олдсонгүй.');
        }

        if ($ticket->event_id != $event->id) {
            throw new AxiomException('Энэ тасалбар өөр арга хэмжээний тасалбар байна!');
        }

        if ($ticket->is_used) {
            throw new AxiomException('Энэ тасалбар урьд нь ашиглагдсан байна!');
        }

        if ($ticket->bound_device_id) {
            if (isset($data['user_device_id']) && $ticket->bound_device_id !== $data['user_device_id']) {
                throw new AxiomException('Өөр төхөөрөмж рүү хуулбарласан тасалбар байна (Screenshot/Login хуваалцсан)!');
            }
        } else {
            if (isset($data['user_device_id'])) {
                $ticket->update(['bound_device_id' => $data['user_device_id']]);
            }
        }

        $checkin = $event->checkins()->create([
            'ticket_id' => $data['ticket_id'],
            'device_id' => $data['device_id'],
            'synced_at' => now(),
        ]);

        $ticket->update(['is_used' => true]);

        CheckinRecorded::dispatch($checkin);

        return $checkin;
    }
}
