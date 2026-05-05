<?php

namespace App\Jobs;

use App\Services\SyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessSyncChunk implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $deviceId;
    protected $chunk;

    public function __construct($deviceId, array $chunk)
    {
        $this->deviceId = $deviceId;
        $this->chunk = $chunk;
    }

    public function handle(SyncService $syncService)
    {
        $syncService->processChunk($this->deviceId, $this->chunk);
    }
}
