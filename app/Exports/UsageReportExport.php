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
            'A' => 25, // Fecha y Hora
            'B' => 45, // Notaría
            'C' => 40, // Servicio
            'D' => 35, // Usuario
            'E' => 15, // Cantidad
            'F' => 15, // Costo
        ];
    }

    public function title(): string
    {
        return 'Uso Detallado';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Estilo para encabezados de columna (fila 7)
            7 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 11,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '0066CC'], // Azul corporativo
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => true,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '0055AA'],
                    ],
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
                    $drawing->setHeight(60);
                    $drawing->setCoordinates('A1');
                    $drawing->setOffsetX(10);
                    $drawing->setOffsetY(10);
                    $drawing->setWorksheet($sheet);
                }

                // Ajustar altura de las primeras filas
                $sheet->getRowDimension(1)->setRowHeight(60);
                $sheet->getRowDimension(2)->setRowHeight(30);
                $sheet->getRowDimension(3)->setRowHeight(10); // Espacio
                $sheet->getRowDimension(4)->setRowHeight(25);
                $sheet->getRowDimension(5)->setRowHeight(25);
                $sheet->getRowDimension(6)->setRowHeight(10); // Espacio antes de encabezados

                // Título del reporte
                $sheet->mergeCells('B1:F1');
                $sheet->setCellValue('B1', 'REPORTE DE USO DETALLADO');
                $sheet->getStyle('B1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 18,
                        'color' => ['rgb' => '0066CC'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_LEFT,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // Subtítulo
                $sheet->mergeCells('B2:F2');
                $sheet->setCellValue('B2', 'Atinet Compliance Hub');
                $sheet->getStyle('B2')->applyFromArray([
                    'font' => [
                        'size' => 11,
                        'color' => ['rgb' => '666666'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_LEFT,
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
                $sheet->mergeCells('B4:C4');
                $sheet->setCellValue('B4', $periodLabel);
                $sheet->getStyle('A4')->getFont()->setBold(true);

                if ($this->notariaName) {
                    $sheet->setCellValue('A5', 'Notaría:');
                    $sheet->mergeCells('B5:C5');
                    $sheet->setCellValue('B5', $this->notariaName);
                    $sheet->getStyle('A5')->getFont()->setBold(true);
                }

                $sheet->setCellValue('D4', 'Generado:');
                $sheet->mergeCells('E4:F4');
                $sheet->setCellValue('E4', now()->format('d/m/Y H:i'));
                $sheet->getStyle('D4')->getFont()->setBold(true);

                $sheet->setCellValue('D5', 'Total Registros:');
                $sheet->setCellValue('E5', count($this->data));
                $sheet->getStyle('D5')->getFont()->setBold(true);

                // Altura de fila de encabezados
                $sheet->getRowDimension(7)->setRowHeight(35);

                // Aplicar bordes a las celdas de datos
                $highestRow = $sheet->getHighestRow();
                $highestColumn = $sheet->getHighestColumn();

                // Bordes solo en la tabla de datos (desde fila 7)
                if ($highestRow >= 7) {
                    $sheet->getStyle('A7:'.$highestColumn.$highestRow)->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['rgb' => 'DDDDDD'],
                            ],
                        ],
                    ]);
                }

                // Aplicar formato alternado a las filas de datos (desde fila 8)
                for ($row = 8; $row <= $highestRow; $row++) {
                    // Altura de cada fila de datos
                    $sheet->getRowDimension($row)->setRowHeight(30);

                    // Color alternado
                    if ($row % 2 == 0) {
                        $sheet->getStyle('A'.$row.':'.$highestColumn.$row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F8F9FA'],
                            ],
                        ]);
                    }
                }

                // Formato de moneda para la columna de costo (F)
                if ($highestRow >= 8) {
                    $sheet->getStyle('F8:F'.$highestRow)->getNumberFormat()->setFormatCode('$#,##0.00');
                }

                // Alineación
                if ($highestRow >= 8) {
                    $sheet->getStyle('E8:E'.$highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle('F8:F'.$highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle('A8:D'.$highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                }

                // Autoajustar altura de texto
                for ($row = 7; $row <= $highestRow; $row++) {
                    $sheet->getStyle('A'.$row.':'.$highestColumn.$row)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
                    $sheet->getStyle('A'.$row.':'.$highestColumn.$row)->getAlignment()->setWrapText(false);
                }

                // Agregar resumen al final si hay datos
                if (count($this->data) > 0) {
                    $summaryRow = $highestRow + 3;
                    $sheet->mergeCells('A'.$summaryRow.':F'.$summaryRow);
                    $sheet->setCellValue('A'.$summaryRow, 'RESUMEN DEL REPORTE');
                    $sheet->getStyle('A'.$summaryRow)->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'size' => 12,
                            'color' => ['rgb' => '0066CC'],
                        ],
                        'alignment' => [
                            'horizontal' => Alignment::HORIZONTAL_CENTER,
                        ],
                    ]);
                    $sheet->getRowDimension($summaryRow)->setRowHeight(25);

                    $summaryRow++;
                    $sheet->mergeCells('A'.$summaryRow.':F'.$summaryRow);
                    $sheet->setCellValue('A'.$summaryRow, 'Este reporte muestra el detalle completo de uso de servicios para el período seleccionado, incluyendo fecha y hora exacta de cada solicitud.');
                    $sheet->getStyle('A'.$summaryRow)->applyFromArray([
                        'font' => [
                            'italic' => true,
                            'size' => 10,
                            'color' => ['rgb' => '666666'],
                        ],
                        'alignment' => [
                            'horizontal' => Alignment::HORIZONTAL_LEFT,
                            'wrapText' => true,
                        ],
                    ]);
                    $sheet->getRowDimension($summaryRow)->setRowHeight(35);
                }
            },
        ];
    }
}
