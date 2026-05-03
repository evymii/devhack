<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AxiomProcess;
use Illuminate\Support\Facades\Cache;

class AddProcessCodeHeader
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Fetch the corresponding process_code from process table based on executed Route action
        $route = $request->route();
        if ($route) {
            $action = $route->getActionName();
            if ($action && $action !== 'Closure') {
                $baseAction = class_basename($action);
                
                // Cache it so heavy traffic doesn't overload the DB resolving names
                $processCode = Cache::remember('pc_' . md5($baseAction), 3600, function () use ($baseAction) {
                    $process = AxiomProcess::where('controller', $baseAction)->first();
                    return $process ? $process->process_code : 'unknown';
                });

                // Attach to response headers
                if ($processCode !== 'unknown') {
                    if (method_exists($response, 'header')) {
                        $response->header('pc', $processCode);
                    } elseif (method_exists($response, 'withHeaders')) {
                        $response->withHeaders(['pc' => $processCode]);
                    }
                }
            }
        }

        return $response;
    }
}
