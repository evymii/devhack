<?php

namespace App\Models;

use App\Models\Traits\ObservesUserActions;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use ObservesUserActions;
    protected $table = 'events';

    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'start_time',
        'end_time',
        'location',
        'map_image_url',
        'settings'
    ];

    protected $casts = [
        'settings' => 'array',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }
    public function messages()
    {
        return $this->hasMany(Message::class);
    }
    public function checkins()
    {
        return $this->hasMany(Checkin::class);
    }
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function resolveRouteBinding($value, $field = null)
    {
        $id = is_string($value) && str_starts_with($value, 'evt_')
            ? substr($value, 4)
            : $value;

        return $this->where($field ?? $this->getRouteKeyName(), $id)->first();
    }
}
