<?php

namespace App\Http\Controllers;

use App\Exceptions\AxiomException;
use App\Models\Event;
use Illuminate\Http\Request;

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

        return $this->success($event);
    }
}
