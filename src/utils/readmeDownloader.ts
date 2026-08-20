import jsPDF from 'jspdf';

/**
 * Helper utility to generate and download the complete Platform README markdown file,
 * strictly aligned with Suruhanjaya Tenaga (Energy Commission Malaysia) RFP LSS6–Hybrid TOR.
 * Reference Document: ST(IP/EMP/SSCP) 12/1/12 (6), Dated 27 July 2026.
 */
export function downloadPlatformReadme() {
  const readmeContent = `# Malaysia LSS6-Hybrid Site Intelligence Platform
## Energy Commission (Suruhanjaya Tenaga) RFP LSS6–Hybrid Terms of Reference (TOR) & GIS Analyzer

Welcome to the **Malaysia LSS6-Hybrid Site Intelligence Platform**, an enterprise-grade GIS, Cadastral, and Financial modeling application engineered for solar utility developers participating in Peninsular Malaysia's **Suruhanjaya Tenaga Large Scale Solar Round 6 Hybrid RFP (LSS6–HYBRID)**.

Official Reference: **ST(IP/EMP/SSCP) 12/1/12 (6)** | Issued: **27 July 2026**

---

## 🌟 Executive Summary & Regulatory Framework

The Ministry of Energy Transition and Water Transformation (PETRA) and Suruhanjaya Tenaga (ST) launched the LSS6–Hybrid competitive bidding programme to procure **2,500 MWa.c.** of Large Scale Solar paired with **1,250 MWa.c. / 5,000 MWh** of Battery Energy Storage Systems (BESS) across Peninsular Malaysia.

The platform provides comprehensive site feasibility screening across **48 Peninsular Malaysia Pencawang Masuk Utama (PMU)** grid substations (38 x 132kV and 10 x 275kV). It integrates real-time vector proximity math, 12-month historical satellite Global Horizontal Irradiation (GHI) solar yield curves (P50/P90), cadastral land title & acquisition CapEx modeling, PLANMalaysia land zoning overlays, and server-side **Gemini AI** technical synthesis.

---

## 📋 RFP LSS6–Hybrid Package Structures & Eligibility

### Package 1: Major Utility Hybrid Scale
- **LSS Export Capacity**: > 100 MWa.c. up to 250 MWa.c. (Total Procurement: **1,100 MWa.c.**)
- **Co-Located BESS**: > 50 MWa.c. – 250 MWa.c. (4-Hour Duration, 1:4 MW:MWh ratio e.g., 100 MW / 400 MWh)
- **Solar Facility Installed Capacity**: Minimum 2x Export Capacity (e.g. 200 MWa.c. / ~250 MWp d.c.)
- **Equity Requirement**: Minimum **51% Malaysian Equity Ownership** (Single Company or Consortium). Foreign participation capped at **49%**.
- **Bid Bond (Tender Guarantee)**: **RM 3,000,000.00**
- **Substitute Bond**: **RM 15,000,000.00** (submitted within 14 days of PPA execution)

### Package 2: Medium Utility Hybrid Scale (Bumiputera Gateway)
- **LSS Export Capacity**: 60 MWa.c. up to 100 MWa.c. (Total Procurement: **150 MWa.c.**)
- **Co-Located BESS**: 30 MWa.c. – 50 MWa.c. (4-Hour Duration, 1:4 MW:MWh ratio e.g., 30 MW / 120 MWh)
- **Solar Facility Installed Capacity**: Minimum 2x Export Capacity (e.g. 60 MWa.c. / ~75 MWp d.c.)
- **Equity Requirement**: Minimum **60% Bumiputera Equity Ownership** (Single Company or Consortium). Foreign participation capped at **49%**.
- **Bid Bond (Tender Guarantee)**: **RM 1,000,000.00**
- **Substitute Bond**: **RM 5,000,000.00** (submitted within 14 days of PPA execution)

---

## 📅 Official Procurement Schedule & Critical Milestones

| Milestone Activity | Key Deadline / Target Date |
| :--- | :--- |
| **RFP Document Issuance Date** | 27 July 2026 |
| **Request for Clarification Period** | Until 21 August 2026 (via lss6@st.gov.my) |
| **Bid Closing Submission Date** | **27 October 2026 @ 3:00 PM** |
| **Notification to Shortlisted Bidders** | January 2027 |
| **PPA Execution with TNB** | Within 6 months from Shortlist Notice (21-Year Term) |
| **Scheduled Financial Close Date (SFCD)** | Within 16 months from Shortlist Notice |
| **Optional Interim BESS (IBSS) Commencement** | **No later than 1 August 2028** (3 - 6 months early operation) |
| **SCOD (with Interim BESS)** | **No later than 1 March 2029** |
| **SCOD (without Interim BESS)** | **No later than 1 December 2029** |

---

## 🏗️ Technical Operating Principles & 2:1:4 Architecture

1. **Mandatory 2:1:4 Capacity Ratio**:
   - Installed Solar Facility Capacity (a.c.) ≥ 2x BESS Power Rating AND ≥ 2x Export Capacity.
   - BESS Energy Capacity (MWh) ≥ 4x BESS Power Rating (4 Hours Duration).
2. **Daily Charge/Discharge Profile**:
   - Simultaneous daytime grid export and BESS charging during the solar window.
   - Night peak dispatch into the TNB Grid as instructed by the Grid System Operator.
   - Cycling Regime: 1 full charge-discharge cycle/day, **maximum 380 cycles/year**.
3. **Minimum Solar Capacity Factor Floor**:
   - Minimum **16.0% annual Capacity Factor** required across the entire 21-year PPA term (ST Clause 11.1.1).
4. **Guaranteed BESS SOH & Efficiency**:
   - BESS State of Health (SOH) baseline: Year 1 = 100%, Year 2 = 95%, Year 10 = 80%, Year 21 = 70%.
   - Minimum Round-Trip Efficiency (RTE) at Interconnection Point: **85.0%**.

---

## 📐 Price Evaluation & Merit Points Adjustment

Evaluated Bid Price is adjusted using the official Merit Score Matrix:

$$\\text{Comparative Price} = \\text{Bid Price} \\times \\frac{100 - \\text{Total Merit Score}}{100}$$

1. **Early SCOD Merit Score**: **0.5 Merit Points per full month** for SCOD proposed earlier than the 1 March 2029 / 1 December 2029 deadline.
2. **Local Content Merit Score**:
   - Mandatory minimum Local Content: **20% of Total Project CAPEX**.
   - **2 Merit Points** awarded if Local Content exceeds **30%** AND uses locally manufactured PV modules with a valid MIDA Manufacturing License.

---

## 🛑 Cadastral Land & PLANMalaysia Zoning Compliance Policy

### 1. Strict Urban Residential Exclusion
- **Residential & Housing Schemes EXCLUDED**: In compliance with PLANMalaysia LSS Guidelines and Energy Commission rules, utility-scale solar farms are **strictly forbidden** on residential or housing land.
- **Mandatory Buffer**: All proposed candidate plots in this platform maintain a verified **>3.0 km buffer** (minimum 500m mandatory) from any residential settlement to eliminate glint, glare, and acoustic impacts.

### 2. Permanent Reserved Forest Prohibition (ST Clause 6.1)
- Sites located inside Permanent Reserved Forests (*Hutan Simpan Kekal*) are strictly rejected unless accompanied by explicit written state authority approval.

### 3. Permitted Land Categories
- **Agricultural Land** (*Tanaman Pertanian* / Oil Palm / Rubber) requiring Title Conversion under National Land Code (NLC 1965) Section 124 to Utility use (*Syarat Khas Stesen Janakuasa Solar*).
- **Former Mining Land** (*Bekas Perlombongan* / Tin Reclamation).
- **Unutilized Scrubland** (*Semak Samun* / Idle Land).
- **Water Bodies / Reservoirs** for Floating Solar PV.

### 4. Candidate Land Envelope vs. Single JUPEM Lot Title Discrepancies
- **Gross Contiguous Land Envelope**: A 75 MWp solar farm requires ~280 acres (~113 Ha). In Malaysian land records (JUPEM NDCDB), an individual registered lot number (e.g. Lot 6249) is often a sub-divided agricultural lot of 10–30 acres within a master plantation block. The 280-acre plot generated by the platform represents a **gross contiguous land envelope** spanning a cluster of adjoining lots in that Mukim.
- **Lot Amalgamation**: Solar developers in Malaysia combine adjacent lots (e.g. Lot 6249 + Lot 6250 + Lot 6251) to achieve the required 280-acre solar footprint.
- **User Custom Lot Input**: Developers can click **"Edit / Input Land Data"** inside the Feasibility Study modal or use the **Custom Location Calculator** tab to override lot numbers, title types, and exact verified acreage from their Pejabat Tanah dan Galian (PTG) title search.

### 5. Full-Screen GIS Map Navigation, JUPEM Overlays & D3 Risk Heatmap
- **Full Screen GIS Exploration**: Immersive full-screen map mode with 'ESC' keyboard exit, top-right HUD quick action controls, and one-click toggle to show or hide the LSS6 legend and floating map panels for unobstructed spatial viewing.
- **JUPEM Land Use Overlay**: Real-time vector layers of Jabatan Ukur dan Pemetaan Malaysia (JUPEM 2026) cadastral zones across 5 categories: Agricultural (*Pertanian*), Industrial (*Perindustrian*), Forest Reserve (*Hutan Simpan*), Water Catchment (*Tadahan Air*), and Commercial (*Komersial*).
- **D3 Geospatial Risk Heatmap**: Animated D3.js density heatmap visualizing DEM slope angles, JPS flood history, and forest reserve buffers.
- **PMU Navigation Dropdowns**: Seamless PMU node selectors on Navbar, Node Details panel, Proposed Lands list, and PMU Capacity Table across all 48 Peninsular Malaysia PMU substations (e.g. LILO Kerayong - Kg. Awah, PMU Chukai, PMU Bakri).

---

## ⚡ Grid Interconnection Technical Benchmarks

| Parameter | 132 kV PMU Grid Connection | 275 kV PMU Grid Connection |
| :--- | :--- | :--- |
| **Export Capacity Target** | 50 MW – 100 MW | 100 MW – 250 MW |
| **Transmission Line Cost** | RM 1.20 Million / km | RM 2.40 Million / km |
| **Substation Bay Extension** | RM 8.50 Million | RM 14.50 Million |
| **Conductive Line Loss** | ~ 0.28% / km | ~ 0.14% / km |
| **BESS Storage Spec (4-Hr)** | 30 MW / 120 MWh BESS | 100 MW / 400 MWh BESS |

---

## 🛠️ Tech Stack & Platform Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **GIS Mapping**: Leaflet, OpenStreetMap Tile Engine, HTML5 Canvas Rasterizer, D3.js (Geospatial Risk Heatmap)
- **Financial & Yield Analytics**: Recharts
- **A4 PDF Engine**: jsPDF
- **Backend Service**: Node.js, Express server proxying Google Gemini API (/api/generate-feasibility-report)
- **Icons**: Lucide React

---

*Malaysia LSS6-Hybrid Site Intelligence Platform © 2026. Official Grid Reference: TNB Pencawang Masuk Utama Database.*
`;

  const blob = new Blob([readmeContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'README_LSS6_HYBRID_ST_TOR_DOCUMENTATION.md');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper utility to export the entire README document into a beautifully formatted A4 PDF
 * aligned with the Suruhanjaya Tenaga RFP LSS6-Hybrid TOR document.
 */
export function exportPlatformReadmePdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = margin;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    // Top banner strip
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 10, 'F');
    doc.setTextColor(245, 158, 11); // amber-500
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('MALAYSIA LSS6-HYBRID SITE INTELLIGENCE PLATFORM • ST RFP TOR COMPLIANCE', margin, 6.5);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('REF: ST(IP/EMP/SSCP) 12/1/12 (6) • 27 JULY 2026', pageWidth - margin, 6.5, { align: 'right' });

    // Bottom footer strip
    const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
    doc.setFillColor(241, 245, 249);
    doc.rect(0, pageHeight - 9, pageWidth, 9, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(0, pageHeight - 9, pageWidth, pageHeight - 9);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Suruhanjaya Tenaga LSS6-Hybrid PMU Engine © 2026', margin, pageHeight - 3.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${pageCount}`, pageWidth - margin, pageHeight - 3.5, { align: 'right' });
  };

  // Initial Header
  drawHeaderFooter();
  y += 10;

  // Title Card Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setFillColor(245, 158, 11);
  doc.rect(margin, y, 3.5, 26, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Malaysia LSS6-Hybrid Site Intelligence Platform', margin + 6, y + 8);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Energy Commission (Suruhanjaya Tenaga) LSS6–Hybrid RFP TOR & Cadastral GIS Documentation', margin + 6, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('Official Ref: ST(IP/EMP/SSCP) 12/1/12 (6) • 27 July 2026 • Peninsular Malaysia (48 PMU Substations)', margin + 6, y + 20);

  y += 30;

  // 1. Executive Summary & RFP Scope
  checkPageBreak(30);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('1. EXECUTIVE SUMMARY & ST RFP MANDATE', margin + 3, y + 4.2);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const execText =
    "The Ministry of Energy Transition and Water Transformation (PETRA) and Suruhanjaya Tenaga (ST) announced the LSS6–Hybrid procurement programme to procure 2,500 MWa.c. of Large Scale Solar paired with 1,250 MWa.c. / 5,000 MWh of BESS (4-Hour Duration) across Peninsular Malaysia.\n\nThe Malaysia LSS6-Hybrid Site Intelligence Platform provides full GIS and financial feasibility screening across 48 Pencawang Masuk Utama (PMU) substations (38 x 132kV and 10 x 275kV). The system incorporates satellite solar yield curves (P50/P90), cadastral land acquisition CapEx, JPS flood history, PLANMalaysia zoning policies, and server-side Gemini AI synthesis.";

  const splitExec = doc.splitTextToSize(execText, contentWidth - 4);
  doc.text(splitExec, margin + 2, y);
  y += splitExec.length * 4.0 + 6;

  // 2. Package Structures Table
  checkPageBreak(45);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('2. ST RFP LSS6–HYBRID PACKAGE STRUCTURES & ELIGIBILITY', margin + 3, y + 4.2);
  y += 8;

  const pkgData = [
    ['Export Capacity (LSS)', '> 100 MWa.c. – 250 MWa.c.', '60 MWa.c. – 100 MWa.c.'],
    ['BESS Capacity (4-Hour)', '> 50 MWa.c. – 250 MWa.c. / 1000MWh', '30 MWa.c. – 50 MWa.c. / 200MWh'],
    ['Installed Solar PV (a.c.)', '> 200 MWa.c. – 500 MWa.c.', '60 MWa.c. – 100 MWa.c.'],
    ['Total Procurement Pool', '1,100 MWa.c.', '150 MWa.c.'],
    ['Equity Structure Gate', 'Min 51% Malaysian Equity', 'Min 60% Bumiputera Equity'],
    ['Foreign Partner Stake', 'Max 49% Foreign Equity', 'Max 49% Foreign Equity'],
    ['Tender Guarantee (Bid Bond)', 'RM 3,000,000.00', 'RM 1,000,000.00'],
    ['Substitute Performance Bond', 'RM 15,000,000.00', 'RM 5,000,000.00'],
  ];

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PARAMETER / REQUIREMENT', margin + 3, y + 3.8);
  doc.text('PACKAGE 1 (MAJOR UTILITY)', margin + 65, y + 3.8);
  doc.text('PACKAGE 2 (BUMIPUTERA GATEWAY)', margin + 125, y + 3.8);
  y += 5.5;

  pkgData.forEach(([param, p1, p2], i) => {
    checkPageBreak(5.5);
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(param, margin + 3, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129); // emerald
    doc.text(p1, margin + 65, y + 3.8);

    doc.setTextColor(147, 51, 234); // purple
    doc.text(p2, margin + 125, y + 3.8);

    y += 5.5;
  });

  y += 6;

  // 3. Official Procurement Schedule
  checkPageBreak(45);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('3. OFFICIAL PROCUREMENT TIMELINE & MILESTONES', margin + 3, y + 4.2);
  y += 8;

  const timelineData = [
    ['Issuance of RFP Document', '27 July 2026', 'ST RFP Publication Date'],
    ['Clarification Window', 'Until 21 August 2026', 'Enquiries via lss6@st.gov.my'],
    ['Bid Closing Date', '27 October 2026 @ 3:00 PM', 'Hardcopy & USB 3-Box System Submission'],
    ['Shortlisting Announcement', 'January 2027', 'Issuance of Notification to Shortlisted Bidder'],
    ['PPA Execution with TNB', 'July 2027 (Within 6 months)', '21-Year Fixed Power Purchase Agreement'],
    ['Scheduled Financial Close (SFCD)', 'May 2028 (Within 16 months)', 'Financial Close & Substitute Bond Lodgement'],
    ['Optional Interim BESS (IBSS)', '1 August 2028', '3 to 6 Months Standalone Grid Operation'],
    ['SCOD (with Interim BESS)', '1 March 2029', 'Full Hybrid Plant Commercial Operation'],
    ['SCOD (without Interim BESS)', '1 December 2029', 'Standard Commercial Operation Deadline'],
  ];

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('MILESTONE EVENT', margin + 3, y + 3.8);
  doc.text('TARGET DATE', margin + 65, y + 3.8);
  doc.text('REMARKS / MANDATE', margin + 125, y + 3.8);
  y += 5.5;

  timelineData.forEach(([evt, dt, rem], i) => {
    checkPageBreak(5.5);
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(evt, margin + 3, y + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6); // amber
    doc.text(dt, margin + 65, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(rem, margin + 125, y + 3.8);

    y += 5.5;
  });

  y += 6;

  // 4. Land Exclusion Policy & PLANMalaysia Alignment
  checkPageBreak(40);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('4. CADASTRAL LAND & PLANMALAYSIA ZONING COMPLIANCE POLICY', margin + 3, y + 4.2);
  y += 8;

  const landPolicies = [
    {
      title: 'Strict Urban Residential Exclusion & Buffer',
      desc: 'Utility solar developments are strictly excluded from residential and housing scheme zones under PLANMalaysia guidelines. All proposed plots in this platform maintain a verified >3.0 km distance from urban residential settlements to prevent glint, glare, and noise.',
    },
    {
      title: 'Permanent Reserved Forest Prohibition (ST Clause 6.1)',
      desc: 'Sites inside Permanent Reserved Forests (Hutan Simpan Kekal) are strictly prohibited and automatically disqualified unless backed by official State Executive Council written de-gazettement.',
    },
    {
      title: 'Permitted Agriculture Title Conversion (NLC Sec 124)',
      desc: 'Agricultural land (Oil Palm / Rubber / Idle) is permitted subject to state PTG title conversion from Agriculture to Utility use (Syarat Khas Stesen Janakuasa Solar).',
    },
    {
      title: 'Brownfield & Former Mining Reclamation',
      desc: 'Former tin mining land, unproductive scrubland, and industrial buffer zones receive high priority for rapid PTG development order approval.',
    },
  ];

  landPolicies.forEach((pol, idx) => {
    checkPageBreak(12);
    doc.setFillColor(245, 158, 11);
    doc.circle(margin + 3, y + 1.5, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${pol.title}`, margin + 7, y + 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const descLines = doc.splitTextToSize(pol.desc, contentWidth - 8);
    doc.text(descLines, margin + 7, y + 6);
    y += descLines.length * 3.8 + 4;
  });

  y += 4;

  // 5. Technical Benchmarks & Merit Scores
  checkPageBreak(40);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('5. TECHNICAL OPERATING BENCHMARKS & MERIT SCORES', margin + 3, y + 4.2);
  y += 8;

  const techRules = [
    ['Mandatory 2:1:4 Ratio', 'Solar Installed (a.c.) ≥ 2x Export Capacity & ≥ 2x BESS Power (MW). BESS MWh ≥ 4x BESS MW.'],
    ['Solar Capacity Factor Floor', 'Minimum 16.0% annual Capacity Factor required across all 21 PPA years (ST Clause 11.1.1).'],
    ['BESS Round-Trip Efficiency', 'Minimum 85.0% RTE measured at Interconnection Point. Annual SOH degradation tracked.'],
    ['Early SCOD Merit Points', '0.5 Merit Points awarded per full month proposed earlier than SCOD deadline.'],
    ['Local Content Merit Points', 'Mandatory 20% CAPEX min. 2 Merit Points if >30% CAPEX with MIDA local PV module license.'],
  ];

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TECHNICAL / MERIT RULE', margin + 3, y + 3.8);
  doc.text('ST RFP LSS6–HYBRID SPECIFICATION', margin + 55, y + 3.8);
  y += 5.5;

  techRules.forEach(([rule, spec], i) => {
    checkPageBreak(5.5);
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(rule, margin + 3, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(spec, margin + 55, y + 3.8);

    y += 5.5;
  });

  y += 8;

  // Save the PDF document
  doc.save('README_LSS6_HYBRID_ST_TOR_DOCUMENTATION.pdf');
}
