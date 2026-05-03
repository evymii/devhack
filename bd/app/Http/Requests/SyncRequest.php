<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncRequest extends FormRequest
{
    public function rules()
    {
        return [
            'device_id' => 'required|string',
            'records' => 'required|array',
            'records.*.entity_type' => 'required|string',
            'records.*.entity_id' => 'required|integer',
            'records.*.payload' => 'required|array',
        ];
    }

    public function authorize()
    {
        return true;
    }
}
