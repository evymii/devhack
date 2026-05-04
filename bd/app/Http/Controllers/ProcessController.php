<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AxiomProcess;
use App\Exceptions\AxiomException;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;

class ProcessController extends Controller
{
    public function process(Request $request)
    {
        $processCode = $request->header('pc');

        if (!$processCode) {
            throw new AxiomException('Process code (pc header) is missing');
        }

        $process = AxiomProcess::where('process_code', $processCode)
            ->where('statusid', 1)
            ->first();

        if (!$process) {
            throw new AxiomException('Invalid process code: ' . $processCode);
        }

        try {
            $route = $process->controller . '@' . $process->function;

            // Check if controller class exists
            if (!class_exists($process->controller)) {
                throw new AxiomException('Controller class not found: ' . $process->controller);
            }

            $response = App::call($route);

            return $this->success($response);
        } catch (\Exception $e) {
            if ($e instanceof AxiomException) {
                throw $e;
            }

            Log::error('Process Error [' . $processCode . ']: ' . $e->getMessage());

            throw new AxiomException('Internal Server Error while processing ' . $processCode);
        }
    }
}
