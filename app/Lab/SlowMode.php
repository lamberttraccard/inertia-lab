<?php

namespace App\Lab;

use Illuminate\Contracts\Session\Session;

class SlowMode
{
    public function __construct(private readonly Session $session) {}

    public function delayMs(): int
    {
        return (int) $this->session->get('lab.slow_mode', 0);
    }

    public function set(int $ms): void
    {
        $this->session->put('lab.slow_mode', max(0, min($ms, 3000)));
    }
}
