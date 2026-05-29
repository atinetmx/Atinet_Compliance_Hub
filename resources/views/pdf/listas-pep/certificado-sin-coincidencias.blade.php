<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Certificado PEP - Sin Coincidencias</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.5;
            color: #1a1a2e;
            background: #ffffff;
        }

        /* ─── ENCABEZADO ─── */
        .header-bar {
            background: #0f3460;
            color: #ffffff;
            padding: 18px 24px 14px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-logo-cell {
            width: 40px;
            vertical-align: middle;
        }
        .header-logo {
            font-size: 22px;
            font-weight: 900;
            color: #e94560;
            letter-spacing: -1px;
        }
        .header-text-cell {
            vertical-align: middle;
            padding-left: 10px;
        }
        .header-title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #ffffff;
        }
        .header-subtitle {
            font-size: 9px;
            color: rgba(255,255,255,0.7);
            margin-top: 2px;
        }
        .header-meta-cell {
            text-align: right;
            vertical-align: middle;
            font-size: 9px;
            color: rgba(255,255,255,0.7);
        }
        .header-meta-cell strong {
            color: #ffffff;
        }

        /* ─── BAND ROJA DECLARACIÓN ─── */
        .declaration-bar {
            background: #e94560;
            color: #ffffff;
            text-align: center;
            padding: 8px 24px;
            font-size: 10px;
            font-weight: 700;
        }

        /* ─── CUERPO ─── */
        .body-wrapper {
            padding: 16px 24px;
        }

        /* ─── SECCIÓN DATOS BÚSQUEDA ─── */
        .section-header {
            background: #0f3460;
            color: #ffffff;
            padding: 6px 12px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 0;
        }
        .section-body {
            border: 1px solid #dde3ed;
            border-top: none;
            padding: 10px 12px;
            margin-bottom: 14px;
            background: #f4f6fb;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
        }
        .data-table td {
            padding: 4px 8px;
            vertical-align: top;
        }
        .data-table .label {
            font-weight: 700;
            color: #475569;
            font-size: 9px;
            text-transform: uppercase;
            width: 160px;
        }
        .data-table .value {
            color: #1a1a2e;
            font-size: 10px;
        }

        /* ─── TABLA RESULTADOS ─── */
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            font-size: 9px;
        }
        .results-table thead tr {
            background: #16213e;
            color: #ffffff;
        }
        .results-table thead th {
            padding: 6px 8px;
            text-align: left;
            font-weight: 700;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .results-table tbody tr:nth-child(even) {
            background: #f1f5f9;
        }
        .results-table tbody td {
            padding: 5px 8px;
            border-bottom: 1px solid #e8edf5;
            color: #334155;
            vertical-align: middle;
        }

        /* Badges tipo */
        .badge-pep      { color: #991b1b; font-weight: 700; }
        .badge-ex-pep   { color: #92400e; font-weight: 700; }
        .badge-afin-pep { color: #854d0e; font-weight: 700; }
        .badge-afin-ex  { color: #1e40af; font-weight: 700; }
        .badge-otros    { color: #374151; font-weight: 700; }

        /* Badges fuente */
        .fuente-mex  { color: #166534; font-weight: 700; }
        .fuente-arg  { color: #1e40af; font-weight: 700; }
        .fuente-usa  { color: #3730a3; font-weight: 700; }
        .fuente-otro { color: #374151; font-weight: 700; }

        /* Exactitud */
        .exactitud-alta  { color: #166534; font-weight: 700; }
        .exactitud-media { color: #92400e; font-weight: 700; }
        .exactitud-baja  { color: #374151; }

        /* ─── RESUMEN BAR ─── */
        .summary-bar {
            background: #16213e;
            color: #ffffff;
            padding: 8px 12px;
            margin-bottom: 8px;
        }
        .summary-bar table {
            width: 100%;
            border-collapse: collapse;
        }
        .summary-bar td {
            padding: 2px 8px;
            font-size: 10px;
        }
        .summary-bar .num {
            font-size: 16px;
            font-weight: 900;
            color: #e94560;
        }
        .summary-bar .lbl {
            font-size: 8px;
            color: rgba(255,255,255,0.6);
            text-transform: uppercase;
        }

        /* ─── UUID / CERTIFICADO ─── */
        .cert-footer-bar {
            background: #f1f5f9;
            border: 1px solid #dde3ed;
            padding: 8px 12px;
            margin-top: 14px;
            margin-bottom: 10px;
        }
        .cert-footer-bar table {
            width: 100%;
            border-collapse: collapse;
        }
        .cert-footer-bar td {
            vertical-align: middle;
            font-size: 9px;
            color: #475569;
        }
        .cert-uuid {
            font-family: "Courier New", monospace;
            font-size: 9px;
            font-weight: 700;
            color: #0f3460;
            letter-spacing: 0.5px;
        }
        .cert-badge {
            background: #0f3460;
            color: #ffffff;
            padding: 3px 8px;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
        }

        /* ─── DISCLAIMER ─── */
        .disclaimer {
            border-top: 1px solid #dde3ed;
            padding-top: 10px;
            margin-top: 10px;
            font-size: 7.5px;
            color: #6b7280;
            line-height: 1.6;
            text-align: justify;
        }
        .disclaimer strong {
            color: #475569;
        }
        .disclaimer .sources-title {
            font-size: 8px;
            font-weight: 700;
            color: #374151;
            margin-bottom: 4px;
            margin-top: 0;
        }
        .footnotes {
            margin-top: 6px;
            padding-top: 5px;
            border-top: 1px dashed #d1d5db;
        }
        .footnote-item {
            font-size: 6.5px;
            color: #6b7280;
            margin-bottom: 2px;
            line-height: 1.5;
            text-align: justify;
        }
        .microbas-note {
            margin-top: 6px;
            padding-top: 5px;
            border-top: 1px dashed #d1d5db;
            font-size: 7px;
            color: #6b7280;
            line-height: 1.6;
            text-align: justify;
        }
        .atinet-note {
            margin-top: 5px;
            padding: 5px 8px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            font-size: 7px;
            color: #374151;
            line-height: 1.5;
        }

        /* ─── PAGE FOOTER ─── */
        .page-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #0f3460;
            color: rgba(255,255,255,0.6);
            font-size: 7.5px;
            padding: 5px 24px;
            text-align: center;
        }
        .page-footer strong {
            color: #ffffff;
        }
    </style>
</head>
<body>

{{-- ─── ENCABEZADO ─── --}}
<div class="header-bar">
    <table class="header-table">
        <tr>
            <td class="header-logo-cell">
                <div class="header-logo">A</div>
            </td>
            <td class="header-text-cell">
                <div class="header-title">Atinet Compliance Hub</div>
                <div class="header-subtitle">INFORME DE CONSULTA DE PEPs Y LISTAS DE INTERÉS</div>
            </td>
            <td class="header-meta-cell">
                <div><strong>Evaluado el:</strong> {{ $fecha_consulta }}</div>
                <div><strong>Usuario:</strong> {{ $usuario_nombre }}</div>
                <div><strong>Notaría:</strong> {{ $notaria_nombre }}</div>
            </td>
        </tr>
    </table>
</div>

{{-- ─── DECLARACIÓN ─── --}}
<div class="declaration-bar">
    De acuerdo con el análisis del usuario, los aciertos hallados NO se corresponden con la persona buscada
</div>

<div class="body-wrapper">

    {{-- ─── DATOS DE BÚSQUEDA ─── --}}
    <div class="section-header">Datos de la Búsqueda</div>
    <div class="section-body">
        <table class="data-table">
            <tr>
                <td class="label">Apellido / Denominación:</td>
                <td class="value">{{ strtoupper($apellido_denominacion) }}</td>
                <td class="label">Nombre(s):</td>
                <td class="value">{{ $nombres ? strtoupper($nombres) : '—' }}</td>
            </tr>
            <tr>
                <td class="label">Identificación (CURP/RFC):</td>
                <td class="value">{{ $identificacion ?? '—' }}</td>
                <td class="label">Filtros aplicados:</td>
                <td class="value">
                    @if(!empty($filtros_activos))
                        {{ implode(', ', $filtros_activos) }}
                    @else
                        Ninguno
                    @endif
                </td>
            </tr>
        </table>
    </div>

    {{-- ─── RESUMEN ─── --}}
    <div class="summary-bar">
        <table>
            <tr>
                <td>
                    <div class="num">{{ $total_resultados }}</div>
                    <div class="lbl">Resultados encontrados</div>
                </td>
                <td>
                    <div class="num">{{ count($resultados) }}</div>
                    <div class="lbl">Mostrados en este informe</div>
                </td>
                <td style="text-align:right; color: rgba(255,255,255,0.5); font-size:8px; padding-right:0;">
                    Ninguno corresponde a la persona buscada<br>
                    * Exactitud Den. toma valores entre 0 y 5
                </td>
            </tr>
        </table>
    </div>

    {{-- ─── TABLA DE RESULTADOS ─── --}}
    <div class="section-header">Lista de Aciertos</div>
    <table class="results-table">
        <thead>
            <tr>
                <th style="width:32%">Apellidos y Nombres / Denominación</th>
                <th style="width:16%">Identificación</th>
                <th style="width:6%; text-align:center">Den*</th>
                <th style="width:6%; text-align:center">ID</th>
                <th style="width:14%; text-align:center">Tipo</th>
                <th style="width:10%; text-align:center">Fuente</th>
                <th style="width:16%">Lista</th>
            </tr>
        </thead>
        <tbody>
            @foreach($resultados as $r)
            <tr>
                <td>{{ strtoupper($r['denominacion'] ?? '—') }}</td>
                <td>{{ $r['identificacion'] ?? 'N/D' }}</td>
                <td style="text-align:center">
                    @php
                        $den = $r['exactitud_denominacion'] ?? 'N/D';
                        $denClass = is_numeric($den) ? ($den >= 4 ? 'exactitud-alta' : ($den >= 2 ? 'exactitud-media' : 'exactitud-baja')) : '';
                    @endphp
                    <span class="{{ $denClass }}">{{ $den }}</span>
                </td>
                <td style="text-align:center">{{ $r['exactitud_identificacion'] ?? 'N/D' }}</td>
                <td style="text-align:center">
                    @php
                        $tipo = strtoupper($r['tipo'] ?? '');
                        $tipoClass = match(true) {
                            $tipo === 'PEP' => 'badge-pep',
                            $tipo === 'EX PEP' => 'badge-ex-pep',
                            $tipo === 'AFIN PEP' => 'badge-afin-pep',
                            str_contains($tipo, 'AFIN') => 'badge-afin-ex',
                            default => 'badge-otros',
                        };
                    @endphp
                    <span class="{{ $tipoClass }}">{{ $tipo ?: '—' }}</span>
                </td>
                <td style="text-align:center">
                    @php
                        $pais = strtoupper($r['pais_lista'] ?? '');
                        $paisClass = match($pais) {
                            'MEX', 'MEXICO', 'MX' => 'fuente-mex',
                            'ARG', 'ARGENTINA' => 'fuente-arg',
                            'USA', 'EE.UU.', 'US' => 'fuente-usa',
                            default => 'fuente-otro',
                        };
                    @endphp
                    <span class="{{ $paisClass }}">{{ $pais ?: 'N/D' }}</span>
                </td>
                <td style="font-size:8px; color:#64748b">{{ $r['lista'] ?? '—' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- ─── CERTIFICADO UUID ─── --}}
    <div class="cert-footer-bar">
        <table>
            <tr>
                <td>
                    <span class="cert-badge">Certificado Atinet</span>
                    &nbsp;
                    <span class="cert-uuid">{{ $uuid_certificado }}</span>
                </td>
                <td style="text-align:right; color:#94a3b8; font-size:8px;">
                    Generado: {{ $fecha_generacion }}<br>
                    Hash: <span style="font-family: 'Courier New', monospace;">{{ $hash_preview }}</span>
                </td>
            </tr>
        </table>
    </div>

    {{-- ─── DISCLAIMER ─── --}}
    <div class="disclaimer">
        <div class="sources-title">Fuentes consultadas por PrevencionDeLavado.com (Microbas S.R.L.) a través de su plataforma:</div>
        Consulta realizada en la base de datos de PEPs y Listas de Interés, que incluye las siguientes Listas:
        PEPs Nacionales e Internacionales (1); Familiares PEP; Lista Consolidada de Sanciones del Consejo de Seguridad
        de las Naciones Unidas (ONU) (2) (4); Sanciones de OFAC (4) (5); OFAC Recientes Acciones (4); Sanciones del
        Reino Unido (Her Majesty's Treasury) (3); Sanciones de la Unión Europea (3); Lista Consolidada de Sanciones
        Autónomas de Canadá; Lista Nacional del Consejo de Seguridad Nacional (Res. 1373/2001 Panamá); Fugitivos de
        la DEA; Personas más Buscadas por el FBI; Personas más Buscadas por Interpol (3); Personas más Buscadas de
        México (FGR - PGR); Personas más Buscadas por la Policía de España; Registro nacional de congelamiento de
        activos de Francia; Alerta sobre Operaciones con o vinculadas al Gobierno Ilegítimo de Venezuela (UIF
        Argentina); Lista Engel de sancionados emitida por el Gobierno de los Estados Unidos; Personas de Alto Riesgo
        de Venezuela (MEF Panamá); Licencias suspendidas por la Superintendencia de Seguros (Ley 23/2015 de Panamá);
        Department of Commerce BIS: Entity List, Unverified Parties List, Denied Person List (EE.UU.); Department of
        State DDTC: US Statutorily Debarred Parties List; ISN: Nonproliferation Sanction List (EE.UU.); US Department
        of State: List of Restricted Entities and Subentities Associated With Cuba (EE.UU.); US Treasury (FinCEN): 311
        and 9714 Special Measures List (EE.UU.); US Immigration and Customs Enforcement (ICE): Most Wanted (EE.UU.);
        US Marshals Service (EE.UU.): Most Wanted Fugitives; Listado de individuos y entidades inhabilitadas emitida
        por el Banco Mundial (BAM); Listado de personas y empresas inhabilitadas por el Banco Interamericano de
        Desarrollo (BID); Secretaría de la Función Pública de México (SFP): Sistema Nacional de Servidores Públicos y
        Particulares Sancionados, Licitantes, proveedores y contratistas sancionados; Sanciones impuestas por la
        Comisión Nacional Bancaria y de Valores (CNBV); Sanciones impuestas por Comisión Nacional para la Protección
        y Defensa de los Usuarios de Servicios Financieros (CONDUSEF); Servicio de Administración Tributaria (SAT):
        Listado de contribuyentes Art. 69 y 69B del Código Fiscal de la Federación de México; Contribuyentes
        suspendidos en el Padrón de Importadores y/o Exportadores.

        <div class="footnotes">
            <div class="footnote-item"><strong>(1)</strong> Incluye los listados internacionales de CIA (World Leaders All Foreign Governments) y Rulers (Heads of state and heads of government).</div>
            <div class="footnote-item"><strong>(2)</strong> Incluye 14 comités sancionatorios de Órganos Subsidiarios del Consejo de Seguridad de las Naciones Unidas: Somalia; ISIL (Da'esh) y Al-Qaida; Iraq; República Democrática del Congo; Sudán; Líbano; DPRK; Libia; Taliban; Guinea-Bissau; República Centro Africana; Yemen; Sudán del Sur; y Mali; y 10 grupos de monitoreo: Focal Point for De-listing; Office of the Ombudsperson; Security Council Affairs Division Roster of Experts; Counter-Terrorism Committee (CTC); 1540 Committee; Working Group on Children and Armed Conflict; Working Group on Peacekeeping Operations; Informal Working Group on Documentation and Other Procedural Questions; Ad Hoc Working Group on Conflict Prevention and Resolution in Africa; Informal Working Group on International Tribunals. También se incluyen los anexos (Resol. 751 [1992] y 1907 [2009] relativos a Somalia y Eritrea; Resol. 1373 [2001]; Resol. 1518 [2003] relativos a Iraq y Kuwait; Resol 2653 [2022] relativos a Haití).</div>
            <div class="footnote-item"><strong>(3)</strong> Incluye los 2 Anexos de la UIF: Anexo A — Resoluciones 1267 (1999), 1989 (2011) y 2253 (2015) relativas a EIIL (Daesh) y Al-Qaida; y Anexo B — Resolución 1988 (2011) relativa al Talibán.</div>
            <div class="footnote-item"><strong>(4)</strong> Incluye los 2 Anexos de la UIF: Anexo C — Resolución 1718 (2006) relativa a Corea del Norte; y Anexo D — Resoluciones 1737 (2006) – 2231 (2015).</div>
            <div class="footnote-item"><strong>(5)</strong> Incluye el listado del U.S. DEPARTMENT OF THE TREASURY: Foreign Sanctions Evaders (EE.UU.).</div>
        </div>

        <div class="microbas-note">
            <strong>Microbas S.R.L.</strong> no asume responsabilidad alguna derivada del uso incorrecto, inapropiado
            o ilícito de la información aparecida en PEPs y Listas de Interés dentro de los límites establecidos por
            las leyes y reglamentos vigentes. El producto PEPs y Listas de Interés suma y reporta datos, de la manera
            en que los registros públicos y las fuentes de datos comercialmente disponibles las proporcionan, y no es
            por tanto una fuente de datos propia o una recopilación exhaustiva de datos. Debido a la naturaleza del
            origen de los registros y de las fuentes de datos comercialmente disponibles, Microbas S.R.L tampoco asume
            ninguna responsabilidad derivada de la falta de integridad, actualización y precisión de los datos o
            informaciones contenidas en PEPs y Listas de Interés. En caso de considerar necesaria actualización alguna,
            podrá comunicarlo a <strong>cac@mbasystems.com.ar</strong>.
        </div>

        <div class="atinet-note">
            Este certificado es generado por <strong>Atinet Compliance Hub</strong> con base en los resultados
            proporcionados por PrevencionDeLavado.com. Atinet actúa como intermediario tecnológico y no consulta
            directamente ninguna de las fuentes listadas. Este documento constituye evidencia del cumplimiento de las
            obligaciones de identificación de clientes conforme a las disposiciones en materia de Prevención de Lavado
            de Dinero y Financiamiento al Terrorismo (PLD/FT) aplicables en México.
        </div>
    </div>

</div>

{{-- ─── PIE DE PÁGINA FIJO ─── --}}
<div class="page-footer">
    <strong>Atinet Compliance Hub</strong> &nbsp;·&nbsp; Módulo Listas PEP &nbsp;·&nbsp;
    Certificado: {{ $uuid_certificado }} &nbsp;·&nbsp; {{ $fecha_generacion }}
</div>

</body>
</html>
