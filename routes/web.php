<?php

use App\Http\Controllers\Citizen\CitizenPageController;
use App\Http\Controllers\Citizen\CitizenReportAnalysisController;
use App\Http\Controllers\Citizen\SafetyCircleController;
use App\Http\Controllers\GCC\AffectedResidentController;
use App\Http\Controllers\GCC\DisasterIncidentController;
use App\Http\Controllers\GCC\GCCDashboardController;
use App\Http\Controllers\GCC\ResidenceController;
use App\Http\Controllers\Responder\ResponderRequestController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('publisher/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('publisher.dashboard');

    Route::get('encoder/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('encoder.dashboard');

    Route::get('external-encoder/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('external-encoder.dashboard');

    Route::get('admin/dashboard', [GCCDashboardController::class, 'index'])
        ->middleware('role:administrator')
        ->name('admin.dashboard');
});
Route::prefix('frontend')->middleware('citizen.auth')->name('citizen.')->group(function () {
    Route::get('/', [CitizenPageController::class, 'index'])->name('home');
    Route::get('/circles/create', [CitizenPageController::class, 'create'])->name('circles.create');
    Route::post('/circles', [SafetyCircleController::class, 'store'])->name('circles.store');
    Route::get('/circles/{circle}', [CitizenPageController::class, 'show'])->name('circles.show');
    Route::post('/circles/{circle}/members', [SafetyCircleController::class, 'addMember'])
        ->name('circles.members.store');
    Route::patch('/circles/{circle}/members/{member}/status', [SafetyCircleController::class, 'updateStatus'])
        ->name('circles.members.status');
    Route::patch('/check-in', [SafetyCircleController::class, 'checkIn'])->name('check-in');
    Route::post('/assistance/analyze', CitizenReportAnalysisController::class)
        ->middleware('throttle:20,1')
        ->name('assistance.analyze');
    Route::get('/preparedness', [CitizenPageController::class, 'preparedness'])->name('preparedness');
    Route::get('/advisory', [CitizenPageController::class, 'advisory'])->name('advisory');
    Route::get('/profile', [CitizenPageController::class, 'profile'])->name('profile');
});

Route::prefix('gcc')->middleware('auth', 'role:gcc,administrator')->group(function () {

    Route::get('/dashboard', [GCCDashboardController::class, 'index'])
        ->name('gcc.dashboard.index');
    Route::get('/disaster-map', [GCCDashboardController::class, 'disasterMap'])
        ->name('gcc.disaster-map.index');
    Route::get('/affected-residents', [AffectedResidentController::class, 'index'])
        ->name('gcc.affected-residents.index');
    Route::patch('/affected-residents/{affectedResident}/mark-safe', [AffectedResidentController::class, 'markSafe'])
        ->name('gcc.affected-residents.mark-safe');
    Route::patch('/affected-residents/{affectedResident}/dispatch-responder', [AffectedResidentController::class, 'dispatchResponder'])
        ->name('gcc.affected-residents.dispatch-responder');
    Route::get('/residences', [ResidenceController::class, 'index'])
        ->name('gcc.residences.index');
    Route::post('/incidents', [DisasterIncidentController::class, 'store'])
        ->name('gcc.incidents.store');
    Route::put('/incidents/{incident}', [DisasterIncidentController::class, 'update'])
        ->name('gcc.incidents.update');
});

Route::prefix('responder')->middleware('auth', 'role:responder')->name('responder.')->group(function () {
    Route::get('/', [ResponderRequestController::class, 'index'])->name('index');
    Route::get('/assigned', [ResponderRequestController::class, 'assigned'])->name('assigned');
    Route::patch('/requests/{member}', [ResponderRequestController::class, 'update'])->name('requests.update');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
