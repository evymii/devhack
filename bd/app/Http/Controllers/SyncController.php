<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use App\Models\Event;
use App\Jobs\ProcessSyncChunk;

class SyncController extends Controller
{
    public function store(Request $request)
    {
        $validated = $this->validateMe($request, [
            'device_id' => 'required|string',
            'records' => 'required|array',
            'records.*.entity_type' => 'required|string',
            'records.*.entity_id' => 'required|integer',
            'records.*.payload' => 'required|array',
        ]);

        $deviceId = $validated['device_id'];
        
        $chunks = array_chunk($validated['records'], 100);

        foreach ($chunks as $chunk) {
            ProcessSyncChunk::dispatch($deviceId, $chunk);
        }

        return $this->success([
            'message' => 'Sync chunks queued successfully',
            'total_queued' => count($validated['records']),
            'chunks_count' => count($chunks)
        ]);
    }

    public function download(Event $event)
    {
        if ($event->statusid !== 1) {
            throw new AxiomException('Арга хэмжээ олдсонгүй эсвэл устгагдсан байна.');
        }
        $tickets = $event->tickets()->where('statusid', 1)->with('user:id,name,email,biometric_data')->get();
        $schedule = $event->schedules()->where('statusid', 1)->get();

        return $this->success([
            'event' => $event,
            'tickets' => $tickets,
            'schedule' => $schedule,
            'downloaded_at' => now(),
        ]);
    }
}
