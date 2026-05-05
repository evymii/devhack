<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\CheckinService;

class CheckinController extends Controller
{
    public function store(Request $request, CheckinService $checkinService)
    {
        $validated = $this->validateMe($request, [
            'event_id' => 'required|exists:events,id',
            'ticket_id' => 'required|exists:tickets,id',
            'device_id' => 'required|string',
            'user_device_id' => 'nullable|string',
        ]);

        $checkin = $checkinService->processCheckin($validated);

        return $this->success($checkin);
    }
}
