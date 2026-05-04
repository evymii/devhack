<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MessageSendRequest extends FormRequest
{
    public function rules()
    {
        return [
            'event_id' => 'required|exists:events,id',
            'message' => 'required|string',
            'sender_device_id' => 'required|string',
            'is_emergency' => 'boolean',
        ];
    }

    public function authorize()
    {
        return true;
    }
}
