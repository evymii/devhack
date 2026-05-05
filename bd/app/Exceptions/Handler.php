<?php

namespace App\Exceptions;

use App\Exceptions\AxiomException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Database\QueryException;
use PDOException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->renderable(function (Throwable $e, $request) {
            // Apply generic safety wrappers for API or JSON requests
            if ($request->expectsJson() || $request->is('api/*') || true) { // Applied unconditionally for the backend safety
                
                // Keep standard logic for http statuses, auth, and validation
                if ($e instanceof ValidationException || $e instanceof AuthenticationException || $e instanceof HttpException) {
                    return null; 
                }

                if ($e instanceof AxiomException) {
                    return response()->json([
                        'response_code' => 'error',
                        'response' => $e->getMessage(),
                    ], 400, [], JSON_UNESCAPED_UNICODE);
                }

                if ($e instanceof QueryException || $e instanceof PDOException) {
                    return response()->json([
                        'response_code' => 'error',
                        'response' => 'Мэдээллийн системтэй ажиллахад алдаа гарлаа',
                    ], 500, [], JSON_UNESCAPED_UNICODE);
                }

                // Mask all other generic server errors
                return response()->json([
                    'response_code' => 'error',
                    'response' => 'Суурь системд алдаа гарлаа',
                ], 500, [], JSON_UNESCAPED_UNICODE);
            }
        });

        $this->reportable(function (Throwable $e) {
            //
        });
    }
}
