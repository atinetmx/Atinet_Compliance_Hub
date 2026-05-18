<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class CombinedSearchResultsExport implements WithMultipleSheets
{
    protected array $ofacResults;

    protected array $satResults;

    protected string $searchTerm;

    protected string $searchType;

    public function __construct(
        array $ofacResults,
        array $satResults,
        string $searchTerm,
        string $searchType = 'Búsqueda Combinada'
    ) {
        $this->ofacResults = $ofacResults;
        $this->satResults = $satResults;
        $this->searchTerm = $searchTerm;
        $this->searchType = $searchType;
    }

    public function sheets(): array
    {
        $sheets = [];

        // Add OFAC sheet if there are results
        if (! empty($this->ofacResults)) {
            $sheets[] = new OfacSearchResultsExport(
                $this->ofacResults,
                $this->searchTerm,
                $this->searchType
            );
        }

        // Add SAT sheet if there are results
        if (! empty($this->satResults)) {
            $sheets[] = new SatSearchResultsExport(
                $this->satResults,
                $this->searchTerm,
                $this->searchType
            );
        }

        return $sheets;
    }
}
