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
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class OfacSearchResultsExport implements FromArray, WithColumnWidths, WithEvents, WithHeadings, WithStyles, WithTitle
{
    protected array $results;

    protected string $searchTerm;

    protected string $searchType;

    public function __construct(array $results, string $searchTerm, string $searchType = 'Búsqueda OFAC')
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
                isset($item['coincidencia']) ? number_format($item['coincidencia'], 2).'%' : 'N/A',
                $item['fuente'] ?? 'OFAC',
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
            'Coincidencia',
            'Fuente',
            'Fecha Consulta',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,
            'B' => 40,
            'C' => 40,
            'D' => 15,
            'E' => 12,
            'F' => 15,
        ];
    }

    public function title(): string
    {
        return 'Resultados OFAC';
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
                    'startColor' => ['rgb' => '0066CC'],
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

                // Agregar logo de Atinet
                $logoPath = public_path('images/logo-atinet.png');
                if (file_exists($logoPath)) {
                    $drawing = new Drawing;
                    $drawing->setName('Atinet Logo');
                    $drawing->setDescription('Logo Atinet Compliance Hub');
                    $drawing->setPath($logoPath);
                    $drawing->setHeight(80);
                    $drawing->setCoordinates('A1');
                    $drawing->setOffsetX(10);
                    $drawing->setOffsetY(5);
                    $drawing->setWorksheet($sheet);
                }

                // Ajustar altura de las primeras filas para el logo
                $sheet->getRowDimension(1)->setRowHeight(60);

                // Título principal (alineado a la derecha junto al logo)
                $sheet->setCellValue('C1', 'RESULTADOS DE BÚSQUEDA - LISTA NEGRA OFAC');
                $sheet->mergeCells('C1:F1');
                $sheet->getStyle('C1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 16,
                        'color' => ['rgb' => '0066CC'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->setCellValue('C2', 'Atinet Compliance Hub');
                $sheet->mergeCells('C2:F2');
                $sheet->getStyle('C2')->applyFromArray([
                    'font' => ['size' => 11, 'italic' => true],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                $sheet->setCellValue('A4', 'Término Búsqueda:');
                $sheet->setCellValue('B4', $this->searchTerm);
                $sheet->setCellValue('D4', 'Fecha de Generación:');
                $sheet->setCellValue('E4', now()->format('d/m/Y H:i'));
                $sheet->getStyle('A4:A4')->getFont()->setBold(true);
                $sheet->getStyle('D4:D4')->getFont()->setBold(true);

                // Headers row is now at row 6
                $sheet->getStyle('A6:F6')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => 'FFFFFF'],
                        'size' => 12,
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '0066CC'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // Borders for data area
                $lastRow = $sheet->getHighestRow();
                $sheet->getStyle("A6:F{$lastRow}")->applyFromArray([
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
                        $sheet->getStyle("A{$i}:F{$i}")->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F9F9F9'],
                            ],
                        ]);
                    }
                }

                // Disclaimer at the end
                $disclaimerRow = $lastRow + 2;
                $sheet->setCellValue("A{$disclaimerRow}", 'DISCLAIMER LEGAL:');
                $sheet->mergeCells("A{$disclaimerRow}:F{$disclaimerRow}");
                $sheet->getStyle("A{$disclaimerRow}")->getFont()->setBold(true);

                $disclaimerRow++;
                $disclaimer = 'Este reporte contiene información de la lista OFAC (Office of Foreign Assets Control) sincronizada desde fuentes oficiales. '
                    .'Los datos se actualizan diariamente (9:30 AM y 6:15 PM hora México). '
                    .'Los resultados mostrados son indicativos y deben ser verificados manualmente. '
                    .'Atinet no se hace responsable por decisiones basadas únicamente en este reporte. '
                    .'Última sincronización: '.now()->format('d/m/Y H:i');

                $sheet->setCellValue("A{$disclaimerRow}", $disclaimer);
                $sheet->mergeCells("A{$disclaimerRow}:F{$disclaimerRow}");
                $sheet->getStyle("A{$disclaimerRow}")->applyFromArray([
                    'font' => ['size' => 9, 'italic' => true, 'color' => ['rgb' => '666666']],
                    'alignment' => ['wrapText' => true, 'vertical' => Alignment::VERTICAL_TOP],
                ]);
                $sheet->getRowDimension($disclaimerRow)->setRowHeight(60);
            },
        ];
    }
}
