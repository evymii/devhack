<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function createEvent(Request $request)
    {
        $validated = $this->validateMe($request, [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
        ]);

        $event = Event::create($validated);

        return $this->success($event);
    }

    public function generateTickets(Request $request, Event $event)
    {
        if ($event->statusid !== 1) {
            throw new AxiomException('Арга хэмжээ олдсонгүй эсвэл устгагдсан байна.');
        }
        $validated = $this->validateMe($request, [
            'count' => 'required|integer|min:1|max:1000',
            'type' => 'required|string',
        ]);

        $tickets = [];
        for ($i = 0; $i < $validated['count']; $i++) {
            $tickets[] = $event->tickets()->create([
                'qr_code' => Str::random(32),
                'signature' => Str::random(64),
                'type' => $validated['type'],
                'is_used' => false,
            ]);
        }

        return $this->success(['message' => $validated['count'] . ' тасалбар үүсгэгдлээ.']);
    }
    
    public function destroy(Event $event)
    {
        $event->update(['statusid' => -1]);
        return $this->success(['message' => 'Арга хэмжээ устгагдлаа.']);
    }
}
