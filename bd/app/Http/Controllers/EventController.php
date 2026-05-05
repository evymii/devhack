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
    public function show(Request $request)
    {
        $validate = $this->validateMe($request, [
            'id' => 'required|numeric'
        ]);

        $eventModel = Event::where('id', $validate['id'])
            ->where('statusid', 1)
            ->first();

        if (!$eventModel) {
            throw new AxiomException('Арга хэмжээ олдсонгүй эсвэл устгагдсан байна.');
        }

        return $this->success($eventModel);
    }
}
