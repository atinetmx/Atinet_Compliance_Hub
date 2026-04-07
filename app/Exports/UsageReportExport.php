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

class UsageReportExport implements FromArray, WithColumnWidths, WithEvents, WithHeadings, WithStyles, WithTitle
{
    protected array $data;

    protected string $period;

    protected ?string $notariaName;

    public function __construct(array $data, string $period = 'month', ?string $notariaName = null)
    {
        $this->data = $data;
        $this->period = $period;
        $this->notariaName = $notariaName;
    }

    public function array(): array
    {
        $rows = [];

        foreach ($this->data as $index => $usage) {
            $rows[] = [
                $usage['consumed_at'] ?? '',
                $usage['notaria_nombre'] ?? '',
                $usage['service_name'] ?? '',
                $usage['user_name'] ?? '',
                $usage['quantity'] ?? 0,
                $usage['cost'] ?? 0,
            ];
        }

        return $rows;
    }

    public function headings(): array
    {
        return [
            'Fecha y Hora',
            'Notaría',
            'Servicio',
            'Usuario',
            'Cantidad',
            'Costo ($)',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 20, // Fecha y Hora
            'B' => 35, // Notaría
            'C' => 30, // Servicio
            'D' => 30, // Usuario
            'E' => 12, // Cantidad
            'F' => 12, // Costo
        ];
    }

    public function title(): string
    {
        return 'Uso Detallado';
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
                    'startColor' => ['rgb' => '0066CC'], // Azul corporativo
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

                // Título del reporte
                $sheet->mergeCells('C1:F1');
                $sheet->setCellValue('C1', 'REPORTE DE USO DETALLADO');
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

                // Subtítulo
                $sheet->mergeCells('C2:F2');
                $sheet->setCellValue('C2', 'Atinet Compliance Hub');
                $sheet->getStyle('C2')->applyFromArray([
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

                if ($this->notariaName) {
                    $sheet->setCellValue('A5', 'Notaría:');
                    $sheet->setCellValue('B5', $this->notariaName);
                    $sheet->getStyle('A5')->getFont()->setBold(true);
                }

                $dateLabel = $this->notariaName ? 'D4' : 'D4';
                $dateValue = $this->notariaName ? 'E4' : 'E4';
                $sheet->setCellValue($dateLabel, 'Generado:');
                $sheet->setCellValue($dateValue, now()->format('d/m/Y H:i'));
                $sheet->getStyle($dateLabel)->getFont()->setBold(true);

                $totalLabel = $this->notariaName ? 'D5' : 'D5';
                $totalValue = $this->notariaName ? 'E5' : 'E5';
                $sheet->setCellValue($totalLabel, 'Total Registros:');
                $sheet->setCellValue($totalValue, count($this->data));
                $sheet->getStyle($totalLabel)->getFont()->setBold(true);

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
                $sheet->getStyle('F8:F'.$highestRow)->getNumberFormat()->setFormatCode('$#,##0.00');

                // Alineación de cantidades
                $sheet->getStyle('E8:E'.$highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Agregar resumen al final
                $summaryRow = $highestRow + 2;
                $sheet->mergeCells('A'.$summaryRow.':F'.$summaryRow);
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
                $sheet->mergeCells('A'.$summaryRow.':F'.$summaryRow);
                $sheet->setCellValue('A'.$summaryRow, 'Este reporte muestra el detalle completo de uso de servicios para el período seleccionado, incluyendo fecha y hora exacta de cada solicitud.');
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
