<?php

namespace App\Services;

use App\Models\SyncQueue;
use App\Events\SyncCompleted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncService
{
    public function processChunk($deviceId, array $chunk)
    {
        $processedCount = 0;
        
        DB::beginTransaction();
        try {
            foreach ($chunk as $record) {
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

            SyncCompleted::dispatch($deviceId, ['processed_count_chunk' => $processedCount]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sync Chunk failed: ' . $e->getMessage());
            throw $e;
        }
    }
}
