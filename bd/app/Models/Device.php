<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    protected $table = 'devices';

    protected $fillable = [
        'device_id', 'user_id', 'event_id', 'platform', 'is_admin', 'last_seen_at', 'statusid', 'created_by', 'updated_by'
    ];

    protected $casts = [
        'is_admin' => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function event() { return $this->belongsTo(Event::class); }
}
