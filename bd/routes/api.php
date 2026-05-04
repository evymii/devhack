<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/user', function (Request $request) {
        return $request->user();
    });

    // Route::post('/events/{event}/checkins', [\App\Http\Controllers\CheckinController::class, 'ch0101']);
    
    // Route::post('/events/{event}/messages/list', [\App\Http\Controllers\MessageController::class, 'ms0101']);
    // Route::post('/events/{event}/messages', [\App\Http\Controllers\MessageController::class, 'ms0102']);
    
    // Route::post('/events/{event}/notifications', [\App\Http\Controllers\NotificationController::class, 'nt0101']);
    
    // Route::post('/sync', [\App\Http\Controllers\SyncController::class, 'sy0101']);

    Route::post('/app/process', [\App\Http\Controllers\ProcessController::class, 'process']);
});
