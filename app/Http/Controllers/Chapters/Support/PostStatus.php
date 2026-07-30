<?php

namespace App\Http\Controllers\Chapters\Support;

enum PostStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
}
