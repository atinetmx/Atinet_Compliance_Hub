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

class NotariasReportExport implements FromArray, WithColumnWidths, WithEvents, WithHeadings, WithStyles, WithTitle
{
    protected array $data;

    protected string $period;

    public function __construct(array $data, string $period = 'month')
    {
        $this->data = $data;
        $this->period = $period;
    }

    public function array(): array
    {
        $rows = [];

        foreach ($this->data as $notaria) {
            $rows[] = [
                $notaria['nombre'] ?? '',
                $notaria['total_requests'] ?? 0,
                $notaria['total_quantity'] ?? 0,
                $notaria['total_cost'] ?? 0,
            ];
        }

        return $rows;
    }

    public function headings(): array
    {
        return [
            'Notaría',
            'Total Solicitudes',
            'Total Cantidad',
            'Total Costo ($)',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 45, // Notaría
            'B' => 18, // Total Solicitudes
            'C' => 18, // Total Cantidad
            'D' => 18, // Total Costo
        ];
    }

    public function title(): string
    {
        return 'Por Notarías';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            7 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 12,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '16A34A'], // Verde
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

                // Insertar logo
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

                // Ajustar altura de la fila del logo
                $sheet->getRowDimension(1)->setRowHeight(60);

                // Título del reporte (columnas C y D porque son 4 columnas totales)
                $sheet->mergeCells('B1:D1');
                $sheet->setCellValue('B1', 'REPORTE POR NOTARÍAS');
                $sheet->getStyle('B1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 16,
                        'color' => ['rgb' => '16A34A'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // Subtítulo
                $sheet->mergeCells('B2:D2');
                $sheet->setCellValue('B2', 'Resumen Agregado por Notaría');
                $sheet->getStyle('B2')->applyFromArray([
                    'font' => [
                        'size' => 12,
                        'color' => ['rgb' => '666666'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // Información del período
                $periodLabel = match ($this->period) {
                    'week' => 'Esta Semana',
                    'month' => 'Este Mes',
                    'year' => 'Este Año',
                    default => 'Período Personalizado',
                };

                $sheet->setCellValue('A4', 'Período:');
                $sheet->setCellValue('B4', $periodLabel);
                $sheet->getStyle('A4')->getFont()->setBold(true);

                $sheet->setCellValue('C4', 'Generado:');
                $sheet->setCellValue('D4', now()->format('d/m/Y H:i'));
                $sheet->getStyle('C4')->getFont()->setBold(true);

                $sheet->setCellValue('A5', 'Total Notarías:');
                $sheet->setCellValue('B5', count($this->data));
                $sheet->getStyle('A5')->getFont()->setBold(true);

                // Calcular totales
                $totalRequests = array_sum(array_column($this->data, 'total_requests'));
                $totalQuantity = array_sum(array_column($this->data, 'total_quantity'));
                $totalCost = array_sum(array_column($this->data, 'total_cost'));

                $sheet->setCellValue('C5', 'Costo Total:');
                $sheet->setCellValue('D5', '$'.number_format($totalCost, 2));
                $sheet->getStyle('C5')->getFont()->setBold(true);
                $sheet->getStyle('D5')->getFont()->setBold(true);

                // Aplicar bordes a las celdas de datos
                $highestRow = $sheet->getHighestRow();
                $highestColumn = $sheet->getHighestColumn();

                $sheet->getStyle('A7:'.$highestColumn.$highestRow)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'CCCCCC'],
                        ],
                    ],
                ]);

                // Aplicar formato alternado a las filas de datos
                for ($row = 8; $row <= $highestRow; $row++) {
                    if ($row % 2 == 0) {
                        $sheet->getStyle('A'.$row.':'.$highestColumn.$row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F9F9F9'],
                            ],
                        ]);
                    }
                }

                // Formato de moneda para la columna de costo
                $sheet->getStyle('D8:D'.$highestRow)->getNumberFormat()->setFormatCode('$#,##0.00');

                // Alineación de números
                $sheet->getStyle('B8:D'.$highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Agregar fila de totales
                $totalRow = $highestRow + 1;
                $sheet->setCellValue('A'.$totalRow, 'TOTAL GENERAL');
                $sheet->setCellValue('B'.$totalRow, $totalRequests);
                $sheet->setCellValue('C'.$totalRow, $totalQuantity);
                $sheet->setCellValue('D'.$totalRow, $totalCost);

                $sheet->getStyle('A'.$totalRow.':D'.$totalRow)->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 12,
                        'color' => ['rgb' => 'FFFFFF'],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '16A34A'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '16A34A'],
                        ],
                    ],
                ]);

                $sheet->getStyle('D'.$totalRow)->getNumberFormat()->setFormatCode('$#,##0.00');

                // Agregar resumen al final
                $summaryRow = $totalRow + 2;
                $sheet->mergeCells('A'.$summaryRow.':D'.$summaryRow);
                $sheet->setCellValue('A'.$summaryRow, 'RESUMEN DEL REPORTE');
                $sheet->getStyle('A'.$summaryRow)->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 12,
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                    ],
                ]);

                $summaryRow++;
                $sheet->mergeCells('A'.$summaryRow.':D'.$summaryRow);
                $sheet->setCellValue('A'.$summaryRow, 'Este reporte muestra el resumen de uso de servicios agrupado por notaría, facilitando el análisis de facturación y comparativa entre clientes.');
                $sheet->getStyle('A'.$summaryRow)->applyFromArray([
                    'font' => [
                        'italic' => true,
                        'color' => ['rgb' => '666666'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_LEFT,
                        'wrapText' => true,
                    ],
                ]);
                $sheet->getRowDimension($summaryRow)->setRowHeight(30);
            },
        ];
    }
}
