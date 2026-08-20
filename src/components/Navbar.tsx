import React from 'react';
import {
  Zap,
  MapPin,
  Layers,
  BarChart3,
  GitCompare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Cpu,
  FileText,
  Download,
  Printer,
  Sun,
  Table,
  Mail,
  BookOpen,
  HelpCircle,
  Database,
  BatteryCharging,
  Sparkles,
} from 'lucide-react';
import { StateName, VoltageLevel, PMUNode, RFPPackageProgram } from '../types';

interface NavbarProps {
  activeTab: 'map' | 'proposed' | 'custom' | 'analytics' | 'compare' | 'capacity';
  setActiveTab: (tab: 'map' | 'proposed' | 'custom' | 'analytics' | 'compare' | 'capacity') => void;
  selectedPackage: RFPPackageProgram;
  setSelectedPackage: (pkg: RFPPackageProgram) => void;
  onOpenPackageSelector: () => void;
  selectedState: string;
  setSelectedState: (state: string) => void;
  selectedVoltage: string;
  setSelectedVoltage: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  minCapacity: number;
  setMinCapacity: (cap: number) => void;
  totalNodeCount: number;
  filteredNodeCount: number;
  allNodes: PMUNode[];
  filteredNodes: PMUNode[];
  selectedNode: PMUNode | null;
  onSelectNode: (node: PMUNode) => void;
  onOpenSchematics: () => void;
  onDownloadReadme: () => void;
  onExportReadmePdf: () => void;
  onOpenTnbLetter?: () => void;
  onOpenUserManual?: () => void;
  onOpenOpenData?: () => void;
}

const MALAYSIA_STATES_HYBRID: (StateName | 'All')[] = [
  'All',
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'N. Sembilan',
  'Pahang',
  'Perak',
  'P. Pinang',
  'Selangor',
  'Terengganu',
  'Perlis',
];

const MALAYSIA_STATES_PACKAGE3: (StateName | 'All')[] = [
  'All',
  'Johor',
  'Kedah',
  'Kelantan',
  'Kuala Lumpur',
  'Melaka',
  'N. Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'P. Pinang',
  'Putrajaya',
  'Selangor',
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedPackage,
  setSelectedPackage,
  onOpenPackageSelector,
  selectedState,
  setSelectedState,
  selectedVoltage,
  setSelectedVoltage,
  searchQuery,
  setSearchQuery,
  minCapacity,
  setMinCapacity,
  totalNodeCount,
  filteredNodeCount,
  allNodes,
  filteredNodes,
  selectedNode,
  onSelectNode,
  onOpenSchematics,
  onDownloadReadme,
  onExportReadmePdf,
  onOpenTnbLetter,
  onOpenUserManual,
  onOpenOpenData,
}) => {
  const isPkg3 = selectedPackage === 'package3';
  const availableStates = isPkg3 ? MALAYSIA_STATES_PACKAGE3 : MALAYSIA_STATES_HYBRID;

  return (
    <header className="bg-white border-b border-slate-300 text-slate-900 sticky top-0 z-50 shadow-sm font-sans">
      {/* Top LSS6 RFP Banner */}
      <div className="bg-slate-900 text-slate-100 px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-sm text-[10px] font-black tracking-widest uppercase font-mono">
            PETRA & ST RFP
          </span>

          {/* Quick Package Toggle in Banner */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-md border border-slate-700 font-mono text-[11px]">
            <button
              onClick={() => setSelectedPackage('hybrid')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all font-bold ${
                !isPkg3
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Switch to Packages 1 & 2: LSS6-Hybrid (Solar + BESS, 132/275kV)"
            >
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>Pkg 1 & 2: Hybrid (132/275kV)</span>
            </button>
            <button
              onClick={() => setSelectedPackage('package3')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all font-bold ${
                isPkg3
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Switch to Package 3: LSS6-Solar Bumiputera (33kV and below)"
            >
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span>Pkg 3: Solar 33kV (Bumiputera)</span>
            </button>
            <button
              onClick={onOpenPackageSelector}
              className="px-2 py-1 text-slate-400 hover:text-amber-400 border-l border-slate-700 ml-0.5"
              title="Open full Package Comparison & Architecture Matrix"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-slate-300 font-medium hidden lg:inline">
            {isPkg3 ? (
              <>
                <strong className="text-blue-400">Package 3 (LSS6-Solar)</strong> &bull; 226 Designated Substations (173 PMUs + 53 PPUs at 33kV & below) | <strong className="text-amber-400">150 MWa.c. Quota</strong> | <strong className="text-purple-300">≥60% Bumiputera Equity</strong>
              </>
            ) : (
              <>
                <strong className="text-emerald-400">Packages 1 & 2 (Hybrid)</strong> &bull; 48 PMUs (132/275kV) | <strong className="text-amber-400">2,500 MW Solar + 1,250 MW BESS</strong>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          {onOpenOpenData && (
            <button
              onClick={onOpenOpenData}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-1 rounded text-[11px] transition-colors shadow-xs cursor-pointer border border-blue-400"
              title="Open JUPEM MyGeoServe, OpenDOSM, PLANMalaysia & Satellite Integration Hub"
            >
              <Database className="w-3.5 h-3.5 text-white" /> OpenGIS & JUPEM Data
            </button>
          )}
          {onOpenUserManual && (
            <button
              onClick={onOpenUserManual}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-2.5 py-1 rounded text-[11px] transition-colors shadow-xs cursor-pointer border border-emerald-400"
              title="Open interactive application user manual and feature walkthrough"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-950" /> User Manual Guide
            </button>
          )}
          {onOpenTnbLetter && (
            <button
              onClick={onOpenTnbLetter}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-2.5 py-1 rounded text-[11px] transition-colors shadow-xs cursor-pointer border border-amber-400"
              title="Open formal draft letter to TNB verifying headroom availability"
            >
              <Mail className="w-3.5 h-3.5" /> TNB Enquiry Letter
            </button>
          )}
          <button
            onClick={onOpenSchematics}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" /> System Architecture
          </button>
          <button
            onClick={onExportReadmePdf}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-1 rounded text-[11px] transition-colors shadow-xs cursor-pointer border border-rose-500"
            title="Export full README documentation as formatted A4 PDF"
          >
            <Printer className="w-3.5 h-3.5" /> Print README
          </button>
          <button
            onClick={onDownloadReadme}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded text-[11px] font-extrabold transition-colors shadow-xs cursor-pointer"
            title="Download full README as Markdown file"
          >
            <Download className="w-3.5 h-3.5" /> README .md
          </button>
        </div>
      </div>

      {/* Main Header & Nav Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title / Brand */}
        <div className="flex items-center gap-3.5">
          <div className={`w-9 h-9 rounded-sm flex items-center justify-center font-black shadow-sm ${
            isPkg3 ? 'bg-blue-600 text-white' : 'bg-amber-500 text-slate-950'
          }`}>
            {isPkg3 ? <Sun className="w-5 h-5 fill-white" /> : <Zap className="w-5 h-5 fill-slate-950" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                LSS6 <span className="text-slate-500 font-normal">PMU FEASIBILITY ENGINE</span>
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                isPkg3 ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {isPkg3 ? 'Package 3: Solar (33kV)' : 'Packages 1 & 2: Hybrid (132/275kV)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
              {isPkg3 ? '60 Designated 33kV Nodal Points & Candidate Land Optimizer' : 'Pencawang Masuk Utama (PMU) & Land Interconnection Analyzer'}
            </p>
          </div>
        </div>

        {/* View Mode Nav Tabs */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 p-1 rounded border border-slate-200">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-white text-amber-700 shadow-sm border border-slate-300 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Node Map & Sites
          </button>
          <button
            onClick={() => setActiveTab('proposed')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'proposed'
                ? isPkg3 ? 'bg-blue-600 text-white shadow-sm border border-blue-700 font-extrabold' : 'bg-amber-500 text-slate-950 shadow-sm border border-amber-600 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sun className="w-3.5 h-3.5" /> App Proposed Lands
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-white text-amber-700 shadow-sm border border-slate-300 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Pin Distance Dropper
          </button>
          <button
            onClick={() => setActiveTab('capacity')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'capacity'
                ? isPkg3 ? 'bg-blue-600 text-white shadow-sm border border-blue-700 font-extrabold' : 'bg-amber-500 text-slate-950 shadow-sm border border-amber-600 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> MW Capacity Table
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-amber-700 shadow-sm border border-slate-300 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Grid Analytics
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'compare'
                ? 'bg-white text-amber-700 shadow-sm border border-slate-300 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" /> Compare Sites
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-100 border-t border-slate-200 px-6 py-2.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left Controls: Search & Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* PMU Dropdown Menu Selector */}
            <div className={`flex items-center gap-2 border rounded px-3 py-1.5 shadow-xs font-mono ${
              isPkg3 ? 'bg-blue-500/15 border-blue-500/40' : 'bg-amber-500/15 border-amber-500/40'
            }`}>
              <Zap className={`w-3.5 h-3.5 shrink-0 ${isPkg3 ? 'text-blue-600' : 'text-amber-600'}`} />
              <span className="text-slate-900 font-extrabold uppercase text-[10px] tracking-wider whitespace-nowrap font-sans">
                PMU Node:
              </span>
              <select
                value={selectedNode?.id || ''}
                onChange={(e) => {
                  const found = allNodes.find((n) => n.id === e.target.value);
                  if (found) onSelectNode(found);
                }}
                className="bg-transparent text-slate-900 font-extrabold text-xs focus:outline-none cursor-pointer max-w-[280px] truncate"
                title="Select PMU Substation Node"
              >
                {filteredNodes.map((node) => (
                  <option key={node.id} value={node.id} className="bg-white text-slate-900 font-medium font-mono">
                    #{node.number} PMU {node.name} ({node.voltage} &bull; {node.state}) - {node.capacityMW} MW
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isPkg3 ? "Search Package 3 33kV PMU (e.g. Guthrie, Tikam Batu)..." : "Search PMU Node name..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500 font-mono shadow-sm"
              />
            </div>

            {/* State Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-3 py-1.5 shadow-sm">
              <Filter className="w-3 h-3 text-amber-600" />
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">State:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer"
              >
                {availableStates.map((st) => (
                  <option key={st} value={st} className="bg-white text-slate-800">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Voltage Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-3 py-1.5 shadow-sm">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Voltage:</span>
              <select
                value={selectedVoltage}
                onChange={(e) => setSelectedVoltage(e.target.value)}
                className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-white text-slate-800">
                  All Voltages
                </option>
                {isPkg3 ? (
                  <option value="33kV" className="bg-white text-blue-700 font-bold">
                    33 kV (152 Nodes)
                  </option>
                ) : (
                  <>
                    <option value="132kV" className="bg-white text-emerald-700 font-bold">
                      132 kV (38 Nodes)
                    </option>
                    <option value="275kV" className="bg-white text-purple-700 font-bold">
                      275 kV (10 Nodes)
                    </option>
                  </>
                )}
              </select>
            </div>

            {/* Min Capacity Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-3 py-1.5 shadow-sm">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Min Export:</span>
              <select
                value={minCapacity}
                onChange={(e) => setMinCapacity(Number(e.target.value))}
                className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer font-mono"
              >
                <option value={0} className="bg-white text-slate-800">
                  All Capacities
                </option>
                {isPkg3 ? (
                  <>
                    <option value={10} className="bg-white text-slate-800">
                      ≥ 10 MW
                    </option>
                    <option value={20} className="bg-white text-slate-800">
                      ≥ 20 MW
                    </option>
                    <option value={25} className="bg-white text-slate-800">
                      ≥ 25 MW
                    </option>
                    <option value={30} className="bg-white text-slate-800">
                      = 30 MW (Max Pkg 3)
                    </option>
                  </>
                ) : (
                  <>
                    <option value={50} className="bg-white text-slate-800">
                      ≥ 50 MW
                    </option>
                    <option value={100} className="bg-white text-slate-800">
                      ≥ 100 MW
                    </option>
                    <option value={200} className="bg-white text-slate-800">
                      ≥ 200 MW
                    </option>
                    <option value={250} className="bg-white text-slate-800">
                      = 250 MW (275kV)
                    </option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Right Status Count */}
          <div className="text-slate-500 text-xs font-semibold flex items-center gap-2">
            <span className="font-mono">
              Showing <strong className={isPkg3 ? "text-blue-600" : "text-amber-600"}>{filteredNodeCount}</strong> of{' '}
              <strong className="text-slate-900">{totalNodeCount}</strong> Nodes
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

