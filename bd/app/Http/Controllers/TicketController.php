<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Exceptions\AxiomException;

class TicketController extends Controller
{
    public function claim(Request $request, Ticket $ticket)
    {
        $validated = $this->validateMe($request, [
            'device_id' => 'required|string',
            'biometric_data' => 'nullable|string',
        ]);

        if ($ticket->user_id !== null) {
            throw new AxiomException('Энэ тасалбар аль хэдийн эзэнтэй байна!');
        }

        $user = $request->user();

        $ticket->update([
            'user_id' => $user->id,
            'bound_device_id' => $validated['device_id'],
        ]);

        if (!empty($validated['biometric_data'])) {
            $user->update([
                'biometric_data' => $validated['biometric_data'],
            ]);
        }

        return $this->success(['message' => 'Тасалбарыг амжилттай өөрийн болгож, биометрик дата хадгаллаа.', 'ticket' => $ticket]);
    }
}
