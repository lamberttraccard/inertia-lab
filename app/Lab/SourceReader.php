<?php

namespace App\Lab;

use InvalidArgumentException;

class SourceReader
{
    private const PLATFORM_FILES = [
        'app/Lab/ChapterRegistry.php',
        'app/Lab/Lab.php',
        'app/Lab/Trace/LabRecorder.php',
        'app/Http/Middleware/InjectLabTrace.php',
        // Read by chapters/devtools-and-testing, whose whole subject is this pair: the
        // helpers this suite uses instead of assertInertia(), and the test that uses them.
        'tests/Pest.php',
        'tests/Feature/Chapters/DevtoolsAndTestingTest.php',
    ];

    public function __construct(private readonly ChapterRegistry $registry) {}

    /** @return array{path: string, contents: string, lines: int} */
    public function read(string $path): array
    {
        if (! in_array($path, $this->allowed(), true)) {
            throw new InvalidArgumentException("Refusing to read [{$path}]: no chapter declares it.");
        }

        $absolute = base_path($path);

        if (! is_file($absolute)) {
            throw new InvalidArgumentException("Declared source file [{$path}] does not exist on disk.");
        }

        $contents = (string) file_get_contents($absolute);

        return [
            'path' => $path,
            'contents' => $contents,
            'lines' => substr_count($contents, "\n") + 1,
        ];
    }

    /** @return array<int, string> */
    private function allowed(): array
    {
        $fromChapters = collect($this->registry->all())
            ->flatMap(fn (Chapter $chapter) => [$chapter->serverFile, $chapter->clientFile])
            ->all();

        return [...self::PLATFORM_FILES, ...$fromChapters];
    }
}
