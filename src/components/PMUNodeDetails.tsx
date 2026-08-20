import React, { useState } from 'react';
import { PMUNode, LandParcel } from '../types';
import { Zap, MapPin, Sun, Compass, ShieldAlert, CheckCircle2, ChevronRight, FileText, ArrowUpRight, DollarSign, Mail } from 'lucide-react';
import { TnbEnquiryLetterModal } from './TnbEnquiryLetterModal';

interface PMUNodeDetailsProps {
  node: PMUNode | null;
  selectedLandParcel: LandParcel | null;
  allNodes?: PMUNode[];
  onSelectNode?: (node: PMUNode) => void;
  onSelectLandParcel: (land: LandParcel) => void;
  onAnalyzeFeasibility: (land: LandParcel, node: PMUNode) => void;
  onAddToCompare: (item: PMUNode | LandParcel) => void;
}

export const PMUNodeDetails: React.FC<PMUNodeDetailsProps> = ({
  node,
  selectedLandParcel,
  allNodes = [],
  onSelectNode,
  onSelectLandParcel,
  onAnalyzeFeasibility,
  onAddToCompare,
}) => {
  const [isTnbLetterOpen, setIsTnbLetterOpen] = useState(false);

  if (!node) {
    return (
      <div className="bg-white border border-slate-300 rounded p-6 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
        <Zap className="w-12 h-12 text-slate-400 mb-3 animate-pulse" />
        <h3 className="text-slate-900 font-bold text-base mb-1">No PMU Node Selected</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Select any designated 132kV or 275kV node from the map or list to view nearby suitable solar land plots & exact PMU distances.
        </p>
      </div>
    );
  }

  const is33kV = node.voltage === '33kV' || node.package?.includes('Package 3');
  const is275kV = node.voltage === '275kV';
  const isPPU = node.substationType === 'PPU' || node.name.startsWith('PPU');
  const subPrefix = isPPU ? 'PPU' : 'PMU';
  const currentLoad = node.currentLoadMW ?? Math.round(node.capacityMW * 0.7);
  const utilPct = node.capacityUtilizationPct ?? Math.round((currentLoad / node.capacityMW) * 100);

  let statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let barFillClass = 'bg-emerald-500';
  let statusText = 'Optimal Capacity Available';

  if (utilPct >= 85) {
    statusBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    barFillClass = 'bg-rose-500';
    statusText = 'High Load / Congestion Risk';
  } else if (utilPct >= 70) {
    statusBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    barFillClass = 'bg-amber-500';
    statusText = 'Moderate Utilization';
  }

  return (
    <div className="bg-white border border-slate-300 rounded p-5 space-y-5 text-slate-900 shadow-sm font-sans">
      {/* Quick PMU/PPU Dropdown Menu Selector */}
      {allNodes.length > 0 && onSelectNode && (
        <div className="bg-slate-900 text-slate-100 p-2.5 rounded-md border border-slate-800 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-extrabold uppercase font-mono tracking-wider text-amber-300">
              Select Substation Node:
            </span>
          </div>
          <select
            value={node.id}
            onChange={(e) => {
              const selected = allNodes.find((n) => n.id === e.target.value);
              if (selected) onSelectNode(selected);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer max-w-[240px] truncate border border-slate-700 font-mono"
            title="Choose Substation Node"
          >
            {allNodes.map((n) => (
              <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                #{n.number} {n.substationType || 'PMU'} {n.name} ({n.voltage}, {n.state}) &bull; {n.capacityMW} MW
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Substation Header Badge & Title */}
      <div className="border-b border-slate-200 pb-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-sm text-xs font-black tracking-wide font-mono ${
                is33kV
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : is275kV
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {subPrefix} #{node.number} &bull; {node.voltage}
            </span>
            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-sm text-xs font-bold border border-slate-300">
              {node.state}
            </span>

            {/* Explicit Solar-Only vs Hybrid Badge */}
            {is33kV ? (
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black px-2.5 py-0.5 rounded shadow-xs text-xs font-mono border border-amber-400">
                <Sun className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Package 3: Solar-Only (No BESS Required)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-sm text-xs font-bold font-mono">
                <span>Packages 1 & 2 &bull; Solar + BESS Hybrid</span>
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-mono">ID: {node.id}</span>
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          {subPrefix} {node.name}
          {node.isPendingApplication && (
            <span className="text-amber-800 text-xs font-bold bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-sm">
              ** Pending Queue
            </span>
          )}
        </h2>
        <div className="text-[11px] font-mono text-slate-600 font-semibold">
          {isPPU ? 'PPU: Pencawang Pembahagian Utama (Distribution Substation, 33kV & below)' : 'PMU: Pencawang Masuk Utama (Main Intake Substation)'}
        </div>
        <p className="text-xs text-slate-600">{node.description}</p>

        {/* Technical Architecture Callout for Package 3 (Explicit No-BESS Confirmation) */}
        {is33kV ? (
          <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded-md text-xs space-y-1">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <span>LSS6 Package 3 Technical Scope: Solar-Only Plant</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed font-sans">
              As mandated by the latest Energy Commission (ST) RFP guidelines, this 33kV node is designated under <strong>Package 3 (LSS6-Solar)</strong>.
              <strong className="text-blue-950"> No Battery Energy Storage System (BESS) is required</strong>. The plant exports direct PV generation to the distribution grid with <strong>RM 0.00 BESS CapEx</strong>.
            </p>
          </div>
        ) : (
          <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-md text-xs text-purple-900 space-y-0.5 font-sans">
            <div className="font-bold flex items-center gap-1.5">
              <span>LSS6 Hybrid Architecture (Packages 1 & 2):</span>
            </div>
            <p className="text-[11px] text-purple-800">
              Requires a mandatory <strong>4-hour Battery Energy Storage System (BESS)</strong> sized at minimum 50% of the solar export capacity.
            </p>
          </div>
        )}

        {/* Pending Queue Warning Banner */}
        {node.isPendingApplication && (
          <div className="mt-2 bg-amber-50 border border-amber-300 text-amber-900 p-2.5 rounded-sm text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-900">Nodal Queue Alert:</strong> This substation node is marked with double-asterisks (**). Interconnection capacity is subject to pending applications in queue and requires formal TNB Grid Owner approval.
            </div>
          </div>
        )}
      </div>

      {/* Grid Key Technical Parameters */}
      <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-center font-mono">
        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase">Export Capacity</div>
          <div className="text-base font-black text-amber-700">{node.capacityMW} MW</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase">District</div>
          <div className="text-xs font-bold text-slate-800 truncate">{node.district}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase">Grid Approval</div>
          <div className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Validated
          </div>
        </div>
      </div>

      {/* Capacity Utilization Meter Box */}
      <div className="bg-slate-50 p-3.5 rounded border border-slate-200 font-sans space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-900">Capacity Utilization</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${statusBadgeClass}`}>
            {utilPct}% ({currentLoad} / {node.capacityMW} MW)
          </span>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barFillClass}`}
            style={{ width: `${utilPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 font-mono">
          <span>Status: <strong className="text-slate-800">{statusText}</strong></span>
          <span>Headroom: <strong className="text-emerald-700">{Math.round((node.capacityMW - currentLoad) * 10) / 10} MW</strong></span>
        </div>
      </div>

      {/* TNB Interconnection Headroom Verification Letter Card */}
      <div className="bg-amber-50/90 border border-amber-300 p-3.5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
            <Mail className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Grid Owner TNB Headroom Verification Letter</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-snug">
            Generate formal RFP enquiry letter to Tenaga Nasional Berhad (TNB) for real-time headroom & PMU {node.name} connection status.
          </p>
        </div>
        <button
          onClick={() => setIsTnbLetterOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded text-xs shrink-0 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border border-amber-400"
        >
          <FileText className="w-3.5 h-3.5 text-slate-950" />
          Draft TNB Letter
        </button>
      </div>

      {/* Nearby Suitable Land Plots Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-600" /> Candidate Land Plots Nearby PMU {node.name}
          </h3>
          <span className="text-xs text-slate-500 font-mono">({node.landParcels.length} Candidate Sites)</span>
        </div>
        <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded text-[11px] text-amber-900 mb-3 leading-snug">
          <strong>JUPEM Ownership Disclaimer:</strong> Land plots shown are spatial candidates. Lot ownership details are unverified and require official designation & classification via <strong>JUPEM eCadastre</strong> & <strong>PTG Carian Hakmilik</strong>. You can enter custom land details inside the Feasibility Study report.
        </div>

        <div className="space-y-3">
          {node.landParcels.map((land) => {
            const isSelected = selectedLandParcel?.id === land.id;

            return (
              <div
                key={land.id}
                onClick={() => onSelectLandParcel(land)}
                className={`p-4 rounded border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/50 shadow-xs'
                }`}
              >
                {/* Land Title & Distance Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 hover:text-amber-700">{land.name}</h4>
                    <span className="text-[11px] text-slate-500">{land.landCategory} &bull; {land.soilType}</span>
                  </div>
                  <div className="bg-amber-100 border border-amber-300 text-amber-900 px-2 py-1 rounded text-right shrink-0 font-mono">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">PMU Distance</div>
                    <div className="text-xs font-black">{land.distanceToPMUKm} km</div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3 font-mono">
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Land Area</span>
                    <strong className="text-slate-800">{land.areaAcres} Acres</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Solar Capacity</span>
                    <strong className="text-amber-700">{land.maxCapacityMW} MWp</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Terrain Slope</span>
                    <strong className="text-slate-800">{land.terrainSlope}° ({land.terrainCategory})</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Suitability Score</span>
                    <strong className="text-emerald-700 font-black">{land.overallScore}/100</strong>
                  </div>
                </div>

                {/* Economic & Interconnection Summary */}
                <div className="flex items-center justify-between text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 mb-3 font-mono">
                  <div>
                    <span className="text-slate-500 text-[11px]">Cable Route:</span> <strong className="text-slate-900">{land.estimatedCableLengthKm} km</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Cable CapEx:</span> <strong className="text-amber-700">RM {land.interconnectionCostMyr}M</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Est. LCOE:</span> <strong className="text-emerald-700">RM {land.estimatedLCOEMyr}/kWh</strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCompare(land);
                    }}
                    className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors"
                  >
                    + Compare
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnalyzeFeasibility(land, node);
                    }}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Generate Detailed Feasibility Study
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TnbEnquiryLetterModal
        isOpen={isTnbLetterOpen}
        onClose={() => setIsTnbLetterOpen(false)}
        pmuName={node.name}
        capacityMW={`${node.capacityMW} MW`}
        pmuVoltage={node.voltage}
        pmuState={node.state}
      />
    </div>
  );
};
