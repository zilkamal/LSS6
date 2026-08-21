import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { PMUNode } from '../types';
import {
  Flame,
  ShieldAlert,
  Zap,
  DollarSign,
  AlertTriangle,
  Sliders,
  Eye,
  Info,
  MapPin,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowRight,
  Maximize2
} from 'lucide-react';

export type RiskMetricMode = 'land_cost' | 'grid_clearance' | 'flood_hazard' | 'composite';
export type ColorPalette = 'YlOrRd' | 'Plasma' | 'Inferno' | 'Turbo';

interface GeospatialRiskHeatmapD3Props {
  nodes: PMUNode[];
  onSelectNode?: (node: PMUNode) => void;
  onSwitchToMapTab?: () => void;
  isHeatmapActive?: boolean;
  onToggleHeatmap?: (active: boolean) => void;
  selectedMetric?: RiskMetricMode;
  onSelectMetric?: (metric: RiskMetricMode) => void;
}

interface GridCellRisk {
  x: number;
  y: number;
  lat: number;
  lng: number;
  riskScore: number; // 0 to 100
  landCostRisk: number;
  gridClearanceRisk: number;
  floodRisk: number;
  nearestPmuName: string;
  nearestPmuDistanceKm: number;
  avgLandCostPerAcre: number;
  availableHeadroomMW: number;
}

export const GeospatialRiskHeatmapD3: React.FC<GeospatialRiskHeatmapD3Props> = ({
  nodes,
  onSelectNode,
  onSwitchToMapTab,
  isHeatmapActive: externalIsActive,
  onToggleHeatmap: externalOnToggle,
  selectedMetric: externalMetric,
  onSelectMetric: externalOnSelectMetric,
}) => {
  // Internal State with External Sync
  const [internalActive, setInternalActive] = useState<boolean>(true);
  const isHeatmapActive = externalIsActive !== undefined ? externalIsActive : internalActive;
  const toggleHeatmap = (val: boolean) => {
    setInternalActive(val);
    if (externalOnToggle) externalOnToggle(val);
  };

  const [internalMetric, setInternalMetric] = useState<RiskMetricMode>('composite');
  const selectedMetric = externalMetric !== undefined ? externalMetric : internalMetric;
  const setMetric = (mode: RiskMetricMode) => {
    setInternalMetric(mode);
    if (externalOnSelectMetric) externalOnSelectMetric(mode);
  };

  // Interactive Heatmap Parameters
  const [colorPalette, setColorPalette] = useState<ColorPalette>('YlOrRd');
  const [dispersionRadius, setDispersionRadius] = useState<number>(45); // Kernel radius px
  const [riskCutoff, setRiskCutoff] = useState<number>(0); // 0 to 80% filter
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<GridCellRisk | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Peninsular Malaysia Boundary Approximation Centroids for D3 Geo Projection
  const mapBounds = {
    minLat: 1.2,
    maxLat: 6.8,
    minLng: 99.5,
    maxLng: 104.5,
  };

  // Calculate Data Risk Scores for each PMU Node & Land Parcel
  const nodeRiskData = useMemo(() => {
    return nodes.map((node) => {
      // 1. Land Cost Risk: Based on average land cost per acre in node parcels or state benchmarks
      const landCosts = (node.landParcels || []).map((l) => l.estimatedLandCostPerAcreMyr);
      const avgLandCost =
        landCosts.length > 0
          ? landCosts.reduce((a, b) => a + b, 0) / landCosts.length
          : node.state === 'Selangor' || node.state === 'P. Pinang'
          ? 220000
          : node.state === 'Johor' || node.state === 'Melaka'
          ? 160000
          : node.state === 'Perak' || node.state === 'N. Sembilan'
          ? 95000
          : 45000;

      // Normalize Land Cost Risk (RM 30k = 0 risk, RM 280k+ = 100 risk)
      const landCostRisk = Math.min(100, Math.max(0, ((avgLandCost - 30000) / (250000 - 30000)) * 100));

      // 2. Restricted Grid Clearance Risk: Based on capacity MW & available headroom
      // If capacity <= 50 MW or low headroom, high clearance constraint risk
      const availableHeadroomMW = node.availableHeadroomMW ?? Math.max(0, node.capacityMW - 30);
      const gridClearanceRisk = Math.min(
        100,
        Math.max(0, ((200 - availableHeadroomMW) / 200) * 100)
      );

      // 3. Flood & Topo Risk: High flood risk or steep terrain
      const highFloodParcels = (node.landParcels || []).filter((l) => l.floodRisk === 'High').length;
      const floodRisk = highFloodParcels > 0 ? 85 : (node.landParcels || []).some((l) => l.floodRisk === 'Moderate') ? 45 : 15;

      // 4. Composite Risk Index
      const compositeRisk = Math.round(landCostRisk * 0.45 + gridClearanceRisk * 0.45 + floodRisk * 0.10);

      return {
        ...node,
        avgLandCost,
        landCostRisk: Math.round(landCostRisk),
        gridClearanceRisk: Math.round(gridClearanceRisk),
        floodRisk: Math.round(floodRisk),
        compositeRisk,
        availableHeadroomMW,
      };
    });
  }, [nodes]);

  // Color Interpolator Selector based on D3
  const getColorInterpolator = (palette: ColorPalette) => {
    switch (palette) {
      case 'Plasma':
        return d3.interpolatePlasma;
      case 'Inferno':
        return d3.interpolateInferno;
      case 'Turbo':
        return d3.interpolateTurbo;
      case 'YlOrRd':
      default:
        return d3.interpolateYlOrRd;
    }
  };

  // D3 Map & Grid Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !isHeatmapActive) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    const width = containerRef.current.clientWidth || 700;
    const height = 480;

    svg.attr('width', width).attr('height', height);

    // Setup D3 Mercator Projection for Peninsular Malaysia
    const projection = d3
      .geoMercator()
      .center([101.9, 4.1]) // Center of Peninsular Malaysia
      .scale(width * 8.2) // Scaled to fit container width nicely
      .translate([width / 2, height / 2]);

    const interpolator = getColorInterpolator(colorPalette);
    const colorScale = d3.scaleSequential(interpolator).domain([0, 100]);

    // Construct 2D Geospatial Grid Surface using Inverse Distance Weighting (IDW)
    const gridCols = 36;
    const gridRows = 30;
    const gridCells: GridCellRisk[] = [];

    const lngStep = (mapBounds.maxLng - mapBounds.minLng) / gridCols;
    const latStep = (mapBounds.maxLat - mapBounds.minLat) / gridRows;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const cellLng = mapBounds.minLng + (c + 0.5) * lngStep;
        const cellLat = mapBounds.minLat + (r + 0.5) * latStep;

        const [x, y] = projection([cellLng, cellLat]) || [0, 0];

        // Skip cells far outside Peninsular Malaysia bounds
        if (cellLng < 99.8 || cellLng > 104.3 || cellLat < 1.3 || cellLat > 6.7) continue;

        // IDW Interpolation from all PMU nodes
        let weightSum = 0;
        let weightedLandRisk = 0;
        let weightedGridRisk = 0;
        let weightedFloodRisk = 0;
        let weightedCost = 0;
        let weightedHeadroom = 0;

        let nearestDist = Infinity;
        let nearestPmuName = 'PMU Node';

        nodeRiskData.forEach((node) => {
          const dLat = cellLat - node.lat;
          const dLng = cellLng - node.lng;
          const distSq = dLat * dLat + dLng * dLng;
          const dist = Math.sqrt(distSq);

          if (dist < nearestDist) {
            nearestDist = dist;
            nearestPmuName = node.name;
          }

          // IDW power p = 2
          const w = 1 / (distSq + 0.008);
          weightSum += w;
          weightedLandRisk += node.landCostRisk * w;
          weightedGridRisk += node.gridClearanceRisk * w;
          weightedFloodRisk += node.floodRisk * w;
          weightedCost += node.avgLandCost * w;
          weightedHeadroom += node.availableHeadroomMW * w;
        });

        const avgLandCost = weightedCost / weightSum;
        const availableHeadroomMW = Math.round(weightedHeadroom / weightSum);
        const landCostRisk = Math.round(weightedLandRisk / weightSum);
        const gridClearanceRisk = Math.round(weightedGridRisk / weightSum);
        const floodRisk = Math.round(weightedFloodRisk / weightSum);
        const compositeRisk = Math.round(
          landCostRisk * 0.45 + gridClearanceRisk * 0.45 + floodRisk * 0.10
        );

        let activeMetricRisk = compositeRisk;
        if (selectedMetric === 'land_cost') activeMetricRisk = landCostRisk;
        if (selectedMetric === 'grid_clearance') activeMetricRisk = gridClearanceRisk;
        if (selectedMetric === 'flood_hazard') activeMetricRisk = floodRisk;

        if (activeMetricRisk >= riskCutoff) {
          gridCells.push({
            x,
            y,
            lat: cellLat,
            lng: cellLng,
            riskScore: activeMetricRisk,
            landCostRisk,
            gridClearanceRisk,
            floodRisk,
            nearestPmuName,
            nearestPmuDistanceKm: Math.round(nearestDist * 111),
            avgLandCostPerAcre: Math.round(avgLandCost),
            availableHeadroomMW,
          });
        }
      }
    }

    // 1. Render Background Map Base & Grid Lines
    const mainGroup = svg.append('g').attr('class', 'heatmap-main-group');

    // Create SVG Defs for Radial Blur Gradients
    const defs = svg.append('defs');

    // Define Linear Gradient for Legend Bar
    const legendGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-risk-legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    for (let i = 0; i <= 10; i++) {
      const pct = i * 10;
      legendGradient
        .append('stop')
        .attr('offset', `${pct}%`)
        .attr('stop-color', colorScale(pct));
    }

    // Render Heatmap Blurring Grid Cells
    const cellWidth = (width / gridCols) * 1.8;
    const cellHeight = (height / gridRows) * 1.8;

    const heatGroup = mainGroup.append('g').attr('class', 'heat-cells-group');

    heatGroup
      .selectAll('circle')
      .data(gridCells)
      .enter()
      .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', dispersionRadius / 1.6)
      .attr('fill', (d) => colorScale(d.riskScore))
      .attr('opacity', (d) => Math.min(0.7, Math.max(0.15, d.riskScore / 130)))
      .style('filter', 'blur(8px)')
      .style('mix-blend-mode', 'multiply')
      .on('mouseover', (event, d) => {
        setHoveredCell(d);
        const [mx, my] = d3.pointer(event, svgRef.current);
        setTooltipPos({ x: mx, y: my });
      })
      .on('mousemove', (event) => {
        const [mx, my] = d3.pointer(event, svgRef.current);
        setTooltipPos({ x: mx, y: my });
      })
      .on('mouseout', () => {
        setHoveredCell(null);
        setTooltipPos(null);
      });

    // 2. Overlay State Guide Borders & Region Labels
    const stateLabels = [
      { name: 'Kedah & Perlis', lat: 5.8, lng: 100.6, label: 'LOW RISK (High Irradiance)' },
      { name: 'Penang Industrial', lat: 5.4, lng: 100.3, label: 'HIGH COST & GRID LIMIT' },
      { name: 'Perak Valley', lat: 4.6, lng: 101.1, label: 'MODERATE RISK' },
      { name: 'Selangor Belt', lat: 3.3, lng: 101.5, label: 'SEVERE LAND COST RISK' },
      { name: 'Johor Corridor', lat: 1.8, lng: 103.6, label: 'HIGH CONVERSION PREMIUM' },
      { name: 'Pahang Coast', lat: 3.8, lng: 103.2, label: 'MODERATE GRID HEADROOM' },
    ];

    const labelGroup = mainGroup.append('g').attr('class', 'state-label-group');

    stateLabels.forEach((lbl) => {
      const [lx, ly] = projection([lbl.lng, lbl.lat]) || [0, 0];
      if (lx > 0 && ly > 0 && lx < width && ly < height) {
        labelGroup
          .append('text')
          .attr('x', lx)
          .attr('y', ly)
          .attr('text-anchor', 'middle')
          .attr('fill', '#334155')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'monospace')
          .text(lbl.name);

        labelGroup
          .append('text')
          .attr('x', lx)
          .attr('y', ly + 11)
          .attr('text-anchor', 'middle')
          .attr('fill', '#64748b')
          .attr('font-size', '8px')
          .attr('font-family', 'sans-serif')
          .text(lbl.label);
      }
    });

    // 3. Render PMU Node Locations as Interactive Rings
    const nodesGroup = mainGroup.append('g').attr('class', 'pmu-nodes-group');

    nodeRiskData.forEach((node) => {
      const [nx, ny] = projection([node.lng, node.lat]) || [0, 0];
      if (nx <= 0 || ny <= 0 || nx >= width || ny >= height) return;

      let activeRisk = node.compositeRisk;
      if (selectedMetric === 'land_cost') activeRisk = node.landCostRisk;
      if (selectedMetric === 'grid_clearance') activeRisk = node.gridClearanceRisk;
      if (selectedMetric === 'flood_hazard') activeRisk = node.floodRisk;

      // Outer Pulse Ring for High Risk Nodes (> 70)
      if (activeRisk >= 70) {
        nodesGroup
          .append('circle')
          .attr('cx', nx)
          .attr('cy', ny)
          .attr('r', 12)
          .attr('fill', 'none')
          .attr('stroke', colorScale(activeRisk))
          .attr('stroke-width', 2)
          .attr('opacity', 0.8)
          .append('animate')
          .attr('attributeName', 'r')
          .attr('values', '8;18;8')
          .attr('dur', '2s')
          .attr('repeatCount', 'indefinite');
      }

      // Core Node Marker Circle
      const circle = nodesGroup
        .append('circle')
        .attr('cx', nx)
        .attr('cy', ny)
        .attr('r', node.voltage === '275kV' ? 6 : 4.5)
        .attr('fill', colorScale(activeRisk))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer');

      circle.on('click', () => {
        if (onSelectNode) onSelectNode(node);
      });

      // Node Name Label
      nodesGroup
        .append('text')
        .attr('x', nx + 8)
        .attr('y', ny + 3)
        .attr('fill', '#0f172a')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'sans-serif')
        .text(node.name.replace('PMU ', ''));
    });

    // 4. Draw D3 Interactive Legend
    const legendWidth = 240;
    const legendHeight = 12;
    const legendX = 16;
    const legendY = height - 36;

    const legendGroup = svg.append('g').attr('transform', `translate(${legendX}, ${legendY})`);

    // Legend Title
    legendGroup
      .append('text')
      .attr('x', 0)
      .attr('y', -6)
      .attr('fill', '#0f172a')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text(`D3 Risk Gradient (${selectedMetric.toUpperCase().replace('_', ' ')})`);

    // Color Bar Rect
    legendGroup
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('rx', 2)
      .attr('fill', 'url(#d3-risk-legend-gradient)')
      .attr('stroke', '#cbd5e1');

    // Legend Tick Labels
    const legendTicks = [
      { label: 'Low (0%)', x: 0 },
      { label: 'Mod (35%)', x: legendWidth * 0.35 },
      { label: 'High (70%)', x: legendWidth * 0.70 },
      { label: 'Severe (100%)', x: legendWidth },
    ];

    legendTicks.forEach((t) => {
      legendGroup
        .append('text')
        .attr('x', t.x)
        .attr('y', legendHeight + 12)
        .attr('text-anchor', t.x === 0 ? 'start' : t.x === legendWidth ? 'end' : 'middle')
        .attr('fill', '#475569')
        .attr('font-size', '8.5px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(t.label);
    });

  }, [isHeatmapActive, selectedMetric, colorPalette, dispersionRadius, riskCutoff, nodeRiskData]);

  // High-Risk Geospatial Hotspots Register
  const highRiskHotspots = [
    {
      id: 'hs-selangor',
      title: 'Selangor Industrial Corridor',
      state: 'Selangor',
      riskCategory: 'High Land Acquisition Cost',
      avgLandCost: 'RM 220,000 – RM 280,000 / Acre',
      gridHeadroom: 'Restricted (< 35 MW)',
      riskScore: 88,
      recommendation: 'Target Agricultural Conversion Lots in Kuala Selangor or Sabak Bernam to lower CapEx.',
    },
    {
      id: 'hs-penang',
      title: 'Penang Island & Seberang Perai',
      state: 'P. Pinang',
      riskCategory: 'Severe Grid Clearance Constraint',
      avgLandCost: 'RM 190,000 – RM 250,000 / Acre',
      gridHeadroom: 'Congested (0 MW Headroom)',
      riskScore: 92,
      recommendation: 'Requires major 275kV PMU bay expansion; high risk of TNB interconnection rejection.',
    },
    {
      id: 'hs-johor',
      title: 'Johor Bahru South Energy Belt',
      state: 'Johor',
      riskCategory: 'Land Premium & Urban Encroachment',
      avgLandCost: 'RM 160,000 – RM 210,000 / Acre',
      gridHeadroom: 'Moderate (60 MW)',
      riskScore: 76,
      recommendation: 'Verify PTG Johor Land Conversion Premium under NLC §124 before final RFP financial submission.',
    },
    {
      id: 'hs-kedah',
      title: 'Northern Corridor (Perlis & Kedah)',
      state: 'Kedah / Perlis',
      riskCategory: 'OPTIMAL LOW RISK ZONE',
      avgLandCost: 'RM 35,000 – RM 48,000 / Acre',
      gridHeadroom: 'Unrestricted (180 MW+)',
      riskScore: 18,
      recommendation: 'Highest yield GHI (>1,880 kWh/m²/yr) + lowest land acquisition cost in Peninsular Malaysia.',
    },
  ];

  return (
    <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-5 space-y-5 font-sans shadow-lg">
      {/* Header & Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded">
              D3 Spatial Intelligence
            </span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Geospatial Risk Heatmap Engine
            </h3>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            Dynamic D3 Inverse Distance Weighted (IDW) surface mapping land acquisition costs and restricted grid clearance zones
          </p>
        </div>

        {/* Master Heatmap Toggle Button */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer bg-slate-800 px-3.5 py-2 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-colors">
            <input
              type="checkbox"
              checked={isHeatmapActive}
              onChange={(e) => toggleHeatmap(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
            <span className="text-xs font-bold font-mono text-slate-200">
              {isHeatmapActive ? '🔥 Heatmap Overlay ACTIVE' : '⏸️ Heatmap Overlay Disabled'}
            </span>
          </label>

          {onSwitchToMapTab && (
            <button
              onClick={onSwitchToMapTab}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold font-mono text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View on Full Map</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isHeatmapActive && (
        <div className="space-y-5">
          {/* Controls Panel: Metric Selector, Color Palette, Sliders */}
          <div className="bg-slate-800/90 p-4 rounded-lg border border-slate-700 space-y-4 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Metric Selector Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Select Risk Metric Dimension
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setMetric('composite')}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      selectedMetric === 'composite'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Composite Risk
                  </button>

                  <button
                    onClick={() => setMetric('land_cost')}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      selectedMetric === 'land_cost'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    High Land Cost Risk
                  </button>

                  <button
                    onClick={() => setMetric('grid_clearance')}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      selectedMetric === 'grid_clearance'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    Restricted Grid Clearance
                  </button>

                  <button
                    onClick={() => setMetric('flood_hazard')}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      selectedMetric === 'flood_hazard'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                    Flood & Topo Risk
                  </button>
                </div>
              </div>

              {/* D3 Color Palette Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  D3 Color Gradient Palette
                </span>
                <div className="flex gap-1.5">
                  {(['YlOrRd', 'Plasma', 'Inferno', 'Turbo'] as ColorPalette[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setColorPalette(p)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        colorPalette === p
                          ? 'bg-slate-200 text-slate-950 border border-white'
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dispersion Radius & Cutoff Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700/80 pt-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400 text-[11px]">Heat Dispersion Radius (Kernel Density):</span>
                  <strong className="text-amber-400 font-bold">{dispersionRadius} px</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={dispersionRadius}
                  onChange={(e) => setDispersionRadius(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400 text-[11px]">Filter Minimum Risk Cutoff:</span>
                  <strong className="text-amber-400 font-bold">&ge; {riskCutoff}% Score</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  step="5"
                  value={riskCutoff}
                  onChange={(e) => setRiskCutoff(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* D3 Map SVG Canvas Display */}
          <div
            ref={containerRef}
            className="relative bg-slate-950 rounded-lg border border-slate-800 p-2 overflow-hidden shadow-inner"
          >
            <svg ref={svgRef} className="w-full h-[480px] block" />

            {/* D3 Hover Tooltip */}
            {hoveredCell && tooltipPos && (
              <div
                className="absolute z-30 pointer-events-none bg-slate-900/95 border border-amber-500/60 p-3 rounded-lg shadow-2xl text-xs font-mono text-white space-y-1.5 min-w-[240px]"
                style={{
                  left: Math.min(tooltipPos.x + 15, (containerRef.current?.clientWidth || 700) - 260),
                  top: Math.max(10, tooltipPos.y - 120),
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">
                    📍 Lat {hoveredCell.lat.toFixed(2)}°, Lng {hoveredCell.lng.toFixed(2)}°
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Risk {hoveredCell.riskScore}%
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div>
                    <span className="text-slate-400">Nearest PMU:</span>{' '}
                    <strong className="text-white">{hoveredCell.nearestPmuName}</strong> ({hoveredCell.nearestPmuDistanceKm} km)
                  </div>
                  <div>
                    <span className="text-slate-400">Est. Land Cost:</span>{' '}
                    <strong className="text-emerald-400">RM {hoveredCell.avgLandCostPerAcre.toLocaleString()} / Acre</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Grid Headroom:</span>{' '}
                    <strong className={hoveredCell.availableHeadroomMW < 50 ? 'text-rose-400 font-bold' : 'text-amber-300'}>
                      {hoveredCell.availableHeadroomMW} MW Available
                    </strong>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-1 text-[10px] flex justify-between text-slate-300">
                  <span>Land Cost Risk: {hoveredCell.landCostRisk}%</span>
                  <span>Grid Restriction: {hoveredCell.gridClearanceRisk}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Regional Risk Hotspot Breakdown Grid */}
          <div className="space-y-3 font-mono">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Key Regional Risk Hotspots & Technical Recommendations
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {highRiskHotspots.map((hs) => (
                <div
                  key={hs.id}
                  onClick={() => setSelectedHotspot(hs.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    hs.riskScore < 30
                      ? 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400'
                      : hs.riskScore > 85
                      ? 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400'
                      : 'bg-slate-800/90 border-slate-700 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2">
                    <strong className="text-sm font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {hs.title}
                    </strong>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        hs.riskScore < 30
                          ? 'bg-emerald-500 text-slate-950'
                          : hs.riskScore > 85
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      Risk Index {hs.riskScore}%
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Primary Risk Factor:</span>
                      <strong className="text-amber-300">{hs.riskCategory}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Land Acquisition Rate:</span>
                      <strong className="text-emerald-400">{hs.avgLandCost}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Grid Headroom:</span>
                      <strong className="text-purple-300">{hs.gridHeadroom}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 mt-2 bg-slate-900/80 p-2 rounded border border-slate-700/60 leading-tight">
                    💡 <strong>Strategy:</strong> {hs.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
