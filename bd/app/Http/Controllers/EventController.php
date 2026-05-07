<?php

namespace App\Http\Controllers;

use App\Exceptions\AxiomException;
use App\Models\Event;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class EventController extends Controller
{
    /**
     * Арга хэмжээний жагсаалт харах (Зөвхөн идэвхтэй)
     */
    public function index(Request $request)
    {
        $query = Event::where('statusid', 1);

        // Стандарт getGridData ашиглан жагсаалтыг буцаана
        $data = $this->getGridData($request, $query, [['field' => 'start_time', 'dir' => 'asc']]);

        $data->getCollection()->transform(fn (Event $event) => $this->eventPayload($event));

        return $this->success($data);
    }

    /**
     * Арга хэмжээний дэлгэрэнгүй харах
     */
    public function show(Event $event)
    {
        if ($event->statusid !== 1) {
            throw new AxiomException('Арга хэмжээ олдсонгүй эсвэл устгагдсан байна.');
        }

        $event->load(['schedules' => fn ($query) => $query->where('statusid', 1)->orderBy('start_time')]);

        return $this->success($this->eventPayload($event));
    }

    private function eventPayload(Event $event): array
    {
        $payload = $event->toArray();
        $settings = $payload['settings'] ?? [];
        if (!is_array($settings)) {
            $settings = [];
        }

        $ticketColumns = ['tier_name', 'type', 'price_paid', 'user_id', 'is_used'];
        $hasSeatLabel = Schema::hasColumn('tickets', 'seat_label');
        if ($hasSeatLabel) {
            $ticketColumns[] = 'seat_label';
        }

        $tickets = Ticket::where('event_id', $event->id)
            ->where('statusid', 1)
            ->get($ticketColumns);

        $ticketTiers = $tickets
            ->groupBy(fn (Ticket $ticket) => ($ticket->tier_name ?: $ticket->type ?: 'General') . '|' . (int) $ticket->price_paid)
            ->map(function ($group) use ($hasSeatLabel) {
                $first = $group->first();
                $name = $first->tier_name ?: $first->type ?: 'General';

                return [
                    'id' => (string) $name . '-' . (int) $first->price_paid,
                    'name' => (string) $name,
                    'price' => (int) $first->price_paid,
                    'perks' => [(string) $name . ' access'],
                    'capacity' => $group->count(),
                    'remaining' => $group->whereNull('user_id')->where('is_used', false)->count(),
                    'takenSeats' => $hasSeatLabel
                        ? $group->whereNotNull('seat_label')->pluck('seat_label')->values()->all()
                        : [],
                ];
            })
            ->sortBy('price')
            ->values()
            ->all();

        if (count($ticketTiers) > 0) {
            $settings['tiers'] = $ticketTiers;
        }

        $payload['settings'] = $settings;
        return $payload;
    }
}
