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

class SearchHistoryExport implements FromArray, WithColumnWidths, WithEvents, WithHeadings, WithStyles, WithTitle
{
    protected array $history;

    protected array $filters;

    public function __construct(array $history, array $filters = [])
    {
        $this->history = $history;
        $this->filters = $filters;
    }

    public function array(): array
    {
        return collect($this->history)->map(function ($item, $index) {
            $resultados = $item['resultados'] ?? [];
            $totalResultados = 0;

            // Contar resultados según el tipo
            if (is_array($resultados)) {
                $totalResultados = count($resultados);
            } elseif (is_object($resultados) && isset($resultados->data)) {
                $totalResultados = count($resultados->data);
            }

            return [
                $index + 1,
                $item['user']['name'] ?? 'N/A',
                $item['notaria']['nombre'] ?? 'Sin notaría',
                $item['tipo_busqueda'] ?? 'N/A',
                $item['termino_busqueda'] ?? '',
                $totalResultados,
                date('d/m/Y H:i', strtotime($item['created_at'])),
            ];
        })->toArray();
    }

    public function headings(): array
    {
        return [
            '#',
            'Usuario',
            'Notaría',
            'Tipo de Búsqueda',
            'Término Búsqueda',
            'Resultados',
            'Fecha',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,
            'B' => 30,
            'C' => 35,
            'D' => 20,
            'E' => 35,
            'F' => 12,
            'G' => 18,
        ];
    }

    public function title(): string
    {
        return 'Historial Búsquedas';
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
                    'startColor' => ['rgb' => '6366F1'],
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
                $sheet->insertNewRowBefore(1, 6);

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
                $sheet->setCellValue('D1', 'HISTORIAL DE BÚSQUEDAS - LISTAS NEGRAS');
                $sheet->mergeCells('D1:G1');
                $sheet->getStyle('D1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 16,
                        'color' => ['rgb' => '6366F1'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->setCellValue('D2', 'Atinet Compliance Hub');
                $sheet->mergeCells('D2:G2');
                $sheet->getStyle('D2')->applyFromArray([
                    'font' => ['size' => 11, 'italic' => true],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                // Información de filtros aplicados
                $filtrosTexto = $this->getFilterDescription();
                $sheet->setCellValue('A4', 'Filtros Aplicados:');
                $sheet->setCellValue('B4', $filtrosTexto);
                $sheet->mergeCells('B4:E4');
                $sheet->getStyle('A4')->getFont()->setBold(true);

                $sheet->setCellValue('F4', 'Fecha Generación:');
                $sheet->setCellValue('G4', now()->format('d/m/Y H:i'));
                $sheet->getStyle('F4')->getFont()->setBold(true);

                $sheet->setCellValue('A5', 'Total Registros:');
                $sheet->setCellValue('B5', count($this->history));
                $sheet->getStyle('A5')->getFont()->setBold(true);

                // Headers row is now at row 7
                $sheet->getStyle('A7:G7')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => 'FFFFFF'],
                        'size' => 12,
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '6366F1'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // Borders for data area
                $lastRow = $sheet->getHighestRow();
                $sheet->getStyle("A7:G{$lastRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'CCCCCC'],
                        ],
                    ],
                ]);

                // Alternate row colors for data
                for ($i = 8; $i <= $lastRow; $i++) {
                    if ($i % 2 == 0) {
                        $sheet->getStyle("A{$i}:G{$i}")->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F9F9F9'],
                            ],
                        ]);
                    }
                }

                // Resumen al final
                $summaryRow = $lastRow + 2;
                $sheet->setCellValue("A{$summaryRow}", 'RESUMEN DEL HISTORIAL:');
                $sheet->mergeCells("A{$summaryRow}:G{$summaryRow}");
                $sheet->getStyle("A{$summaryRow}")->getFont()->setBold(true);

                $summaryRow++;
                $summary = 'Este reporte contiene el historial de búsquedas realizadas en las Listas Negras OFAC y SAT 69-B. '
                    .'Los datos reflejan todas las consultas registradas según los filtros aplicados. '
                    .'El historial completo está disponible en el sistema para consultas futuras.';

                $sheet->setCellValue("A{$summaryRow}", $summary);
                $sheet->mergeCells("A{$summaryRow}:G{$summaryRow}");
                $sheet->getStyle("A{$summaryRow}")->applyFromArray([
                    'font' => ['size' => 9, 'italic' => true, 'color' => ['rgb' => '666666']],
                    'alignment' => ['wrapText' => true, 'vertical' => Alignment::VERTICAL_TOP],
                ]);
                $sheet->getRowDimension($summaryRow)->setRowHeight(45);
            },
        ];
    }

    protected function getFilterDescription(): string
    {
        $parts = [];

        if (! empty($this->filters['tipo_busqueda']) && $this->filters['tipo_busqueda'] !== 'all') {
            $parts[] = "Tipo: {$this->filters['tipo_busqueda']}";
        }

        if (! empty($this->filters['notaria_id']) && $this->filters['notaria_id'] !== 'all') {
            $parts[] = 'Notaría: '.($this->filters['notaria_label'] ?? $this->filters['notaria_id']);
        }

        if (! empty($this->filters['dias']) && $this->filters['dias'] !== 'all') {
            $diasLabels = [
                '7' => 'Últimos 7 días',
                '30' => 'Últimos 30 días',
                '90' => 'Últimos 3 meses',
                '365' => 'Último año',
            ];
            $parts[] = $diasLabels[$this->filters['dias']] ?? "Últimos {$this->filters['dias']} días";
        }

        if (! empty($this->filters['termino'])) {
            $parts[] = "Término: {$this->filters['termino']}";
        }

        return empty($parts) ? 'Ninguno (todo el historial)' : implode(' | ', $parts);
    }
}
