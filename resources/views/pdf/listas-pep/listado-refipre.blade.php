<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>REFIPRE — Regímenes Fiscales Preferentes</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        font-family: Arial, sans-serif;
        font-size: 10px;
        color: #1e293b;
        background: #ffffff;
    }

    /* ─── HEADER ─── */
    .header-band {
        background: #0f3460;
        height: 6px;
        width: 100%;
    }
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

    /* ─── BANNER SAT / REFIPRE ─── */
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
        width: 50%;
    }
    .sat-badge {
        background: #ffffff;
        color: #0f3460;
        font-size: 13px;
        font-weight: 900;
        padding: 4px 12px;
        border-radius: 3px;
        letter-spacing: 2px;
        display: inline-block;
    }
    .sat-label {
        color: #93c5fd;
        font-size: 7.5px;
        margin-top: 3px;
        letter-spacing: 0.5px;
    }
    .banner-right {
        display: table-cell;
        vertical-align: middle;
        text-align: right;
        width: 50%;
    }
    .refipre-title {
        color: #ffffff;
        font-size: 20px;
        font-weight: 900;
        letter-spacing: 3px;
    }
    .refipre-sub {
        color: #e94560;
        font-size: 7.5px;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin-top: 2px;
    }

    /* ─── CONTENT ─── */
    .content {
        padding: 14px 24px;
    }

    .doc-title {
        font-size: 11px;
        font-weight: 700;
        color: #0f3460;
        text-decoration: underline;
        margin-bottom: 8px;
    }

    .intro-text {
        font-size: 9px;
        color: #374151;
        line-height: 1.6;
        margin-bottom: 14px;
        text-align: justify;
    }

    /* ─── TERRITORY LIST ─── */
    .territory-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 14px;
    }
    .territory-table td {
        width: 50%;
        padding: 2px 8px 2px 12px;
        font-size: 9px;
        color: #1e293b;
        vertical-align: top;
        line-height: 1.6;
    }
    .territory-table tr:nth-child(even) td {
        background: #f8fafc;
    }
    .bullet {
        color: #e94560;
        font-weight: 700;
        margin-right: 4px;
    }

    /* ─── META SECTION ─── */
    .meta-section {
        border-top: 2px solid #0f3460;
        padding-top: 8px;
        margin-top: 4px;
    }
    .meta-row {
        font-size: 8px;
        color: #64748b;
        margin-bottom: 3px;
    }
    .meta-row strong {
        color: #374151;
    }
    .meta-row a {
        color: #0f3460;
    }

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
    .page-footer strong {
        color: #ffffff;
    }
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
        <div class="header-doc-title">REFIPRE</div>
        <div class="header-doc-sub">Regímenes Fiscales Preferentes</div>
    </div>
</div>

{{-- ─── BANNER ─── --}}
<div class="banner">
    <div class="banner-left">
        <span class="sat-badge">SAT</span>
        <div class="sat-label">Servicio de Administración Tributaria · México</div>
    </div>
    <div class="banner-right">
        <div class="refipre-title">REFIPRE</div>
        <div class="refipre-sub">Regímenes Fiscales Preferentes</div>
    </div>
</div>

{{-- ─── CONTENT ─── --}}
<div class="content">

    <div class="doc-title">Listado de territorios por los que se debe presentar la declaración informativa</div>

    <div class="intro-text">
        A continuación, se enumeran las jurisdicciones por las que se debe presentar la declaración
        informativa a que se refieren el <strong>Título VI de la Ley del Impuesto sobre la Renta (LISR)</strong>
        y el <strong>Título IV Capítulo II del Código Fiscal de la Federación (CFF)</strong>, los siguientes:
    </div>

    {{-- Lista de territorios en 2 columnas --}}
    @php
    $territorios = [
        'Anguila',
        'Antigua y Barbuda',
        'Antillas Neerlandesas',
        'Archipiélago de Svalbard',
        'Aruba',
        'Ascensión',
        'Barbados',
        'Belice',
        'Bermudas',
        'Brunei Darussalam',
        'Campione D´Italia',
        'Commonwealth de Dominica',
        'Commonwealth de las Bahamas',
        'Emiratos Árabes Unidos',
        'Estado de Bahrein',
        'Estado de Kuwait',
        'Estado de Qatar',
        'Estado Independiente de Samoa Occidental',
        'Estado Libre Asociado de Puerto Rico',
        'Gibraltar',
        'Granada',
        'Groenlandia',
        'Guam',
        'Hong Kong',
        'Isla Caimán',
        'Isla de Christmas',
        'Isla de Norfolk',
        'Isla de San Pedro y Miguelón',
        'Isla del Hombre',
        'Isla Qeshm',
        'Islas Azores',
        'Islas Canarias',
        'Islas Cook',
        'Islas de Cocos o Kelling',
        'Islas de Guernesey, Jersey, Alderney, Isla Great Sark, Herm, Little Sark, Brechou, Jethou Lihou (Islas del Canal)',
        'Islas Malvinas',
        'Islas Pacífico',
        'Islas Salomón',
        'Islas Turcas y Caicos',
        'Islas Vírgenes Británicas',
        'Islas Vírgenes de Estados Unidos de América',
        'Kiribati',
        'Labuán',
        'Macao',
        'Madeira',
        'Malta',
        'Montserrat',
        'Nevis',
        'Niue',
        'Patau',
        'Pitcairn',
        'Polinesia Francesa',
        'Principado de Andorra',
        'Principado de Liechtenstein',
        'Principado de Mónaco',
        'Reino de Swazilandia',
        'Reino de Tonga',
        'Reino Hachemita de Jordania',
        'República de Albania',
        'República de Angola',
        'República de Cabo Verde',
        'República de Costa Rica',
        'República de Chipre',
        'República de Djibouti',
        'República de Guyana',
        'República de Honduras',
        'República de las Islas Marshall',
        'República de Liberia',
        'República de Maldivas',
        'República de Mauricio',
        'República de Nauru',
        'República de Panamá',
        'República de Seychelles',
        'República de Trinidad y Tobago',
        'República de Túnez',
        'República de Vanuatu',
        'República del Yemen',
        'República Oriental del Uruguay',
        'República Socialista Democrática de Sri Lanka',
        'Samoa Americana',
        'San Kitts',
        'San Vicente y las Granadinas',
        'Santa Elena',
        'Santa Lucía',
        'Serenísima República de San Marino',
        'Sultanía de Omán',
        'Tokelau',
        'Trieste',
        'Tristán de Cunha',
        'Tuvalu',
        'Zona Especial Canaria',
        'Zona Libre Ostrava',
    ];

    // Dividir en 2 columnas parejas
    $mitad = (int) ceil(count($territorios) / 2);
    $col1  = array_slice($territorios, 0, $mitad);
    $col2  = array_slice($territorios, $mitad);
    $filas = max(count($col1), count($col2));
    @endphp

    <table class="territory-table">
        @for ($i = 0; $i < $filas; $i++)
        <tr>
            <td>
                @isset($col1[$i])
                    <span class="bullet">›</span>{{ $col1[$i] }}
                @endisset
            </td>
            <td>
                @isset($col2[$i])
                    <span class="bullet">›</span>{{ $col2[$i] }}
                @endisset
            </td>
        </tr>
        @endfor
    </table>

    {{-- ─── META ─── --}}
    <div class="meta-section">
        <div class="meta-row"><strong>Total de territorios:</strong> {{ count($territorios) }}</div>
        <div class="meta-row"><strong>Última actualización de la fuente:</strong> Decreto DOF 01/04/2024</div>
        <div class="meta-row"><strong>Fuente oficial:</strong> <a href="https://www.diputados.gob.mx/LeyesBiblio/ref/lisr.htm">https://www.diputados.gob.mx/LeyesBiblio/ref/lisr.htm</a></div>
        <div class="meta-row"><strong>Documento generado:</strong> {{ $fecha_generacion }}</div>
    </div>

    <div class="atinet-note">
        Este listado es reproducido por <strong>Atinet Compliance Hub</strong> con fines de consulta interna en materia de
        Prevención de Lavado de Dinero y Financiamiento al Terrorismo (PLD/FT). Los datos corresponden al Anexo 21 del
        Título VI de la LISR y son de dominio público. Atinet no modifica ni interpreta la lista oficial; para la versión
        vigente siempre consulte la fuente oficial indicada.
    </div>

</div>

{{-- ─── FOOTER FIJO ─── --}}
<div class="page-footer">
    <div class="page-footer-left">
        <strong>Atinet Compliance Hub</strong> · Módulo Listas PEP y Listas de Interés
    </div>
    <div class="page-footer-right">
        REFIPRE · Regímenes Fiscales Preferentes · SAT México
    </div>
</div>

</body>
</html>
