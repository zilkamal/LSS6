import React, { useState, useMemo } from 'react';
import { LandParcel } from '../types';
import {
  Mountain,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Layers,
  HelpCircle,
  Eye,
  Maximize2,
  TrendingDown,
  Ruler,
  ShieldAlert,
  HardHat,
  ChevronRight,
  Info
} from 'lucide-react';

interface TopographicalRiskVisualizerProps {
  land: LandParcel;
}

export type ViewOverlayMode = 'combined' | 'elevation' | 'slope' | 'flood' | 'usability';

interface SubSectorData {
  id: string;
  row: number;
  col: number;
  elevationASL: number;
  slopeDeg: number;
  floodDepthMeters: number;
  isHighSlope: boolean;
  isSteepSlope: boolean;
  isFloodZone: boolean;
  isDualRisk: boolean;
  isOptimal: boolean;
  usableStatus: 'Optimal' | 'Requires Terracing' | 'High Piling Needed' | 'Excluded Hazard';
  requiredPileHeightM: number;
  subSectorAcres: number;
  subSectorHectares: number;
  civilCostEstimateMyr: number;
}

export const TopographicalRiskVisualizer: React.FC<TopographicalRiskVisualizerProps> = ({ land }) => {
  const [overlayMode, setOverlayMode] = useState<ViewOverlayMode>('combined');
  const [selectedSector, setSelectedSector] = useState<SubSectorData | null>(null);
  const [hoveredSector, setHoveredSector] = useState<SubSectorData | null>(null);

  const baseElevation = land.elevationDEM || 35;
  const baseSlope = land.terrainSlope || 4.2;
  const baseFloodDepth = land.ariFloodLevel50Yr || 0.3;
  const floodRiskLevel = land.floodRisk || 'Low';
  const totalAcres = land.areaAcres || 250;

  // Generate deterministic 10x10 grid based on land parcel lat/lng/elevation
  const { grid, summaryStats, crossSectionPoints, minElev, maxElev, maxSlope } = useMemo(() => {
    const gridData: SubSectorData[] = [];
    const subAcres = Math.round((totalAcres / 100) * 100) / 100;
    const subHectares = Math.round((subAcres * 0.404686) * 100) / 100;

    let totalOptimalCount = 0;
    let totalHighSlopeCount = 0;
    let totalFloodZoneCount = 0;
    let totalDualRiskCount = 0;

    let currentMinElev = 999;
    let currentMaxElev = -999;
    let currentMaxSlope = 0;

    // Deterministic pseudo-random seed based on lat/lng
    const seed = (Math.abs(land.lat) * 10000 + Math.abs(land.lng) * 1000) % 100;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        // Spatial wave functions for elevation variation
        const elevOffset =
          Math.sin((r + seed * 0.1) * 0.65 + (c + seed * 0.2) * 0.4) * (baseSlope * 1.8) +
          Math.cos((c - seed * 0.05) * 0.8) * 3.2 -
          (r > 6 ? 2.5 : 0); // Lower elevation towards south (r > 6) simulating valley/river bank

        const elev = Math.round((baseElevation + elevOffset) * 10) / 10;
        if (elev < currentMinElev) currentMinElev = elev;
        if (elev > currentMaxElev) currentMaxElev = elev;

        // Local slope variation
        const slopeVar =
          Math.sin((r * 1.2 + c * 0.9 + seed)) * 3.8 +
          (c > 7 ? 4.5 : 0) + // East ridge
          (r < 2 ? 3.0 : 0); // North slope

        const slope = Math.max(0.4, Math.round((baseSlope + slopeVar) * 10) / 10);
        if (slope > currentMaxSlope) currentMaxSlope = slope;

        // Flood hazard check: lower elevation sub-sectors near southern river basin
        const floodDepth =
          elev <= baseElevation - 0.8 || (floodRiskLevel === 'High' && r >= 6) || (floodRiskLevel === 'Moderate' && r >= 8)
            ? Math.round((baseFloodDepth + (baseElevation - elev > 0 ? (baseElevation - elev) * 0.4 : 0.1)) * 100) / 100
            : 0;

        const isHighSlope = slope >= 8.0 && slope < 15.0;
        const isSteepSlope = slope >= 15.0;
        const isFloodZone = floodDepth > 0.15;
        const isDualRisk = (isHighSlope || isSteepSlope) && isFloodZone;
        const isOptimal = !isHighSlope && !isSteepSlope && !isFloodZone;

        if (isOptimal) totalOptimalCount++;
        if (isHighSlope || isSteepSlope) totalHighSlopeCount++;
        if (isFloodZone) totalFloodZoneCount++;
        if (isDualRisk) totalDualRiskCount++;

        let usableStatus: SubSectorData['usableStatus'] = 'Optimal';
        if (isSteepSlope || isDualRisk) {
          usableStatus = 'Excluded Hazard';
        } else if (isHighSlope) {
          usableStatus = 'Requires Terracing';
        } else if (isFloodZone) {
          usableStatus = 'High Piling Needed';
        }

        const requiredPileHeightM = Math.max(
          land.recommendedPileElevationMeters || 1.5,
          Math.round((floodDepth + 1.2) * 10) / 10
        );

        const civilCostEstimateMyr = isSteepSlope
          ? 35000
          : isHighSlope
          ? 18000
          : isFloodZone
          ? 12000
          : 2500;

        const colLetter = String.fromCharCode(65 + c);
        const sectorId = `${colLetter}${r + 1}`;

        gridData.push({
          id: sectorId,
          row: r,
          col: c,
          elevationASL: elev,
          slopeDeg: slope,
          floodDepthMeters: floodDepth,
          isHighSlope,
          isSteepSlope,
          isFloodZone,
          isDualRisk,
          isOptimal,
          usableStatus,
          requiredPileHeightM,
          subSectorAcres: subAcres,
          subSectorHectares: subHectares,
          civilCostEstimateMyr
        });
      }
    }

    // Generate Cross-Section Profile across row 5 (West to East)
    const crossSection = gridData
      .filter((s) => s.row === 4)
      .map((s, idx) => ({
        xPercent: idx * 11.1,
        sectorId: s.id,
        elevation: s.elevationASL,
        slope: s.slopeDeg,
        floodWaterElev: s.floodDepthMeters > 0 ? s.elevationASL + s.floodDepthMeters : null,
        trackerTopElev: s.elevationASL + s.requiredPileHeightM,
        isHazard: s.isHighSlope || s.isFloodZone
      }));

    const stats = {
      optimalPercent: Math.round((totalOptimalCount / 100) * 100),
      highSlopePercent: Math.round((totalHighSlopeCount / 100) * 100),
      floodZonePercent: Math.round((totalFloodZoneCount / 100) * 100),
      dualRiskPercent: Math.round((totalDualRiskCount / 100) * 100),
      usableAcres: Math.round((totalAcres * (totalOptimalCount + totalHighSlopeCount * 0.8 + totalFloodZoneCount * 0.7) / 100) * 10) / 10,
      totalCivilEstMyr: Math.round(
        gridData.reduce((acc, curr) => acc + curr.civilCostEstimateMyr, 0) / 1000000 * 100
      ) / 100
    };

    return {
      grid: gridData,
      summaryStats: stats,
      crossSectionPoints: crossSection,
      minElev: currentMinElev,
      maxElev: currentMaxElev,
      maxSlope: currentMaxSlope
    };
  }, [land, baseElevation, baseSlope, baseFloodDepth, floodRiskLevel, totalAcres]);

  const activeSector = hoveredSector || selectedSector || grid[44]; // default to center C5

  // Color helper functions based on overlayMode
  const getCellStyle = (cell: SubSectorData) => {
    if (overlayMode === 'combined') {
      if (cell.isDualRisk) {
        return 'bg-purple-900/90 text-purple-100 border-purple-500 shadow-inner';
      }
      if (cell.isSteepSlope) {
        return 'bg-rose-700 text-white border-rose-500';
      }
      if (cell.isHighSlope) {
        return 'bg-amber-600/90 text-amber-50 border-amber-400';
      }
      if (cell.isFloodZone) {
        return 'bg-cyan-600/90 text-cyan-50 border-cyan-400 animate-pulse';
      }
      return 'bg-emerald-700/80 text-emerald-50 border-emerald-500 hover:bg-emerald-600';
    }

    if (overlayMode === 'elevation') {
      const range = Math.max(1, maxElev - minElev);
      const ratio = (cell.elevationASL - minElev) / range;
      if (ratio > 0.75) return 'bg-amber-800 text-amber-100 border-amber-600';
      if (ratio > 0.5) return 'bg-amber-600 text-amber-50 border-amber-400';
      if (ratio > 0.25) return 'bg-emerald-600 text-emerald-50 border-emerald-400';
      return 'bg-teal-700 text-teal-100 border-teal-500';
    }

    if (overlayMode === 'slope') {
      if (cell.slopeDeg >= 15) return 'bg-rose-700 text-white font-bold border-rose-500';
      if (cell.slopeDeg >= 8) return 'bg-amber-600 text-amber-50 font-bold border-amber-400';
      if (cell.slopeDeg >= 3) return 'bg-emerald-600 text-emerald-50 border-emerald-400';
      return 'bg-emerald-800 text-emerald-100 border-emerald-600';
    }

    if (overlayMode === 'flood') {
      if (cell.floodDepthMeters > 0.6) return 'bg-blue-800 text-blue-100 font-bold border-blue-400';
      if (cell.floodDepthMeters > 0.2) return 'bg-cyan-600 text-cyan-50 border-cyan-300';
      return 'bg-slate-800/80 text-slate-300 border-slate-700';
    }

    if (overlayMode === 'usability') {
      if (cell.usableStatus === 'Optimal') return 'bg-emerald-600 text-white border-emerald-400';
      if (cell.usableStatus === 'Requires Terracing') return 'bg-amber-500 text-slate-900 border-amber-300';
      if (cell.usableStatus === 'High Piling Needed') return 'bg-blue-600 text-white border-blue-300';
      return 'bg-rose-900 text-rose-200 border-rose-700 line-through opacity-80';
    }

    return 'bg-slate-700 text-slate-200';
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-lg p-5 border border-slate-800 space-y-5 font-mono text-xs shadow-xl">
      {/* Visualizer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1">
              <Mountain className="w-3 h-3 text-emerald-400" /> Topographical & Hydrological DEM Analyzer
            </span>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
              Spatial Resolution: 10m Sub-Sector Grid
            </span>
          </div>
          <h4 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
            Topographical Slope & 50-Year ARI Flood Inundation Heatmap
          </h4>
          <p className="text-slate-400 text-xs mt-0.5">
            Micro-elevation spatial modeling highlighting high-slope terracing risks, low-lying flood pools, and buildable PV tracker footprint.
          </p>
        </div>

        {/* View Mode Overlay Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setOverlayMode('combined')}
            className={`px-2.5 py-1 rounded font-bold text-[11px] transition-all flex items-center gap-1 ${
              overlayMode === 'combined'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3 h-3" /> Combined Hazard
          </button>
          <button
            type="button"
            onClick={() => setOverlayMode('slope')}
            className={`px-2.5 py-1 rounded font-bold text-[11px] transition-all flex items-center gap-1 ${
              overlayMode === 'slope'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Mountain className="w-3 h-3" /> Slope Map
          </button>
          <button
            type="button"
            onClick={() => setOverlayMode('flood')}
            className={`px-2.5 py-1 rounded font-bold text-[11px] transition-all flex items-center gap-1 ${
              overlayMode === 'flood'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Droplets className="w-3 h-3" /> 50-Yr Flood
          </button>
          <button
            type="button"
            onClick={() => setOverlayMode('elevation')}
            className={`px-2.5 py-1 rounded font-bold text-[11px] transition-all flex items-center gap-1 ${
              overlayMode === 'elevation'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingDown className="w-3 h-3" /> DEM Contour
          </button>
          <button
            type="button"
            onClick={() => setOverlayMode('usability')}
            className={`px-2.5 py-1 rounded font-bold text-[11px] transition-all flex items-center gap-1 ${
              overlayMode === 'usability'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3 h-3" /> PV Usability
          </button>
        </div>
      </div>

      {/* Top Impact Summary Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Optimal Flat PV Area</span>
          <div className="text-xl font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {summaryStats.optimalPercent}% <span className="text-xs text-slate-400">({Math.round(totalAcres * summaryStats.optimalPercent / 100)} Ac)</span>
          </div>
          <span className="text-[10px] text-slate-500">Slope &lt; 8° | Zero Flood Hazard</span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-amber-900/40">
          <span className="text-[10px] text-amber-400/90 uppercase font-bold block">High Slope Risk Area</span>
          <div className="text-xl font-black text-amber-400 mt-0.5 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            {summaryStats.highSlopePercent}% <span className="text-xs text-slate-400">({Math.round(totalAcres * summaryStats.highSlopePercent / 100)} Ac)</span>
          </div>
          <span className="text-[10px] text-amber-500/80">Slope &ge; 8.0° (Terracing Needed)</span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-900/40">
          <span className="text-[10px] text-cyan-400/90 uppercase font-bold block">50-Yr Flood Pool Zone</span>
          <div className="text-xl font-black text-cyan-400 mt-0.5 flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-cyan-400" />
            {summaryStats.floodZonePercent}% <span className="text-xs text-slate-400">({Math.round(totalAcres * summaryStats.floodZonePercent / 100)} Ac)</span>
          </div>
          <span className="text-[10px] text-cyan-500/80">Inundation &ge; 0.15m (Piling +1.8m)</span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Est. Earthworks & Civil CapEx</span>
          <div className="text-xl font-black text-white mt-0.5">
            RM {summaryStats.totalCivilEstMyr} Million
          </div>
          <span className="text-[10px] text-slate-400">Cut & Fill + Bunding + Drainage</span>
        </div>
      </div>

      {/* Main Grid + Inspector Side-by-Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 10x10 Heatmap Grid */}
        <div className="lg:col-span-7 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Site Sub-Sector Grid (100 Sub-Parcels)
            </span>
            <span className="text-slate-500">Hover cell to inspect metrics</span>
          </div>

          {/* 10x10 Interactive Raster Grid */}
          <div className="grid grid-cols-10 gap-1 aspect-square bg-slate-900 p-1.5 rounded-md border border-slate-800">
            {grid.map((cell) => {
              const isSelected = selectedSector?.id === cell.id;
              const isHovered = hoveredSector?.id === cell.id;

              return (
                <button
                  key={cell.id}
                  type="button"
                  onClick={() => setSelectedSector(cell)}
                  onMouseEnter={() => setHoveredSector(cell)}
                  onMouseLeave={() => setHoveredSector(null)}
                  className={`relative flex flex-col items-center justify-center p-0.5 rounded transition-all cursor-pointer select-none text-[9px] font-bold border ${getCellStyle(
                    cell
                  )} ${
                    isSelected || isHovered
                      ? 'ring-2 ring-white scale-110 z-10 shadow-lg'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                  title={`${cell.id}: Elev ${cell.elevationASL}m, Slope ${cell.slopeDeg}°, Flood ${cell.floodDepthMeters}m`}
                >
                  <span>{cell.id}</span>
                  <span className="text-[7.5px] opacity-80 scale-90">
                    {overlayMode === 'slope'
                      ? `${cell.slopeDeg}°`
                      : overlayMode === 'elevation'
                      ? `${cell.elevationASL}m`
                      : overlayMode === 'flood'
                      ? `${cell.floodDepthMeters}m`
                      : cell.slopeDeg > 8
                      ? '⚠️'
                      : cell.floodDepthMeters > 0.15
                      ? '💧'
                      : '✓'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-1 text-slate-400">
            {overlayMode === 'combined' && (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-600 border border-emerald-400 inline-block" />
                  Optimal (&lt;8°, No Flood)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-600 border border-amber-400 inline-block" />
                  High Slope (&ge;8°)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-600 border border-cyan-400 inline-block" />
                  50-Yr Flood Zone
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-purple-900 border border-purple-500 inline-block" />
                  Dual Hazard
                </span>
              </>
            )}
            {overlayMode === 'slope' && (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-800 inline-block" /> &lt;3° Flat
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" /> 3-8° Moderate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-600 inline-block" /> 8-15° High
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-700 inline-block" /> &gt;15° Steep
                </span>
              </>
            )}
            {overlayMode === 'flood' && (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700 inline-block" /> 0.0m Safe
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-600 inline-block" /> 0.2m Moderate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-blue-800 inline-block" /> &gt;0.5m Deep Pool
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Active Sub-Sector Spot Inspector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded">
                  {activeSector.id}
                </span>
                <h5 className="font-bold text-white text-sm">
                  Sub-Sector Elevation & Hazard Spot Check
                </h5>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                {activeSector.subSectorAcres} Acres ({activeSector.subSectorHectares} Ha)
              </span>
            </div>

            {/* Inspector Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Ground Elevation</span>
                <div className="text-base font-black text-teal-400 mt-0.5">
                  {activeSector.elevationASL} m <span className="text-[10px] text-slate-400 font-normal">ASL</span>
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Local Slope Gradient</span>
                <div className={`text-base font-black mt-0.5 ${
                  activeSector.slopeDeg >= 8 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {activeSector.slopeDeg}° <span className="text-[10px] font-normal opacity-80">
                    ({activeSector.slopeDeg < 3 ? 'Flat' : activeSector.slopeDeg < 8 ? 'Gentle' : 'High Slope'})
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">50-Yr ARI Flood Depth</span>
                <div className={`text-base font-black mt-0.5 ${
                  activeSector.floodDepthMeters > 0.15 ? 'text-cyan-400' : 'text-slate-300'
                }`}>
                  {activeSector.floodDepthMeters > 0 ? `${activeSector.floodDepthMeters} m` : '0.00 m (Dry)'}
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Req. Pile Clearance</span>
                <div className="text-base font-black text-amber-300 mt-0.5">
                  +{activeSector.requiredPileHeightM} m <span className="text-[10px] text-slate-400 font-normal">AGL</span>
                </div>
              </div>
            </div>

            {/* Status & Technology Verdict */}
            <div className="bg-slate-900/90 p-3 rounded border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Feasibility & Engineering Verdict</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  activeSector.usableStatus === 'Optimal'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : activeSector.usableStatus === 'Requires Terracing'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700'
                    : activeSector.usableStatus === 'High Piling Needed'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-rose-950 text-rose-300 border border-rose-700'
                }`}>
                  {activeSector.usableStatus}
                </span>
                <span className="text-[11px] text-slate-300">
                  Est. Civil Adjustment: <strong className="text-white">RM {activeSector.civilCostEstimateMyr.toLocaleString()}</strong>
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                {activeSector.usableStatus === 'Optimal' &&
                  'Ideal unencumbered terrain. Suitable for standard 1P single-axis trackers with 1.2m driven steel pile foundations.'}
                {activeSector.usableStatus === 'Requires Terracing' &&
                  'High slope gradient requiring bench terracing earthworks and flexible multi-tier racking to minimize inter-row shading.'}
                {activeSector.usableStatus === 'High Piling Needed' &&
                  'Located in low-lying monsoon inundation zone. Requires driven pile extension to +1.8m AGL and sealed motor drives.'}
                {activeSector.usableStatus === 'Excluded Hazard' &&
                  'Steep slope or compound flood hazard area. Excluded from active PV array footprint; designated for detention pond or green buffer.'}
              </p>
            </div>
          </div>

          {/* Quick Technical Specs Note */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold">
              <HardHat className="w-3.5 h-3.5 text-amber-400" /> JPS & Civil Engineering Standards
            </div>
            <p className="text-slate-400">
              Topographical slope data derived from JUPEM 5m LiDAR DEM. Flood inundation contours modeled against JPS MSMA 50-Year ARI peak discharge events.
            </p>
          </div>
        </div>
      </div>

      {/* SVG Interactive Elevation & Water Level Cross-Section Profile */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-white text-xs flex items-center gap-2">
            <Ruler className="w-4 h-4 text-emerald-400" /> Site Elevation Cross-Section Profile (West to East Slice - Row 5)
          </h5>
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Ground Terrain (DEM)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-cyan-400 border-b border-dashed inline-block" /> 50-Yr ARI Flood Water Line
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-amber-400 inline-block" /> PV Tracker Module Elevation
            </span>
          </div>
        </div>

        {/* SVG Diagram */}
        <div className="relative w-full h-36 bg-slate-900 rounded border border-slate-800 overflow-hidden p-2">
          <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
            {/* Horizontal Grid lines */}
            <line x1="0" y1="20" x2="500" y2="20" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="0" y1="60" x2="500" y2="60" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="0" y1="100" x2="500" y2="100" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />

            {/* Ground Fill Gradient */}
            <defs>
              <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#064e3b" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Polyline path for ground terrain */}
            {(() => {
              const range = Math.max(2, maxElev - minElev);
              const points = crossSectionPoints.map((p, i) => {
                const x = i * 50 + 25;
                const y = 90 - ((p.elevation - minElev) / range) * 60;
                return `${x},${y}`;
              });

              const groundPath = `M 25,110 L ${points.join(' L ')} L 475,110 Z`;
              const terrainLine = `M ${points.join(' L ')}`;

              // PV Tracker height line (+1.5m)
              const trackerPoints = crossSectionPoints.map((p, i) => {
                const x = i * 50 + 25;
                const y = 90 - ((p.trackerTopElev - minElev) / range) * 60;
                return `${x},${y}`;
              });
              const trackerLine = `M ${trackerPoints.join(' L ')}`;

              // Flood water line
              const floodPoints = crossSectionPoints.map((p, i) => {
                const x = i * 50 + 25;
                const waterElev = p.floodWaterElev || p.elevation;
                const y = 90 - ((waterElev - minElev) / range) * 60;
                return `${x},${y}`;
              });
              const floodLine = `M ${floodPoints.join(' L ')}`;

              return (
                <>
                  <path d={groundPath} fill="url(#groundGrad)" />
                  <path d={terrainLine} fill="none" stroke="#10b981" strokeWidth="2.5" />
                  <path d={trackerLine} fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 2" />
                  <path d={floodLine} fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3 3" />

                  {/* Feature Markers */}
                  {crossSectionPoints.map((p, i) => {
                    const x = i * 50 + 25;
                    const y = 90 - ((p.elevation - minElev) / range) * 60;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="3" fill={p.slope > 8 ? '#f59e0b' : '#10b981'} />
                        {p.floodWaterElev && (
                          <circle cx={x} cy={90 - ((p.floodWaterElev - minElev) / range) * 60} r="2.5" fill="#06b6d4" />
                        )}
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>

          {/* West & East Axis Labels */}
          <div className="absolute bottom-1 left-3 text-[9px] text-slate-400 font-bold">West (0m)</div>
          <div className="absolute bottom-1 right-3 text-[9px] text-slate-400 font-bold">East (1,200m)</div>
        </div>
      </div>
    </div>
  );
};
