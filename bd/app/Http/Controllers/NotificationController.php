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
            'user_id' => 'nullable|exists:users,id',
        ]);

        $notification = $notificationService->sendNotification($validated, $request->user()->id);

        return $this->success($notification);
    }
}
