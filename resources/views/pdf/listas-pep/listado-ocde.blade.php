<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>OCDE — Foro Global y Paraísos Fiscales</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        font-family: Arial, sans-serif;
        font-size: 10px;
        color: #1e293b;
        background: #ffffff;
    }

    /* ─── HEADER ─── */
    .header-bar {
        background: #0f3460;
        padding: 10px 24px;
        display: table;
        width: 100%;
    }
    .header-logo-cell {
        display: table-cell;
        vertical-align: middle;
    }
    .header-logo-a {
        display: inline-block;
        background: #e94560;
        color: #ffffff;
        font-size: 22px;
        font-weight: 900;
        width: 36px;
        height: 36px;
        text-align: center;
        line-height: 36px;
        border-radius: 4px;
        margin-right: 8px;
        vertical-align: middle;
    }
    .header-brand {
        display: inline-block;
        vertical-align: middle;
    }
    .header-brand-name {
        color: #ffffff;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
    .header-brand-sub {
        color: #93c5fd;
        font-size: 8px;
        letter-spacing: 1px;
        text-transform: uppercase;
    }
    .header-title-cell {
        display: table-cell;
        text-align: right;
        vertical-align: middle;
    }
    .header-doc-title {
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
    .header-doc-sub {
        color: #93c5fd;
        font-size: 8px;
    }

    /* ─── BANNER ─── */
    .banner {
        background: #0f3460;
        margin: 14px 24px 0 24px;
        padding: 10px 18px;
        border-radius: 4px;
        display: table;
        width: calc(100% - 48px);
    }
    .banner-left {
        display: table-cell;
        vertical-align: middle;
        width: 55%;
    }
    .ocde-badge {
        background: #ffffff;
        color: #0f3460;
        font-size: 13px;
        font-weight: 900;
        padding: 4px 12px;
        border-radius: 3px;
        letter-spacing: 2px;
        display: inline-block;
    }
    .ocde-badge-label {
        color: #93c5fd;
        font-size: 7.5px;
        margin-top: 3px;
        letter-spacing: 0.5px;
    }
    .banner-right {
        display: table-cell;
        vertical-align: middle;
        text-align: right;
        width: 45%;
    }
    .banner-main-title {
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
    }
    .banner-main-sub {
        color: #e94560;
        font-size: 7.5px;
        letter-spacing: 0.5px;
        margin-top: 2px;
    }

    /* ─── CONTENT ─── */
    .content {
        padding: 14px 24px;
        padding-bottom: 40px;
    }

    /* ─── SECTION HEADERS ─── */
    .section-header {
        background: #0f3460;
        color: #ffffff;
        padding: 5px 10px;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
        margin-top: 14px;
        border-radius: 3px;
    }
    .section-header:first-child { margin-top: 0; }

    .section-intro {
        font-size: 8.5px;
        color: #374151;
        line-height: 1.6;
        margin-bottom: 8px;
        text-align: justify;
    }

    .update-badge {
        display: inline-block;
        background: #dbeafe;
        color: #1d4ed8;
        font-size: 7.5px;
        padding: 2px 7px;
        border-radius: 10px;
        margin-bottom: 8px;
        font-weight: 700;
    }

    /* ─── TERRITORY TABLES ─── */
    .territory-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
    }
    .territory-table td {
        padding: 2px 6px 2px 10px;
        font-size: 8.5px;
        color: #1e293b;
        vertical-align: top;
        line-height: 1.55;
    }
    .territory-table td.col3 { width: 33.33%; }
    .territory-table td.col2 { width: 50%; }
    .territory-table tr:nth-child(even) td {
        background: #f8fafc;
    }
    .bullet {
        color: #e94560;
        font-weight: 700;
        margin-right: 3px;
    }
    .ref-sup {
        color: #0f3460;
        font-size: 7px;
        font-weight: 700;
    }

    /* ─── COUNT BADGE ─── */
    .count-bar {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 3px;
        padding: 4px 10px;
        font-size: 8px;
        color: #475569;
        margin-bottom: 8px;
    }
    .count-bar strong { color: #0f3460; }

    /* ─── REFERENCES ─── */
    .references-title {
        font-size: 9px;
        font-weight: 700;
        color: #0f3460;
        text-decoration: underline;
        margin: 10px 0 5px 0;
    }
    .reference-item {
        font-size: 8px;
        color: #374151;
        line-height: 1.6;
        margin-bottom: 2px;
    }
    .reference-num {
        color: #0f3460;
        font-weight: 700;
    }

    /* ─── NOTE BOX ─── */
    .note-box {
        background: #fffbeb;
        border-left: 3px solid #f59e0b;
        padding: 6px 10px;
        font-size: 8px;
        color: #374151;
        line-height: 1.6;
        text-align: justify;
        margin-top: 8px;
    }
    .note-box p { margin-bottom: 4px; }
    .note-box ul { margin: 4px 0 4px 14px; }
    .note-box li { margin-bottom: 3px; }

    /* ─── META SECTION ─── */
    .meta-section {
        border-top: 2px solid #0f3460;
        padding-top: 8px;
        margin-top: 12px;
    }
    .meta-row {
        font-size: 8px;
        color: #64748b;
        margin-bottom: 3px;
    }
    .meta-row strong { color: #374151; }
    .meta-row a { color: #0f3460; }

    /* ─── ATINET NOTE ─── */
    .atinet-note {
        margin-top: 10px;
        padding: 6px 10px;
        background: #f1f5f9;
        border-left: 3px solid #e94560;
        font-size: 7.5px;
        color: #475569;
        line-height: 1.5;
    }

    /* ─── PAGE FOOTER ─── */
    .page-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #0f3460;
        padding: 5px 24px;
        display: table;
        width: 100%;
    }
    .page-footer-left {
        display: table-cell;
        vertical-align: middle;
        color: #93c5fd;
        font-size: 7px;
    }
    .page-footer-right {
        display: table-cell;
        text-align: right;
        vertical-align: middle;
        color: #93c5fd;
        font-size: 7px;
    }
    .page-footer strong { color: #ffffff; }

    .page-break { page-break-before: always; }
</style>
</head>
<body>

{{-- ─── HEADER ─── --}}
<div class="header-bar">
    <div class="header-logo-cell">
        <span class="header-logo-a">A</span>
        <span class="header-brand">
            <div class="header-brand-name">Atinet Compliance Hub</div>
            <div class="header-brand-sub">Prevención de Lavado de Dinero · PLD/FT</div>
        </span>
    </div>
    <div class="header-title-cell">
        <div class="header-doc-title">OCDE</div>
        <div class="header-doc-sub">Foro Global · Paraísos Fiscales</div>
    </div>
</div>

{{-- ─── BANNER ─── --}}
<div class="banner">
    <div class="banner-left">
        <span class="ocde-badge">OCDE</span>
        <div class="ocde-badge-label">Organización para la Cooperación y el Desarrollo Económicos</div>
    </div>
    <div class="banner-right">
        <div class="banner-main-title">FORO GLOBAL</div>
        <div class="banner-main-sub">Transparencia e Intercambio de Información Tributaria</div>
    </div>
</div>

{{-- ─── CONTENT ─── --}}
<div class="content">

    {{-- ══════════════════════════════════════════ --}}
    {{-- SECCIÓN 1: MIEMBROS DEL FORO GLOBAL       --}}
    {{-- ══════════════════════════════════════════ --}}
    <div class="section-header">SECCIÓN 1 — Países Miembros del Foro Global sobre Transparencia e Intercambio de Información con Fines Tributarios</div>

    <div class="update-badge">Última actualización: marzo de 2026</div>

    <div class="count-bar">
        <strong>173 miembros</strong> del Foro Global sobre Transparencia e Intercambio de Información con Fines Tributarios
    </div>

    @php
    $miembros = [
        'Albania', 'Algeria', 'Andorra', 'Angola', 'Anguilla', 'Antigua and Barbuda',
        'Argentina', 'Armenia', 'Aruba', 'Australia', 'Austria', 'Azerbaijan',
        'Bahamas', 'Bahrain', 'Barbados', 'Belarus', 'Belgium', 'Belize',
        'Benin', 'Bermuda', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
        'British Virgin Islands', 'Brunei Darussalam', 'Bulgaria', 'Burkina Faso',
        'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Cayman Islands', 'Chad',
        'Chile', 'China (People\'s Republic of)', 'Colombia', 'Congo (Republic of the)',
        'Cook Islands', 'Costa Rica', 'Côte d\'Ivoire', 'Croatia', 'Curaçao', 'Cyprus',
        'Czechia', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica',
        'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Estonia', 'Eswatini',
        'Faroe Islands', 'Fiji', 'Finland', 'France', 'Gabon', 'Georgia', 'Germany',
        'Ghana', 'Gibraltar', 'Greece', 'Greenland', 'Grenada', 'Guatemala', 'Guernsey',
        'Guinea', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong, China', 'Hungary', 'Iceland',
        'India', 'Indonesia', 'Ireland', 'Isle of Man', 'Israel', 'Italy', 'Jamaica',
        'Japan', 'Jersey', 'Jordan', 'Kazakhstan', 'Kenya', 'Korea', 'Kuwait', 'Latvia',
        'Lebanon', 'Lesotho', 'Liberia', 'Liechtenstein', 'Lithuania', 'Luxembourg',
        'Macau, China', 'Madagascar', 'Malaysia', 'Maldives', 'Mali', 'Malta',
        'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco',
        'Mongolia', 'Montenegro', 'Montserrat', 'Morocco', 'Namibia', 'Nauru', 'Nepal',
        'Netherlands', 'New Zealand', 'Niger', 'Nigeria', 'Niue', 'North Macedonia',
        'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay',
        'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
        'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
        'Samoa', 'San Marino', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
        'Sierra Leone', 'Singapore', 'Sint Maarten', 'Slovak Republic', 'Slovenia',
        'South Africa', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Tanzania',
        'Thailand', 'Togo', 'Trinidad and Tobago', 'Tunisia', 'Türkiye',
        'Turks and Caicos Islands', 'Uganda', 'Ukraine', 'United Arab Emirates',
        'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
        'Viet Nam', 'Zambia', 'Zimbabwe',
    ];

    // Dividir en 3 columnas
    $por_col = (int) ceil(count($miembros) / 3);
    $col1 = array_slice($miembros, 0, $por_col);
    $col2 = array_slice($miembros, $por_col, $por_col);
    $col3 = array_slice($miembros, $por_col * 2);
    $filas = max(count($col1), count($col2), count($col3));
    @endphp

    <table class="territory-table">
        @for ($i = 0; $i < $filas; $i++)
        <tr>
            <td class="col3">
                @isset($col1[$i])
                    <span class="bullet">›</span>{{ $col1[$i] }}
                @endisset
            </td>
            <td class="col3">
                @isset($col2[$i])
                    <span class="bullet">›</span>{{ $col2[$i] }}
                @endisset
            </td>
            <td class="col3">
                @isset($col3[$i])
                    <span class="bullet">›</span>{{ $col3[$i] }}
                @endisset
            </td>
        </tr>
        @endfor
    </table>

    {{-- ══════════════════════════════════════════════════════ --}}
    {{-- SECCIÓN 2: PARAÍSOS FISCALES NO COOPERATIVOS        --}}
    {{-- ══════════════════════════════════════════════════════ --}}
    <div class="section-header">SECCIÓN 2 — Territorios Comprometidos con la Mejora de la Transparencia e Intercambio de Información Tributaria (Paraísos Fiscales)</div>

    <div class="update-badge">Última actualización de la fuente: 4 de junio de 2018</div>

    <div class="section-intro">
        A continuación, se enumeran las jurisdicciones que se han comprometido con la OCDE a implementar mejoras
        en la transparencia y el intercambio efectivo de información para fines tributarios:
    </div>

    @php
    // Territorios con sus referencias (null = sin referencia)
    $paraisos = [
        ['nombre' => 'Andorra',                                  'refs' => []],
        ['nombre' => 'Anguila',                                  'refs' => [1]],
        ['nombre' => 'Antigua y Barbuda',                        'refs' => []],
        ['nombre' => 'Aruba',                                    'refs' => [2, 3]],
        ['nombre' => 'Las Bahamas',                              'refs' => []],
        ['nombre' => 'Bahrein',                                  'refs' => []],
        ['nombre' => 'Bermudas',                                 'refs' => [1]],
        ['nombre' => 'Belice',                                   'refs' => []],
        ['nombre' => 'Islas Vírgenes Británicas',                'refs' => [1]],
        ['nombre' => 'Islas Caimán',                             'refs' => [1]],
        ['nombre' => 'Islas Cook',                               'refs' => [4]],
        ['nombre' => 'Chipre',                                   'refs' => []],
        ['nombre' => 'Dominica',                                 'refs' => []],
        ['nombre' => 'Gibraltar',                                'refs' => [1]],
        ['nombre' => 'Granada',                                  'refs' => []],
        ['nombre' => 'Guernsey',                                 'refs' => [5]],
        ['nombre' => 'Isla del Hombre',                          'refs' => [5]],
        ['nombre' => 'Jersey',                                   'refs' => [5]],
        ['nombre' => 'Liberia',                                  'refs' => []],
        ['nombre' => 'Liechtenstein',                            'refs' => []],
        ['nombre' => 'Malta',                                    'refs' => []],
        ['nombre' => 'Islas Marshall',                           'refs' => []],
        ['nombre' => 'Mauricio',                                 'refs' => []],
        ['nombre' => 'Mónaco',                                   'refs' => []],
        ['nombre' => 'Montserrat',                               'refs' => [1]],
        ['nombre' => 'Nauru',                                    'refs' => []],
        ['nombre' => 'Antillas Holandesas',                      'refs' => [2]],
        ['nombre' => 'Niue',                                     'refs' => [4]],
        ['nombre' => 'Panamá',                                   'refs' => []],
        ['nombre' => 'Samoa',                                    'refs' => []],
        ['nombre' => 'San Marino',                               'refs' => []],
        ['nombre' => 'Seychelles',                               'refs' => []],
        ['nombre' => 'Santa Lucía',                              'refs' => []],
        ['nombre' => 'San Cristóbal y Nieves',                   'refs' => []],
        ['nombre' => 'San Vicente y las Granadinas',             'refs' => []],
        ['nombre' => 'Islas Turcas y Caicos',                    'refs' => [1]],
        ['nombre' => 'Islas Vírgenes de los Estados Unidos',     'refs' => [6]],
        ['nombre' => 'Vanuatu',                                  'refs' => []],
    ];

    $mitad = (int) ceil(count($paraisos) / 2);
    $pcol1 = array_slice($paraisos, 0, $mitad);
    $pcol2 = array_slice($paraisos, $mitad);
    $pfilas = max(count($pcol1), count($pcol2));
    @endphp

    <table class="territory-table">
        @for ($i = 0; $i < $pfilas; $i++)
        <tr>
            <td class="col2">
                @isset($pcol1[$i])
                    <span class="bullet">›</span>{{ $pcol1[$i]['nombre'] }}
                    @foreach($pcol1[$i]['refs'] as $r)
                        <span class="ref-sup">({{ $r }})</span>
                    @endforeach
                @endisset
            </td>
            <td class="col2">
                @isset($pcol2[$i])
                    <span class="bullet">›</span>{{ $pcol2[$i]['nombre'] }}
                    @foreach($pcol2[$i]['refs'] as $r)
                        <span class="ref-sup">({{ $r }})</span>
                    @endforeach
                @endisset
            </td>
        </tr>
        @endfor
    </table>

    {{-- ─── Referencias ─── --}}
    <div class="references-title">Referencias</div>
    <div class="reference-item"><span class="reference-num">(1)</span> Territorio de Ultramar del Reino Unido.</div>
    <div class="reference-item"><span class="reference-num">(2)</span> Aruba, las Antillas Holandesas y los Países Bajos son los tres países del Reino de los Países Bajos.</div>
    <div class="reference-item"><span class="reference-num">(3)</span> Carta del Secretario General de la OCDE, Donald J. Johnston, al Ministro de Finanzas de Aruba, Dr. Robertico R. Croes.</div>
    <div class="reference-item"><span class="reference-num">(4)</span> País totalmente autónomo en asociación libre con Nueva Zelanda.</div>
    <div class="reference-item"><span class="reference-num">(5)</span> Dependencia de la Corona Británica.</div>
    <div class="reference-item"><span class="reference-num">(6)</span> Territorio externo de los Estados Unidos.</div>

    {{-- ─── Notas aclaratorias ─── --}}
    <div class="note-box">
        <p>La OCDE determinó que otras tres jurisdicciones (<strong>Barbados, Maldivas y Tonga</strong>) identificadas en el
        Informe de progreso 2000 como paraísos fiscales no deberían haberse incluido en la Lista de Paraísos Fiscales
        No Cooperativos.</p>
        <ul>
            <li><strong>Barbados</strong> no se incluirá porque tiene acuerdos de intercambio de información de larga data con otros
            países. Barbados ha establecido procedimientos con respecto a la transparencia y los recientes cambios
            legislativos han mejorado la transparencia de sus normas tributarias y regulatorias.</li>
            <li><strong>Tonga y Maldivas</strong>: la OCDE determinó, después de una cuidadosa revisión de las leyes y prácticas
            actuales, que estas jurisdicciones no cumplen con los criterios de Paraíso Fiscal.</li>
        </ul>
        <p style="margin-top:4px">Muchos otros países también han respaldado los estándares.</p>
    </div>

    {{-- ─── META ─── --}}
    <div class="meta-section">
        <div class="meta-row">
            <strong>Fuente — Sección 1 (Foro Global):</strong>
            <a href="https://www.oecd.org/en/networks/global-forum-tax-transparency/who-we-are/members.html">
                https://www.oecd.org/en/networks/global-forum-tax-transparency/who-we-are/members.html
            </a>
        </div>
        <div class="meta-row">
            <strong>Fuente — Sección 2 (Paraísos Fiscales, archivo 2018):</strong>
            <a href="https://web-archive.oecd.org/2018-06-05/77934-jurisdictions-committed-to-improving-transparency-and-establishing-effective-exchange-of-information-in-tax-matters.htm">
                web-archive.oecd.org/2018-06-05/77934-jurisdictions-committed-...
            </a>
        </div>
        <div class="meta-row"><strong>Documento generado:</strong> {{ $fecha_generacion }}</div>
    </div>

    <div class="atinet-note">
        Este listado es reproducido por <strong>Atinet Compliance Hub</strong> con fines de consulta interna en materia de
        Prevención de Lavado de Dinero y Financiamiento al Terrorismo (PLD/FT). Los datos provienen de fuentes oficiales
        de la OCDE y son de dominio público. Atinet no modifica ni interpreta los listados; para la versión vigente
        consulte siempre las fuentes oficiales indicadas.
    </div>

</div>

{{-- ─── FOOTER FIJO ─── --}}
<div class="page-footer">
    <div class="page-footer-left">
        <strong>Atinet Compliance Hub</strong> · Módulo Listas PEP y Listas de Interés
    </div>
    <div class="page-footer-right">
        OCDE · Foro Global · Paraísos Fiscales No Cooperativos
    </div>
</div>

</body>
</html>
