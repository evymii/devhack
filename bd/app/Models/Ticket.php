<?php

namespace App\Models;

use App\Models\Traits\ObservesUserActions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory, ObservesUserActions;

    protected $table = 'tickets';

    protected $fillable = [
        'event_id',
        'user_id',
        'qr_code',
        'signature',
        'type',
        'is_used',
        'bound_device_id',
        'tier_name',
        'price_paid',
        'buyer_name',
        'buyer_email',
        'buyer_phone',
        'buyer_dob',
        'buyer_national_id',
        'face_embedding',
        'biometric_snapshot',
        'biometric_enrolled_at',
        'redeemed_at',
        'statusid',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'face_embedding' => 'array',
        'biometric_enrolled_at' => 'datetime',
        'redeemed_at' => 'datetime',
        'buyer_dob' => 'date',
        'price_paid' => 'integer',
    ];

    // ── Relationships ────────────────────────────────────────────────────────

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function checkins()
    {
        return $this->hasMany(Checkin::class);
    }

    public function resolveRouteBinding($value, $field = null)
    {
        $id = is_string($value) && str_starts_with($value, 'tk_')
            ? substr($value, 3)
            : $value;

        return $this->where($field ?? $this->getRouteKeyName(), $id)->first();
    }

    // ── Accessors ────────────────────────────────────────────────────────────

    /**
     * Maps BD status → frontend "valid" | "redeemed"
     */
    public function getStatusAttribute(): string
    {
        return $this->is_used ? 'redeemed' : 'valid';
    }

    /**
     * Returns the structured buyer object matching frontend Ticket.buyer
     */
    public function getBuyerAttribute(): array
    {
        return [
            'fullName' => $this->buyer_name ?? ($this->user?->name ?? ''),
            'email' => $this->buyer_email ?? ($this->user?->email ?? ''),
            'phone' => $this->buyer_phone ?? '',
            'dateOfBirth' => $this->buyer_dob ? $this->buyer_dob->toDateString() : '',
            'nationalId' => $this->buyer_national_id ?? '',
        ];
    }

    /**
     * Returns the structured biometric object matching frontend Ticket.biometric
     */
    public function getBiometricAttribute(): array
    {
        return [
            'snapshot' => $this->biometric_snapshot ?? '',
            'enrolledAt' => $this->biometric_enrolled_at
                ? $this->biometric_enrolled_at->toISOString()
                : $this->created_at->toISOString(),
        ];
    }

    /**
     * Serialises the ticket to the shape the frontend Ticket type expects.
     * Used in TicketController responses.
     */
    public function toFrontend(): array
    {
        $event = $this->event;
        return [
            'id' => 'tk_' . $this->id,
            'eventId' => $event ? ('evt_' . $event->id) : '',
            'eventTitle' => $event?->name ?? '',
            'eventDate' => $event?->start_time?->toDateString() ?? '',
            'venue' => $event?->location ?? '',
            'tierName' => $this->tier_name ?? $this->type ?? '',
            'pricePaid' => (int) $this->price_paid,
            'buyer' => $this->buyer,
            'biometric' => $this->biometric,
            'status' => $this->status,
            'createdAt' => $this->created_at->toISOString(),
            'redeemedAt' => $this->redeemed_at?->toISOString(),
        ];
    }
}
