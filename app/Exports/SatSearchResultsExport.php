<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SatSearchResultsExport implements FromArray, WithColumnWidths, WithEvents, WithHeadings, WithStyles, WithTitle
{
    protected array $results;

    protected string $searchTerm;

    protected string $searchType;

    public function __construct(array $results, string $searchTerm, string $searchType = 'Búsqueda SAT')
    {
        $this->results = $results;
        $this->searchTerm = $searchTerm;
        $this->searchType = $searchType;
    }

    public function array(): array
    {
        return collect($this->results)->map(function ($item, $index) {
            return [
                $index + 1,
                $item['nombre_original'] ?? '',
                $item['nombre_limpio'] ?? '',
                $item['rfc'] ?? 'N/A',
                $item['situacion'] ?? 'No especificada',
                $item['publicacion_sat'] ?? 'N/A',
                $item['publicacion_dof'] ?? 'N/A',
                isset($item['coincidencia']) ? number_format($item['coincidencia'], 2).'%' : 'N/A',
                now()->format('d/m/Y'),
            ];
        })->toArray();
    }

    public function headings(): array
    {
        return [
            '#',
            'Nombre Original',
            'Nombre Normalizado',
            'RFC',
            'Situación',
            'Pub. SAT',
            'Pub. DOF',
            'Coincidencia',
            'Fecha Consulta',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,
            'B' => 35,
            'C' => 35,
            'D' => 15,
            'E' => 20,
            'F' => 15,
            'G' => 15,
            'H' => 15,
            'I' => 15,
        ];
    }

    public function title(): string
    {
        return 'Resultados SAT';
    }

    /**
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Header row styling
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 12,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'DC2626'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Agregar título y metadata
                $sheet->insertNewRowBefore(1, 5);

                $sheet->setCellValue('A1', 'RESULTADOS DE BÚSQUEDA - LISTA NEGRA SAT');
                $sheet->mergeCells('A1:I1');
                $sheet->getStyle('A1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 16,
                        'color' => ['rgb' => 'DC2626'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->setCellValue('A2', 'Atinet Compliance Hub');
                $sheet->mergeCells('A2:I2');
                $sheet->getStyle('A2')->applyFromArray([
                    'font' => ['size' => 11, 'italic' => true],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                $sheet->setCellValue('A4', 'Término Búsqueda:');
                $sheet->setCellValue('B4', $this->searchTerm);
                $sheet->setCellValue('E4', 'Fecha de Generación:');
                $sheet->setCellValue('F4', now()->format('d/m/Y H:i'));
                $sheet->getStyle('A4:A4')->getFont()->setBold(true);
                $sheet->getStyle('E4:E4')->getFont()->setBold(true);

                // Headers row is now at row 6
                $sheet->getStyle('A6:I6')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => 'FFFFFF'],
                        'size' => 12,
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'DC2626'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // Borders for data area
                $lastRow = $sheet->getHighestRow();
                $sheet->getStyle("A6:I{$lastRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'CCCCCC'],
                        ],
                    ],
                ]);

                // Alternate row colors for data
                for ($i = 7; $i <= $lastRow; $i++) {
                    if ($i % 2 == 0) {
                        $sheet->getStyle("A{$i}:I{$i}")->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FEF2F2'],
                            ],
                        ]);
                    }
                }

                // Disclaimer at the end
                $disclaimerRow = $lastRow + 2;
                $sheet->setCellValue("A{$disclaimerRow}", 'DISCLAIMER LEGAL:');
                $sheet->mergeCells("A{$disclaimerRow}:I{$disclaimerRow}");
                $sheet->getStyle("A{$disclaimerRow}")->getFont()->setBold(true);

                $disclaimerRow++;
                $disclaimer = 'Este reporte contiene información del SAT (Servicio de Administración Tributaria) sobre contribuyentes con situación fiscal comprometida. '
                    .'Los datos se sincronizan diariamente desde el listado oficial del SAT (9:30 AM y 6:15 PM hora México). '
                    .'Los resultados mostrados son indicativos y deben ser verificados en el portal oficial del SAT. '
                    .'Atinet no se hace responsable por decisiones basadas únicamente en este reporte. '
                    .'Última sincronización: '.now()->format('d/m/Y H:i');

                $sheet->setCellValue("A{$disclaimerRow}", $disclaimer);
                $sheet->mergeCells("A{$disclaimerRow}:I{$disclaimerRow}");
                $sheet->getStyle("A{$disclaimerRow}")->applyFromArray([
                    'font' => ['size' => 9, 'italic' => true, 'color' => ['rgb' => '666666']],
                    'alignment' => ['wrapText' => true, 'vertical' => Alignment::VERTICAL_TOP],
                ]);
                $sheet->getRowDimension($disclaimerRow)->setRowHeight(60);
            },
        ];
    }
}
