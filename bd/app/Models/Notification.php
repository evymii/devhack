<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'notifications';

    protected $fillable = [
        'event_id',
        'user_id',
        'title',
        'body',
        'type',
        'is_broadcast',
        'sent_at',
        'statusid',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'is_broadcast' => 'boolean',
        'sent_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
