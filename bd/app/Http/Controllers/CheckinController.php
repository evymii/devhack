<?php

namespace App\Http\Controllers;

use App\Events\CheckinRecorded;
use App\Models\Checkin;
use App\Models\Event;
use App\Http\Requests\CheckinRequest;

class CheckinController extends Controller
{
    public function ch0101(CheckinRequest $request)
    {
        $event = Event::findOrFail($request->event_id);

        $checkin = $event->checkins()->create([
            'ticket_id' => $request->ticket_id,
            'device_id' => $request->device_id,
            'synced_at' => now(),
        ]);

        CheckinRecorded::dispatch($checkin);

        return $this->success($checkin);
    }
}
