<?php

namespace App\Models;

use App\Models\Traits\ObservesUserActions;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use ObservesUserActions;
    protected $table = 'tickets';

    use HasFactory;

    protected $fillable = [
        'event_id', 'user_id', 'qr_code', 'signature', 'type', 'is_used'
    ];

    protected $casts = [
        'is_used' => 'boolean',
    ];

    public function event() { return $this->belongsTo(Event::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function checkins() { return $this->hasMany(Checkin::class); }
}
