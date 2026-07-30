<?php

namespace App\Http\Controllers;

use App\Lab\SlowMode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SlowModeController extends Controller
{
    public function update(Request $request, SlowMode $slowMode): RedirectResponse
    {
        $slowMode->set($request->integer('ms'));

        return back();
    }
}
