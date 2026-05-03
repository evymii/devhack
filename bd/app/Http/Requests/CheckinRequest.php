<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckinRequest extends FormRequest
{
    public function rules()
    {
        return [
            'ticket_id' => 'required|exists:tickets,id',
            'device_id' => 'required|string',
        ];
    }

    public function authorize()
    {
        return true;
    }
}
