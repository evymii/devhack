<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use App\Services\MessageService;

class MessageController extends Controller
{
    public function index(Request $request, Event $event)
    {
        $query = $event->messages()->with('user');
        $messages = $this->getGridData($request, $query, [['field' => 'created_at', 'dir' => 'desc']]);
        return $this->success($messages);
    }

    public function store(Request $request, Event $event, MessageService $messageService)
    {
        $validated = $this->validateMe($request, [
            'message' => 'required|string',
            'sender_device_id' => 'required|string',
            'is_emergency' => 'boolean',
        ]);

        $message = $messageService->sendMessage($validated, $event, $request->user()->id);

        return $this->success($message);
    }
}
