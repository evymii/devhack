<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventZone extends Model
{
    use HasFactory;

    protected $table = 'event_zones';

    protected $fillable = [
        'event_id', 'name', 'name2', 'type', 'coordinates', 'color', 'capacity', 'statusid', 'created_by', 'updated_by'
    ];

    protected $casts = [
        'coordinates' => 'array',
    ];

    public function event() { return $this->belongsTo(Event::class); }
}
