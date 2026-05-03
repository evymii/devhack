<?php

namespace App\Models;

use App\Models\Traits\ObservesUserActions;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Checkin extends Model
{
    use ObservesUserActions;
    protected $table = 'checkins';

    use HasFactory;

    protected $fillable = [
        'event_id', 'ticket_id', 'device_id', 'synced_at'
    ];

    protected $casts = [
        'synced_at' => 'datetime',
    ];

    public function event() { return $this->belongsTo(Event::class); }
    public function ticket() { return $this->belongsTo(Ticket::class); }
}
