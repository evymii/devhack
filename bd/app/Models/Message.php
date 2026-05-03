<?php

namespace App\Models;

use App\Models\Traits\ObservesUserActions;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use ObservesUserActions;
    protected $table = 'messages';

    use HasFactory;

    protected $fillable = [
        'event_id', 'user_id', 'sender_device_id', 'message', 'is_emergency'
    ];

    protected $casts = [
        'is_emergency' => 'boolean',
    ];

    public function event() { return $this->belongsTo(Event::class); }
    public function user() { return $this->belongsTo(User::class); }
}
