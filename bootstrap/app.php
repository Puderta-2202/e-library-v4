<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // ⬇️ Tambahkan baris ini agar Sanctum membaca cookie SPA
        $middleware->statefulApi();
        // (opsional) $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
    })
    ->withExceptions()
    ->create();
