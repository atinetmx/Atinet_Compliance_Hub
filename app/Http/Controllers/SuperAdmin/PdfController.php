<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;

// La clase tFPDF base (UTF-8 compatible)
require_once base_path('vendor/setasign/tfpdf/tfpdf.php');

class PdfController extends Controller
{
    /**
     * Generar PDF para resultado de búsqueda OFAC individual
     */
    public function generateOfacPdf(Request $request)
    {
        $nombre = $request->input('nombre', '');
        $resultados = json_decode($request->input('resultados', '[]'), true);

        // Determinar si hay coincidencias
        $encontrado = ! empty($resultados);

        $pdf = new PdfOfac;
        $pdf->generarPdf($nombre, $encontrado);

        return response($pdf->Output('S'), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="consulta_ofac_'.date('Ymd_His').'.pdf"');
    }

    /**
     * Generar PDF para resultado de búsqueda SAT individual
     */
    public function generateSatPdf(Request $request)
    {
        $nombre = $request->input('nombre', '');
        $rfc = $request->input('rfc', '');
        $resultados = json_decode($request->input('resultados', '[]'), true);

        // Determinar si hay coincidencias
        $encontrado = ! empty($resultados);

        $pdf = new PdfSat;
        $pdf->generarPdf($nombre, $rfc, $encontrado, $encontrado);

        return response($pdf->Output('S'), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="consulta_sat_'.date('Ymd_His').'.pdf"');
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

    public function generarPdf($nombre, $encontrado)
    {
        $resultado = $encontrado ? 'Afirmativo' : 'Negativo';
        $resultado2 = $encontrado ? 'SI' : 'NO';

        // Generar fecha en español con Carbon
        Carbon::setLocale('es');
        $fecha = Carbon::now()->translatedFormat('d \d\e F \d\e Y');
        $hora = Carbon::now()->format('H:i');
        $this->AddPage();

        // Logo (si existe)
        $logoPath = public_path('images/logo-notaria.jpg');
        if (file_exists($logoPath)) {
            $this->Image($logoPath, 5, 5, 30, 0, 'JPG');
        }

        // Fecha y hora
        $this->SetFont('Arial', '', 12);
        $this->Ln(5);
        $this->Cell(0, 8, $this->encodeText($fecha.' a las ').$hora.' horas', 0, 1, 'R');
        $this->Ln(10);

        // Título
        $this->SetFont('Arial', 'B', 18);
        $this->Cell(0, 10, $this->encodeText('RESULTADO DE CONSULTA EN LAS LISTAS NEGRAS'), 0, 1, 'C');
        $this->Ln(5);

        // Contenido principal
        $this->SetFont('Arial', 'B', 12);
        $x = $this->GetX();
        $y = $this->GetY();
        $nombreHeight = ceil($this->GetStringWidth($nombre) / 120) * 10;
        $this->SetXY($x, $y);

        $this->Cell(70, $nombreHeight, $this->encodeText('Nombre:'), 1, 0, 'L');
        $this->SetFont('Arial', '', 10);
        $this->MultiCell(0, 10, $this->encodeText($nombre), 1, 'R');

        $this->SetFont('Arial', 'B', 12);
        $this->Cell(70, 10, $this->encodeText('Presencia en Lista Negra:'), 1, 0, 'L');
        $this->SetFont('Arial', '', 10);
        $this->Cell(0, 10, $this->encodeText($resultado), 1, 1, 'R');

        $this->Ln(5);
        $this->SetFont('Arial', 'B', 14);
        $text = 'De acuerdo con la información obtenida el día '.$fecha.' al consultar la búsqueda de '.$nombre.' se encontró que dicho nombre o un semejante '.$resultado2.' se encuentra en el Listado de consulta.';
        $this->JustifyText($this->encodeText($text), 190, 8);

        // Información legal OFAC
        $this->Ln(5);
        $this->SetFont('Arial', '', 9);
        $text = 'Esta aplicación de búsqueda de listas de sanciones ("Búsqueda de listas de sanciones") está diseñada para facilitar el uso de la lista de personas especialmente designadas y personas bloqueadas ("Lista SDN") y todas las demás listas de sanciones administradas por la OFAC, incluida la Lista de evasores de sanciones extranjeras, la Lista de personas identificadas como bloqueadas únicamente de conformidad con EO 13599, la Lista de la Ley de sanciones contra Irán de la SDN, la lista de la Parte 561, la Lista de identificación de sanciones sectoriales y la Lista del Consejo Legislativo Palestino no SDN.';
        $this->JustifyText($this->encodeText($text), 190, 6);

        $this->Ln(3);
        $text = 'La lista actualizada a que se refiere el "Acuerdo del titular de la Unidad de Inteligencia Financiera (UIF)", por el que se da a conocer a la población en general la relación de personas y entidades que se encuentran dentro de las listas derivadas de las Resoluciones 1267 (1999) y sus sucesivas, 1373 (2001) y las demás que sean emitidas por el Consejo de Seguridad de las Naciones Unidas con base en la Carta de las Naciones Unidas, podrá consultarse en los siguientes anexos de esta página.';
        $this->JustifyText($this->encodeText($text), 190, 6);

        $this->Ln(3);
        $this->MultiCell(0, 6, $this->encodeText('* ANEXO "A" Resoluciones 1267 (1999); 1989 (2011) Y 2253 (2015) relativas a EIIL (Daesh) y Al-Qaida'), 0, 1);
        $this->MultiCell(0, 6, $this->encodeText('* ANEXO "B" Resolución 1988 (2011) relativa al Talibán'), 0, 1);
        $this->MultiCell(0, 6, $this->encodeText('* ANEXO "C" Resolución 1718 (2006) relativa a Corea del Norte'), 0, 1);
        $this->MultiCell(0, 6, $this->encodeText('* ANEXO "D" Resoluciones 1737 (2006) - 2231 (2015)'), 0, 1);

        $this->Ln(3);
        $text = 'Dado el número de listas que ahora residen en la herramienta de búsqueda de listas de sanciones, se recomienda enfáticamente que los usuarios presten mucha atención a los códigos de programa asociados con cada registro devuelto. La herramienta de búsqueda de listas de sanciones utiliza una coincidencia aproximada de cadenas para identificar posibles coincidencias entre cadenas de caracteres o palabras tal como se ingresaron en la búsqueda de listas de sanciones y cualquier nombre o componente de nombre tal como aparece en la lista SDN y / o en las otras listas de sanciones.';
        $this->JustifyText($this->encodeText($text), 190, 6);

        $this->Ln(3);
        $text = 'El uso de la Búsqueda de listas de sanciones no sustituye la debida diligencia. El uso de la Búsqueda de listas de sanciones no limita ninguna responsabilidad penal o civil por ningún acto realizado como resultado de dicho uso o en dependencia de dicho uso.';
        $this->JustifyText($this->encodeText($text), 190, 6);

        // Fuentes consultadas
        $this->Ln(5);
        $this->SetFont('Arial', 'B', 10);
        $this->MultiCell(0, 5, $this->encodeText('Fuentes Consultadas'), 0, 1);

        $this->SetFont('Arial', '', 8);
        $this->MultiCell(0, 8, $this->encodeText("OFAC\nhttps://sanctionssearch.ofac.treas.gov\nUIF\nwww.gob.mx/shcp/documentos/uif-listas-actualizadas"));
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

    public function generarPdf($nombre, $rfc, $encontradoNombre, $encontradoRfc)
    {
        $resultadoNombre = $encontradoNombre ? 'Afirmativo' : 'Negativo';
        $resultadoNombre2 = $encontradoNombre ? 'SI' : 'NO';
        $resultadoRfc = $encontradoRfc ? 'Afirmativo' : 'Negativo';
        $resultadoRfc2 = $encontradoRfc ? 'SI' : 'NO';

        // Generar fecha en español con Carbon
        Carbon::setLocale('es');
        $fecha = Carbon::now()->translatedFormat('d \d\e F \d\e Y');
        $hora = Carbon::now()->format('H:i');
        $this->AddPage();

        // Logo (si existe)
        $logoPath = public_path('images/logo-notaria.jpg');
        if (file_exists($logoPath)) {
            $this->Image($logoPath, 5, 5, 30, 0, 'JPG');
        }

        // Fecha y hora
        $this->SetFont('Arial', '', 12);
        $this->Ln(5);
        $this->Cell(0, 8, $this->encodeText($fecha.' a las ').$hora.' horas', 0, 1, 'R');
        $this->Ln(10);

        // Título
        $this->SetFont('Arial', 'B', 16);
        $this->Cell(0, 10, $this->encodeText('RESULTADO DE CONSULTA EN LISTADO DE CONTRIBUYENTES'), 0, 1, 'C');
        $this->SetFont('Arial', 'B', 18);
        $this->Cell(0, 10, $this->encodeText('(Artículo 69-B del Código Fiscal de la Federación)'), 0, 1, 'C');
        $this->Ln(5);

        // Contenido principal
        $this->SetFont('Arial', 'B', 12);
        $x = $this->GetX();
        $y = $this->GetY();
        $nombreHeight = ceil($this->GetStringWidth($nombre) / 110) * 10;
        $this->SetXY($x, $y);

        $this->Cell(80, $nombreHeight, $this->encodeText('Nombre:'), 1, 0, 'L');
        $this->SetFont('Arial', '', 10);
        $this->MultiCell(0, 10, $this->encodeText($nombre), 1, 'R');

        $this->SetFont('Arial', 'B', 12);
        $this->Cell(80, 10, $this->encodeText('Presencia en Lista de Contribuyentes:'), 1, 0, 'L');
        $this->SetFont('Arial', '', 10);
        $this->Cell(0, 10, $this->encodeText($resultadoNombre), 1, 1, 'R');

        $this->SetFont('Arial', 'B', 12);
        $this->Cell(80, 10, $this->encodeText('RFC:'), 1, 0, 'L');
        $this->SetFont('Arial', '', 10);
        $this->Cell(0, 10, $this->encodeText($rfc), 1, 1, 'R');

        $this->SetFont('Arial', 'B', 12);
        $this->Cell(80, 10, $this->encodeText('Presencia del Lista de Contribuyentes:'), 1, 0, 'L');
        $this->SetFont('Arial', '', 10);
        $this->Cell(0, 10, $this->encodeText($resultadoRfc), 1, 1, 'R');

        $this->Ln(5);
        $this->SetFont('Arial', 'B', 14);
        $text = 'De acuerdo con la información obtenida el día '.$fecha.' al consultar la búsqueda de '.$nombre.' se encontró que el RFC '.$rfc.' '.$resultadoRfc2.' se encuentra en el Listado de Contribuyentes y que dicho nombre o un semejante '.$resultadoNombre2.' se encuentra en el Listado de Contribuyentes (Artículo 69-B del Código Fiscal de la Federación).';
        $this->JustifyText($this->encodeText($text), 190, 8);

        // Información legal SAT
        $this->Ln(5);
        $this->SetFont('Arial', '', 9);
        $text = 'De conformidad con el artículo 69-B del Código Fiscal de la Federación, el Servicio de Administración Tributaria publica en su página de Internet y en el Diario Oficial de la Federación, listados de contribuyentes que no desvirtuaron la presunción de operaciones simuladas.';
        $this->JustifyText($this->encodeText($text), 190, 6);

        $this->Ln(3);
        $text = 'Los contribuyentes que realicen operaciones con los contribuyentes incluidos en el listado a que se refiere el presente artículo, no podrán acreditar el Impuesto al Valor Agregado que les hayan trasladado, ni deducir el gasto o costo relacionado con dichas operaciones, para efectos del Impuesto sobre la Renta.';
        $this->JustifyText($this->encodeText($text), 190, 6);

        // Fuentes consultadas
        $this->Ln(5);
        $this->SetFont('Arial', 'B', 10);
        $this->MultiCell(0, 5, $this->encodeText('Fuentes Consultadas'), 0, 1);

        $this->SetFont('Arial', '', 8);
        $this->MultiCell(0, 8, $this->encodeText("SAT\nhttps://www.sat.gob.mx/consultas/42103/listado-de-contribuyentes-que-no-desvirtuaron-la-presuncion-de-operaciones-simuladas\nhttps://www.sat.gob.mx/aplicacion/operacion/31274/consulta-tu-informacion-fiscal"));
    }

    private function encodeText($text)
    {
        return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text);
    }
}
