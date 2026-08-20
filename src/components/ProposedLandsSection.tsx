import React, { useState, useMemo } from 'react';
import { PMUNode, LandParcel, StateName } from '../types';
import {
  Sun,
  Zap,
  MapPin,
  Search,
  Filter,
  FileText,
  SlidersHorizontal,
  Compass,
  ArrowUpDown,
  CheckCircle2,
  Download,
  Building,
  ShieldCheck,
  TrendingUp,
  Award,
} from 'lucide-react';

interface ProposedLandsSectionProps {
  nodes: PMUNode[];
  onSelectNode: (node: PMUNode) => void;
  onSelectLandParcel: (land: LandParcel, pmu: PMUNode) => void;
  onAnalyzeFeasibility: (land: LandParcel, pmu: PMUNode) => void;
  onAddToCompare: (item: PMUNode | LandParcel) => void;
  onSwitchToMapTab: () => void;
}

interface CombinedLandItem {
  land: LandParcel;
  pmu: PMUNode;
}

export const ProposedLandsSection: React.FC<ProposedLandsSectionProps> = ({
  nodes,
  onSelectNode,
  onSelectLandParcel,
  onAnalyzeFeasibility,
  onAddToCompare,
  onSwitchToMapTab,
}) => {
  // Extract all proposed lands suggested by app across all PMUs
  const allProposedLands: CombinedLandItem[] = useMemo(() => {
    const list: CombinedLandItem[] = [];
    nodes.forEach((pmu) => {
      pmu.landParcels.forEach((land) => {
        list.push({ land, pmu });
      });
    });
    return list;
  }, [nodes]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedPMUId, setSelectedPMUId] = useState<string>('All');
  const [selectedPackage, setSelectedPackage] = useState<string>('All');
  const [selectedBadge, setSelectedBadge] = useState<string>('All');
  const [selectedZoning, setSelectedZoning] = useState<string>('Suitable Only');
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'score' | 'distance' | 'capacity' | 'landCost' | 'lcoe'>('score');

  // Filtered and sorted lands
  const filteredLands = useMemo(() => {
    return allProposedLands
      .filter(({ land, pmu }) => {
        if (selectedState !== 'All' && pmu.state !== selectedState) return false;
        if (selectedPMUId !== 'All' && pmu.id !== selectedPMUId) return false;

        // Zoning Classification Policy Check
        if (selectedZoning === 'Suitable Only') {
          if (
            land.isSuitableForSolarFarm === false ||
            land.categoryOfLandUse.includes('Residential') ||
            land.categoryOfLandUse.includes('Commercial') ||
            land.categoryOfLandUse.includes('Heavy Industrial') ||
            land.isResidentialExcluded ||
            land.isCommercialExcluded ||
            land.isIndustrialExcluded
          ) {
            return false;
          }
        } else if (selectedZoning === 'Agricultural') {
          if (!land.categoryOfLandUse.includes('Agricultural')) return false;
        } else if (selectedZoning === 'Scrubland') {
          if (!land.categoryOfLandUse.includes('Scrubland')) return false;
        } else if (selectedZoning === 'Mining') {
          if (!land.categoryOfLandUse.includes('Mining')) return false;
        } else if (selectedZoning === 'Excluded') {
          if (
            land.isSuitableForSolarFarm !== false &&
            !land.categoryOfLandUse.includes('Residential') &&
            !land.categoryOfLandUse.includes('Commercial') &&
            !land.categoryOfLandUse.includes('Heavy Industrial') &&
            !land.isResidentialExcluded &&
            !land.isCommercialExcluded &&
            !land.isIndustrialExcluded
          ) {
            return false;
          }
        }

        if (selectedPackage !== 'All') {
          if (selectedPackage === 'Package 1' && land.maxCapacityMW > 100) return false;
          if (selectedPackage === 'Package 2' && (land.maxCapacityMW <= 100 || land.maxCapacityMW > 250)) return false;
          if (selectedPackage === 'Mega' && land.maxCapacityMW <= 250) return false;
        }

        if (selectedBadge !== 'All') {
          if (selectedBadge === 'best' && !land.isBestOverall) return false;
          if (selectedBadge === 'cost' && !land.isLowestCost) return false;
          if (selectedBadge === 'fast' && !land.isFastestToDevelop) return false;
          if (selectedBadge === 'env' && !land.isLowestEnvRisk) return false;
        }

        if (land.overallScore < minScore) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchLandName = land.name.toLowerCase().includes(q);
          const matchLot = land.lotNumber.toLowerCase().includes(q);
          const matchMukim = land.mukim.toLowerCase().includes(q);
          const matchDistrict = land.district.toLowerCase().includes(q);
          const matchPMU = pmu.name.toLowerCase().includes(q);
          if (!matchLandName && !matchLot && !matchMukim && !matchDistrict && !matchPMU) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.land.overallScore - a.land.overallScore;
        if (sortBy === 'distance') return a.land.distanceToPMUKm - b.land.distanceToPMUKm;
        if (sortBy === 'capacity') return b.land.maxCapacityMW - a.land.maxCapacityMW;
        if (sortBy === 'landCost') return a.land.estimatedLandCostPerAcreMyr - b.land.estimatedLandCostPerAcreMyr;
        if (sortBy === 'lcoe') return a.land.estimatedLCOEMyr - b.land.estimatedLCOEMyr;
        return 0;
      });
  }, [allProposedLands, searchQuery, selectedState, selectedPMUId, selectedZoning, selectedPackage, selectedBadge, minScore, sortBy]);

  // Aggregate Stats
  const totalSitesCount = allProposedLands.length;
  const totalCapacityMW = allProposedLands.reduce((acc, curr) => acc + curr.land.maxCapacityMW, 0);
  const avgPMUDistance = (allProposedLands.reduce((acc, curr) => acc + curr.land.distanceToPMUKm, 0) / totalSitesCount).toFixed(1);
  const gradeASitesCount = allProposedLands.filter(({ land }) => land.overallScore >= 80).length;

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-6 space-y-6 shadow-sm text-slate-900 font-sans">
      {/* Title & Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono tracking-wider">
              LSS6 App Suggested Sites Directory
            </span>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
              {gradeASitesCount} Grade A Sites (Score ≥ 80)
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sun className="w-6 h-6 text-amber-600" /> Proposed Solar Farm Lands Suggested by App
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Pre-screened cadastral plots with verified GIS grid proximity, DEM topography, title ownership status, and instant online detailed feasibility study reports.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono shrink-0">
          <Award className="w-5 h-5 text-amber-600" />
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Suggested Capacity</span>
            <span className="text-base font-black text-amber-700">{totalCapacityMW.toLocaleString()} MWp Solar</span>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-center">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Proposed Lands</span>
          <div className="text-xl font-black text-slate-900">{totalSitesCount} Candidate Sites</div>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Solar Potential</span>
          <div className="text-xl font-black text-amber-700">{totalCapacityMW.toLocaleString()} MWp</div>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Avg Distance to PMU</span>
          <div className="text-xl font-black text-emerald-700">{avgPMUDistance} km</div>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Top Grade A Parcels</span>
          <div className="text-xl font-black text-blue-700">{gradeASitesCount} Sites</div>
        </div>
      </div>

      {/* LSS6 Official Program Quotas Callout */}
      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase">
              PETRA Official Quotas
            </span>
            <span className="font-bold text-amber-400">LSS6 Official 3 Tender Packages & Capacity Scales</span>
          </div>
          <span className="text-[10px] text-slate-300 hidden sm:inline">Target COD: <strong className="text-emerald-400 font-bold">31 Dec 2029</strong> | Est. Inv: <strong className="text-purple-300 font-bold">RM 13B–15B</strong></span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-800/80 p-2.5 rounded border border-amber-500/30">
            <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-0.5">
              <span>Package 1: Open Tender</span>
              <span className="bg-amber-500 text-slate-950 px-1 rounded text-[9px]">Open</span>
            </div>
            <div className="text-slate-100 text-sm font-black">2,200 MW Solar + 1,100 MW BESS</div>
            <div className="text-[10px] text-amber-300 font-bold mt-0.5">Scale: 60 MW – 500 MW</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">RFP Collection: July 27 – Aug 7 (ST HQ)</span>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded border border-blue-500/30">
            <div className="flex items-center justify-between text-[10px] text-blue-400 font-bold mb-0.5">
              <span>Package 2: Bumiputera Tender</span>
              <span className="bg-blue-500 text-white px-1 rounded text-[9px]">Bumi</span>
            </div>
            <div className="text-slate-100 text-sm font-black">300 MW Solar + 150 MW BESS</div>
            <div className="text-[10px] text-blue-300 font-bold mt-0.5">Scale: 60 MW – 500 MW</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">RFP Collection: July 27 – Aug 7 (ST HQ)</span>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded border border-purple-500/30">
            <div className="flex items-center justify-between text-[10px] text-purple-300 font-bold mb-0.5">
              <span>Package 3: Small Bumiputera</span>
              <span className="bg-purple-500 text-white px-1 rounded text-[9px]">SME</span>
            </div>
            <div className="text-slate-100 text-sm font-black">150 MW Solar (No BESS)</div>
            <div className="text-[10px] text-purple-300 font-bold mt-0.5">Scale: 10 MW – 30 MW</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">RFP Collection: Aug 17 – Aug 28 (ST HQ)</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase font-mono flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-amber-600" /> Search & Filter Proposed Solar Lands
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Showing <strong>{filteredLands.length}</strong> of {totalSitesCount} sites
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search site, lot, mukim, PMU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded pl-8 pr-3 py-1.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono shadow-xs text-xs"
            />
          </div>

          {/* Zoning Filter (Strict Exclusion Policy) */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-slate-500 font-bold uppercase text-[10px] font-mono shrink-0">Zoning:</span>
            <select
              value={selectedZoning}
              onChange={(e) => setSelectedZoning(e.target.value)}
              className="w-full bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer font-mono truncate text-xs"
            >
              <option value="Suitable Only">✅ Suitable Only (Excl. Res/Com/Ind)</option>
              <option value="Agricultural">Agricultural Only</option>
              <option value="Scrubland">Unutilized Scrubland</option>
              <option value="Mining">Former Mining Reclamation</option>
              <option value="Excluded">⚠️ Excluded Urban/Com/Ind (Audit View)</option>
            </select>
          </div>

          {/* PMU Substation Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 rounded px-2.5 py-1.5 shadow-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-slate-700 font-bold uppercase text-[10px] font-mono shrink-0">PMU:</span>
            <select
              value={selectedPMUId}
              onChange={(e) => setSelectedPMUId(e.target.value)}
              className="w-full bg-transparent text-slate-900 font-extrabold focus:outline-none cursor-pointer truncate text-xs"
              title="Filter proposed lands by PMU Node"
            >
              <option value="All">All PMUs (48 Substation Nodes)</option>
              {nodes.map((pmu) => (
                <option key={pmu.id} value={pmu.id}>
                  #{pmu.number} PMU {pmu.name} ({pmu.state})
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1.5 shadow-xs">
            <span className="text-slate-500 font-bold uppercase text-[10px] font-mono">State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="All">All States</option>
              <option value="Johor">Johor</option>
              <option value="Kedah">Kedah</option>
              <option value="Kelantan">Kelantan</option>
              <option value="Melaka">Melaka</option>
              <option value="N. Sembilan">N. Sembilan</option>
              <option value="Pahang">Pahang</option>
              <option value="Perak">Perak</option>
              <option value="P. Pinang">P. Pinang</option>
              <option value="Selangor">Selangor</option>
              <option value="Terengganu">Terengganu</option>
              <option value="Perlis">Perlis</option>
            </select>
          </div>

          {/* Package Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1.5 shadow-xs">
            <span className="text-slate-500 font-bold uppercase text-[10px] font-mono">Package:</span>
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="w-full bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="All">All Capacities</option>
              <option value="Package 1">Package 1 (50-100 MW)</option>
              <option value="Package 2">Package 2 (100-250 MW)</option>
              <option value="Mega">Mega (250+ MW)</option>
            </select>
          </div>

          {/* Badge Tag Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1.5 shadow-xs">
            <span className="text-slate-500 font-bold uppercase text-[10px] font-mono">Badge:</span>
            <select
              value={selectedBadge}
              onChange={(e) => setSelectedBadge(e.target.value)}
              className="w-full bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="All">All Strategic Badges</option>
              <option value="best">🏆 Best Overall Site</option>
              <option value="cost">💰 Lowest Cost</option>
              <option value="fast">⚡ Fast Track</option>
              <option value="env">🌿 Lowest Env Risk</option>
            </select>
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1.5 shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-slate-500 font-bold uppercase text-[10px] font-mono">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer font-mono"
            >
              <option value="score">Highest AI Score</option>
              <option value="distance">Shortest PMU Distance</option>
              <option value="capacity">Largest Solar Capacity</option>
              <option value="landCost">Lowest Land Cost / Acre</option>
              <option value="lcoe">Lowest Tariff LCOE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suggested Proposed Land Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredLands.map(({ land, pmu }) => {
          const is33kV = pmu.voltage === '33kV' || land.packageSuitability?.includes('Package 3');
          const is275kV = pmu.voltage === '275kV';
          const isPPU = pmu.substationType === 'PPU' || pmu.name.startsWith('PPU');
          const subPrefix = isPPU ? 'PPU' : 'PMU';

          return (
            <div
              key={land.id}
              className="bg-white border border-slate-300 hover:border-amber-500 rounded-lg p-5 space-y-4 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="space-y-2 border-b border-slate-200 pb-3">
                {/* PMU Node & Voltage Badge */}
                <div className="flex items-center justify-between gap-2 font-mono">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      is33kV
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : is275kV
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {subPrefix} {pmu.name} &bull; {pmu.voltage}
                  </span>
                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-300">
                    {pmu.state}
                  </span>
                </div>

                {/* Proposed Land Title & Cadastral Details */}
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">{land.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Lot: <strong className="text-slate-800">{land.lotNumber}</strong>, Mukim {land.mukim} &bull; {land.district}
                  </p>
                </div>

                {/* Strategic Badges & Solar-Only Indicator */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {is33kV ? (
                    <span
                      className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow-2xs font-mono border border-amber-400"
                      title="Package 3 RFP Rule: 100% Solar-Only (Zero BESS required)"
                    >
                      ☀️ SOLAR-ONLY (NO BESS)
                    </span>
                  ) : (
                    <span
                      className="bg-purple-100 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded font-mono border border-purple-300"
                      title="Packages 1 & 2 RFP Rule: Solar + BESS 4-Hour Hybrid"
                    >
                      🔋 HYBRID (+BESS)
                    </span>
                  )}
                  {land.isBestOverall && (
                    <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                      🏆 BEST OVERALL
                    </span>
                  )}
                  {land.isLowestCost && (
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                      💰 LOWEST COST
                    </span>
                  )}
                  {land.isFastestToDevelop && (
                    <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                      ⚡ FAST TRACK
                    </span>
                  )}
                  {land.isLowestEnvRisk && (
                    <span className="bg-teal-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                      🌿 CLEAN ENV
                    </span>
                  )}
                  <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                    {land.packageSuitability}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      land.floodRiskLevel?.includes('High')
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : land.floodRiskLevel?.includes('Moderate')
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}
                  >
                    💧 {land.floodRiskLevel || `${land.floodRisk} Flood Risk`}
                  </span>
                </div>
              </div>

              {/* Key Technical & Economic Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Land Area</span>
                  <strong className="text-slate-900 font-bold">{land.areaHectares} Ha</strong> ({land.areaAcres} Ac)
                </div>

                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Solar Capacity</span>
                  <strong className="text-amber-700 font-black">{land.maxCapacityMW} MWp</strong>
                </div>

                <div className="bg-amber-50/80 p-2.5 rounded border border-amber-300">
                  <span className="text-[10px] text-amber-900 font-bold block uppercase">Distance to PMU</span>
                  <strong className="text-amber-900 font-black text-sm">{land.distanceToPMUKm} km</strong>
                  <span className="text-[10px] text-slate-500 block">Cable: {land.estimatedCableLengthKm} km</span>
                </div>

                <div className="bg-emerald-50/80 p-2.5 rounded border border-emerald-300">
                  <span className="text-[10px] text-emerald-900 font-bold block uppercase">AI Suitability Score</span>
                  <strong className="text-emerald-900 font-black text-sm">{land.overallScore} / 100</strong>
                  <span className="text-[10px] text-emerald-700 block font-bold">Grade A Candidate</span>
                </div>
              </div>

              {/* Secondary Legal & Financial Information */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Cadastral Ownership:</span>
                  <strong className="text-slate-900 truncate font-semibold" title={land.ownershipType}>
                    {land.ownershipType.includes('Unverified') ? 'Unverified / JUPEM Search Req.' : land.ownershipType} ({land.landTitleType.split(' ')[0]})
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Est. Land Cost / Acre:</span>
                  <strong className="text-slate-900">RM {land.estimatedLandCostPerAcreMyr.toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">JPS Catchment:</span>
                  <strong className="text-blue-900 truncate max-w-[170px]" title={land.didRiverCatchment}>
                    {land.didRiverCatchment?.split('(')[0] || 'Peninsular Basin'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">50-Yr ARI Flood Level:</span>
                  <strong className="text-slate-900">{land.ariFloodLevel50Yr || 0.3}m (Pile: +{land.recommendedPileElevationMeters || 1.5}m)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Acquisition CapEx:</span>
                  <strong className="text-emerald-700 font-bold">RM {land.estimatedTotalLandAcquisitionCostMyr}M</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Est. Tariff (LCOE):</span>
                  <strong className="text-amber-700 font-bold">RM {land.estimatedLCOEMyr} / kWh</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* PRIMARY ACTION BUTTON: Generate Detailed Feasibility Study */}
                <button
                  onClick={() => onAnalyzeFeasibility(land, pmu)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-4 rounded text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer border border-amber-600 transform hover:scale-[1.01]"
                >
                  <FileText className="w-4 h-4" /> Generate Detailed Feasibility Study (View & PDF Export)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddToCompare(land)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-1.5 px-2 rounded text-[11px] border border-slate-300 transition-colors font-mono cursor-pointer"
                  >
                    + Compare
                  </button>
                  <button
                    onClick={() => {
                      onSelectNode(pmu);
                      onSelectLandParcel(land, pmu);
                      onSwitchToMapTab();
                    }}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-2 rounded text-[11px] transition-colors font-mono flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-amber-400" /> View on Map
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLands.length === 0 && (
        <div className="bg-slate-50 border border-slate-300 rounded p-12 text-center text-slate-500 font-mono">
          <Sun className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-slate-900 font-bold text-base">No App Suggested Lands Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your search query, state filter, or package requirements to view suggested candidate solar plots.
          </p>
        </div>
      )}
    </div>
  );
};
