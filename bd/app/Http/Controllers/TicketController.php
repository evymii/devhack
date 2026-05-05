<?php

namespace App\Http\Controllers;

use App\Exceptions\AxiomException;
use App\Models\Event;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $query = Ticket::with('event:id,name,location,start_time')
            ->where('statusid', 1)
            ->select('tickets.*');

        if ($request->filled('event_id')) {
            $query->where('tickets.event_id', $request->integer('event_id'));
        }

        if ($request->filled('status')) {
            $query->where('is_used', $request->get('status') === 'redeemed');
        }

        if ($request->filled('search')) {
            $term = '%' . $request->get('search') . '%';
            $query->where(function ($q) use ($term) {
                $q->where('buyer_name', 'like', $term)
                    ->orWhere('buyer_email', 'like', $term)
                    ->orWhere('buyer_national_id', 'like', $term)
                    ->orWhere('qr_code', 'like', $term);
            });
        }

        if ($request->filled('tier')) {
            $query->where(function ($q) use ($request) {
                $q->where('tier_name', $request->get('tier'))
                    ->orWhere('type', $request->get('tier'));
            });
        }

        $allowedSorts = ['created_at', 'redeemed_at', 'price_paid', 'buyer_name', 'tier_name'];
        $sort = in_array($request->get('sort'), $allowedSorts) ? $request->get('sort') : 'created_at';
        $dir = $request->get('dir') === 'asc' ? 'asc' : 'desc';
        $query->orderBy('tickets.' . $sort, $dir);

        $tickets = $query->paginate(min((int) ($request->get('per_page') ?? 20), 100));

        $eventId = $request->filled('event_id') ? $request->integer('event_id') : null;
        $base = Ticket::when($eventId, fn($q) => $q->where('event_id', $eventId));

        return $this->success([
            'data' => $tickets->getCollection()->map->toFrontend()->values(),
            'pagination' => [
                'total' => $tickets->total(),
                'per_page' => $tickets->perPage(),
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'has_more' => $tickets->hasMorePages(),
            ],
            'summary' => [
                'total' => (clone $base)->count(),
                'valid' => (clone $base)->where('is_used', false)->count(),
                'redeemed' => (clone $base)->where('is_used', true)->count(),
            ],
        ]);
    }

    public function show(Ticket $ticket)
    {
        if ($ticket->statusid !== 1) {
            throw new AxiomException('Тасалбар олдсонгүй эсвэл устгагдсан байна.');
        }
        $ticket->load('event:id,name,location,start_time', 'user:id,name,email', 'checkins');
        return $this->success($ticket->toFrontend());
    }

    public function scan(Request $request)
    {
        $validated = $this->validateMe($request, [
            'qr_code' => 'nullable|string',
            'biometric_data' => 'nullable|string',
        ]);

        if (empty($validated['qr_code']) && empty($validated['biometric_data'])) {
            throw new AxiomException('QR код эсвэл царайны өгөгдөл шаардлагатай.');
        }

        $ticket = null;

        if (!empty($validated['qr_code'])) {
            $ticket = Ticket::with('event', 'user')
                ->where('qr_code', $validated['qr_code'])
                ->where('statusid', 1)
                ->first();
        } elseif (!empty($validated['biometric_data'])) {
            // Ирээдүйд pgvector эсвэл vector DB ашиглаж cosine similarity хийх хэрэгтэй.
            // Одоогоор шууд string match хийж байна.
            $biometricData = $validated['biometric_data'];
            $ticket = Ticket::with('event', 'user')
                ->where(function ($query) use ($biometricData) {
                    $query->where('face_embedding', $biometricData)
                        ->orWhere('face_embedding', json_encode($biometricData));
                })
                ->where('statusid', 1)
                ->first();
        }

        if (!$ticket) {
            throw new AxiomException('Тасалбар олдсонгүй.');
        }

        return $this->success([
            'ticket' => $ticket->toFrontend(),
            'is_used' => $ticket->is_used,
            'redeemed_at' => $ticket->redeemed_at?->toISOString(),
            'buyer' => [
                'fullName' => $ticket->buyer['fullName'],
                'email' => $ticket->buyer['email'],
            ],
        ]);
    }

    public function purchase(Request $request, Event $event, TicketService $ticketService)
    {
        if ($event->statusid !== 1) {
            throw new AxiomException('Арга хэмжээ олдсонгүй эсвэл устгагдсан байна.');
        }

        $validated = $this->validateMe($request, [
            'tier_name' => 'required|string|max:80',
            'device_id' => 'required|string',
            'buyer' => 'nullable|array',
            'buyer.fullName' => 'nullable|string|max:200',
            'buyer.email' => 'nullable|email|max:200',
            'buyer.phone' => 'nullable|string|max:30',
            'buyer.dateOfBirth' => 'nullable|date',
            'buyer.nationalId' => 'nullable|string|max:30',
            'biometric_snapshot' => 'nullable|string',
        ]);

        if (!empty($validated['biometric_snapshot'])) {
            $request->user()->update(['biometric_data' => $validated['biometric_snapshot']]);
        }

        $ticket = $ticketService->purchase($validated, $event, $request->user()->id);

        return $this->success([
            'message' => 'Тасалбарыг амжилттай захиаллаа.',
            'ticket' => $ticket->toFrontend(),
        ]);
    }

    public function generate(Request $request, Event $event, TicketService $ticketService)
    {
        if ($event->statusid !== 1) {
            throw new AxiomException('Арга хэмжээ олдсонгүй эсвэл устгагдсан байна.');
        }

        $validated = $this->validateMe($request, [
            'count' => 'required|integer|min:1|max:500',
            'tier_name' => 'required|string|max:80',
            'price_paid' => 'required|integer|min:0',
        ]);

        $tickets = $ticketService->generate($validated, $event);

        return $this->success([
            'message' => $validated['count'] . ' тасалбар амжилттай үүсгэлээ.',
            'tickets' => collect($tickets)->map->toFrontend()->values(),
        ]);
    }

    public function claim(Request $request, Ticket $ticket, TicketService $ticketService)
    {
        $validated = $this->validateMe($request, [
            'device_id' => 'required|string',
            'buyer' => 'nullable|array',
            'buyer.fullName' => 'nullable|string|max:200',
            'buyer.email' => 'nullable|email|max:200',
            'buyer.phone' => 'nullable|string|max:30',
            'buyer.dateOfBirth' => 'nullable|date',
            'buyer.nationalId' => 'nullable|string|max:30',
            'biometric_data' => 'nullable|string',
            'biometric_snapshot' => 'nullable|string',
        ]);

        $validated['user_id'] = $request->user()->id;

        if (!empty($validated['biometric_data'])) {
            $request->user()->update(['biometric_data' => $validated['biometric_data']]);
        }

        $ticket = $ticketService->claim($validated, $ticket);

        return $this->success([
            'message' => 'Тасалбарыг амжилттай өөрийн болгож, биометрик дата хадгаллаа.',
            'ticket' => $ticket->toFrontend(),
        ]);
    }

    public function redeem(Request $request, Ticket $ticket, TicketService $ticketService)
    {
        $this->validateMe($request, [
            'device_id' => 'required|string',
        ]);

        $ticket = $ticketService->redeem($ticket);

        return $this->success([
            'message' => 'Тасалбар амжилттай нэвтрүүллээ.',
            'ticket' => $ticket->toFrontend(),
        ]);
    }

    public function destroy(Ticket $ticket, TicketService $ticketService)
    {
        $ticketService->delete($ticket);
        return $this->success(['message' => 'Тасалбар устгагдлаа.']);
    }
}
