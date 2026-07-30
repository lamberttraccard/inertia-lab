<?php

use App\Http\Controllers\LabController;
use App\Http\Controllers\SlowModeController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::prefix('lab')->name('lab.')->group(function () {
    Route::get('/', [LabController::class, 'home'])->name('home');
    Route::get('/glossary', [LabController::class, 'glossary'])->name('glossary');
    Route::get('/where-did-it-go', [LabController::class, 'whereDidItGo'])->name('where-did-it-go');
    Route::post('/slow-mode', [SlowModeController::class, 'update'])->name('slow-mode');
    Route::get('/source/{slug}', [LabController::class, 'source'])->name('source');
});
