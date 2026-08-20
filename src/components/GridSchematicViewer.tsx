import React, { useState } from 'react';
import { PMUNode, LandParcel } from '../types';
import {
  Zap,
  Sun,
  Battery,
  Shield,
  Activity,
  Layers,
  FileDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { generateRfpSubmissionPdfReport } from '../utils/rfpPdfReport';

interface GridSchematicViewerProps {
  land: LandParcel;
  pmuNode: PMUNode;
  onClose?: () => void;
}

export const GridSchematicViewer: React.FC<GridSchematicViewerProps> = ({
  land,
  pmuNode,
  onClose,
}) => {
  const [selectedElement, setSelectedElement] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [bidderName, setBidderName] = useState<string>('LSS6 CONSORTIUM SPV SDN. BHD.');
  const [customTariff, setCustomTariff] = useState<number>(
    pmuNode.voltage === '33kV' ? 0.2380 : 0.4331
  );

  const isPackage3 =
    pmuNode.voltage === '33kV' ||
    land.packageSuitability?.includes('Package 3') ||
    (land.bessEnergyMWh === 0 && land.bessPowerMW === 0);

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await generateRfpSubmissionPdfReport(land, pmuNode, {
        bidderCompanyName: bidderName,
        bidTariffMyrKwh: customTariff,
      });
    } catch (err) {
      console.error('Failed to generate RFP PDF:', err);
      alert('Error generating RFP PDF Report. Please check console.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-700 shadow-2xl p-5 space-y-5 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                Electrical Engineering Single Line Diagram (SLD)
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  isPackage3
                    ? 'bg-blue-500 text-white'
                    : 'bg-purple-500 text-white'
                }`}
              >
                {isPackage3 ? 'Package 3: Solar-Only' : 'Packages 1 & 2: Solar + BESS Hybrid'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {land.name} &rarr; PMU {pmuNode.name} ({pmuNode.voltage})
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer border border-amber-400 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Compiling 8-Page RFP PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-slate-950" />
                <span>Export Official RFP Submission PDF (8 Pages)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive SLD Vector Canvas */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-lg p-6 overflow-x-auto min-w-[760px] shadow-inner">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2 mb-6">
          <span className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Activity className="w-3.5 h-3.5" /> High-Voltage Interconnection Topology
          </span>
          <span>
            Route Distance: <strong className="text-white">{land.distanceToPMUKm} km vector</strong> ({land.estimatedCableLengthKm} km Cable)
          </span>
        </div>

        {/* SLD Component Flow Layout */}
        <div className="grid grid-cols-12 gap-3 items-center relative">
          {/* 1. PV Array Block (Cols 1-3) */}
          <div
            onClick={() => setSelectedElement('pv')}
            className={`col-span-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
              selectedElement === 'pv'
                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">PV Generation Array</span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-base font-black text-white">{land.maxCapacityMW} MWp</div>
            <div className="text-[10px] text-slate-400 font-mono space-y-0.5 mt-1">
              <div>• N-Type TOPCon 600Wp+</div>
              <div>• 1500V DC Array String</div>
              <div>• 1-Axis Single Trackers</div>
              <div>• String Inverters (0.8kV AC)</div>
            </div>
          </div>

          {/* Flow Connector Arrow */}
          <div className="col-span-1 flex justify-center text-slate-500">
            <ArrowRight className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>

          {/* 2. Middle Station: BESS (if Hybrid) or Direct Coupling (if Pkg 3) (Cols 5-7) */}
          <div
            onClick={() => setSelectedElement('storage')}
            className={`col-span-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
              selectedElement === 'storage'
                ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-400/30'
                : isPackage3
                ? 'bg-blue-950/40 border-blue-500/40 hover:border-blue-400'
                : 'bg-slate-900/90 border-purple-500/40 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase ${
                  isPackage3 ? 'text-blue-400' : 'text-purple-400'
                }`}
              >
                {isPackage3 ? 'Solar-Only Coupling' : '4-Hour BESS System'}
              </span>
              {isPackage3 ? <Sun className="w-4 h-4 text-blue-400" /> : <Battery className="w-4 h-4 text-purple-400" />}
            </div>
            <div className="text-base font-black text-white">
              {isPackage3 ? '0 MWh (Solar-Only)' : `${land.bessEnergyMWh || 120} MWh LFP`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono space-y-0.5 mt-1">
              {isPackage3 ? (
                <>
                  <div>• Direct 33kV Distribution Feed</div>
                  <div>• No Battery Storage Required</div>
                  <div>• RM 0.00 BESS CapEx Sizing</div>
                  <div>• ST Package 3 Compliant</div>
                </>
              ) : (
                <>
                  <div>• {land.bessPowerMW || 50} MW Bi-directional PCS</div>
                  <div>• Liquid Cooled LFP Rack</div>
                  <div>• Fire Suppression (NFPA 855)</div>
                  <div>• 4-Hour Storage Duration</div>
                </>
              )}
            </div>
          </div>

          {/* Flow Connector Arrow */}
          <div className="col-span-1 flex justify-center text-slate-500">
            <ArrowRight className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>

          {/* 3. Main Step-Up Substation & Transmission (Cols 9-12) */}
          <div
            onClick={() => setSelectedElement('pmu')}
            className={`col-span-4 p-3.5 rounded-lg border transition-all cursor-pointer ${
              selectedElement === 'pmu'
                ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/30'
                : 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                TNB Interconnection PMU
              </span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-base font-black text-white">
              PMU {pmuNode.name} ({pmuNode.voltage})
            </div>
            <div className="text-[10px] text-slate-400 font-mono space-y-0.5 mt-1">
              <div>• 33kV / {pmuNode.voltage} Step-Up Transformer</div>
              <div>• Dual Class 0.2S Revenue Meters</div>
              <div>• Line Differential 87L & Distance 21</div>
              <div>• TNB NLDC SCADA Gateway via OPGW</div>
            </div>
          </div>
        </div>

        {/* Detailed Protection & Metering Specs Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono">
          <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
              Protection Scheme
            </span>
            <span className="text-slate-200">
              ANSI 87L (Differential), ANSI 21 (Distance), ANSI 50/51 (Overcurrent), ANSI 81O/U (Frequency)
            </span>
          </div>
          <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
              Revenue Metering
            </span>
            <span className="text-slate-200">
              Dual redundant Class 0.2S bi-directional active/reactive 4-quadrant meters with optical test port
            </span>
          </div>
          <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
              Transmission Corridor
            </span>
            <span className="text-slate-200">
              {land.estimatedCableLengthKm} km route length &bull; {pmuNode.voltage} XLPE / ACSR Conductor with OPGW
            </span>
          </div>
        </div>
      </div>

      {/* RFP Report Configuration Controls */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Bidder SPV Name (For Cover Page):
            </label>
            <input
              type="text"
              value={bidderName}
              onChange={(e) => setBidderName(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs w-full sm:w-64 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Bid Tariff (RM / kWh):
            </label>
            <input
              type="number"
              step="0.001"
              value={customTariff}
              onChange={(e) => setCustomTariff(parseFloat(e.target.value) || 0.238)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs w-full sm:w-32 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer w-full md:w-auto justify-center"
        >
          <FileDown className="w-4 h-4 text-slate-950" />
          <span>Generate Formatted PDF Summary Report</span>
        </button>
      </div>
    </div>
  );
};
