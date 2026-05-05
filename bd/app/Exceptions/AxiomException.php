<?php

namespace App\Exceptions;

use Exception;

class AxiomException extends Exception
{
    public $data;

    public function __construct($message = "", $data = [])
    {
        parent::__construct($message);
        $this->data = $data;
    }

    public function render($request)
    {
        return response()->json([
            'response_code' => 'error',
            'response' => $this->getMessage(),
        ], 400, [], JSON_UNESCAPED_UNICODE);
    }
}
