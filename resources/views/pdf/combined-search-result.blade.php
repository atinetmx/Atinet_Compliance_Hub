<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consulta Combinada en Listas Negras</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            margin: 15px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
        }

        .header h1 {
            margin: 5px 0;
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .header .subtitle {
            font-size: 14px;
            font-weight: bold;
            margin: 5px 0;
        }

        .date-time {
            text-align: right;
            margin-bottom: 20px;
            font-size: 10px;
        }

        .search-info {
            margin-bottom: 20px;
        }

        .search-info table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        .search-info th, .search-info td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
        }

        .search-info th {
            background-color: #f0f0f0;
            font-weight: bold;
            width: 30%;
        }

        .result-positive {
            background-color: #fee2e2;
            color: #991b1b;
            padding: 10px;
            border: 2px solid #dc2626;
            border-radius: 5px;
            margin: 15px 0;
            text-align: center;
            font-weight: bold;
        }

        .result-negative {
            background-color: #dcfce7;
            color: #166534;
            padding: 10px;
            border: 2px solid #16a34a;
            border-radius: 5px;
            margin: 15px 0;
            text-align: center;
            font-weight: bold;
        }

        .results-section {
            margin: 20px 0;
            page-break-inside: avoid;
        }

        .results-section h3 {
            background-color: #f8f9fa;
            padding: 8px;
            margin: 15px 0 10px 0;
            border-left: 4px solid #007bff;
            font-size: 12px;
        }

        .ofac-section h3 {
            border-left-color: #dc3545;
        }

        .sat-section h3 {
            border-left-color: #6f42c1;
        }

        .result-item {
            border: 1px solid #ddd;
            margin: 10px 0;
            padding: 10px;
            background-color: #f9f9f9;
        }

        .result-item h4 {
            margin: 0 0 10px 0;
            color: #333;
        }

        .result-details {
            font-size: 10px;
            color: #666;
        }

        .legal-info {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 9px;
            text-align: justify;
            line-height: 1.5;
            page-break-inside: avoid;
        }

        .legal-info h3 {
            font-size: 11px;
            margin-bottom: 10px;
        }

        .sources {
            margin-top: 20px;
            font-size: 9px;
        }

        .sources h4 {
            font-size: 10px;
            margin-bottom: 5px;
        }

        .no-results {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="date-time">
        {{ $fecha }} a las {{ $hora }} horas
    </div>

    <div class="header">
        <h1>Consulta Combinada en Listas Negras</h1>
        <div class="subtitle">OFAC (Estados Unidos) + SAT (Artículo 69-B México)</div>
    </div>

    <div class="search-info">
        <table>
            <tr>
                <th>Nombre/Razón Social:</th>
                <td>{{ $nombre }}</td>
            </tr>
            @if($rfc)
            <tr>
                <th>RFC:</th>
                <td>{{ $rfc }}</td>
            </tr>
            @endif
            <tr>
                <th>OFAC - Presencia en Lista:</th>
                <td>{{ !empty($resultados_ofac) ? 'AFIRMATIVO' : 'NEGATIVO' }}</td>
            </tr>
            <tr>
                <th>SAT - Presencia en Lista:</th>
                <td>{{ !empty($resultados_sat) ? 'AFIRMATIVO' : 'NEGATIVO' }}</td>
            </tr>
        </table>
    </div>

    @if($encontrado)
        <div class="result-positive">
            ⚠️ SE ENCONTRARON COINCIDENCIAS EN UNA O MÁS LISTAS
        </div>
    @else
        <div class="result-negative">
            ✅ NO SE ENCONTRARON COINCIDENCIAS EN NINGUNA LISTA
        </div>
    @endif

    <!-- Resultados OFAC -->
    <div class="results-section ofac-section">
        <h3>🇺🇸 Resultados Lista OFAC (Estados Unidos)</h3>
        @if(!empty($resultados_ofac))
            @foreach($resultados_ofac as $resultado)
                <div class="result-item">
                    <h4>{{ $resultado['nombre_limpio'] ?? $resultado['name'] }}</h4>
                    <div class="result-details">
                        @if(isset($resultado['type']))
                            <p><strong>Tipo:</strong> {{ $resultado['type'] }}</p>
                        @endif
                        @if(isset($resultado['similarity']) || isset($resultado['coincidencia']))
                            <p><strong>Porcentaje de coincidencia:</strong> {{ $resultado['similarity'] ?? $resultado['coincidencia'] }}%</p>
                        @endif
                        @if(isset($resultado['publicacion_ofac']))
                            <p><strong>Publicación OFAC:</strong> {{ $resultado['publicacion_ofac'] }}</p>
                        @endif
                    </div>
                </div>
            @endforeach
        @else
            <div class="no-results">
                No se encontraron coincidencias en la lista OFAC
            </div>
        @endif
    </div>

    <!-- Resultados SAT -->
    <div class="results-section sat-section">
        <h3>🇲🇽 Resultados Lista SAT (México - Artículo 69-B)</h3>
        @if(!empty($resultados_sat))
            @foreach($resultados_sat as $resultado)
                <div class="result-item">
                    <h4>{{ $resultado['nombre_limpio'] ?? $resultado['name'] }}</h4>
                    <div class="result-details">
                        @if(isset($resultado['rfc']))
                            <p><strong>RFC:</strong> {{ $resultado['rfc'] }}</p>
                        @endif
                        @if(isset($resultado['tipo_coincidencia']))
                            <p><strong>Tipo de coincidencia:</strong> {{ $resultado['tipo_coincidencia'] }}</p>
                        @endif
                        @if(isset($resultado['similarity']) || isset($resultado['coincidencia']))
                            <p><strong>Porcentaje de coincidencia:</strong> {{ $resultado['similarity'] ?? $resultado['coincidencia'] }}%</p>
                        @endif
                        @if(isset($resultado['situacion']))
                            <p><strong>Situación:</strong> {{ $resultado['situacion'] }}</p>
                        @endif
                        @if(isset($resultado['publicacion_sat']))
                            <p><strong>Publicación SAT:</strong> {{ $resultado['publicacion_sat'] }}</p>
                        @endif
                    </div>
                </div>
            @endforeach
        @else
            <div class="no-results">
                No se encontraron coincidencias en la lista SAT
            </div>
        @endif
    </div>

    <p style="font-weight: bold; text-align: justify; margin: 20px 0;">
        De acuerdo con la información obtenida el día {{ $fecha }} al consultar la búsqueda combinada de "{{ $nombre }}"
        @if($rfc) con RFC "{{ $rfc }}" @endif se encontró que:
    </p>

    <ul style="font-weight: bold;">
        <li>En la lista OFAC (Estados Unidos): {{ !empty($resultados_ofac) ? 'SÍ se encontraron coincidencias' : 'NO se encontraron coincidencias' }}</li>
        <li>En la lista SAT (México Artículo 69-B): {{ !empty($resultados_sat) ? 'SÍ se encontraron coincidencias' : 'NO se encontraron coincidencias' }}</li>
    </ul>

    <div class="legal-info">
        <h3>Información Legal</h3>

        <h4>OFAC (Estados Unidos):</h4>
        <p>Esta aplicación de búsqueda de listas de sanciones está diseñada para facilitar el uso de la lista de personas especialmente designadas y personas bloqueadas ("Lista SDN") y todas las demás listas de sanciones administradas por la OFAC.</p>

        <h4>SAT (México - Artículo 69-B):</h4>
        <p>De conformidad con el artículo 69-B del Código Fiscal de la Federación, el Servicio de Administración Tributaria publica listados de contribuyentes que no desvirtuaron la presunción de operaciones simuladas. Los contribuyentes que realicen operaciones con los contribuyentes incluidos en este listado, no podrán acreditar el IVA trasladado ni deducir gastos o costos relacionados.</p>

        <p><strong>IMPORTANTE: El uso de estas búsquedas no sustituye la debida diligencia. Se recomienda verificación adicional y consulta con expertos legales cuando sea necesario.</strong></p>

        <div class="sources">
            <h4>Fuentes Consultadas:</h4>
            <p>
                <strong>OFAC:</strong> https://sanctionssearch.ofac.treas.gov<br>
                <strong>UIF:</strong> www.gob.mx/shcp/documentos/uif-listas-actualizadas<br>
                <strong>SAT:</strong> https://www.sat.gob.mx/consultas/42103/listado-de-contribuyentes-que-no-desvirtuaron-la-presuncion-de-operaciones-simuladas<br>
                <strong>SAT:</strong> https://www.sat.gob.mx/aplicacion/operacion/31274/consulta-tu-informacion-fiscal
            </p>
        </div>
    </div>
</body>
</html>
