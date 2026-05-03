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
            'success' => false,
            'message' => $this->getMessage(),
            'data'    => $this->data,
        ], 400);
    }
}
