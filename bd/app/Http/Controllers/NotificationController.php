<?php

namespace App\Http\Controllers;

use App\Events\NotificationSent;
use App\Models\Event;
use App\Http\Requests\NotificationSendRequest;

class NotificationController extends Controller
{
    public function nt0101(NotificationSendRequest $request)
    {
        $event = Event::findOrFail($request->event_id);

        $notification = $event->notifications()->create([
            'user_id' => $request->user_id,
            'title' => $request->title,
            'body' => $request->body,
            'type' => $request->type,
            'is_broadcast' => $request->is_broadcast ?? false,
            'sent_at' => now(),
            'created_by' => $request->user()->id,
        ]);

        NotificationSent::dispatch($notification);

        return $this->success($notification);
    }
}
