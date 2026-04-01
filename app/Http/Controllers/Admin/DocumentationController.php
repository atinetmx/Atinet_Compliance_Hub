<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentationController extends Controller
{
    /**
     * Display the documentation page.
     */
    public function index(Request $request)
    {
        // Obtener la sección desde la query string
        $section = $request->query('section', 'introduccion');

        return Inertia::render('Admin/Documentation/Index', [
            'currentSection' => $section,
        ]);
    }
}
