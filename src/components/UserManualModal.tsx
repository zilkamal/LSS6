import React, { useState } from 'react';
import {
  X,
  BookOpen,
  MapPin,
  Zap,
  FileText,
  Sliders,
  Edit3,
  Mail,
  Compass,
  GitCompare,
  BarChart3,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Printer,
  DollarSign,
  AlertTriangle,
  Database,
  Globe,
  Key,
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'map' | 'proposed' | 'custom' | 'analytics' | 'compare' | 'capacity') => void;
  onOpenTnbLetter: () => void;
  onOpenSchematics: () => void;
  onOpenOpenData?: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenTnbLetter,
  onOpenSchematics,
}) => {
  const [activeSection, setActiveSection] = useState<
    'overview' | 'map' | 'feasibility' | 'custom' | 'letter' | 'compare' | 'jupem'
  >('overview');

  if (!isOpen) return null;

  const handleQuickNavigate = (tab: 'map' | 'proposed' | 'custom' | 'analytics' | 'compare' | 'capacity') => {
    onNavigateTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-300 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 text-slate-950 font-black rounded-lg flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">Interactive User Manual & Feature Guide</h2>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  PETRA LSS6 Utility Platform
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Step-by-step instructions on exploring 48 PMU nodes, analyzing solar land feasibility, drafting TNB letters & custom calculations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
            title="Close User Manual"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-900 px-6 py-2.5 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs shrink-0 font-mono scrollbar-none">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> 1. Quick Start Guide
          </button>

          <button
            onClick={() => setActiveSection('map')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'map'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> 2. PMU Grid Map & Search
          </button>

          <button
            onClick={() => setActiveSection('feasibility')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'feasibility'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> 3. Feasibility Study Report
          </button>

          <button
            onClick={() => setActiveSection('custom')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'custom'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> 4. Custom Location Calculator
          </button>

          <button
            onClick={() => setActiveSection('letter')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'letter'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> 5. TNB Enquiry Letter
          </button>

          <button
            onClick={() => setActiveSection('compare')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'compare'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" /> 6. Site Comparison
          </button>

          <button
            onClick={() => setActiveSection('jupem')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'jupem'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> 7. JUPEM Ownership Guide
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 bg-slate-50 text-sm">
          {/* SECTION 1: OVERVIEW & QUICK START */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Key Application Workflows at a Glance
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  This application is built for renewable energy developers, IPPs, solar consultants, and engineers submitting bids for Malaysia’s <strong>PETRA Large Scale Solar 6 (LSS6) RFP</strong>. Follow this 4-step workflow to identify and evaluate solar interconnection sites:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                    <div className="w-7 h-7 bg-amber-500 text-slate-950 font-black rounded flex items-center justify-center text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">Filter Substation Headroom</h4>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Filter 48 PMU nodes across Peninsular Malaysia by State, Voltage (132kV / 275kV), or MW headroom capacity.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                    <div className="w-7 h-7 bg-amber-500 text-slate-950 font-black rounded flex items-center justify-center text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">Inspect Nearby Candidate Land</h4>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Click any PMU marker on the map to review available transformer capacity and candidate land plots within 10 km.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                    <div className="w-7 h-7 bg-amber-500 text-slate-950 font-black rounded flex items-center justify-center text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">Run Feasibility Study & Edit Lots</h4>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Launch full Feasibility Study report, simulate CapEx/LCOE, review 3D slope contours, and input real Lot Numbers or Landowner data.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                    <div className="w-7 h-7 bg-amber-500 text-slate-950 font-black rounded flex items-center justify-center text-xs">
                      4
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">Generate TNB Letter & Export Report</h4>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Draft formal headroom verification letters to Tenaga Nasional Berhad (TNB) and export formatted A4 PDF reports for RFP submission.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Shortcuts */}
              <div className="bg-slate-900 text-white p-5 rounded-lg border border-slate-800 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                  Interactive Module Shortcuts
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  <button
                    onClick={() => handleQuickNavigate('map')}
                    className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 p-2.5 rounded-md font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer border border-slate-700"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Grid Map</span>
                  </button>

                  <button
                    onClick={() => handleQuickNavigate('proposed')}
                    className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 p-2.5 rounded-md font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer border border-slate-700"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Candidate Lands</span>
                  </button>

                  <button
                    onClick={() => handleQuickNavigate('custom')}
                    className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 p-2.5 rounded-md font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer border border-slate-700"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Custom Location</span>
                  </button>

                  <button
                    onClick={() => handleQuickNavigate('compare')}
                    className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 p-2.5 rounded-md font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer border border-slate-700"
                  >
                    <GitCompare className="w-4 h-4" />
                    <span>Site Compare</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenTnbLetter();
                      onClose();
                    }}
                    className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 p-2.5 rounded-md font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer border border-slate-700"
                  >
                    <Mail className="w-4 h-4" />
                    <span>TNB Letter</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenSchematics();
                      onClose();
                    }}
                    className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 p-2.5 rounded-md font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer border border-slate-700"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>Schematics</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: MAP & FILTERS */}
          {activeSection === 'map' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-500" /> Interactive PMU Grid Map & Headroom Search
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  The primary view features an interactive leaflet map detailing all 48 Peninsular Malaysia Main Transmission Substations (PMU - Pencawang Masuk Utama) categorized by voltage level (132kV and 275kV).
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">State & Voltage Filters:</strong> Use the top controls to filter PMUs by state (e.g. Johor, Kedah, Selangor) or voltage level (132kV vs 275kV).
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">MW Capacity Slider:</strong> Set minimum headroom thresholds (e.g. 50 MW or 100 MW) to filter out constrained substations.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Search Box:</strong> Type any PMU name (e.g. "Bakri", "Gurun", "Chuping") or district/mukim to snap directly to that substation.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Click Map Marker / List item:</strong> Selecting a PMU loads its real-time transformer headroom, voltage level, and nearby candidate land parcels in the inspection drawer.
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleQuickNavigate('map')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    Open Grid Map View <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: FEASIBILITY STUDY & CUSTOM LAND EDIT */}
          {activeSection === 'feasibility' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" /> Solar Land Feasibility Study & Custom Lot Entry
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Clicking <strong>"Full Feasibility Study"</strong> on any land plot opens an engineering feasibility analysis report tailored for LSS6 submissions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Sliders className="w-4 h-4 text-amber-600" /> Dynamic CapEx & Financial Calculator
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Adjust PV panel wattage (600Wp–700Wp), inverter efficiency, interconnection cable length, land cost per acre, and O&M rates to see real-time updates to Total CapEx (RM Million) and Levelized Cost of Electricity (LCOE Sen/kWh).
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Layers className="w-4 h-4 text-amber-600" /> 3D & 2D Topographical Slope Contours
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Visualize 3D topographical slope angles, earthwork grading requirements, and flood risk zones with interactive contour overlays to evaluate piling and civil engineering costs.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Edit3 className="w-4 h-4 text-amber-600" /> Enter / Edit Custom Land & Ownership
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Click <strong>"Edit / Input Land Data"</strong> inside the feasibility modal to override candidate plots with verified Lot Numbers (e.g. Lot 1482), land titles (Freehold vs Leasehold), and landowner details.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Printer className="w-4 h-4 text-amber-600" /> PDF Report Export
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Export a formatted A4 Feasibility Study Report PDF complete with financial tables, grid distance, land title review, and solar irradiance charts ready for investment committee or PETRA LSS6 submission.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleQuickNavigate('proposed')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    Browse All Candidate Lands <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: CUSTOM LOCATION CALCULATOR */}
          {activeSection === 'custom' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-500" /> Custom Land Parcel & Location Calculator
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Have a specific land plot in mind? Use the <strong>Custom Location Calculator</strong> module to analyze any land parcel across Peninsular Malaysia:
                </p>

                <div className="space-y-2 pt-1">
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                    <strong className="text-slate-900 block font-bold mb-0.5">1. Interactive Map Clicking or Manual Lat/Lng Input:</strong>
                    Click anywhere on the map or input exact GPS coordinates (Latitude & Longitude) for your proposed solar farm plot.
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                    <strong className="text-slate-900 block font-bold mb-0.5">2. Set Target Land Area (Acres):</strong>
                    Enter the total available land area. The engine automatically calculates equivalent hectares (~0.4047 Ha/Acre) and maximum MW solar export potential (~2.8 Acres/MW).
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                    <strong className="text-slate-900 block font-bold mb-0.5">3. Nearest PMU Grid Auto-Routing:</strong>
                    The spatial engine automatically finds the nearest 132kV / 275kV PMU substation, measures direct line and cable route distance (km), and estimates 132kV overhead transmission line CapEx.
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleQuickNavigate('custom')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    Open Custom Location Calculator <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: TNB ENQUIRY LETTER */}
          {activeSection === 'letter' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-500" /> Formal TNB Interconnection Headroom Enquiry Letter
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  PETRA LSS6 RFP submission rules require developers to submit official enquiries to <strong>Tenaga Nasional Berhad (TNB System Operator & Grid Division)</strong> regarding grid interconnection headroom availability.
                </p>

                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded text-xs text-amber-950 space-y-1.5">
                  <strong className="text-amber-900 block font-bold flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-amber-600" /> Letter Generator Features
                  </strong>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    <li>Pre-filled with official TNB Grid Planning Division address in Kuala Lumpur.</li>
                    <li>Includes PMU Substation Name, Target Capacity MW, Voltage (132kV/275kV), and State.</li>
                    <li>Includes editable fields for Developer Company Name, Business Registration (SSM No.), Contact Person, and Official Ref No.</li>
                    <li>Supports 1-click printing or PDF download formatted for formal letterhead presentation.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      onOpenTnbLetter();
                      onClose();
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    Open TNB Enquiry Letter Generator <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: SITE COMPARISON */}
          {activeSection === 'compare' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-amber-500" /> Side-by-Side Site Comparison Matrix
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Benchmark up to 4 PMU substations or candidate land plots side-by-side to determine the most cost-effective and feasible site for your LSS6 bid:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <strong className="text-slate-900 block font-bold mb-1">CapEx & LCOE Metrics</strong>
                    Compare total estimated CapEx (RM Million), LCOE (Sen/kWh), and 21-year cumulative revenue side-by-side.
                  </div>

                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <strong className="text-slate-900 block font-bold mb-1">Grid Distance & Interconnection</strong>
                    Compare cable route length to nearest PMU, voltage class, and estimated overhead line installation costs.
                  </div>

                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <strong className="text-slate-900 block font-bold mb-1">Topography & Solar GHI</strong>
                    Compare solar irradiance (kWh/m²/yr), slope suitability score, and flood risk parameters.
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleQuickNavigate('compare')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    Open Comparison Matrix <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: JUPEM OWNERSHIP GUIDE */}
          {activeSection === 'jupem' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" /> JUPEM Cadastral & Landowner Verification
                </h3>

                {/* Important Q&A Clarification Callout for Plot Size Discrepancies */}
                <div className="bg-blue-50 border border-blue-300 p-4 rounded-lg space-y-2.5 text-xs text-blue-950">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-900 font-extrabold text-sm">
                        ❓ Why Does a Proposed 280-Acre Candidate Plot Look Smaller on a Single JUPEM Title Search (e.g., Lot 6249)?
                      </strong>
                      <p className="text-blue-800 leading-relaxed mt-1">
                        In utility-scale solar development (e.g., a 75 MWp solar farm requiring ~280 acres), GIS suitability algorithms identify a <strong>gross contiguous land envelope</strong> comprising a cluster of adjacent agricultural lots.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border border-blue-200 text-slate-700 space-y-2">
                    <p className="leading-relaxed">
                      <strong>1. Individual Lot vs. Contiguous Land Envelope:</strong> In JUPEM’s National Digital Cadastral Database (NDCDB), a single lot number (e.g. Lot 6249) often covers only a small portion (e.g. 15 to 30 acres) of a master plantation or Mukim estate. To assemble 280 acres, developers in Malaysia amalgamate multiple adjoining lots (e.g. Lot 6249 + Lot 6250 + Lot 6251).
                    </p>
                    <p className="leading-relaxed">
                      <strong>2. How to Input Your Exact Verified Lot Size:</strong> If your JUPEM search or PTG title search shows a different net acreage for your specific lot:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-800 font-mono text-[11px]">
                      <li>
                        <strong>Option A:</strong> Open the Feasibility Study report for the candidate land and click <strong>"Edit / Input Land Data"</strong> to manually override the Lot Number, Land Title Type, and exact Acreage.
                      </li>
                      <li>
                        <strong>Option B:</strong> Go to the <strong>Custom Location Calculator</strong> tab, click your exact coordinates on the map, and enter your target land area in acres.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-md text-xs text-amber-950 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-900 font-bold">Cadastral Ownership Status Clarification:</strong>
                      <p className="text-amber-800 leading-relaxed mt-0.5">
                        In spatial utility platforms, candidate land plots generated around substations represent spatial possibilities. Because official private property registry data is protected under Malaysian privacy laws (Jabatan Ukur dan Pemetaan Malaysia - JUPEM & Pejabat Tanah dan Galian - PTG):
                      </p>
                    </div>
                  </div>
                  <ul className="list-disc pl-6 space-y-1 text-slate-700">
                    <li>Standard candidate land plots are classified as <strong>"Unverified / Candidate Plot (Pending JUPEM Title Search)"</strong>.</li>
                    <li>Developers can click <strong>"Edit / Input Land Data"</strong> inside any Feasibility Study report to input verified Lot Numbers, real Landowner names, or official JUPEM survey data.</li>
                    <li>Title conversion from Agricultural to Utility (Stesen Janakuasa Solar) is required under <strong>National Land Code Section 124</strong> via the state PTG.</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-1.5 text-xs">
                  <strong className="text-slate-900 block font-bold">Recommended Verification Steps before LSS6 RFP Submission:</strong>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                    <li>Perform <strong>JUPEM eCadastre (eKadaster)</strong> spatial lot overlay check.</li>
                    <li>Conduct <strong>PTG Official Title Search (Carian Hakmilik)</strong> at the District Land Office (Pejabat Tanah Daerah) to verify encumbrances and exact ownership.</li>
                    <li>Obtain landowner <strong>Letter of Intent (LOI) / Option to Lease Agreement</strong> for the proposed acreage.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between shrink-0 font-mono text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>PETRA LSS6 User Guidance Version 2.4</span>
          </div>
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded transition-colors cursor-pointer shadow-xs"
          >
            Close Guide & Return to App
          </button>
        </div>
      </div>
    </div>
  );
};
