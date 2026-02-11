<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class PdfController extends Controller
{
    /**
     * Generar PDF para resultado de búsqueda en OFAC
     */
    public function generateOfacPdf(Request $request)
    {
        $nombre = $request->input('nombre', '');
        $rfc = $request->input('rfc', '');
        $resultados = $request->input('resultados', []);
        $encontrado = !empty($resultados);

        $data = [
            'nombre' => $nombre,
            'rfc' => $rfc,
            'resultados' => $resultados,
            'encontrado' => $encontrado,
            'fecha' => Carbon::now()->translatedFormat('d \d\e F \d\e Y'),
            'hora' => Carbon::now()->format('H:i'),
            'tipo_lista' => 'OFAC'
        ];

        $pdf = Pdf::loadView('pdf.search-result', $data);
        $filename = 'consulta_ofac_' . date('Ymd_His') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Generar PDF negativo para OFAC (sin resultados)
     */
    public function generateOfacNegativePdf(Request $request)
    {
        $nombre = $request->input('nombre', '');
        $rfc = $request->input('rfc', '');

        $data = [
            'nombre' => $nombre,
            'rfc' => $rfc,
            'resultados' => [],
            'encontrado' => false,
            'fecha' => Carbon::now()->translatedFormat('d \d\e F \d\e Y'),
            'hora' => Carbon::now()->format('H:i'),
            'tipo_lista' => 'OFAC'
        ];

        $pdf = Pdf::loadView('pdf.search-result', $data);
        $filename = 'consulta_ofac_negativa_' . date('Ymd_His') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Generar PDF para resultado de búsqueda en SAT
     */
    public function generateSatPdf(Request $request)
    {
        $nombre = $request->input('nombre', '');
        $rfc = $request->input('rfc', '');
        $resultados = $request->input('resultados', []);
        $encontrado = !empty($resultados);

        $data = [
            'nombre' => $nombre,
            'rfc' => $rfc,
            'resultados' => $resultados,
            'encontrado' => $encontrado,
            'fecha' => Carbon::now()->translatedFormat('d \d\e F \d\e Y'),
            'hora' => Carbon::now()->format('H:i'),
            'tipo_lista' => 'SAT'
        ];

        $pdf = Pdf::loadView('pdf.search-result', $data);
        $filename = 'consulta_sat_' . date('Ymd_His') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Generar PDF negativo para SAT (sin resultados)
     */
    public function generateSatNegativePdf(Request $request)
    {
        $nombre = $request->input('nombre', '');
        $rfc = $request->input('rfc', '');

        $data = [
            'nombre' => $nombre,
            'rfc' => $rfc,
            'resultados' => [],
            'encontrado' => false,
            'fecha' => Carbon::now()->translatedFormat('d \d\e F \d\e Y'),
            'hora' => Carbon::now()->format('H:i'),
            'tipo_lista' => 'SAT'
        ];

        $pdf = Pdf::loadView('pdf.search-result', $data);
        $filename = 'consulta_sat_negativa_' . date('Ymd_His') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Generar PDF combinado para resultado con OFAC y SAT
     */
    public function generateCombinedPdf(Request $request)
    {
        $nombre = $request->input('nombre', '');
        $rfc = $request->input('rfc', '');
        $resultados_ofac = $request->input('resultados_ofac', []);
        $resultados_sat = $request->input('resultados_sat', []);
        $encontrado = !empty($resultados_ofac) || !empty($resultados_sat);

        $data = [
            'nombre' => $nombre,
            'rfc' => $rfc,
            'resultados_ofac' => $resultados_ofac,
            'resultados_sat' => $resultados_sat,
            'encontrado' => $encontrado,
            'fecha' => Carbon::now()->translatedFormat('d \d\e F \d\e Y'),
            'hora' => Carbon::now()->format('H:i'),
            'tipo_lista' => 'COMBINADO'
        ];

        $pdf = Pdf::loadView('pdf.combined-search-result', $data);
        $filename = 'consulta_combinada_' . date('Ymd_His') . '.pdf';

        return $pdf->download($filename);
    }
}
