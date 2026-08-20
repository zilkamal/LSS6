import React, { useState } from 'react';
import {
  X,
  Layers,
  Cpu,
  Database,
  Zap,
  Download,
  CheckCircle2,
  GitBranch,
  ShieldCheck,
  BarChart3,
  Sparkles,
  FileText,
  MapPin,
  Compass,
  ArrowRight,
  Server,
} from 'lucide-react';
import { downloadPlatformReadme } from '../utils/readmeDownloader';

interface SystemArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'schematic' | 'scoring' | 'techspecs' | 'api'>('schematic');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-300 w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Banner */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 text-slate-950 font-black rounded flex items-center justify-center text-xl shadow-xs">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-mono">
                  System Architecture & Technical Schematics
                </span>
                <span className="bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono">
                  v2.5 Full Stack
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">LSS6-Hybrid Site Intelligence Platform Architecture</h2>
              <p className="text-xs text-slate-300 font-mono">
                GIS Spatial Engine &bull; Gemini AI Pipeline &bull; Cadastral CapEx &bull; Grid Interconnection Model
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadPlatformReadme()}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded text-xs transition-colors shadow-xs font-mono"
            >
              <Download className="w-4 h-4" /> Download README.md
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('schematic')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded font-bold transition-all ${
              activeTab === 'schematic' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" /> Pipeline Schematics Diagram
          </button>
          <button
            onClick={() => setActiveTab('scoring')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded font-bold transition-all ${
              activeTab === 'scoring' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> 7-Factor AI Scoring Algorithm
          </button>
          <button
            onClick={() => setActiveTab('techspecs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded font-bold transition-all ${
              activeTab === 'techspecs' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Grid & Solar Engineering Specs
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded font-bold transition-all ${
              activeTab === 'api' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" /> API & Server Endpoints
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 font-sans">
          {/* TAB 1: Pipeline Schematics Diagram */}
          {activeTab === 'schematic' && (
            <div className="space-y-6">
              <div className="bg-amber-50 p-4 rounded border border-amber-200 font-mono text-xs">
                <h4 className="font-bold text-amber-900 text-sm mb-1 uppercase flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-700" /> End-to-End System Processing Pipeline
                </h4>
                <p className="text-slate-700 text-xs">
                  How raw Peninsular Malaysia GIS dataset coordinates, TNB grid substation capacity, solar satellite GHI, and cadastral lot boundaries flow into Gemini AI synthesis and downloadable PDF reports.
                </p>
              </div>

              {/* Visual Flow Architecture Nodes */}
              <div className="space-y-4">
                {/* Stage 1 */}
                <div className="bg-slate-900 text-white p-4 rounded-lg shadow-sm border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Database className="w-4 h-4" /> Layer 1: Data Acquisition & GIS Ingestion
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded">
                      Static & Spatial GIS Layer
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">48 TNB PMU Substation Nodes</strong>
                      <p className="text-slate-400 text-[11px]">38 x 132kV (50-100MW) &bull; 10 x 275kV (100-250MW) with lat/lng coordinates and busbar capacities (including LILO Kerayong - Kg. Awah).</p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">JUPEM Cadastral Land Overlay</strong>
                      <p className="text-slate-400 text-[11px]">JUPEM (2026) vector zones: Agriculture, Industrial, Forest Reserve, Water Catchment & Commercial with auto-zoom bounds.</p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">Satellite Solar GHI</strong>
                      <p className="text-slate-400 text-[11px]">1,380 – 1,720 kWh/m²/year GHI database with 12-month historical profile curve.</p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">DEM & D3 Risk Heatmap</strong>
                      <p className="text-slate-400 text-[11px]">Digital Elevation Model (DEM) slope classification (&lt;3°, 3-8°, 8-15°, &gt;15°), D3 risk heatmap & Permanent Forest Reserve overlays.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center text-amber-500 font-bold">
                  <ArrowRight className="w-6 h-6 rotate-90 my-[-6px]" />
                </div>

                {/* Stage 2 */}
                <div className="bg-slate-900 text-white p-4 rounded-lg shadow-sm border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Compass className="w-4 h-4" /> Layer 2: Spatial Proximity & Cable Route Engine
                    </span>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30">
                      Real-Time Vector Math
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">Haversine Distance & Bearing</strong>
                      <p className="text-slate-400 text-[11px]">Computes exact geodesic distance (d) and compass direction angle (θ) between custom land pin and nearest PMU node.</p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">Cable Route Sinuous Factor</strong>
                      <p className="text-slate-400 text-[11px]">Applies 1.35x terrain wayleave multiplier to calculate realistic underground / overhead transmission cable length.</p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">Interconnection CapEx Pricing</strong>
                      <p className="text-slate-400 text-[11px]">RM 3.2M/km (132kV) or RM 5.5M/km (275kV) + RM 8.5M (132kV) / RM 15.0M (275kV) fixed substation bay switchgear & protection cost.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center text-amber-500 font-bold">
                  <ArrowRight className="w-6 h-6 rotate-90 my-[-6px]" />
                </div>

                {/* Stage 3 */}
                <div className="bg-slate-900 text-white p-4 rounded-lg shadow-sm border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Layer 3: Gemini AI Synthesis Pipeline
                    </span>
                    <span className="bg-purple-500/20 text-purple-300 text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30">
                      @google/genai Server SDK
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">Server Endpoint `/api/generate-feasibility-report`</strong>
                      <p className="text-slate-400 text-[11px]">Secure server-side API proxy calling Gemini model with JSON schema response enforcement.</p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">ST & TNB Regulatory Matrix</strong>
                      <p className="text-slate-400 text-[11px]">Generates compliance statuses for Suruhanjaya Tenaga (ST), DoE Preliminary EIA Category 2, and PTG NLC 124 land conversion.</p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">Risk Matrix & BESS Optimization</strong>
                      <p className="text-slate-400 text-[11px]">Synthesizes site-specific technical risks, mandatory 4-hour BESS battery sizing (1:4 MW:MWh ratio), and ESG carbon offsets.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center text-amber-500 font-bold">
                  <ArrowRight className="w-6 h-6 rotate-90 my-[-6px]" />
                </div>

                {/* Stage 4 */}
                <div className="bg-slate-900 text-white p-4 rounded-lg shadow-sm border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Layer 4: Client Visualization & PDF Export
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                      jsPDF + Recharts Output
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">Full-Screen GIS Map & HUD Controls</strong>
                      <p className="text-slate-400 text-[11px]">Full Screen exploration mode (ESC key exit), HUD Legend & Panel toggles, JUPEM land overlays, and direct PMU node navigation dropdowns.</p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">Recharts Analytics Dashboard</strong>
                      <p className="text-slate-400 text-[11px]">12-month GHI vs P50/P90 solar energy yield curves, state distribution bar charts, LCOE vs CapEx scatter plots.</p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                      <strong className="text-amber-300 block mb-1">A4 Technical PDF Feasibility Export</strong>
                      <p className="text-slate-400 text-[11px]">Generates multi-page formatted engineering PDF complete with cadastral land acquisition cost, P50/P90 tables, and AI risk synthesis.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 7-Factor AI Scoring Algorithm */}
          {activeTab === 'scoring' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-amber-50 p-4 rounded border border-amber-200">
                <h4 className="font-bold text-amber-900 text-sm mb-1 uppercase">7-Factor Weighted Land Suitability Algorithm (0 - 100)</h4>
                <p className="text-slate-700 text-xs">
                  Every candidate land parcel and dropped custom pin is evaluated against a strict multi-criteria decision matrix calibrated for LSS6 solar utility bidding.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <strong className="text-slate-900 font-bold">1. PMU Grid Proximity (25% Weight)</strong>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">25 Points Max</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Evaluates transmission cable distance to PMU node. Score decays by 8 points per kilometer from 0 km (100 pts) down to 10 points for distances &gt;11 km to minimize line loss and cable CapEx.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <strong className="text-slate-900 font-bold">2. Contiguous Land Acreage (20% Weight)</strong>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">20 Points Max</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Assesses contiguous footprint area. Requires ~3.5 acres per MW installed. Parcels &ge; 370 acres (150 Ha / 100+ MW) score maximum 100 points.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <strong className="text-slate-900 font-bold">3. Terrain Slope & DEM Elevation (15% Weight)</strong>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">15 Points Max</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Flat terrain (&lt;3°) scores 98 pts. Gentle slope (3-8°) scores 85 pts. Hilly slope (8-15°) scores 60 pts. Steep slopes (&gt;15°) are penalised with 0 pts and flagged for exclusion.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <strong className="text-slate-900 font-bold">4. Environmental & Forest Buffers (15% Weight)</strong>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">15 Points Max</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Evaluates buffer distance to Permanent Forest Reserves (Hutan Simpan Kekal) and Ramsar wetlands. Zero-overlay sites with &gt;5 km buffer score 95–100 pts.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <strong className="text-slate-900 font-bold">5. Cadastral Ownership & Title Cleanliness (10% Weight)</strong>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">10 Points Max</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Freehold titles and unencumbered candidate parcels score 90–100 pts. Short leasehold or encumbered titles incur point deductions, subject to JUPEM eCadastre title search.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <strong className="text-slate-900 font-bold">6. Road Infrastructure & Access (10% Weight)</strong>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">10 Points Max</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Proximity to Federal Highway or paved road network for heavy transformer component logistics. Access within 1 km scores 90–100 pts.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2 col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <strong className="text-slate-900 font-bold">7. Local Plan (RTD) & Utility Zoning Alignment (5% Weight)</strong>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">5 Points Max</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Zoning compatibility with District Local Plan (Rancangan Tempatan Daerah). Approved utility zoning scores 100 pts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Grid & Solar Engineering Specs */}
          {activeTab === 'techspecs' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-amber-50 p-4 rounded border border-amber-200">
                <h4 className="font-bold text-amber-900 text-sm mb-1 uppercase">LSS6 Technical Standards & Interconnection Baseline</h4>
                <p className="text-slate-700 text-xs">
                  Key electrical, civil, and financial parameters utilized across Peninsular Malaysia LSS6-Hybrid bidding analysis.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
                  <h5 className="font-bold text-slate-900 uppercase border-b pb-1 text-xs">132 kV Transmission Connection</h5>
                  <div className="space-y-1.5 text-slate-700">
                    <div><strong>Grid Voltage:</strong> 132 kV Single / Double Circuit</div>
                    <div><strong>Max Export Capacity:</strong> 50 MW to 100 MW per node</div>
                    <div><strong>Cable Cost Rate:</strong> RM 1.20 Million / km</div>
                    <div><strong>Substation Bay Cost:</strong> RM 8.50 Million fixed</div>
                    <div><strong>Conductive Cable Loss:</strong> ~ 0.28% per km</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
                  <h5 className="font-bold text-purple-900 uppercase border-b pb-1 text-xs">275 kV Transmission Connection</h5>
                  <div className="space-y-1.5 text-slate-700">
                    <div><strong>Grid Voltage:</strong> 275 kV High Voltage Bulk Grid</div>
                    <div><strong>Max Export Capacity:</strong> 100 MW to 250 MW per node</div>
                    <div><strong>Cable Cost Rate:</strong> RM 2.40 Million / km</div>
                    <div><strong>Substation Bay Cost:</strong> RM 14.50 Million fixed</div>
                    <div><strong>Conductive Cable Loss:</strong> ~ 0.14% per km</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
                  <h5 className="font-bold text-emerald-900 uppercase border-b pb-1 text-xs">Solar PV Yield Modeling</h5>
                  <div className="space-y-1.5 text-slate-700">
                    <div><strong>Annual Yield Benchmark:</strong> ~1,420 kWh / kWp / yr</div>
                    <div><strong>Performance Ratio (PR):</strong> 81.5% System PR</div>
                    <div><strong>P90 Yield Exceedance Ratio:</strong> 91.5% of P50 median</div>
                    <div><strong>Annual Panel Degradation:</strong> 0.40% / year</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
                  <h5 className="font-bold text-amber-900 uppercase border-b pb-1 text-xs">BESS & Financial Parameters</h5>
                  <div className="space-y-1.5 text-slate-700">
                    <div><strong>BESS Battery Storage:</strong> 4-Hour Duration Mandate (e.g., 30MW / 120MWh or 50MW / 200MWh per RFP Cl. 4.2)</div>
                    <div><strong>PV CapEx Rate:</strong> RM 2.85 Million / MW</div>
                    <div><strong>BESS CapEx Rate:</strong> RM 1.15 Million / MW</div>
                    <div><strong>Target Equity IRR:</strong> 8.5% – 12.8%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: API & Server Endpoints */}
          {activeTab === 'api' && (
            <div className="space-y-6 font-mono text-xs">
              <div className="bg-amber-50 p-4 rounded border border-amber-200">
                <h4 className="font-bold text-amber-900 text-sm mb-1 uppercase">Backend Server API Architecture</h4>
                <p className="text-slate-700 text-xs">
                  Express server endpoint specifications proxying requests securely to Google Gemini models.
                </p>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-emerald-400">POST /api/generate-feasibility-report</span>
                  <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded">Express Router</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Accepts land plot parameters, node connection distance, cadastral info, and financial metrics. Returns structured JSON containing executive feasibility summary, legal title review, EIA environmental screening, BESS recommendations, and technical risk matrix.
                </p>
                <div className="bg-slate-950 p-3 rounded text-[11px] text-slate-300 overflow-x-auto border border-slate-800">
                  <div className="text-amber-400 font-bold mb-1">// Request Body Sample:</div>
                  <pre className="text-[10px] text-slate-300">
{`{
  "siteName": "Kuala Muda Solar Farm",
  "nodeName": "PMU Kuala Muda",
  "state": "Kedah",
  "voltage": "132kV",
  "distanceToPMUKm": 2.8,
  "areaAcres": 320,
  "maxCapacityMW": 91,
  "ownershipType": "Unverified / Candidate Plot (Pending JUPEM Search)",
  "ghiYear": 1650,
  "estimatedCapExMyr": 298.5
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-mono">
          <div className="text-slate-500">
            Official Grid Data: Peninsular Malaysia TNB 132kV/275kV PMU Substation Database (2026)
          </div>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-1.5 rounded transition-colors"
          >
            Close Schematics
          </button>
        </div>
      </div>
    </div>
  );
};
