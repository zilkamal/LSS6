# Malaysia LSS6 Solar & Hybrid Site Intelligence Platform

An enterprise-grade GIS intelligence and site suitability platform designed for Malaysia's Large Scale Solar 6 (LSS6) and LSS-Hybrid renewable energy tenders launched by the Ministry of Energy Transition and Water Transformation (PETRA) and Suruhanjaya Tenaga (ST). 

The platform automates site screening, cadastral title lookup (JUPEM 2026), JPS DID flood inundation & hydrology modeling, Digital Elevation Model (DEM) slope analysis, Global Solar Atlas (GHI) irradiance curves, grid evacuation routing to 48 TNB transmission PMUs & 60 designated 33kV distribution nodes, financial & sensitivity modeling, and multi-page engineering feasibility PDF study generation.

Official Reference: **ST(IP/EMP/SSCP) 12/1/12 (6)** | Program Investment Pool: **RM 13 – 15 Billion**

---

## ⚡ PETRA LSS6 Official Program Parameters & 3 Tender Packages

The platform supports dedicated workflows and datasets for all 3 official tender packages:

```
+---------------------------------------------------------------------------------------------------------+
|                                    MALAYSIA LSS6 TENDER PROGRAM OVERVIEW                                |
+-----------------------+---------------------------------------+-----------------------------------------+
| Parameter             | Packages 1 & 2 (Hybrid RFP)           | Package 3 (LSS-Solar RFP)               |
+-----------------------+---------------------------------------+-----------------------------------------+
| Project Type          | Solar PV + Battery Storage (BESS)     | Solar PV Only (No BESS Required)        |
| Target Participants   | Pkg 1: Open / Pkg 2: Bumiputera       | Pkg 3: Bumiputera Only                  |
| Total Program Quota   | 1,250 MWa.c. (2,500 MW Solar + BESS)  | 150 MWa.c. (Solar Only)                 |
| Bidding Scale         | 60 MWa.c. to 500 MWa.c.               | 10 MWa.c. to 30 MWa.c.                  |
| Interconnection Level | 132 kV or 275 kV Transmission Grid    | 33 kV and below (Distribution Network)  |
| Official Grid Nodes   | 48 Transmission PMUs (132kV/275kV)    | 60 Designated 33kV Distribution Points  |
| EPC Benchmark Cost    | RM 2.65M / MWp + BESS (RM 0.82M/MWh)  | RM 2.45M / MWp (Solar EPC Only)         |
| Operating Ratio       | Mandatory 2:1:4 (Solar:BESS MW:MWh)   | 100% Direct Solar PV Grid Injection     |
| Target COD Deadline   | 1 March 2029 (IBSS) / 1 Dec 2029      | 31 December 2029                        |
+-----------------------+---------------------------------------+-----------------------------------------+
```

---

## 🏛️ System Architecture

```
+---------------------------------------------------------------------------------------------------------------+
|                                  MALAYSIA LSS6 SITE INTELLIGENCE SYSTEM ARCHITECTURE                          |
+---------------------------------------------------------------------------------------------------------------+
|                                                                                                               |
|   +---------------------------------------+            +--------------------------------------------------+   |
|   |         USER INTERFACE LAYER          |            |              GIS & DATA LAYER                    |   |
|   |  - Program Switcher (Hybrid / Pkg 3)  | <--------> |  - 48 Hybrid PMUs (132kV / 275kV Transmission)   |   |
|   |  - Fullscreen GIS Map + HUD Controls  |            |  - 60 Package 3 PMU Nodes (33kV Distribution)    |   |
|   |  - Dual-Variable Sensitivity Matrix   |            |  - JUPEM 2026 Land Cadastral Zones (5 Classes)   |   |
|   |  - Custom Land & Pinpoint Analyzer    |            |  - JPS DID Flood Inundation & Hydrology Engine   |   |
|   |  - PMU Headroom Capacity Table        |            |  - Global Solar Atlas GHI Irradiance Engine      |   |
|   |  - LSS6 Bidding Wizard & RFP Tracker  |            |  - DEM Altitude & Topographic Slope Model        |   |
|   +---------------------------------------+            +--------------------------------------------------+   |
|                      |                                                          |                             |
|                      v                                                          v                             |
|   +---------------------------------------+            +--------------------------------------------------+   |
|   |      FINANCIAL & LCOE ENGINE          |            |          PDF REPORT & EXPORT GENERATOR           |   |
|   |  - Package 1/2 vs Package 3 Modeling  |            |  - jsPDF Multi-Page Feasibility Report (7 Pages) |   |
|   |  - 33kV / 132kV / 275kV Wayleave Math |            |  - ST RFP TOR Formatted PDF & Readme Exporter    |   |
|   |  - DSCR, Equity IRR, NPV, Payback     |            |  - OpenStreetMap Vector Canvas Map Render        |   |
|   |  - Real-time CapEx Adjustments        |            |  - Full Financial Statement & Cashflow Matrix    |   |
|   +---------------------------------------+            +--------------------------------------------------+   |
|                      |                                                          |                             |
|                      +----------------------------+-----------------------------+                             |
|                                                   |                                                           |
|                                                   v                                                           |
|                         +---------------------------------------------------+                                 |
|                         |            EXPRESS BACKEND PROXY SERVER           |                                 |
|                         |       - API Endpoint: /api/generate-feasibility   |                                 |
|                         |       - Endpoint: /api/generate-feasibility-report|                                 |
|                         |       - Secure Environment Key Management (Node)  |                                 |
|                         +---------------------------------------------------+                                 |
|                                                   |                                                           |
|                                                   v                                                           |
|                         +---------------------------------------------------+                                 |
|                         |         GOOGLE GEMINI AI SYNTHESIS ENGINE         |                                 |
|                         |           - @google/genai TypeScript SDK          |                                 |
|                         |           - JSON Schema Strict Parsing Output     |                                 |
|                         |           - Engineering Risk & Mitigation Matrix  |                                 |
|                         |           - ST/TNB Regulatory Permitting Review   |                                 |
|                         +---------------------------------------------------+                                 |
+---------------------------------------------------------------------------------------------------------------+
```

---

## 🌟 Key Platform Capabilities

### 🗺️ Full-Screen GIS & Leaflet Exploration
- **Full Screen Toggle**: Instant one-click fullscreen expansion (`Maximize2` / `Minimize2` or `Esc`) allowing deep spatial inspection across Peninsular Malaysia.
- **HUD & Legend Control**: Toggle the LSS6 Legend, JUPEM Land Layers, D3 Heatmap, and Floating HUD Panels with a single click to maximize visible map real estate.
- **Dynamic 3-Tier Voltage Coloring**:
  - 🔵 **33 kV Distribution Nodes**: Cyan/Blue markers with 33kV distribution badges (Package 3).
  - 🟢 **132 kV Substations**: Emerald markers for standard transmission injection (Hybrid).
  - 🟣 **275 kV Extra-High Voltage**: Purple markers for large-scale transmission injection (Hybrid).
- **Proximity Buffer Circles**: Interactive 5 km, 10 km, 20 km, and 30 km radius rings centered on PMU substations to calculate transmission losses and cable wayleave costs.

### 🌐 Package 3 (LSS6-Solar for Bumiputera) Dedicated Features
- **Separate Program Landing Page / Modal**: Seamlessly toggle between **Packages 1 & 2 (Hybrid)** and **Package 3 (LSS-Solar)**.
- **60 Official 33kV Distribution Substation Points**: Covers all designated 33kV nodes across Kedah, Penang, Perak, Selangor, Kuala Lumpur, Negeri Sembilan, Melaka, Johor, Pahang, Terengganu, Kelantan, and Perlis (including PMU Guthrie, PMU Tikam Batu, PMU Mergong 33kV, PMU Pekan, PMU Kluang, and more).
- **Package 3 Financial Engine**: Tailored for Solar-only installations (10 MW to 30 MW) with zero BESS CapEx, RM 2.45M/MWp EPC benchmark, and lower 33kV interconnection rates (RM 550k/km).

### 📊 Financial Sensitivity & Interactive Matrix
- **Dual-Variable Sensitivity Table**: Live sensitivity matrix analyzing project Equity IRR and LCOE across Capex variations (-10% to +10%) and Tariff variations (RM 0.18 to RM 0.28 / kWh).
- **Custom Scenario Sliders**: Real-time slider controls for Tariff, CapEx, OpEx, Debt Interest Rate, and Target Capacity.
- **Comprehensive Key Metrics**: Instant computation of Equity IRR, Project NPV, Simple Payback Period, Levelized Cost of Electricity (LCOE), and Minimum Debt Service Coverage Ratio (DSCR).

### 📄 Multi-Page Detailed Feasibility Study (PDF & Print)
- **7-Page Comprehensive PDF Report Structure**:
  1. **Executive Cover Page & Scorecard**: AI Suitability Index, site location, capacity rating, and key KPIs.
  2. **OpenStreetMap GIS & Cadastral Site Overlay**: Dedicated map page with site boundary vectors, GPS coordinates, and PMU interconnection route map.
  3. **Cadastral Title & Land Acquisition Matrix**: Lot number, Mukim/District, ownership type, land title tenure, restrictions in interest, and acquisition CapEx.
  4. **JPS DID Historical Flood & Hydrology Risk Assessment**: 50-year ARI inundation depth, monsoon disaster history, river catchment analysis, recommended PV pile elevation (+m AGL), and flood mitigation CapEx.
  5. **Topography (DEM), Slope & Environmental Buffer Screening**: Digital Elevation Model altitude, slope angle (>15° exclusion zone), NDVI vegetation index, permanent forest reserve distance, and EIA screening category.
  6. **Grid Interconnection & Financial Investment Model**: Distance to PMU, estimated cable route length, tariff/LCOE breakdown, equity IRR projections, and component CapEx matrix.
  7. **Gemini AI Technical Synthesis & Regulatory Matrix**: Executive engineering summary, risk matrix with severity & mitigation, and ST/TNB regulatory permitting checklist.

---

## 🛑 Cadastral Land & PLANMalaysia Zoning Compliance Policy

1. **Strict Urban Residential Exclusion**: All proposed candidate plots maintain a verified **>3.0 km buffer** (minimum 500m mandatory) from any residential settlement to eliminate glint, glare, and acoustic impacts.
2. **Permanent Reserved Forest Prohibition (ST Clause 6.1)**: Sites inside Permanent Reserved Forests (*Hutan Simpan Kekal*) are strictly rejected unless accompanied by explicit written state authority de-gazettement.
3. **Permitted Agriculture Title Conversion (NLC Sec 124)**: Agricultural land (*Tanaman Pertanian*) is converted to utility use (*Syarat Khas Stesen Janakuasa Solar*).
4. **Brownfield & Mining Reclamation**: Former tin mining land (*Bekas Perlombongan*) and unutilized scrubland (*Semak Samun*) receive top priority for rapid PTG development order approval.

---

## ⚡ Grid Interconnection Technical Benchmarks

| Parameter | 33 kV Distribution Grid (Pkg 3) | 132 kV Transmission Grid | 275 kV Transmission Grid |
| :--- | :--- | :--- | :--- |
| **Export Capacity Target** | 10 MW – 30 MW | 50 MW – 100 MW | 100 MW – 250 MW |
| **Transmission Line Cost** | RM 0.55 Million / km | RM 1.20 Million / km | RM 2.40 Million / km |
| **Substation Bay Extension** | RM 3.50 Million | RM 8.50 Million | RM 14.50 Million |
| **Conductive Line Loss** | ~ 0.45% / km | ~ 0.28% / km | ~ 0.14% / km |
| **BESS Storage Spec (4-Hr)** | Not Required (0 MWh) | 30 MW / 120 MWh BESS | 100 MW / 400 MWh BESS |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons
- **GIS Mapping**: Leaflet, OpenStreetMap Tile Engine, HTML5 Canvas Rasterizer, D3.js (Geospatial Risk Heatmap)
- **Document Generation**: jsPDF (Sequential multi-page PDF rendering)
- **AI Integration**: Express + Vite full-stack server proxy for Gemini API (`/api/generate-feasibility-report`)

---

## 💻 Getting Started & Usage

### 1. Installation
```bash
npm install
```

### 2. Development Mode
```bash
npm run dev
```
The server will start on port `3000`.

### 3. Production Build
```bash
npm run build
npm start
```
