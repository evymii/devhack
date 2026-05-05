<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use App\Services\MessageService;

class MessageController extends Controller
{
    public function index(Request $request, Event $event)
    {
        if ($event->statusid !== 1) {
            throw new AxiomException('Арга хэмжээ олдсонгүй эсвэл устгагдсан байна.');
        }
        $query = $event->messages()->where('statusid', 1)->with('user');
        $messages = $this->getGridData($request, $query, [['field' => 'created_at', 'dir' => 'desc']]);
        return $this->success($messages);
    }

    public function store(Request $request, Event $event, MessageService $messageService)
    {
        if ($event->statusid !== 1) {
            throw new AxiomException('Арга хэмжээ олдсонгүй эсвэл устгагдсан байна.');
        }
        $validated = $this->validateMe($request, [
            'message' => 'required|string',
            'sender_device_id' => 'required|string',
            'is_emergency' => 'boolean',
        ]);

        $message = $messageService->sendMessage($validated, $event, $request->user()->id);

        return $this->success($message);
    }
}
