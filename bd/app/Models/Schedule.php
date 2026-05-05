<?php

namespace App\Models;

use App\Models\Traits\ObservesUserActions;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\HasStatusId;

class Schedule extends Model
{
    use ObservesUserActions;
    protected $table = 'schedules';

    use HasFactory, HasStatusId;

    protected $fillable = [
        'event_id', 'title', 'description', 'start_time', 'end_time', 'location', 'speaker'
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function event() { return $this->belongsTo(Event::class); }
}
