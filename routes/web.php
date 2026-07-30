<?php

use App\Http\Controllers\Chapters\AlwaysPropsController;
use App\Http\Controllers\Chapters\AssetVersioningController;
use App\Http\Controllers\Chapters\DeferredPropsController;
use App\Http\Controllers\Chapters\EventsController;
use App\Http\Controllers\Chapters\FileUploadsController;
use App\Http\Controllers\Chapters\FirstLoadVsVisitController;
use App\Http\Controllers\Chapters\FormsController;
use App\Http\Controllers\Chapters\InfiniteScrollController;
use App\Http\Controllers\Chapters\LinksAndVisitsController;
use App\Http\Controllers\Chapters\MentalModelController;
use App\Http\Controllers\Chapters\MergingPropsController;
use App\Http\Controllers\Chapters\OncePropsController;
use App\Http\Controllers\Chapters\OptionalPropsController;
use App\Http\Controllers\Chapters\PartialReloadsController;
use App\Http\Controllers\Chapters\PollingController;
use App\Http\Controllers\Chapters\PrecognitionController;
use App\Http\Controllers\Chapters\PrefetchingController;
use App\Http\Controllers\Chapters\PropsAndTypesController;
use App\Http\Controllers\Chapters\RedirectsController;
use App\Http\Controllers\Chapters\RenderAndComponentsController;
use App\Http\Controllers\Chapters\SharedDataController;
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
    Route::get('/shared-data', [SharedDataController::class, 'show'])->name('shared-data');
    Route::post('/shared-data/switch-user', [SharedDataController::class, 'switchUser'])->name('shared-data.switch-user');
    Route::get('/partial-reloads', [PartialReloadsController::class, 'show'])->name('partial-reloads');
    Route::get('/optional-props', [OptionalPropsController::class, 'show'])->name('optional-props');
    Route::get('/deferred-props', [DeferredPropsController::class, 'show'])->name('deferred-props');
    Route::get('/always-props', [AlwaysPropsController::class, 'show'])->name('always-props');
    Route::post('/always-props/flash', [AlwaysPropsController::class, 'flash'])->name('always-props.flash');
    Route::get('/merging-props', [MergingPropsController::class, 'show'])->name('merging-props');
    Route::get('/infinite-scroll', [InfiniteScrollController::class, 'show'])->name('infinite-scroll');
    Route::get('/once-props', [OncePropsController::class, 'show'])->name('once-props');
    Route::get('/polling', [PollingController::class, 'show'])->name('polling');
    Route::post('/polling/simulate', [PollingController::class, 'simulate'])->name('polling.simulate');
    Route::get('/forms', [FormsController::class, 'show'])->name('forms');
    Route::post('/forms', [FormsController::class, 'store'])->name('forms.store');
    Route::get('/file-uploads', [FileUploadsController::class, 'show'])->name('file-uploads');
    Route::post('/file-uploads', [FileUploadsController::class, 'store'])->name('file-uploads.store');
    Route::get('/precognition', [PrecognitionController::class, 'show'])->name('precognition');
    Route::post('/precognition', [PrecognitionController::class, 'store'])
        ->middleware('precognitive')
        ->name('precognition.store');
    Route::get('/prefetching', [PrefetchingController::class, 'show'])->name('prefetching');
    Route::get('/prefetching/destination', [PrefetchingController::class, 'destination'])->name('prefetching.destination');
});
