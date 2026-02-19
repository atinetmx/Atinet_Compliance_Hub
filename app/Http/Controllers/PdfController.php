<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;

class PdfController extends Controller
{
    /**
     * Generar PDF para resultado OFAC individual
     */
    public function generateOfacPdf(Request $request)
    {
        $nombre = $request->input('nombre', '');
        $rfc = $request->input('rfc', '');
        $resultados = $request->input('resultados', '[]');

        $pdf = new PdfOfac;
        $pdf->generarPdf($nombre, $rfc, $resultados);

        return response($pdf->Output('S'), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="consulta_ofac_'.date('Ymd_His').'.pdf"');
    }

    /**
     * Generar PDF para resultado SAT individual
     */
    public function generateSatPdf(Request $request)
    {
        $nombre = $request->input('nombre', '');
        $rfc = $request->input('rfc', '');
        $resultados = $request->input('resultados', '[]');

        $pdf = new PdfSat;
        $pdf->generarPdf($nombre, $rfc, $resultados);

        return response($pdf->Output('S'), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="consulta_sat_'.date('Ymd_His').'.pdf"');
    }

    /**
     * Generar PDF negativo (sin coincidencias)
     */
    public function generateNegativePdf(Request $request)
    {
        $nombre = $request->input('nombre', '');
        $type = $request->input('type', 'combined');

        if ($type === 'ofac') {
            $pdf = new PdfOfac;
            $pdf->generarPdf($nombre, '', '[]', true);
        } elseif ($type === 'sat') {
            $pdf = new PdfSat;
            $pdf->generarPdf($nombre, '', '[]', true);
        } else {
            $pdf = new PdfOfac;
            $pdf->generarPdf($nombre, '', '[]', true);
        }

        return response($pdf->Output('S'), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="consulta_negativa_'.date('Ymd_His').'.pdf"');
    }
}

/**
 * Clase para generar PDFs de OFAC
 */
class PdfOfac extends \tFPDF
{
    public function JustifyText($text, $w, $h)
    {
        $lines = explode("\n", $text);
        $lineCount = count($lines);
        $lineHeight = $h / $lineCount;

        foreach ($lines as $line) {
            $this->MultiCell($w, $lineHeight, $line, 0, 'J');
        }
    }

    public function generarPdf($nombre, $rfc = '', $resultados = '[]', $negativo = false)
    {
        $resultado = $negativo ? 'Negativo' : 'Afirmativo';
        $resultado2 = $negativo ? 'NO' : 'SI';

        // Generar fecha en español con Carbon
        Carbon::setLocale('es');
        $fecha = Carbon::now()->translatedFormat('d \d\e F \d\e Y');
        $hora = Carbon::now()->format('H:i');
        $this->AddPage();

        // Logo (si existe)
        $logoPath = public_path('images/logo.jpg');
        if (file_exists($logoPath)) {
            $this->Image($logoPath, 10, 8, 25);
        }

        // Fecha y hora
        $this->SetFont('Arial', '', 11);
        $this->SetXY(10, 12);
        $this->Cell(0, 6, $this->encodeText($fecha.' a las '.$hora.' horas'), 0, 1, 'R');
        $this->Ln(8);

        // Título
        $this->SetFont('Arial', 'B', 16);
        $this->MultiCell(0, 7, $this->encodeText('RESULTADO DE CONSULTA EN LAS LISTAS NEGRAS'), 0, 'C');
        $this->Ln(5);

        // Contenido principal
        $this->SetFont('Arial', 'B', 11);
        $nombreHeight = ceil($this->GetStringWidth($nombre) / 120) * 8;
        $this->Cell(50, $nombreHeight, $this->encodeText('Nombre:'), 1, 0, 'L');
        $this->SetFont('Arial', '', 10);
        $this->MultiCell(0, 8, $this->encodeText($nombre), 1, 'L');

        $this->SetFont('Arial', 'B', 11);
        $this->Cell(50, 8, $this->encodeText('Presencia en Lista Negra:'), 1, 0, 'L');
        $this->SetFont('Arial', '', 10);
        $this->Cell(0, 8, $this->encodeText($resultado), 1, 1, 'L');

        if ($rfc) {
            $this->SetFont('Arial', 'B', 11);
            $this->Cell(50, 8, $this->encodeText('RFC:'), 1, 0, 'L');
            $this->SetFont('Arial', '', 10);
            $this->Cell(0, 8, $this->encodeText($rfc), 1, 1, 'L');
        }

        // Detalles si hay coincidencias
        if (! $negativo && $resultados !== '[]') {
            $this->Ln(3);
            $this->SetFont('Arial', 'B', 10);
            $this->MultiCell(0, 5, $this->encodeText('Detalles de Coincidencias:'), 0, 'L');

            try {
                $items = json_decode($resultados, true) ?: [];
                $this->SetFont('Arial', '', 9);
                foreach ($items as $item) {
                    $this->Ln(2);
                    if (isset($item['nombre_limpio'])) {
                        $this->MultiCell(0, 4, $this->encodeText('• '.$item['nombre_limpio']), 0, 'L');
                    }
                    if (isset($item['similarity'])) {
                        $this->MultiCell(0, 4, $this->encodeText('  Similitud: '.$item['similarity'].'%'), 0, 'L');
                    }
                    if (isset($item['tipo_coincidencia'])) {
                        $this->MultiCell(0, 4, $this->encodeText('  Tipo: '.$item['tipo_coincidencia']), 0, 'L');
                    }
                }
            } catch (\Exception $e) {
                // Si falla la decodificación, continuar sin detalles
            }
        }

        $this->Ln(5);
        $this->SetFont('Arial', 'B', 11);
        $text = 'De acuerdo con la información obtenida el día '.$fecha.' al consultar la búsqueda de '.$nombre.' se encontró que dicho nombre o un semejante '.$resultado2.' se encuentra en el Listado de consulta.';
        $this->JustifyText($this->encodeText($text), 190, 7);

        // Información legal OFAC
        $this->Ln(4);
        $this->SetFont('Arial', '', 8);
        $text = 'Esta aplicación de búsqueda de listas de sanciones ("Búsqueda de listas de sanciones") está diseñada para facilitar el uso de la lista de personas especialmente designadas y personas bloqueadas ("Lista SDN") y todas las demás listas de sanciones administradas por la OFAC.';
        $this->JustifyText($this->encodeText($text), 190, 5);

        $this->Ln(2);
        $text = 'La lista actualizada a que se refiere el "Acuerdo del titular de la Unidad de Inteligencia Financiera (UIF)", por el que se da a conocer a la población en general la relación de personas y entidades que se encuentran dentro de las listas derivadas de las Resoluciones 1267 (1999) y sus sucesivas, 1373 (2001).';
        $this->JustifyText($this->encodeText($text), 190, 5);

        $this->Ln(2);
        $text = 'El uso de la Búsqueda de listas de sanciones no sustituye la debida diligencia. El uso de la Búsqueda de listas de sanciones no limita ninguna responsabilidad penal o civil por ningún acto realizado como resultado de dicho uso.';
        $this->JustifyText($this->encodeText($text), 190, 5);

        // Fuentes consultadas
        $this->Ln(3);
        $this->SetFont('Arial', 'B', 9);
        $this->MultiCell(0, 5, $this->encodeText('Fuentes Consultadas:'), 0, 'L');

        $this->SetFont('Arial', '', 8);
        $this->MultiCell(0, 4, $this->encodeText('OFAC: https://sanctionssearch.ofac.treas.gov'));
        $this->MultiCell(0, 4, $this->encodeText('UIF: www.gob.mx/shcp/documentos/uif-listas-actualizadas'));
    }

    private function encodeText($text)
    {
        return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text);
    }
}

/**
 * Clase para generar PDFs de SAT
 */
class PdfSat extends \tFPDF
{
    public function JustifyText($text, $w, $h)
    {
        $lines = explode("\n", $text);
        $lineCount = count($lines);
        $lineHeight = $h / $lineCount;

        foreach ($lines as $line) {
            $this->MultiCell($w, $lineHeight, $line, 0, 'J');
        }
    }

    public function generarPdf($nombre, $rfc = '', $resultados = '[]', $negativo = false)
    {
        $resultado = $negativo ? 'Negativo' : 'Afirmativo';
        $resultado2 = $negativo ? 'NO' : 'SI';

        // Generar fecha en español con Carbon
        Carbon::setLocale('es');
        $fecha = Carbon::now()->translatedFormat('d \d\e F \d\e Y');
        $hora = Carbon::now()->format('H:i');
        $this->AddPage();

        // Logo (si existe)
        $logoPath = public_path('images/logo.jpg');
        if (file_exists($logoPath)) {
            $this->Image($logoPath, 10, 8, 25);
        }

        // Fecha y hora
        $this->SetFont('Arial', '', 11);
        $this->SetXY(10, 12);
        $this->Cell(0, 6, $this->encodeText($fecha.' a las '.$hora.' horas'), 0, 1, 'R');
        $this->Ln(8);

        // Título
        $this->SetFont('Arial', 'B', 15);
        $this->MultiCell(0, 6, $this->encodeText('RESULTADO DE CONSULTA EN LISTADO DE CONTRIBUYENTES'), 0, 'C');
        $this->SetFont('Arial', 'B', 12);
        $this->MultiCell(0, 6, $this->encodeText('(Artículo 69-B del Código Fiscal de la Federación)'), 0, 'C');
        $this->Ln(4);

        // Contenido principal
        $this->SetFont('Arial', 'B', 11);
        $nombreHeight = ceil($this->GetStringWidth($nombre) / 110) * 8;
        $this->Cell(50, $nombreHeight, $this->encodeText('Nombre:'), 1, 0, 'L');
        $this->SetFont('Arial', '', 10);
        $this->MultiCell(0, 8, $this->encodeText($nombre), 1, 'L');

        $this->SetFont('Arial', 'B', 11);
        $this->Cell(50, 8, $this->encodeText('Presencia en Lista:'), 1, 0, 'L');
        $this->SetFont('Arial', '', 10);
        $this->Cell(0, 8, $this->encodeText($resultado), 1, 1, 'L');

        if ($rfc) {
            $this->SetFont('Arial', 'B', 11);
            $this->Cell(50, 8, $this->encodeText('RFC:'), 1, 0, 'L');
            $this->SetFont('Arial', '', 10);
            $this->Cell(0, 8, $this->encodeText($rfc), 1, 1, 'L');
        }

        // Detalles si hay coincidencias
        if (! $negativo && $resultados !== '[]') {
            $this->Ln(3);
            $this->SetFont('Arial', 'B', 10);
            $this->MultiCell(0, 5, $this->encodeText('Detalles de Coincidencias:'), 0, 'L');

            try {
                $items = json_decode($resultados, true) ?: [];
                $this->SetFont('Arial', '', 9);
                foreach ($items as $item) {
                    $this->Ln(2);
                    if (isset($item['nombre_limpio'])) {
                        $this->MultiCell(0, 4, $this->encodeText('• '.$item['nombre_limpio']), 0, 'L');
                    }
                    if (isset($item['rfc'])) {
                        $this->MultiCell(0, 4, $this->encodeText('  RFC: '.$item['rfc']), 0, 'L');
                    }
                    if (isset($item['similarity'])) {
                        $this->MultiCell(0, 4, $this->encodeText('  Similitud: '.$item['similarity'].'%'), 0, 'L');
                    }
                    if (isset($item['situacion'])) {
                        $this->MultiCell(0, 4, $this->encodeText('  Situación: '.$item['situacion']), 0, 'L');
                    }
                }
            } catch (\Exception $e) {
                // Si falla la decodificación, continuar sin detalles
            }
        }

        $this->Ln(5);
        $this->SetFont('Arial', 'B', 11);
        $rfcText = $rfc ? 'el RFC '.$rfc.' '.$resultado2.' se encuentra en el Listado de Contribuyentes y que ' : '';
        $text = 'De acuerdo con la información obtenida el día '.$fecha.' al consultar la búsqueda de '.$nombre.' se encontró que '.$rfcText.'dicho nombre o un semejante '.$resultado2.' se encuentra en el Listado de Contribuyentes (Artículo 69-B del Código Fiscal de la Federación).';
        $this->JustifyText($this->encodeText($text), 190, 7);

        // Información legal SAT
        $this->Ln(4);
        $this->SetFont('Arial', '', 8);
        $text = 'De conformidad con el artículo 69-B del Código Fiscal de la Federación, el Servicio de Administración Tributaria publica en su página de Internet y en el Diario Oficial de la Federación, listados de contribuyentes que no desvirtuaron la presunción de operaciones simuladas.';
        $this->JustifyText($this->encodeText($text), 190, 5);

        $this->Ln(2);
        $text = 'Los contribuyentes que realicen operaciones con los contribuyentes incluidos en el listado a que se refiere el presente artículo, no podrán acreditar el Impuesto al Valor Agregado que les hayan trasladado, ni deducir el gasto o costo relacionado con dichas operaciones, para efectos del Impuesto sobre la Renta.';
        $this->JustifyText($this->encodeText($text), 190, 5);

        // Fuentes consultadas
        $this->Ln(3);
        $this->SetFont('Arial', 'B', 9);
        $this->MultiCell(0, 5, $this->encodeText('Fuentes Consultadas:'), 0, 'L');

        $this->SetFont('Arial', '', 8);
        $this->MultiCell(0, 4, $this->encodeText('SAT: https://www.sat.gob.mx/consultas/42103'));
        $this->MultiCell(0, 4, $this->encodeText('https://www.sat.gob.mx/aplicacion/operacion/31274'));
    }

    private function encodeText($text)
    {
        return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text);
    }
}
