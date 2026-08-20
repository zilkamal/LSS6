import React, { useState } from 'react';
import { PMUNode } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, Zap, Sun, ShieldAlert, CheckCircle2, MapPin, Sparkles, Calendar, TrendingUp, Award, ArrowRight, Flame } from 'lucide-react';
import { LSS6BiddingWizardModal } from './LSS6BiddingWizardModal';
import { PMUCapacityTable } from './PMUCapacityTable';
import { GeospatialRiskHeatmapD3 } from './GeospatialRiskHeatmapD3';

interface AnalyticsDashboardProps {
  nodes: PMUNode[];
  onSelectNode?: (node: PMUNode) => void;
  onSwitchToMapTab?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  nodes,
  onSelectNode,
  onSwitchToMapTab,
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  // Aggregate Export Capacity by State
  const stateCapacityMap: Record<string, { state: string; capacityMW: number; nodeCount: number }> = {};

  nodes.forEach((n) => {
    if (!stateCapacityMap[n.state]) {
      stateCapacityMap[n.state] = { state: n.state, capacityMW: 0, nodeCount: 0 };
    }
    stateCapacityMap[n.state].capacityMW += n.capacityMW;
    stateCapacityMap[n.state].nodeCount += 1;
  });

  const stateChartData = Object.values(stateCapacityMap).sort((a, b) => b.capacityMW - a.capacityMW);

  // Aggregate Voltage Distribution
  const count132 = nodes.filter((n) => n.voltage === '132kV').length;
  const count275 = nodes.filter((n) => n.voltage === '275kV').length;

  const voltageChartData = [
    { name: '132 kV Nodes (38 total)', value: count132, color: '#059669' },
    { name: '275 kV Nodes (10 total)', value: count275, color: '#7c3aed' },
  ];

  // Total export capacity sum
  const totalCapacityMW = nodes.reduce((acc, n) => acc + n.capacityMW, 0);

  return (
    <div className="bg-white border border-slate-300 rounded p-6 space-y-6 text-slate-800 shadow-sm font-sans">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600" /> LSS6 Grid Analytics & Strategic Bidding Intelligence
          </h2>
          <p className="text-xs text-slate-600 font-mono">
            Macroscopic capacity distribution, regional GHI performance, and PETRA official tender parameters
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold font-mono text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>Launch Bidding Strategy & Qualification Wizard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* LSS6 PETRA Official Program Quotas & 3 Tender Packages Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-lg border border-slate-800 space-y-4 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase">
              PETRA Official Announcement
            </span>
            <span className="text-sm font-bold text-amber-400">
              Large Scale Solar 6 (LSS6) Program Parameters & Tender Structure
            </span>
          </div>
          <span className="text-xs text-slate-300">
            Est. Investment: <strong className="text-purple-300 font-bold">RM 13 Billion – RM 15 Billion</strong>
          </span>
        </div>

        {/* 3 Tender Packages Breakdown */}
        <div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            📋 Official 3 Tender Package Allocation & Capacity Scales
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-800/90 p-3.5 rounded border border-amber-500/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 px-2 py-0.5 text-[9px] font-black uppercase rounded-bl">
                Package 1
              </div>
              <strong className="text-amber-400 text-sm block mb-1">Open Tender</strong>
              <div className="text-xl font-black text-white">2,200 MW <span className="text-xs font-normal text-slate-400">Solar</span></div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">+ 1,100 MW BESS</div>
              <div className="text-[10px] text-amber-300 font-bold mt-1">Bidding Scale: 60 MW – 500 MW</div>
              <p className="text-[11px] text-slate-300 mt-2 border-t border-slate-700/80 pt-2 leading-tight">
                Open to all eligible domestic & international renewable developers.
              </p>
            </div>

            <div className="bg-slate-800/90 p-3.5 rounded border border-blue-500/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-0.5 text-[9px] font-black uppercase rounded-bl">
                Package 2
              </div>
              <strong className="text-blue-400 text-sm block mb-1">Bumiputera Tender</strong>
              <div className="text-xl font-black text-white">300 MW <span className="text-xs font-normal text-slate-400">Solar</span></div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">+ 150 MW BESS</div>
              <div className="text-[10px] text-blue-300 font-bold mt-1">Bidding Scale: 60 MW – 500 MW</div>
              <p className="text-[11px] text-slate-300 mt-2 border-t border-slate-700/80 pt-2 leading-tight">
                Allocated exclusively for qualified Bumiputera energy companies.
              </p>
            </div>

            <div className="bg-slate-800/90 p-3.5 rounded border border-purple-500/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-500 text-white px-2 py-0.5 text-[9px] font-black uppercase rounded-bl">
                Package 3
              </div>
              <strong className="text-purple-300 text-sm block mb-1">Small Bumiputera Tender</strong>
              <div className="text-xl font-black text-white">150 MW <span className="text-xs font-normal text-slate-400">Solar</span></div>
              <div className="text-sm font-bold text-slate-400 mt-0.5">No BESS Required</div>
              <div className="text-[10px] text-purple-300 font-bold mt-1">Bidding Scale: 10 MW – 30 MW</div>
              <p className="text-[11px] text-slate-300 mt-2 border-t border-slate-700/80 pt-2 leading-tight">
                Designed to assist smaller indigenous renewable enterprises.
              </p>
            </div>
          </div>
        </div>

        {/* Key Guidelines & Critical Deadlines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
          {/* Key Guidelines */}
          <div className="bg-slate-800/60 p-3.5 rounded border border-slate-700/80 space-y-2">
            <span className="font-bold text-amber-400 uppercase text-[11px] block">
              📌 Key Project Guidelines & Criteria
            </span>
            <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
              <li><strong>Target COD:</strong> All plants must achieve commercial operation by <strong>31 December 2029</strong>.</li>
              <li><strong>Location Priority:</strong> Strategic focus on high-growth zones (Southern Region).</li>
              <li><strong>Local Sourcing:</strong> Energy Commission gives priority to domestic PV module equipment.</li>
              <li><strong>Experience:</strong> Proof of prior solar facility dev required; <em>BESS experience non-mandatory</em>.</li>
            </ul>
          </div>

          {/* RFP Timelines & Economic Forecast */}
          <div className="bg-slate-800/60 p-3.5 rounded border border-slate-700/80 space-y-2">
            <span className="font-bold text-emerald-400 uppercase text-[11px] block">
              📅 Energy Commission (ST) RFP Dates & Impact
            </span>
            <div className="space-y-1 text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span>Packages 1 & 2 RFPs:</span>
                <strong className="text-amber-400">July 27 – August 7 (ST HQ)</strong>
              </div>
              <div className="flex justify-between">
                <span>Package 3 RFPs:</span>
                <strong className="text-purple-300">August 17 – August 28 (ST HQ)</strong>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1 mt-1">
                <span>EPCC Job Creation:</span>
                <strong className="text-emerald-400">15,000 – 20,000 Jobs</strong>
              </div>
              <div className="flex justify-between">
                <span>Annual Carbon Offsets:</span>
                <strong className="text-blue-400">2.6 Million Tonnes CO₂/yr</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Callout Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="bg-slate-50 p-4 rounded border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Designated Nodes</span>
          <div className="text-2xl font-black text-amber-700">48 Nodes</div>
          <span className="text-xs text-slate-500">38 x 132kV | 10 x 275kV</span>
        </div>

        <div className="bg-slate-50 p-4 rounded border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Grid Export Capacity</span>
          <div className="text-2xl font-black text-slate-900">{totalCapacityMW.toLocaleString()} MW</div>
          <span className="text-xs text-slate-500">Range: 50 MW to 250 MW</span>
        </div>

        <div className="bg-slate-50 p-4 rounded border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Highest Irradiance Region</span>
          <div className="text-2xl font-black text-emerald-700">Perlis & Kedah</div>
          <span className="text-xs text-slate-500">&gt; 1,880 kWh/m²/year</span>
        </div>

        <div className="bg-slate-50 p-4 rounded border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Pending Queue Nodes (**)</span>
          <div className="text-2xl font-black text-amber-700">3 Nodes</div>
          <span className="text-xs text-slate-500">Rubber City, Proton City, Ulu Yam</span>
        </div>
      </div>

      {/* Geospatial Risk Heatmap Engine (D3 Visualization) */}
      <GeospatialRiskHeatmapD3
        nodes={nodes}
        onSelectNode={onSelectNode}
        onSwitchToMapTab={onSwitchToMapTab}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
        {/* Chart 1: Export Capacity by State */}
        <div className="bg-slate-50 p-5 rounded border border-slate-200">
          <h3 className="text-xs font-bold text-slate-900 uppercase mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" /> Total Export Capacity (MW) by State
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="state" stroke="#64748b" fontSize={10} interval={0} angle={-30} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a' }} />
                <Bar dataKey="capacityMW" fill="#d97706" radius={[4, 4, 0, 0]} name="Capacity (MW)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Voltage Split */}
        <div className="bg-slate-50 p-5 rounded border border-slate-200 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" /> Voltage Class Share (132 kV vs 275 kV)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={voltageChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {voltageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#334155', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick-Check MW Capacity & Remaining Headroom Table Tool */}
      <PMUCapacityTable
        nodes={nodes}
        onSelectNode={onSelectNode}
        onSwitchToMapTab={onSwitchToMapTab}
      />

      {/* LSS6 Interactive Bidding Wizard Modal */}
      <LSS6BiddingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </div>
  );
};
