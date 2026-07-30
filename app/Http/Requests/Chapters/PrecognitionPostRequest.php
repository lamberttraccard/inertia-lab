<?php

namespace App\Http\Requests\Chapters;

use Illuminate\Foundation\Http\FormRequest;

class PrecognitionPostRequest extends FormRequest
{
    // No authentication system exists in this lab: every visitor may create demo content.
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            // The rule chapter 19 is about. A precognitive request for this same route
            // filters down to just this rule when it names slug in Precognition-Validate-
            // Only, and unique:posts,slug is the genuine constraint the posts table itself
            // enforces (verified in database/migrations/..._create_posts_table.php),
            // not a client-side approximation of it.
            'slug' => ['required', 'string', 'max:80', 'unique:posts,slug'],
        ];
    }
}
