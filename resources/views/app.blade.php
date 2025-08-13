<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'E-Library DLH Medan') }}</title>

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">

    <!-- React Refresh untuk Vite -->
    @viteReactRefresh
    @vite(['resources/css/app.css','resources/js/app1.tsx'])
</head>

<body>
    <div id="app"></div>
</body>

</html>