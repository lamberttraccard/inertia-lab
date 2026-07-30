<?php

use App\Http\Controllers\LabController;
use App\Http\Controllers\SlowModeController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::prefix('lab')->name('lab.')->group(function () {
    Route::post('/slow-mode', [SlowModeController::class, 'update'])->name('slow-mode');
    Route::get('/source/{slug}', [LabController::class, 'source'])->name('source');
});
