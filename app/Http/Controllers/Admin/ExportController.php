<?php

namespace App\Http\Controllers\Admin;

use App\Exports\CombinedSearchResultsExport;
use App\Exports\OfacSearchResultsExport;
use App\Exports\SatSearchResultsExport;
use App\Exports\SearchHistoryExport;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    /**
     * Export OFAC search results to Excel
     */
    public function exportOfac(Request $request)
    {
        $request->validate([
            'results' => 'required|array',
            'searchTerm' => 'required|string',
        ]);

        $results = $request->input('results');
        $searchTerm = $request->input('searchTerm');
        $searchType = $request->input('searchType', 'Búsqueda OFAC');

        $filename = $this->generateFilename('ofac', $searchTerm);

        return Excel::download(
            new OfacSearchResultsExport($results, $searchTerm, $searchType),
            $filename
        );
    }

    /**
     * Export SAT search results to Excel
     */
    public function exportSat(Request $request)
    {
        $request->validate([
            'results' => 'required|array',
            'searchTerm' => 'required|string',
        ]);

        $results = $request->input('results');
        $searchTerm = $request->input('searchTerm');
        $searchType = $request->input('searchType', 'Búsqueda SAT');

        $filename = $this->generateFilename('sat', $searchTerm);

        return Excel::download(
            new SatSearchResultsExport($results, $searchTerm, $searchType),
            $filename
        );
    }

    /**
     * Export combined OFAC and SAT search results to Excel (multi-sheet)
     */
    public function exportCombined(Request $request)
    {
        $request->validate([
            'ofacResults' => 'required|array',
            'satResults' => 'required|array',
            'searchTerm' => 'required|string',
        ]);

        $ofacResults = $request->input('ofacResults');
        $satResults = $request->input('satResults');
        $searchTerm = $request->input('searchTerm');
        $searchType = $request->input('searchType', 'Búsqueda Combinada');

        $filename = $this->generateFilename('completa', $searchTerm);

        return Excel::download(
            new CombinedSearchResultsExport($ofacResults, $satResults, $searchTerm, $searchType),
            $filename
        );
    }

    /**
     * Generate a safe filename for the export
     */
    protected function generateFilename(string $type, string $searchTerm): string
    {
        // Remove special characters and limit length
        $safeTerm = preg_replace('/[^a-zA-Z0-9_-]/', '_', $searchTerm);
        $safeTerm = substr($safeTerm, 0, 30);

        $date = now()->format('Y-m-d_His');

        return "busqueda_{$type}_{$safeTerm}_{$date}.xlsx";
    }

    /**
     * Export search history to Excel
     */
    public function exportHistory(Request $request)
    {
        $request->validate([
            'history' => 'required|array',
            'filters' => 'array',
        ]);

        $history = $request->input('history');
        $filters = $request->input('filters', []);

        $date = now()->format('Y-m-d_His');
        $filename = "historial_busquedas_{$date}.xlsx";

        return Excel::download(
            new SearchHistoryExport($history, $filters),
            $filename
        );
    }
}
