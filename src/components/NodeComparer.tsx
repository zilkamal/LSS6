import React from 'react';
import { LandParcel, PMUNode } from '../types';
import { GitCompare, Trash2, Zap, Sun, DollarSign, CheckCircle2 } from 'lucide-react';

interface NodeComparerProps {
  compareList: LandParcel[];
  onRemoveFromCompare: (id: string) => void;
  onClearCompare: () => void;
  onAnalyzeFeasibility: (land: LandParcel, pmuNode: PMUNode) => void;
  allNodes: PMUNode[];
}

export const NodeComparer: React.FC<NodeComparerProps> = ({
  compareList,
  onRemoveFromCompare,
  onClearCompare,
  onAnalyzeFeasibility,
  allNodes,
}) => {
  if (compareList.length === 0) {
    return (
      <div className="bg-white border border-slate-300 rounded p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px] shadow-sm font-sans">
        <GitCompare className="w-12 h-12 text-slate-400 mb-3" />
        <h3 className="text-slate-900 font-bold text-base mb-1">Comparison Matrix Empty</h3>
        <p className="text-xs text-slate-600 max-w-sm">
          Click "+ Compare" on any land parcel from the PMU Explorer to add up to 3 candidate sites side-by-side.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-300 rounded p-6 space-y-6 text-slate-800 shadow-sm font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-amber-600" /> Side-by-Side Solar Land Comparison
          </h2>
          <p className="text-xs text-slate-600 font-mono">
            Comparing {compareList.length} candidate sites on distance to nearest PMU, CapEx, solar yield, and LCOE
          </p>
        </div>

        <button
          onClick={onClearCompare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-rose-700 font-bold text-xs transition-colors font-mono border border-slate-200"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {compareList.map((land) => {
          const matchingPMU = allNodes.find((n) => n.id === land.pmuId) || allNodes[0];
          const is33kV = matchingPMU.voltage === '33kV' || land.packageSuitability?.includes('Package 3');
          const isPPU = matchingPMU.substationType === 'PPU' || matchingPMU.name.startsWith('PPU');
          const subPrefix = isPPU ? 'PPU' : 'PMU';

          return (
            <div key={land.id} className="bg-slate-50 border border-slate-200 rounded p-5 space-y-4 relative flex flex-col justify-between font-mono">
              <button
                onClick={() => onRemoveFromCompare(land.id)}
                className="absolute top-3 right-3 p-1 rounded bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-300 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="space-y-1.5 border-b border-slate-200 pb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-900 bg-white border border-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {subPrefix} {matchingPMU.name} ({matchingPMU.voltage})
                  </span>
                  {is33kV ? (
                    <span className="text-[9px] font-black bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded border border-amber-300">
                      ☀️ SOLAR-ONLY (NO BESS)
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded border border-purple-300">
                      🔋 HYBRID (+BESS)
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 pr-8 font-sans">{land.name}</h3>
                <span className="text-xs text-slate-500 block">{land.landCategory} &bull; {matchingPMU.state}</span>
              </div>

              {/* Matrix Metrics */}
              <div className="space-y-2 text-xs text-slate-800">
                <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-600">BESS Battery Scope:</span>
                  {is33kV ? (
                    <strong className="text-amber-800 font-extrabold">0 MW (Not Required • RM 0.00)</strong>
                  ) : (
                    <strong className="text-purple-800 font-bold">50% 4-Hour BESS (Mandatory)</strong>
                  )}
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-600">Distance to Substation:</span>
                  <strong className="text-amber-700 font-bold">{land.distanceToPMUKm} km</strong>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-600">Land Area:</span>
                  <strong className="text-slate-900 font-bold">{land.areaAcres} Acres</strong>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-600">Solar Potential:</span>
                  <strong className="text-amber-700 font-bold">{land.maxCapacityMW} MWp</strong>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-600">Terrain Slope:</span>
                  <strong className="text-slate-900 font-bold">{land.terrainSlope}° ({land.terrainCategory})</strong>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-600">Solar GHI:</span>
                  <strong className="text-slate-900 font-bold">{land.ghiKwhM2Year} kWh/m²/yr</strong>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-600">Interconnection Cable CapEx:</span>
                  <strong className="text-emerald-700 font-bold">RM {land.interconnectionCostMyr}M</strong>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-600">Total Project CapEx:</span>
                  <strong className="text-slate-900 font-bold">RM {land.estimatedCapExMyr}M</strong>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-600">Est. LCOE:</span>
                  <strong className="text-emerald-700 font-bold">RM {land.estimatedLCOEMyr} / kWh</strong>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-600">Projected Equity IRR:</span>
                  <strong className="text-amber-700 font-bold">{land.estimatedIRR}%</strong>
                </div>

                <div className="flex items-center justify-between bg-amber-50 p-2 rounded border border-amber-300">
                  <span className="text-slate-700 font-bold">Suitability Score:</span>
                  <strong className="text-emerald-800 font-black text-sm">{land.overallScore} / 100</strong>
                </div>
              </div>

              <button
                onClick={() => onAnalyzeFeasibility(land, matchingPMU)}
                className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2 rounded text-xs transition-colors"
              >
                Run AI Assessment
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
