<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>GAFI — Territorios bajo Revisión</title>
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

    /* ─── GAFI BANNER ─── */
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
    .fatf-badge {
        background: #ffffff;
        color: #0f3460;
        font-size: 13px;
        font-weight: 900;
        padding: 4px 12px;
        border-radius: 3px;
        letter-spacing: 2px;
        display: inline-block;
    }
    .fatf-label {
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
    .gafi-title {
        color: #ffffff;
        font-size: 20px;
        font-weight: 900;
        letter-spacing: 3px;
    }
    .gafi-sub {
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

    /* ─── SECTION BLOCKS ─── */
    .risk-section {
        margin-bottom: 16px;
    }

    .section-label {
        font-size: 8.5px;
        font-weight: 700;
        color: #ffffff;
        background: #0f3460;
        padding: 4px 12px;
        border-radius: 3px;
        display: inline-block;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }

    .intro-text {
        font-size: 9px;
        color: #374151;
        line-height: 1.6;
        margin-bottom: 10px;
        text-align: justify;
    }

    /* ─── HIGH RISK LIST (contramedidas / DDE) ─── */
    .high-risk-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 6px;
    }
    .high-risk-table td {
        padding: 4px 12px;
        font-size: 9.5px;
        font-weight: 700;
        vertical-align: middle;
    }
    .high-risk-table tr.contramedidas td {
        background: #fef2f2;
        color: #991b1b;
        border-left: 4px solid #e94560;
    }
    .high-risk-table tr.dde td {
        background: #fff7ed;
        color: #92400e;
        border-left: 4px solid #f97316;
    }
    .risk-dot-red {
        display: inline-block;
        width: 8px;
        height: 8px;
        background: #e94560;
        border-radius: 50%;
        margin-right: 6px;
        vertical-align: middle;
    }
    .risk-dot-orange {
        display: inline-block;
        width: 8px;
        height: 8px;
        background: #f97316;
        border-radius: 50%;
        margin-right: 6px;
        vertical-align: middle;
    }

    /* ─── MONITORING UPDATE BADGE ─── */
    .update-badge {
        display: inline-block;
        background: #e94560;
        color: #ffffff;
        font-size: 7.5px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 10px;
        letter-spacing: 0.5px;
        vertical-align: middle;
        margin-left: 6px;
    }
    .monitoring-header {
        font-size: 10px;
        font-weight: 700;
        color: #0f3460;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 2px solid #e94560;
    }
    .count-bar {
        background: #f1f5f9;
        border-left: 4px solid #0f3460;
        padding: 4px 10px;
        font-size: 8px;
        color: #475569;
        margin-bottom: 10px;
    }
    .count-bar strong {
        color: #0f3460;
    }

    /* ─── MONITORING LIST (2 columns) ─── */
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
    .footer-accent {
        color: #e94560;
        font-weight: 700;
    }
</style>
</head>
<body>

{{-- FIXED FOOTER --}}
<div class="page-footer">
    <div class="page-footer-left">
        <span class="footer-accent">Atinet</span> Compliance Hub &mdash; Listado GAFI / FATF
    </div>
    <div class="page-footer-right">
        Generado: {{ $fecha_generacion }}
    </div>
</div>

{{-- HEADER --}}
<div class="header-band"></div>
<div class="header-bar">
    <div class="header-logo-cell">
        <span class="header-logo-a">A</span>
        <span class="header-brand">
            <div class="header-brand-name">Atinet</div>
            <div class="header-brand-sub">Compliance Hub</div>
        </span>
    </div>
    <div class="header-title-cell">
        <div class="header-doc-title">Territorios bajo Revisión del GAFI</div>
        <div class="header-doc-sub">Grupo de Acción Financiera Internacional (FATF)</div>
    </div>
</div>

{{-- GAFI BANNER --}}
<div class="banner">
    <div class="banner-left">
        <span class="fatf-badge">FATF</span>
        <div class="fatf-label">Financial Action Task Force</div>
    </div>
    <div class="banner-right">
        <div class="gafi-title">GAFI</div>
        <div class="gafi-sub">Revisiones &mdash; Febrero 2026</div>
    </div>
</div>

{{-- CONTENT --}}
<div class="content">

    <div class="doc-title">Listado de territorios informados por las Revisiones del GAFI</div>

    {{-- ── SECTION 1: LLAMADO A CONTRAMEDIDAS ── --}}
    <div class="risk-section">
        <div class="section-label">&#9888; Llamado a Contramedidas</div>
        <p class="intro-text">
            Las jurisdicciones sujetas a un llamado del GAFI a sus miembros y otras jurisdicciones a aplicar contramedidas:
        </p>
        <table class="high-risk-table">
            <tr class="contramedidas">
                <td><span class="risk-dot-red"></span>República Popular Democrática de Corea (RPDC)</td>
            </tr>
            <tr class="contramedidas">
                <td><span class="risk-dot-red"></span>Irán</td>
            </tr>
        </table>
    </div>

    {{-- ── SECTION 2: DEBIDA DILIGENCIA REFORZADA ── --}}
    <div class="risk-section">
        <div class="section-label">&#9675; Debida Diligencia Reforzada</div>
        <p class="intro-text">
            Jurisdicción sujeta a un llamado del GAFI a sus miembros y otras jurisdicciones para que apliquen medidas de debida diligencia reforzadas, proporcionales a los riesgos derivados de la jurisdicción:
        </p>
        <table class="high-risk-table">
            <tr class="dde">
                <td><span class="risk-dot-orange"></span>Birmania</td>
            </tr>
        </table>
    </div>

    {{-- ── SECTION 3: MAYOR MONITOREO ── --}}
    <div class="risk-section">
        <div class="monitoring-header">
            Jurisdicciones bajo Mayor Monitoreo
            <span class="update-badge">13 de febrero de 2026</span>
        </div>
        <div class="count-bar">
            <strong>22 jurisdicciones</strong> bajo mayor monitoreo que trabajan activamente con el GAFI para corregir deficiencias estratégicas en sus regímenes ALD/CFT.
        </div>
        <table class="territory-table">
            <tr>
                <td><span class="bullet">&#9679;</span>Argelia</td>
                <td><span class="bullet">&#9679;</span>Angola</td>
            </tr>
            <tr>
                <td><span class="bullet">&#9679;</span>Bolivia</td>
                <td><span class="bullet">&#9679;</span>Bulgaria</td>
            </tr>
            <tr>
                <td><span class="bullet">&#9679;</span>Camerún</td>
                <td><span class="bullet">&#9679;</span>Costa de Marfil</td>
            </tr>
            <tr>
                <td><span class="bullet">&#9679;</span>Haití</td>
                <td><span class="bullet">&#9679;</span>Islas Vírgenes (Reino Unido)</td>
            </tr>
            <tr>
                <td><span class="bullet">&#9679;</span>Kenia</td>
                <td><span class="bullet">&#9679;</span>Kuwait</td>
            </tr>
            <tr>
                <td><span class="bullet">&#9679;</span>Líbano</td>
                <td><span class="bullet">&#9679;</span>Mónaco</td>
            </tr>
            <tr>
                <td><span class="bullet">&#9679;</span>Namibia</td>
                <td><span class="bullet">&#9679;</span>Nepal</td>
            </tr>
            <tr>
                <td><span class="bullet">&#9679;</span>Papúa Nueva Guinea</td>
                <td><span class="bullet">&#9679;</span>República Democrática Popular Lao</td>
            </tr>
            <tr>
                <td><span class="bullet">&#9679;</span>República Democrática del Congo</td>
                <td><span class="bullet">&#9679;</span>Sudán del Sur</td>
            </tr>
            <tr>
                <td><span class="bullet">&#9679;</span>Siria</td>
                <td><span class="bullet">&#9679;</span>Venezuela</td>
            </tr>
            <tr>
                <td><span class="bullet">&#9679;</span>Vietnam</td>
                <td><span class="bullet">&#9679;</span>Yemen</td>
            </tr>
        </table>
    </div>

    {{-- META --}}
    <div class="meta-section">
        <div class="meta-row"><strong>Última actualización:</strong> Febrero 2026</div>
        <div class="meta-row">
            <strong>Fuentes:</strong>
        </div>
        <div class="meta-row">
            &bull; <a href="https://www.fatf-gafi.org/en/publications/High-risk-and-other-monitored-jurisdictions/increased-monitoring-february-2026.html">
                fatf-gafi.org &mdash; Increased Monitoring February 2026
            </a>
        </div>
        <div class="meta-row">
            &bull; <a href="https://www.fatf-gafi.org/en/publications/High-risk-and-other-monitored-jurisdictions/Call-for-action-february-2026.html">
                fatf-gafi.org &mdash; Call for Action February 2026
            </a>
        </div>
    </div>

    {{-- ATINET NOTE --}}
    <div class="atinet-note">
        <strong>Atinet Compliance Hub</strong> actúa como intermediario en la consulta de estas listas con fines de prevención de lavado de dinero y financiamiento al terrorismo (ALD/CFT), conforme a las obligaciones establecidas en la Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita (LFPIORPI) y demás normativa aplicable en México.
    </div>

</div>

</body>
</html>
