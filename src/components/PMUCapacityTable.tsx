import React, { useState, useMemo } from 'react';
import { PMUNode, StateName, VoltageLevel } from '../types';
import {
  Zap,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Copy,
  Check,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sun,
  BatteryCharging,
} from 'lucide-react';

interface PMUCapacityTableProps {
  nodes: PMUNode[];
  onSelectNode?: (node: PMUNode) => void;
  onSwitchToMapTab?: () => void;
}

type SortField =
  | 'number'
  | 'name'
  | 'state'
  | 'voltage'
  | 'capacityMW'
  | 'currentLoadMW'
  | 'remainingMW'
  | 'utilizationPct';

export const PMUCapacityTable: React.FC<PMUCapacityTableProps> = ({
  nodes,
  onSelectNode,
  onSwitchToMapTab,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedVoltage, setSelectedVoltage] = useState<string>('All');
  const [headroomFilter, setHeadroomFilter] = useState<string>('All');
  
  const [sortField, setSortField] = useState<SortField>('remainingMW');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);

  // Computed Node Row Data
  const tableData = useMemo(() => {
    return nodes.map((node) => {
      const currentLoad = node.currentLoadMW ?? Math.round(node.capacityMW * 0.7);
      const remainingMW = Math.max(0, node.capacityMW - currentLoad);
      const utilizationPct =
        node.capacityUtilizationPct ?? Math.round((currentLoad / node.capacityMW) * 100);

      let statusCategory: 'high' | 'moderate' | 'low';
      if (remainingMW >= 50) {
        statusCategory = 'high';
      } else if (remainingMW >= 20) {
        statusCategory = 'moderate';
      } else {
        statusCategory = 'low';
      }

      return {
        node,
        number: node.number,
        name: node.name,
        state: node.state,
        district: node.district,
        voltage: node.voltage,
        capacityMW: node.capacityMW,
        currentLoadMW: currentLoad,
        remainingMW,
        utilizationPct,
        statusCategory,
        isPending: !!node.isPendingApplication,
      };
    });
  }, [nodes]);

  // Aggregate Stats
  const totalGridCapacity = useMemo(
    () => tableData.reduce((acc, d) => acc + d.capacityMW, 0),
    [tableData]
  );
  const totalAllocatedLoad = useMemo(
    () => tableData.reduce((acc, d) => acc + d.currentLoadMW, 0),
    [tableData]
  );
  const totalRemainingHeadroom = useMemo(
    () => tableData.reduce((acc, d) => acc + d.remainingMW, 0),
    [tableData]
  );
  const highHeadroomNodesCount = useMemo(
    () => tableData.filter((d) => d.remainingMW >= 50).length,
    [tableData]
  );

  // Filtered Data
  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      if (selectedState !== 'All' && item.state !== selectedState) return false;
      if (selectedVoltage !== 'All' && item.voltage !== selectedVoltage) return false;

      if (headroomFilter === 'high' && item.remainingMW < 50) return false;
      if (
        headroomFilter === 'moderate' &&
        (item.remainingMW < 20 || item.remainingMW >= 50)
      )
        return false;
      if (headroomFilter === 'low' && item.remainingMW >= 20) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchState = item.state.toLowerCase().includes(q);
        const matchDistrict = item.district.toLowerCase().includes(q);
        const matchNum = item.number.toString().includes(q);
        if (!matchName && !matchState && !matchDistrict && !matchNum) return false;
      }

      return true;
    });
  }, [tableData, selectedState, selectedVoltage, headroomFilter, searchQuery]);

  // Sorted Data
  const sortedData = useMemo(() => {
    const list = [...filteredData];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        const res = (valA as string).localeCompare(valB as string);
        return sortDirection === 'asc' ? res : -res;
      }

      const numA = valA as number;
      const numB = valB as number;
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
    return list;
  }, [filteredData, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // CSV Export & Copy
  const generateCsvContent = () => {
    const headers = [
      'PMU Number',
      'PMU Name',
      'State',
      'District',
      'Voltage Class',
      'Max Rated Capacity (MW)',
      'Current Allocated Load (MW)',
      'Remaining Headroom Capacity (MW)',
      'Capacity Utilization (%)',
      'Queue Status',
    ];

    const rows = sortedData.map((d) => [
      `#${d.number}`,
      `PMU ${d.name}`,
      d.state,
      d.district,
      d.voltage,
      d.capacityMW,
      d.currentLoadMW,
      d.remainingMW,
      `${d.utilizationPct}%`,
      d.isPending ? 'Pending Queue (**)' : 'Validated',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const handleCopyCsv = () => {
    const csvStr = generateCsvContent();
    navigator.clipboard.writeText(csvStr);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csvStr = generateCsvContent();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LSS6_PMU_Capacity_Headroom_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-300 rounded p-5 space-y-5 text-slate-900 shadow-sm font-sans">
      {/* Title & Explainer Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" /> PMU Nodal Capacity & Remaining Headroom Quick-Check Table
          </h2>
          <p className="text-xs text-slate-600 font-mono mt-0.5">
            Instant evaluation of available MW export capacity, current load, and remaining grid headroom across Peninsular Malaysia
          </p>
        </div>

        {/* Action Buttons: CSV Export & Copy */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-mono rounded border border-slate-300 transition-colors cursor-pointer"
            title="Copy CSV to Clipboard"
          >
            {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copiedCsv ? 'Copied CSV!' : 'Copy CSV'}</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold font-mono rounded transition-colors shadow-xs cursor-pointer"
            title="Download CSV Report"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Concept Definition Banner */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded p-3.5 text-slate-800 text-xs space-y-2 font-sans">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Understanding "Capacity Utilization" & "Remaining MW Headroom" for LSS6</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-700 font-mono">
          <div className="bg-white/80 p-2.5 rounded border border-amber-200/60">
            <strong className="text-slate-900 block font-sans">⚡ Capacity Utilization (%)</strong>
            <span className="text-slate-600">
              Ratio of current loaded/committed grid power to the maximum rated transformer/busbar export capacity.
            </span>
            <div className="mt-1 font-bold text-amber-800 text-[10px]">
              Util. % = (Current Load / Max Capacity) × 100
            </div>
          </div>
          <div className="bg-white/80 p-2.5 rounded border border-amber-200/60">
            <strong className="text-slate-900 block font-sans">🟢 Remaining Headroom (MW)</strong>
            <span className="text-slate-600">
              Unallocated export capacity in MW available for immediate LSS6 solar plant interconnection.
            </span>
            <div className="mt-1 font-bold text-emerald-800 text-[10px]">
              Headroom = Max Capacity − Current Load
            </div>
          </div>
          <div className="bg-white/80 p-2.5 rounded border border-amber-200/60">
            <strong className="text-slate-900 block font-sans">🎯 Strategic Tender Impact</strong>
            <span className="text-slate-600">
              Higher headroom (&gt;50 MW) minimizes risk of mandatory TNB grid upgrade CapEx or delayed COD.
            </span>
            <div className="mt-1 font-bold text-blue-800 text-[10px]">
              Crucial for 60 MW – 500 MW RFP bids
            </div>
          </div>
        </div>
        <div className="pt-1.5 border-t border-amber-200/70 text-[11px] text-amber-900/90 font-sans flex items-start gap-1.5">
          <span className="font-bold shrink-0">📌 Advisory Note:</span>
          <span>
            Remaining headroom numbers are estimated indicators for planning purposes. They do <strong>not restrict or block</strong> the execution of feasibility studies or proposal generation for any PMU node or land plot. Bidders may proceed with feasibility studies and proposal submissions for all nodes in full technical &amp; commercial compliance with the RFP.
          </span>
        </div>
      </div>

      {/* Aggregate Metrics Callout Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-slate-50 p-3 rounded border border-slate-200">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Designated Capacity</span>
          <div className="text-xl font-black text-slate-900">{totalGridCapacity.toLocaleString()} MW</div>
          <span className="text-[10px] text-slate-500">{nodes.length} PMU Nodes</span>
        </div>

        <div className="bg-slate-50 p-3 rounded border border-slate-200">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Allocated Load</span>
          <div className="text-xl font-black text-amber-700">{totalAllocatedLoad.toLocaleString()} MW</div>
          <span className="text-[10px] text-slate-500">Commited & Current Load</span>
        </div>

        <div className="bg-slate-50 p-3 rounded border border-slate-200 bg-emerald-50/50 border-emerald-200">
          <span className="text-[10px] text-emerald-800 font-bold uppercase block">Total Available Headroom</span>
          <div className="text-xl font-black text-emerald-700">{totalRemainingHeadroom.toLocaleString()} MW</div>
          <span className="text-[10px] text-emerald-700 font-bold">Available for LSS6 Interconnection</span>
        </div>

        <div className="bg-slate-50 p-3 rounded border border-slate-200">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">High Headroom Nodes (&ge;50MW)</span>
          <div className="text-xl font-black text-purple-700">{highHeadroomNodesCount} Nodes</div>
          <span className="text-[10px] text-slate-500">Ideal for Large Scale Solar</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
        {/* Direct PMU Selection Drop Menu */}
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 rounded px-2.5 py-1.5 shadow-xs font-mono">
          <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-slate-700 font-bold text-[11px] font-mono shrink-0">PMU Node:</span>
          <select
            onChange={(e) => {
              const selected = nodes.find((n) => n.id === e.target.value);
              if (selected && onSelectNode) {
                onSelectNode(selected);
                if (onSwitchToMapTab) onSwitchToMapTab();
              }
            }}
            defaultValue=""
            className="bg-transparent text-slate-900 font-extrabold text-xs focus:outline-none cursor-pointer max-w-[220px] truncate font-sans"
            title="Directly select a PMU Node"
          >
            <option value="" disabled className="text-slate-400">-- Select PMU Substation --</option>
            {nodes.map((node) => (
              <option key={node.id} value={node.id} className="bg-white text-slate-900 font-medium">
                #{node.number} PMU {node.name} ({node.voltage}, {node.state})
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PMU name, district, or state..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* State Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold text-[11px]">State:</span>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All States</option>
            <option value="Johor">Johor</option>
            <option value="Kedah">Kedah</option>
            <option value="Kelantan">Kelantan</option>
            <option value="Kuala Lumpur">Kuala Lumpur</option>
            <option value="Melaka">Melaka</option>
            <option value="N. Sembilan">N. Sembilan</option>
            <option value="Pahang">Pahang</option>
            <option value="Perak">Perak</option>
            <option value="P. Pinang">P. Pinang</option>
            <option value="Putrajaya">Putrajaya</option>
            <option value="Selangor">Selangor</option>
            <option value="Terengganu">Terengganu</option>
            <option value="Perlis">Perlis</option>
          </select>
        </div>

        {/* Voltage & Package Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold text-[11px]">Grid Level & Scope:</span>
          <select
            value={selectedVoltage}
            onChange={(e) => setSelectedVoltage(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono font-medium"
          >
            <option value="All">All Voltages & Packages</option>
            <option value="33kV">☀️ 33 kV &bull; Package 3 (Solar-Only, No BESS)</option>
            <option value="132kV">⚡ 132 kV &bull; Pkg 1/2 (Hybrid +BESS)</option>
            <option value="275kV">⚡ 275 kV &bull; Pkg 1/2 (Hybrid +BESS)</option>
          </select>
        </div>

        {/* Headroom Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold text-[11px]">Headroom:</span>
          <select
            value={headroomFilter}
            onChange={(e) => setHeadroomFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-bold"
          >
            <option value="All">All Headroom Levels</option>
            <option value="high">🟢 High Headroom (&ge;50 MW)</option>
            <option value="moderate">🟡 Moderate Headroom (20 - 49 MW)</option>
            <option value="low">🔴 Limited Headroom (&lt;20 MW)</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing <strong>{sortedData.length}</strong> of <strong>{tableData.length}</strong> PMUs
        </div>
      </div>

      {/* Quick-Check Interactive Data Table */}
      <div className="border border-slate-300 rounded overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-900 text-slate-200 font-mono text-[11px] border-b border-slate-800 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3 font-bold">
                <button
                  onClick={() => handleSort('number')}
                  className="flex items-center gap-1 hover:text-amber-400 cursor-pointer"
                >
                  <span>PMU Node</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 font-bold">
                <button
                  onClick={() => handleSort('state')}
                  className="flex items-center gap-1 hover:text-amber-400 cursor-pointer"
                >
                  <span>State / District</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 font-bold">Voltage</th>
              <th className="py-2.5 px-3 font-bold">Scope / BESS</th>
              <th className="py-2.5 px-3 font-bold text-right">
                <button
                  onClick={() => handleSort('capacityMW')}
                  className="flex items-center justify-end gap-1 hover:text-amber-400 w-full cursor-pointer"
                >
                  <span>Max Rated (MW)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 font-bold text-right">
                <button
                  onClick={() => handleSort('currentLoadMW')}
                  className="flex items-center justify-end gap-1 hover:text-amber-400 w-full cursor-pointer"
                >
                  <span>Current Load (MW)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 font-bold text-right bg-slate-800 text-amber-300">
                <button
                  onClick={() => handleSort('remainingMW')}
                  className="flex items-center justify-end gap-1 hover:text-amber-200 w-full cursor-pointer font-black"
                >
                  <span>Remaining MW Headroom</span>
                  <ArrowUpDown className="w-3 h-3 text-amber-400" />
                </button>
              </th>
              <th className="py-2.5 px-3 font-bold text-center">
                <button
                  onClick={() => handleSort('utilizationPct')}
                  className="flex items-center justify-center gap-1 hover:text-amber-400 w-full cursor-pointer"
                >
                  <span>Utilization %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 font-bold">Interconnection Status</th>
              <th className="py-2.5 px-3 font-bold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-mono">
                  No PMU nodes matched your search or filter criteria.
                </td>
              </tr>
            ) : (
              sortedData.map((row) => {
                const is275 = row.voltage === '275kV';

                let headroomBadgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                let headroomText = 'Optimal Headroom';
                if (row.remainingMW < 20) {
                  headroomBadgeClass = 'bg-rose-100 text-rose-900 border-rose-300';
                  headroomText = 'Limited Headroom';
                } else if (row.remainingMW < 50) {
                  headroomBadgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
                  headroomText = 'Moderate Headroom';
                }

                let barColor = 'bg-emerald-500';
                if (row.utilizationPct >= 85) {
                  barColor = 'bg-rose-500';
                } else if (row.utilizationPct >= 70) {
                  barColor = 'bg-amber-500';
                }

                return (
                  <tr key={row.node.id} className="hover:bg-slate-50 transition-colors">
                    {/* Node Name & Number */}
                    <td className="py-2.5 px-3 font-mono">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                        <span>PMU {row.name}</span>
                        {row.isPending && (
                          <span
                            title="Subject to pending queue applications"
                            className="text-amber-700 text-[10px] font-black cursor-help"
                          >
                            **
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">Node #{row.number}</div>
                    </td>

                    {/* State & District */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-800">{row.state}</div>
                      <div className="text-[10px] text-slate-500">{row.district}</div>
                    </td>

                    {/* Voltage Class */}
                    <td className="py-2.5 px-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          is275
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : row.voltage === '33kV'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {row.voltage}
                      </span>
                    </td>

                    {/* Scope & BESS Requirement Badge */}
                    <td className="py-2.5 px-3 font-mono">
                      {row.voltage === '33kV' ? (
                        <span
                          className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-black"
                          title="Package 3: Solar-Only (No BESS required, RM 0 CapEx)"
                        >
                          <Sun className="w-3 h-3 text-amber-600 fill-amber-500" />
                          <span>Solar-Only (No BESS)</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 bg-purple-50 text-purple-900 border border-purple-300 px-2 py-0.5 rounded text-[10px] font-bold"
                          title="Packages 1 & 2: Solar + BESS Hybrid (4-Hour Battery Storage Mandatory)"
                        >
                          <BatteryCharging className="w-3 h-3 text-purple-600" />
                          <span>Hybrid (+BESS)</span>
                        </span>
                      )}
                    </td>

                    {/* Max Rated Capacity */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {row.capacityMW} MW
                    </td>

                    {/* Current Allocated Load */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {row.currentLoadMW} MW
                    </td>

                    {/* Remaining Headroom Capacity (Highlighted Column) */}
                    <td className="py-2.5 px-3 text-right font-mono bg-amber-50/50">
                      <div className="text-sm font-black text-slate-900">
                        {row.remainingMW} MW
                      </div>
                    </td>

                    {/* Utilization Progress Bar */}
                    <td className="py-2.5 px-3 font-mono">
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                        <span>{row.utilizationPct}%</span>
                      </div>
                      <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden mx-auto">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${row.utilizationPct}%` }}
                        />
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold border ${headroomBadgeClass}`}
                      >
                        {row.remainingMW >= 50 && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {row.remainingMW >= 20 && row.remainingMW < 50 && (
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        )}
                        {row.remainingMW < 20 && <ShieldAlert className="w-3 h-3 text-rose-600" />}
                        <span>{headroomText}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          if (onSelectNode) onSelectNode(row.node);
                          if (onSwitchToMapTab) onSwitchToMapTab();
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-800 font-bold font-mono text-[10px] rounded border border-slate-300 transition-colors cursor-pointer"
                        title="Focus node on map and view nearby land plots"
                      >
                        Select & Map
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
