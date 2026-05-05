<?php

use App\Http\Controllers\CheckinController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SyncController;
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

    Route::post('/events/{event}/checkins', [CheckinController::class, 'store']);
    Route::post('/tickets/{ticket}/claim', [\App\Http\Controllers\TicketController::class, 'claim']);

    Route::get('/events/{event}/messages', [MessageController::class, 'index']);
    Route::post('/events/{event}/messages', [MessageController::class, 'store']);

    Route::middleware(['admin'])->group(function () {
        Route::post('/admin/events', [\App\Http\Controllers\AdminController::class, 'createEvent']);
        Route::post('/admin/events/{event}/tickets', [\App\Http\Controllers\AdminController::class, 'generateTickets']);
        Route::post('/events/{event}/notifications', [NotificationController::class, 'store']);
    });

    Route::get('/events/{event}/download-data', [SyncController::class, 'download']);
    Route::post('/sync', [SyncController::class, 'store']);
});
