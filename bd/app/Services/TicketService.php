<?php

namespace App\Services;

use App\Exceptions\AxiomException;
use App\Models\Event;
use App\Models\Ticket;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class TicketService
{
    public function generate(array $data, Event $event): array
    {
        $tickets = [];
        for ($i = 0; $i < $data['count']; $i++) {
            $qr = 'QR-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
            $tickets[] = $event->tickets()->create([
                'qr_code' => $qr,
                'signature' => hash_hmac('sha256', $qr, config('app.key')),
                'type' => $data['tier_name'],
                'tier_name' => $data['tier_name'],
                'price_paid' => $data['price_paid'],
                'is_used' => false,
                'statusid' => 1,
            ]);
        }
        return $tickets;
    }

    public function purchase(array $data, Event $event, int $userId): Ticket
    {
        $available = Ticket::where('event_id', $event->id)
            ->where('statusid', 1)
            ->whereNull('user_id')
            ->where(function ($query) use ($data) {
                $query->where('tier_name', $data['tier_name'])
                    ->orWhere('type', $data['tier_name']);
            })
            ->first();

        if (!$available) {
            throw new AxiomException('Уучлаарай, ' . $data['tier_name'] . ' ангиллын тасалбар дууссан байна.');
        }

        $payload = [
            'user_id' => $userId,
            'bound_device_id' => $data['device_id'],
            'seat_label' => $data['seat_label'] ?? null,
        ];

        if (!empty($data['buyer'])) {
            $b = $data['buyer'];
            $payload['buyer_name'] = $b['fullName'] ?? null;
            $payload['buyer_email'] = $b['email'] ?? null;
            $payload['buyer_phone'] = $b['phone'] ?? null;
            $payload['buyer_dob'] = isset($b['dateOfBirth']) ? date('Y-m-d', strtotime($b['dateOfBirth'])) : null;
            $payload['buyer_national_id'] = $b['nationalId'] ?? null;
        }

        if (!empty($data['biometric_snapshot'])) {
            $payload['biometric_snapshot'] = $data['biometric_snapshot'];
            $payload['biometric_enrolled_at'] = now();
        }

        $available->update($payload);
        return $available->fresh('event');
    }

    public function claim(array $data, Ticket $ticket): Ticket
    {
        if ($ticket->statusid !== 1) {
            throw new AxiomException('Тасалбар олдсонгүй эсвэл устгагдсан байна.');
        }

        if ($ticket->user_id !== null) {
            throw new AxiomException('Энэ тасалбар аль хэдийн эзэнтэй байна!');
        }

        $payload = [
            'user_id' => $data['user_id'],
            'bound_device_id' => $data['device_id'],
        ];

        if (!empty($data['buyer'])) {
            $b = $data['buyer'];
            $payload['buyer_name'] = $b['fullName'] ?? null;
            $payload['buyer_email'] = $b['email'] ?? null;
            $payload['buyer_phone'] = $b['phone'] ?? null;
            $payload['buyer_dob'] = isset($b['dateOfBirth']) ? date('Y-m-d', strtotime($b['dateOfBirth'])) : null;
            $payload['buyer_national_id'] = $b['nationalId'] ?? null;
        }

        if (!empty($data['biometric_data'])) {
            $payload['face_embedding'] = $data['biometric_data'];
        }

        if (!empty($data['biometric_snapshot'])) {
            $payload['biometric_snapshot'] = $data['biometric_snapshot'];
            $payload['biometric_enrolled_at'] = now();
        }

        $ticket->update($payload);
        return $ticket->fresh('event');
    }

    public function redeem(Ticket $ticket): Ticket
    {
        if ($ticket->statusid !== 1) {
            throw new AxiomException('Тасалбар олдсонгүй эсвэл устгагдсан байна.');
        }

        if ($ticket->is_used) {
            throw new AxiomException(
                'Тасалбар аль хэдийн ашиглагдсан байна. Нэвтэрсэн цаг: ' .
                $ticket->redeemed_at?->format('Y-m-d H:i')
            );
        }

        $ticket->update([
            'is_used' => true,
            'redeemed_at' => now(),
        ]);

        return $ticket->fresh('event');
    }

    public function delete(Ticket $ticket): void
    {
        if ($ticket->statusid !== 1) {
            throw new AxiomException('Тасалбар олдсонгүй эсвэл устгагдсан байна.');
        }

        if ($ticket->is_used) {
            throw new AxiomException('Аль хэдийн ашиглагдсан тасалбарыг устгах боломжгүй.');
        }
        $ticket->update(['statusid' => -1]);
    }
}
