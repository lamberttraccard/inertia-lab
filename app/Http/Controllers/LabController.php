<?php

namespace App\Http\Controllers;

use App\Lab\ChapterRegistry;
use App\Lab\SourceReader;
use Illuminate\Http\JsonResponse;

class LabController extends Controller
{
    public function source(ChapterRegistry $registry, SourceReader $reader, string $slug): JsonResponse
    {
        $chapter = $registry->find($slug);

        abort_if($chapter === null, 404);

        return response()->json([
            'server' => $reader->read($chapter->serverFile),
            'client' => $reader->read($chapter->clientFile),
        ]);
    }
}
