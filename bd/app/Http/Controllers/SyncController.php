<?php

namespace App\Http\Controllers;

use App\Events\SyncCompleted;
use App\Models\SyncQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\SyncRequest;

class SyncController extends Controller
{
    public function sy0101(SyncRequest $request)
    {

        $deviceId = $request->device_id;
        $processedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($request->records as $record) {
                $existing = SyncQueue::where('device_id', $deviceId)
                    ->where('entity_type', $record['entity_type'])
                    ->where('entity_id', $record['entity_id'])
                    ->first();

                if ($existing) {
                    SyncQueue::where('id', $existing->id)->update([
                        'payload' => is_array($record['payload']) ? json_encode($record['payload']) : $record['payload'],
                        'synced_at' => now(),
                        'updated_at' => now()
                    ]);
                } else {
                    SyncQueue::insert([
                        'device_id' => $deviceId,
                        'entity_type' => $record['entity_type'],
                        'entity_id' => $record['entity_id'],
                        'payload' => is_array($record['payload']) ? json_encode($record['payload']) : $record['payload'],
                        'synced_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
                $processedCount++;
            }
            DB::commit();

            SyncCompleted::dispatch($deviceId, ['processed_count' => $processedCount]);

            return $this->success([
                'message' => 'Sync processed successfully',
                'processed_count' => $processedCount
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sync failed: ' . $e->getMessage());
            return $this->error('SR0001', ['error' => 'Sync failed']);
        }
    }
}
