<?php

it('returns a successful response', function () {
    $response = $this->get(route('lab.home'));

    $response->assertOk();
});
