<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\NotificationService;

class NotificationController extends Controller
{
    public function store(Request $request, NotificationService $notificationService)
    {
        $validated = $this->validateMe($request, [
            'event_id' => 'required|exists:events,id',
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'type' => 'required|string|max:50',
            'is_broadcast' => 'boolean',
        ]);

        $event = \App\Models\Event::where('id', $validated['event_id'])->where('statusid', 1)->first();
        if (!$event) {
            throw new AxiomException('Арга хэмжээ олдсонгүй эсвэл устгагдсан байна.');
        }

        $notification = $notificationService->sendNotification($validated, $request->user()->id);

        return $this->success($notification);
    }
}
