<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CheckinController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\EventController;
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
// Түр хугацаанд auth:sanctum-ийг болиулж, автоматаар Админ нэвтэрдэг MockAuth тавилаа
Route::middleware([\App\Http\Middleware\MockAuth::class])->group(function () {
    Route::post('/user', function (Request $request) {
        return $request->user();
    });

    // ── Events ────────────────────────────────────────────────────────────────
    Route::get('/events',           [EventController::class, 'index']);
    Route::get('/events/{event}',    [EventController::class, 'show']);

    Route::post('/events/{event}/checkins', [CheckinController::class, 'store']);

    // ── Tickets (user) ────────────────────────────────────────────────────────
    Route::post('/events/{event}/tickets/purchase', [TicketController::class, 'purchase']);
    Route::post('/tickets/{ticket}/claim',           [TicketController::class, 'claim']);
    Route::post('/tickets/{ticket}/redeem',          [TicketController::class, 'redeem']);

    // ── Messages ──────────────────────────────────────────────────────────────
    Route::get('/events/{event}/messages',  [MessageController::class, 'index']);
    Route::post('/events/{event}/messages', [MessageController::class, 'store']);

    // ── Admin-only ────────────────────────────────────────────────────────────
    Route::middleware(['admin'])->group(function () {
        Route::post('/admin/events', [AdminController::class, 'createEvent']);
        Route::delete('/admin/events/{event}', [AdminController::class, 'destroy']);

        // Ticket management
        Route::get('/admin/tickets',                      [TicketController::class, 'index']);
        Route::get('/admin/tickets/{ticket}',             [TicketController::class, 'show']);
        Route::post('/admin/tickets/scan',                [TicketController::class, 'scan']);
        Route::post('/admin/events/{event}/tickets',      [TicketController::class, 'generate']);
        Route::delete('/admin/tickets/{ticket}',          [TicketController::class, 'destroy']);

        Route::post('/events/{event}/notifications', [NotificationController::class, 'store']);
    });

    // ── Sync ──────────────────────────────────────────────────────────────────
    Route::get('/events/{event}/download-data', [SyncController::class, 'download']);
    Route::post('/sync', [SyncController::class, 'store']);
});
