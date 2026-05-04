<?php

namespace App\Http\Controllers;

use App\Events\EmergencyAlert;
use App\Events\MessageSent;
use App\Models\Event;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function ms0101(Request $request)
    {
        $event = Event::findOrFail($request->event_id);
        $messages = $event->messages()->with('user')->latest()->paginate(50);
        return $this->success($messages);
    }

    public function ms0102(\App\Http\Requests\MessageSendRequest $request)
    {
        $event = Event::findOrFail($request->event_id);

        $message = $event->messages()->create([
            'user_id' => $request->user()->id,
            'sender_device_id' => $request->sender_device_id,
            'message' => $request->message,
            'is_emergency' => $request->is_emergency ?? false,
        ]);

        MessageSent::dispatch($message);

        if ($message->is_emergency) {
            EmergencyAlert::dispatch($message);
        }

        return $this->success($message);
    }
}
