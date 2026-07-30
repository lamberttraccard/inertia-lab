<?php

it('responds not found for a slug no chapter registers', function () {
    $this->get('/lab/source/does-not-exist')->assertNotFound();
});
