<?php

namespace App\Models;

use App\Models\Traits\ObservesUserActions;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SyncQueue extends Model
{
    use ObservesUserActions;
    protected $table = 'sync_queues';

    use HasFactory;

    protected $fillable = [
        'device_id', 'entity_type', 'entity_id', 'payload', 'synced_at'
    ];

    protected $casts = [
        'payload' => 'array',
        'synced_at' => 'datetime',
    ];
}
