<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NotificationSendRequest extends FormRequest
{
    public function rules()
    {
        return [
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'type' => 'required|string|max:50',
            'is_broadcast' => 'boolean',
            'user_id' => 'nullable|exists:users,id',
        ];
    }

    public function authorize()
    {
        return true;
    }
}
