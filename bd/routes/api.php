<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CheckinController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/face-login', [AuthController::class, 'faceLogin']);
Route::post('/auth/register/otp/send', [AuthController::class, 'sendRegisterOtp']);
Route::post('/auth/register/otp/verify', [AuthController::class, 'verifyRegisterOtp']);
Route::post('/auth/register/complete', [AuthController::class, 'completeRegister']);

Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{event}', [EventController::class, 'show']);
Route::get('/events/{event}/messages', [MessageController::class, 'index']);

Route::middleware(['jwt'])->group(function () {
    Route::match(['get', 'post'], '/user', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::post('/events/{event}/checkins', [CheckinController::class, 'store']);
    Route::post('/events/{event}/tickets/purchase', [TicketController::class, 'purchase']);
    Route::get('/tickets', [TicketController::class, 'mine']);
    Route::get('/tickets/{ticket}', [TicketController::class, 'showMine']);
    Route::post('/tickets/{ticket}/claim', [TicketController::class, 'claim']);
    Route::post('/tickets/{ticket}/redeem', [TicketController::class, 'redeem']);
    Route::post('/events/{event}/messages', [MessageController::class, 'store']);

    Route::get('/events/{event}/download-data', [SyncController::class, 'download']);
    Route::post('/sync', [SyncController::class, 'store']);

    Route::middleware(['admin'])->group(function () {
        Route::post('/admin/events', [AdminController::class, 'createEvent']);
        Route::delete('/admin/events/{event}', [AdminController::class, 'destroy']);
        Route::get('/admin/tickets', [TicketController::class, 'index']);
        Route::get('/admin/tickets/{ticket}', [TicketController::class, 'show']);
        Route::post('/admin/tickets/scan', [TicketController::class, 'scan']);
        Route::post('/admin/events/{event}/tickets', [TicketController::class, 'generate']);
        Route::delete('/admin/tickets/{ticket}', [TicketController::class, 'destroy']);
        Route::post('/events/{event}/notifications', [NotificationController::class, 'store']);
    });
});
