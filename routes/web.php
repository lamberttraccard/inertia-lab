<?php

use App\Http\Controllers\Chapters\FirstLoadVsVisitController;
use App\Http\Controllers\Chapters\MentalModelController;
use App\Http\Controllers\Chapters\RenderAndComponentsController;
use App\Http\Controllers\LabController;
use App\Http\Controllers\SlowModeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LabController::class, 'home'])->name('lab.home');

Route::prefix('lab')->name('lab.')->group(function () {
    Route::get('/glossary', [LabController::class, 'glossary'])->name('glossary');
    Route::get('/where-did-it-go', [LabController::class, 'whereDidItGo'])->name('where-did-it-go');
    Route::post('/slow-mode', [SlowModeController::class, 'update'])->name('slow-mode');
    Route::get('/source/{slug}', [LabController::class, 'source'])->name('source');
});

Route::prefix('chapters')->name('chapters.')->group(function () {
    Route::get('/mental-model', MentalModelController::class)->name('mental-model');
    Route::get('/first-load-vs-visit', FirstLoadVsVisitController::class)->name('first-load-vs-visit');
    Route::get('/render-and-components', [RenderAndComponentsController::class, 'show'])->name('render-and-components');
    Route::get('/render-and-components/broken', [RenderAndComponentsController::class, 'broken'])->name('render-and-components.broken');
});
