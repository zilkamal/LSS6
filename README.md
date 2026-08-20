# Malaysia LSS6 Solar & Hybrid Site Intelligence Platform

An enterprise-grade GIS intelligence and site suitability platform designed for Malaysia's Large Scale Solar 6 (LSS6) and LSS-Hybrid renewable energy tenders launched by the Ministry of Energy Transition and Water Transformation (PETRA) and Suruhanjaya Tenaga (ST). The platform automates site screening, cadastral title lookup, JUPEM land use overlays, JPS DID flood risk modeling, solar irradiance (GHI) analysis, grid evacuation routing to TNB PMU substations, financial & sensitivity modeling, and comprehensive multi-page feasibility study generation.

---

## ⚡ PETRA LSS6 Official Program Parameters & 3 Tender Packages

The Ministry of Energy Transition and Water Transformation (PETRA) and Suruhanjaya Tenaga (ST) have structured the LSS6 bidding exercise with an expected private investment of **RM 13 Billion to RM 15 Billion**. The platform supports dedicated workflows and datasets for all 3 tender packages:

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
| Official PMU Nodes    | 48 Transmission Substations           | 60 Designated Distribution PMU Points   |
| EPC Benchmark Cost    | RM 2.65M / MWp + BESS (RM 1.2M/MWh)   | RM 2.45M / MWp (Solar EPC Only)         |
| Target COD Deadline   | 31 December 2029                      | 31 December 2029                        |
+-----------------------+---------------------------------------+-----------------------------------------+
```

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------------------------------------------+
|                                  MALAYSIA LSS6 SITE INTELLIGENCE SYSTEM ARCHITECTURE                      |
+-----------------------------------------------------------------------------------------------------------+
|                                                                                                           |
|   +----------------------------------+          +-----------------------------------------------------+   |
|   |         USER INTERFACE           |          |               GIS & DATA ENGINE                     |   |
|   |  - Program Switcher (Hybrid/Pkg3)| <------> |  - 48 Hybrid PMUs (132kV / 275kV)                   |   |
|   |  - Fullscreen GIS Map + HUD      |          |  - 60 Package 3 PMUs (33kV Distribution)            |   |
|   |  - Sensitivity & Financial Matrix|          |  - JUPEM 2026 Land Cadastral Zones (5 Classes)      |   |
|   |  - PMU Headroom Capacity Table   |          |  - JPS DID Flood Inundation & Hydrology Modeling    |   |
|   |  - Land Parcel Candidate Drawers |          |  - Global Solar Atlas GHI Irradiance Engine         |   |
|   +----------------------------------+          +-----------------------------------------------------+   |
|                     |                                                      |                              |
|                     v                                                      v                              |
|   +----------------------------------+          +-----------------------------------------------------+   |
|   |    FINANCIAL & LCOE CALCULATOR   |          |           PDF REPORT & EXPORT GENERATOR             |   |
|   |  - Solar-Only vs Hybrid Capex    |          |  - jsPDF Multi-Page Feasibility Report (7 Pages)    |   |
|   |  - 33kV / 132kV / 275kV Wayleave |          |  - OpenStreetMap Vector Canvas Map Render           |   |
|   |  - DSCR, Equity IRR, NPV, Payback|          |  - Full Financial Statement & Cashflow Matrix       |   |
|   +----------------------------------+          +-----------------------------------------------------+   |
|                     |                                                      |                              |
|                     +--------------------------+---------------------------+                              |
|                                                |                                                          |
|                                                v                                                          |
|                        +-----------------------------------------------+                                  |
|                        |          EXPRESS BACKEND PROXY SERVER         |                                  |
|                        |       - API Endpoint: /api/generate-feasibility|                                 |
|                        |       - Secure Environment Key Management     |                                  |
|                        +-----------------------------------------------+                                  |
|                                                |                                                          |
|                                                v                                                          |
|                        +-----------------------------------------------+                                  |
|                        |       GOOGLE GEMINI AI SYNTHESIS ENGINE       |                                  |
|                        |         - @google/genai (Gemini 2.5)          |                                  |
|                        |         - Automated Technical Executive Brief |                                  |
|                        |         - Regulatory Compliance Matrix        |                                  |
|                        +-----------------------------------------------+                                  |
+-----------------------------------------------------------------------------------------------------------+
```

---

## 🌟 Key Platform Capabilities

### 🗺️ Full-Screen GIS & OpenStreetMap Exploration
- **Full Screen Toggle**: Instant one-click fullscreen expansion (`Maximize2` / `Minimize2` or `Esc`) allowing deep spatial inspection across Peninsular Malaysia.
- **HUD & Legend Control**: Toggle the LSS6 Legend, JUPEM Land Layers, D3 Heatmap, and Floating HUD Panels with a single click to maximize visible map real estate.
- **Dynamic 3-Tier Voltage Coloring**:
  - 🔵 **33 kV PMU Points**: Cyan/Blue markers with 33kV distribution badges (Package 3).
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

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons
- **Mapping & GIS**: Leaflet, OpenStreetMap Tile Engine, HTML5 Canvas Rasterizer, D3.js (Geospatial Risk Heatmap)
- **Document Generation**: jsPDF (Sequential multi-page PDF rendering)
- **AI Integration**: Express + Vite full-stack server proxy for Gemini 2.5 API (`/api/generate-feasibility-report`)

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
