import React from 'react';
import {
  Zap,
  Sun,
  ShieldCheck,
  BatteryCharging,
  Layers,
  MapPin,
  CheckCircle2,
  X,
  ArrowRight,
  Info,
  Building2,
  Scale,
  Sparkles,
} from 'lucide-react';
import { RFPPackageProgram } from '../types';

interface PackageLandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: RFPPackageProgram;
  onSelectPackage: (pkg: RFPPackageProgram) => void;
}

export const PackageLandingModal: React.FC<PackageLandingModalProps> = ({
  isOpen,
  onClose,
  selectedPackage,
  onSelectPackage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto font-sans animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase font-mono">
                  PETRA & Suruhanjaya Tenaga (ST)
                </span>
                <span className="text-slate-400 text-xs font-mono">LSS6 Bidding RFP Architecture</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Select LSS6 Tender Program & Grid Voltage Workspace
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 text-sm">
          {/* Key RFP Program Comparison Intro */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-slate-300">
              <p className="font-semibold text-slate-100">
                LSS6 Bidding Framework distinguishes between <span className="text-amber-400 font-bold">Hybrid RFP (Packages 1 & 2)</span> and the dedicated <span className="text-blue-400 font-bold">Solar Bumiputera RFP (Package 3)</span>.
              </p>
              <p>
                Each program operates under distinct technical configurations, interconnection voltage levels, designated PMU nodal points, and equity ownership mandates. Select your project's bidding package below to filter map nodal points and feasibility calculations:
              </p>
            </div>
          </div>

          {/* Side-by-Side Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Package 1 & 2 (LSS6-Hybrid) */}
            <div
              onClick={() => {
                onSelectPackage('hybrid');
                onClose();
              }}
              className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                selectedPackage === 'hybrid'
                  ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/50'
                  : 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/70'
              }`}
            >
              {selectedPackage === 'hybrid' && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Mode
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                    Packages 1 & 2
                  </span>
                  <span className="text-xs text-slate-400 font-mono">132kV / 275kV Grid</span>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <BatteryCharging className="w-5 h-5 text-emerald-400" />
                  LSS6-Hybrid (Solar + BESS)
                </h3>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Utility-scale integrated solar photovoltaic plus 4-Hour Battery Energy Storage System (BESS) designed for day-to-night peak energy shifting and grid stability.
                </p>

                <div className="space-y-2 text-xs font-mono border-t border-slate-700/60 pt-3 mb-4">
                  <div className="flex justify-between py-1 border-b border-slate-700/30">
                    <span className="text-slate-400">Technical Config:</span>
                    <span className="text-emerald-300 font-bold">Solar + 4-Hr BESS (1:0.5 Ratio)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/30">
                    <span className="text-slate-400">Grid Voltage:</span>
                    <span className="text-slate-100 font-bold">132kV (38 PMUs) & 275kV (10 PMUs)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/30">
                    <span className="text-slate-400">Total Program Quota:</span>
                    <span className="text-amber-400 font-bold">2,500 MW Solar + 1,250 MW BESS</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/30">
                    <span className="text-slate-400">Bidding Scale:</span>
                    <span className="text-slate-100">Pkg 1: &gt;100–500 MW | Pkg 2: 60–100 MW</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/30">
                    <span className="text-slate-400">Equity Requirement:</span>
                    <span className="text-slate-100">Pkg 1: 51% M&apos;sian | Pkg 2: 60% Bumi</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Designated PMUs:</span>
                    <span className="text-emerald-300 font-bold">48 High-Voltage Substations</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  selectedPackage === 'hybrid'
                    ? 'bg-emerald-500 text-slate-950 shadow-md hover:bg-emerald-400'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                Launch LSS6-Hybrid Workspace (132/275kV) <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: Package 3 (LSS6-Solar Bumiputera) */}
            <div
              onClick={() => {
                onSelectPackage('package3');
                onClose();
              }}
              className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                selectedPackage === 'package3'
                  ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-950/50'
                  : 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/70'
              }`}
            >
              {selectedPackage === 'package3' && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Mode
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                    Package 3 (LSS6-Solar)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">33kV & below Grid</span>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <Sun className="w-5 h-5 text-blue-400" />
                  LSS-Solar Bumiputera RFP
                </h3>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Dedicated Solar-Only ground mounted utility projects reserved exclusively for qualified Bumiputera energy developers with direct 33kV distribution grid interconnection.
                </p>

                <div className="space-y-2 text-xs font-mono border-t border-slate-700/60 pt-3 mb-4">
                  <div className="flex justify-between py-1 border-b border-slate-700/30">
                    <span className="text-slate-400">Technical Config:</span>
                    <span className="text-blue-300 font-bold">Solar-Only (No BESS Required • RM 0 CapEx)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/30">
                    <span className="text-slate-400">Grid Voltage:</span>
                    <span className="text-cyan-300 font-bold">33kV & below (PMU & PPU Substations)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/30">
                    <span className="text-slate-400">Total Program Quota:</span>
                    <span className="text-amber-400 font-bold">150 MWa.c. Solar Export</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/30">
                    <span className="text-slate-400">Bidding Scale:</span>
                    <span className="text-slate-100">10 MWa.c. to &lt;30 MWa.c. per site</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/30">
                    <span className="text-slate-400">Equity Requirement:</span>
                    <span className="text-purple-300 font-bold">≥60% Bumiputera Ownership</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/30">
                    <span className="text-slate-400">Bid Bond:</span>
                    <span className="text-emerald-300 font-bold">RM 350,000.00 per LSS Plant</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Designated Substations:</span>
                    <span className="text-blue-300 font-bold">226 Official ST Points (173 PMUs + 53 PPUs)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  selectedPackage === 'package3'
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-500'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                Launch Package 3 Solar Workspace (33kV) <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Highlighted PMU Nodal Point Status */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Official Nodal Point Mapping Status (Suruhanjaya Tenaga RFP)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="font-bold text-blue-400 mb-1">PMU Guthrie (Kulim, Kedah)</div>
                <div className="text-[11px] text-slate-300">
                  <span className="text-emerald-400 font-semibold">✓ Confirmed Nodal Point #30</span> for Package 3 (33kV). Excluded from Hybrid list.
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="font-bold text-blue-400 mb-1">PMU Tikam Batu (Kuala Muda, Kedah)</div>
                <div className="text-[11px] text-slate-300">
                  <span className="text-emerald-400 font-semibold">✓ Confirmed Nodal Point #27</span> for Package 3 (33kV). Excluded from Hybrid list.
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="font-bold text-amber-400 mb-1">PMU Mergong (Kota Setar, Kedah)</div>
                <div className="text-[11px] text-slate-300">
                  <span className="text-cyan-300 font-semibold">Dual-Listed:</span> Listed for Hybrid (132kV) & Package 3 (33kV Nodal Point #25).
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="font-bold text-slate-400 mb-1">PMU Kuala Ketil (Kedah)</div>
                <div className="text-[11px] text-rose-400">
                  <span>✗ Not listed</span> in either Hybrid (132kV) or Package 3 (33kV) official nodal schedules.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            You can toggle between packages anytime using the package badge in the top navigation bar.
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-1.5 rounded text-xs transition-colors"
          >
            Close & Continue Exploring
          </button>
        </div>
      </div>
    </div>
  );
};
