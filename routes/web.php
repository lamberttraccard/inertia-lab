<?php

use App\Http\Controllers\Chapters\AssetVersioningController;
use App\Http\Controllers\Chapters\EventsController;
use App\Http\Controllers\Chapters\FirstLoadVsVisitController;
use App\Http\Controllers\Chapters\LinksAndVisitsController;
use App\Http\Controllers\Chapters\MentalModelController;
use App\Http\Controllers\Chapters\PropsAndTypesController;
use App\Http\Controllers\Chapters\RedirectsController;
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
    Route::get('/redirects', [RedirectsController::class, 'show'])->name('redirects');
    Route::post('/redirects/post', [RedirectsController::class, 'post'])->name('redirects.post');
    Route::delete('/redirects/delete', [RedirectsController::class, 'delete'])->name('redirects.delete');
    Route::get('/redirects/location', [RedirectsController::class, 'location'])->name('redirects.location');
    Route::get('/links-and-visits', [LinksAndVisitsController::class, 'show'])->name('links-and-visits');
    Route::get('/events', [EventsController::class, 'show'])->name('events');
    Route::post('/events/unprocessable', [EventsController::class, 'unprocessable'])->name('events.unprocessable');
    Route::post('/events/server-error', [EventsController::class, 'serverError'])->name('events.server-error');
    Route::get('/events/non-inertia', [EventsController::class, 'nonInertia'])->name('events.non-inertia');
    Route::get('/asset-versioning', [AssetVersioningController::class, 'show'])->name('asset-versioning');
    Route::post('/asset-versioning/bump', [AssetVersioningController::class, 'bump'])->name('asset-versioning.bump');
    Route::post('/asset-versioning/reset', [AssetVersioningController::class, 'reset'])->name('asset-versioning.reset');
    Route::get('/props-and-types', [PropsAndTypesController::class, 'show'])->name('props-and-types');
});
