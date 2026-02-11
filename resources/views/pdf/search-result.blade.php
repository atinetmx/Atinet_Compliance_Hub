<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consulta en Listas Negras</title>
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

        .logo {
            float: left;
            margin-right: 15px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="date-time">
        {{ $fecha }} a las {{ $hora }} horas
    </div>

    <div class="header">
        <h1>Resultado de Consulta en Listas Negras</h1>
        @if($tipo_lista == 'OFAC')
            <div class="subtitle">Lista OFAC (Office of Foreign Assets Control - Estados Unidos)</div>
        @elseif($tipo_lista == 'SAT')
            <div class="subtitle">Lista SAT (Artículo 69-B del Código Fiscal de la Federación)</div>
        @endif
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
                <th>Presencia en Lista:</th>
                <td>{{ $encontrado ? 'AFIRMATIVO' : 'NEGATIVO' }}</td>
            </tr>
        </table>
    </div>

    @if($encontrado)
        <div class="result-positive">
            ⚠️ SE ENCONTRARON COINCIDENCIAS EN LA LISTA {{ $tipo_lista }}
        </div>

        <div class="results-section">
            <h3>Resultados encontrados:</h3>
            @foreach($resultados as $resultado)
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
                        @if(isset($resultado['publicacion_ofac']))
                            <p><strong>Publicación OFAC:</strong> {{ $resultado['publicacion_ofac'] }}</p>
                        @endif
                    </div>
                </div>
            @endforeach
        </div>

        <p style="font-weight: bold; text-align: justify; margin: 20px 0;">
            De acuerdo con la información obtenida el día {{ $fecha }} al consultar la búsqueda de "{{ $nombre }}"
            se encontró que dicho nombre o uno semejante <strong>SÍ</strong> se encuentra en el listado de consulta {{ $tipo_lista }}.
        </p>
    @else
        <div class="result-negative">
            ✅ NO SE ENCONTRARON COINCIDENCIAS EN LA LISTA {{ $tipo_lista }}
        </div>

        <p style="font-weight: bold; text-align: justify; margin: 20px 0;">
            De acuerdo con la información obtenida el día {{ $fecha }} al consultar la búsqueda de "{{ $nombre }}"
            se encontró que dicho nombre <strong>NO</strong> se encuentra en el listado de consulta {{ $tipo_lista }}.
        </p>
    @endif

    <div class="legal-info">
        @if($tipo_lista == 'OFAC')
            <h3>Información Legal - OFAC</h3>
            <p>Esta aplicación de búsqueda de listas de sanciones está diseñada para facilitar el uso de la lista de personas especialmente designadas y personas bloqueadas ("Lista SDN") y todas las demás listas de sanciones administradas por la OFAC.</p>

            <p>La herramienta utiliza una coincidencia aproximada de cadenas para identificar posibles coincidencias entre cadenas de caracteres o palabras tal como se ingresaron en la búsqueda y cualquier nombre o componente de nombre tal como aparece en las listas de sanciones.</p>

            <p><strong>El uso de esta búsqueda no sustituye la debida diligencia. El uso no limita ninguna responsabilidad penal o civil por ningún acto realizado como resultado de dicho uso.</strong></p>
        @elseif($tipo_lista == 'SAT')
            <h3>Información Legal - SAT</h3>
            <p>De conformidad con el artículo 69-B del Código Fiscal de la Federación, el Servicio de Administración Tributaria publica en su página de Internet y en el Diario Oficial de la Federación, listados de contribuyentes que no desvirtuaron la presunción de operaciones simuladas.</p>

            <p>Los contribuyentes que realicen operaciones con los contribuyentes incluidos en este listado, no podrán acreditar el Impuesto al Valor Agregado que les hayan trasladado, ni deducir el gasto o costo relacionado con dichas operaciones, para efectos del Impuesto sobre la Renta.</p>
        @endif

        <div class="sources">
            <h4>Fuentes Consultadas:</h4>
            @if($tipo_lista == 'OFAC')
                <p>
                    OFAC - https://sanctionssearch.ofac.treas.gov<br>
                    UIF - www.gob.mx/shcp/documentos/uif-listas-actualizadas
                </p>
            @elseif($tipo_lista == 'SAT')
                <p>
                    SAT - https://www.sat.gob.mx/consultas/42103/listado-de-contribuyentes-que-no-desvirtuaron-la-presuncion-de-operaciones-simuladas<br>
                    SAT - https://www.sat.gob.mx/aplicacion/operacion/31274/consulta-tu-informacion-fiscal
                </p>
            @endif
        </div>
    </div>
</body>
</html>
