<?php

use App\Lab\SourceReader;

it('reads a file listed in the registry', function () {
    $result = app(SourceReader::class)->read('app/Lab/ChapterRegistry.php');

    expect($result['contents'])->toContain('class ChapterRegistry')
        ->and($result['lines'])->toBeGreaterThan(10);
});

it('refuses a path that no chapter declares', function () {
    app(SourceReader::class)->read('.env');
})->throws(InvalidArgumentException::class);

it('refuses traversal out of the project', function () {
    app(SourceReader::class)->read('../../etc/passwd');
})->throws(InvalidArgumentException::class);
