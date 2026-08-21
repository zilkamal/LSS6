import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import * as d3 from 'd3';
import { PMUNode, LandParcel, VoltageLevel } from '../types';
import { calculateHaversineDistanceKm, estimateCableRouteKm } from '../utils/geoUtils';
import { Zap, Layers, MapPin, Compass, Eye, EyeOff, ShieldAlert, Navigation, Filter, Check, Globe, Maximize2, Minimize2, Flame, X } from 'lucide-react';
import { JUPEM_LAND_CATEGORIES, JUPEM_ZONES_DATA, JupemLandCategory, convertLandParcelToJupemZone } from '../data/jupemData';

interface InteractiveMapProps {
  nodes: PMUNode[];
  selectedNode: PMUNode | null;
  onSelectNode: (node: PMUNode) => void;
  selectedLandParcel: LandParcel | null;
  onSelectLandParcel: (land: LandParcel, pmu: PMUNode) => void;
  customPin: { lat: number; lng: number; areaAcres: number } | null;
  onSetCustomPin: (pin: { lat: number; lng: number; areaAcres: number }) => void;
  isPinDropperActive: boolean;
  setIsPinDropperActive: (active: boolean) => void;
  onAnalyzeFeasibility: (land: LandParcel, pmu: PMUNode) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
  selectedLandParcel,
  onSelectLandParcel,
  customPin,
  onSetCustomPin,
  isPinDropperActive,
  setIsPinDropperActive,
  onAnalyzeFeasibility,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const linesGroupRef = useRef<L.LayerGroup | null>(null);

  const [tileLayerType, setTileLayerType] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [showRadiusRings, setShowRadiusRings] = useState<boolean>(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [3.9, 101.8], // Center of Peninsular Malaysia
        zoom: 7,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      linesGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (tileLayerType === 'satellite') {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS',
          maxZoom: 18,
        }
      ).addTo(map);
    } else if (tileLayerType === 'terrain') {
      L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; OpenStreetMap contributors, SRTM',
        maxZoom: 17,
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
    }
  }, [tileLayerType]);

  // Click on map listener for Pin Dropper Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isPinDropperActive) {
        onSetCustomPin({
          lat: Math.round(e.latlng.lat * 10000) / 10000,
          lng: Math.round(e.latlng.lng * 10000) / 10000,
          areaAcres: 250,
        });
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isPinDropperActive, onSetCustomPin]);

  const [showEnvironmentalOverlay, setShowEnvironmentalOverlay] = useState<boolean>(false);
  const [showRiskHeatmapOverlay, setShowRiskHeatmapOverlay] = useState<boolean>(true);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(10);

  // Full Screen & Map HUD Overlay Toggle States
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showFloatingPanels, setShowFloatingPanels] = useState<boolean>(true);

  // Invalidate Leaflet map size whenever Full Screen state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullScreen]);

  // Handle ESC key to exit full screen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // JUPEM Land Classification Overlay States
  const [showJupemOverlay, setShowJupemOverlay] = useState<boolean>(true);
  const [selectedJupemCategories, setSelectedJupemCategories] = useState<JupemLandCategory[]>([
    'agricultural',
    'industrial',
    'forest_reserve',
    'water_catchment',
    'commercial',
  ]);

  // Construct comprehensive JUPEM GIS zones from macro zones + PMU land parcel cadastral lots
  const allJupemZones = useMemo(() => {
    const pmuZones = nodes.flatMap((node) =>
      (node.landParcels || []).map((land) => convertLandParcelToJupemZone(land, node.name))
    );
    return [...JUPEM_ZONES_DATA, ...pmuZones];
  }, [nodes]);

  const handleFitJupemBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const activeZones = allJupemZones.filter((z) => selectedJupemCategories.includes(z.category));
    if (activeZones.length === 0) return;

    const allCoords = activeZones
      .flatMap((z) => z.coords)
      .filter((c) => Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && !isNaN(c[0]) && typeof c[1] === 'number' && !isNaN(c[1]));

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  // Render PMU Markers, Land Plot Polygons & Markers, Distance Lines, Buffer Circles, JUPEM Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const linesGroup = linesGroupRef.current;

    if (!map || !markersGroup || !linesGroup) return;

    markersGroup.clearLayers();
    linesGroup.clearLayers();

    // Helper to validate [lat, lng] tuple
    const isValidLatLng = (lat?: number, lng?: number): lat is number =>
      typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);

    // 0. Render JUPEM Land Classification Overlay if enabled
    if (showJupemOverlay) {
      const activeZones = allJupemZones.filter((z) => selectedJupemCategories.includes(z.category));
      activeZones.forEach((zone) => {
        const validCoords = (zone.coords || []).filter(
          (c) => Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && !isNaN(c[0]) && typeof c[1] === 'number' && !isNaN(c[1])
        );
        if (validCoords.length < 3) return;

        const polygon = L.polygon(validCoords, {
          color: zone.color,
          fillColor: zone.fillColor,
          fillOpacity: 0.35,
          weight: 2,
          dashArray: zone.category === 'agricultural' ? '4, 4' : zone.category === 'forest_reserve' ? '2, 3' : '0',
        });

        const popupContent = `
          <div class="p-2 min-w-[260px] font-sans">
            <div class="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
              <span class="text-[10px] font-mono font-bold text-slate-500">${zone.jupemCode}</span>
              <span class="px-1.5 py-0.5 text-[9px] font-black rounded ${
                zone.permissibilityBadge === 'emerald'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : zone.permissibilityBadge === 'amber'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : zone.permissibilityBadge === 'rose'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }">${zone.permissibilityStatus.split(' ')[0]}</span>
            </div>
            <strong class="text-xs font-extrabold text-slate-900 block mb-1">${zone.name}</strong>
            <div class="text-[11px] text-slate-700 space-y-1 font-mono">
              <div><strong>Category:</strong> ${zone.categoryLabel}</div>
              <div><strong>District / State:</strong> ${zone.district}, ${zone.state}</div>
              <div><strong>Area:</strong> ${zone.areaHectares} Ha (${zone.areaAcres} Acres)</div>
              ${
                zone.conversionRateMyrPerAcre > 0
                  ? `<div class="text-emerald-800 font-bold"><strong>Est. Conversion:</strong> RM ${zone.conversionRateMyrPerAcre.toLocaleString()} / Acre</div>`
                  : `<div class="text-rose-700 font-bold"><strong>Status:</strong> Protected Conservation Zone</div>`
              }
              <div class="bg-slate-100 p-1.5 rounded text-[10px] text-slate-700 border border-slate-200 mt-1 font-sans">
                ${zone.description}
              </div>
            </div>
          </div>
        `;

        polygon.bindPopup(popupContent);
        polygon.bindTooltip(`📍 JUPEM Cadastral Lot: ${zone.name} (${zone.categoryLabel})`, {
          permanent: false,
          className: 'bg-slate-900 text-amber-300 text-[11px] font-bold p-1.5 rounded border border-slate-700 shadow-lg font-mono',
        });

        linesGroup.addLayer(polygon);
      });
    }

    // 1. Render Environmental Exclusion Layer if enabled
    if (showEnvironmentalOverlay) {
      // Draw simulated Forest Reserve & Water Catchment Exclusion Polygons in Central/Eastern Peninsular
      const exclusionZones = [
        { name: 'Taman Negara & Main Range Forest Reserve', coords: [[4.6, 101.4], [4.8, 101.7], [4.4, 102.1], [4.1, 101.8]] },
        { name: 'Endau-Rompin Forest Reserve Buffer', coords: [[2.4, 103.2], [2.7, 103.5], [2.3, 103.7], [2.1, 103.4]] },
        { name: 'Beldum-Temenggor Water Catchment Zone', coords: [[5.6, 101.3], [5.8, 101.6], [5.4, 101.8], [5.2, 101.4]] },
      ];

      exclusionZones.forEach((zone) => {
        const validCoords = (zone.coords || []).filter(
          (c) => Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && !isNaN(c[0]) && typeof c[1] === 'number' && !isNaN(c[1])
        );
        if (validCoords.length < 3) return;

        const polygon = L.polygon(validCoords as [number, number][], {
          color: '#dc2626',
          fillColor: '#ef4444',
          fillOpacity: 0.25,
          weight: 1.5,
          dashArray: '3, 3',
        });
        polygon.bindTooltip(`⚠️ ${zone.name} (Environmental Exclusion Zone - No Solar Development Allowed)`, {
          permanent: false,
          className: 'bg-rose-950 text-rose-200 text-xs font-bold border border-rose-500 p-1.5 rounded shadow-lg',
        });
        linesGroup.addLayer(polygon);
      });
    }

    // 1b. Render D3 Geospatial Risk Heatmap Overlay
    if (showRiskHeatmapOverlay) {
      const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 100]);

      nodes.forEach((node) => {
        if (!isValidLatLng(node.lat, node.lng)) return;

        const landCosts = (node.landParcels || []).map((l) => l.estimatedLandCostPerAcreMyr);
        const avgLandCost =
          landCosts.length > 0
            ? landCosts.reduce((a, b) => a + b, 0) / landCosts.length
            : node.state === 'Selangor' || node.state === 'P. Pinang'
            ? 220000
            : node.state === 'Johor' || node.state === 'Melaka'
            ? 160000
            : 85000;

        const landRisk = Math.min(100, Math.max(0, ((avgLandCost - 30000) / (250000 - 30000)) * 100));
        const availableHeadroomMW = node.availableHeadroomMW ?? Math.max(0, node.capacityMW - 30);
        const gridRisk = Math.min(100, Math.max(0, ((200 - availableHeadroomMW) / 200) * 100));
        const compositeRisk = Math.round(landRisk * 0.5 + gridRisk * 0.5);

        const circle = L.circle([node.lat, node.lng], {
          radius: 16000, // 16 km heat radius
          color: colorScale(compositeRisk),
          fillColor: colorScale(compositeRisk),
          fillOpacity: 0.35,
          weight: 1.5,
          dashArray: '3, 3',
        });

        circle.bindTooltip(
          `🔥 <strong>D3 Risk Heat Zone: ${node.name}</strong><br/>
           Composite Risk Index: <strong>${compositeRisk}%</strong><br/>
           Avg Land Cost: RM ${Math.round(avgLandCost).toLocaleString()} / Acre<br/>
           Grid Headroom: ${availableHeadroomMW} MW`,
          {
            permanent: false,
            className: 'bg-slate-900 text-amber-300 font-mono text-xs p-2 rounded border border-amber-500 shadow-xl',
          }
        );

        linesGroup.addLayer(circle);
      });
    }

    // 2. Render Search Radius Buffer Circles around selected PMU
    if (selectedNode && showRadiusRings && isValidLatLng(selectedNode.lat, selectedNode.lng)) {
      const radiusColors: Record<number, string> = {
        5: '#10b981', // 5km - Optimal Proximity
        10: '#f59e0b', // 10km - Standard Interconnection
        20: '#3b82f6', // 20km - Extended Corridor
        30: '#64748b', // 30km - Max Economic Boundary
      };

      [5, 10, 20, 30].forEach((rad) => {
        const isSelectedRad = rad === selectedRadiusKm;
        L.circle([selectedNode.lat, selectedNode.lng], {
          radius: rad * 1000,
          color: radiusColors[rad],
          fillColor: radiusColors[rad],
          fillOpacity: isSelectedRad ? 0.08 : 0.02,
          weight: isSelectedRad ? 2.5 : 1,
          dashArray: isSelectedRad ? '0' : '4, 4',
        }).addTo(linesGroup);
      });
    }

    // 3. Render PMU Node Markers
    nodes.forEach((node) => {
      if (!isValidLatLng(node.lat, node.lng)) return;

      const isSelected = selectedNode?.id === node.id;
      const is275kV = node.voltage === '275kV';
      const is33kV = node.voltage === '33kV';

      const bgClass = is275kV
        ? 'bg-purple-600 border-purple-300'
        : is33kV
        ? 'bg-blue-600 border-blue-300'
        : 'bg-emerald-600 border-emerald-300';
      const glowClass = isSelected ? 'ring-4 ring-amber-400 scale-125 z-50' : 'hover:scale-110';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-all ${glowClass}">
          <div class="w-8 h-8 rounded-full ${bgClass} text-white font-black text-xs border-2 shadow-lg flex items-center justify-center">
            ${node.number}
          </div>
          ${
            node.isPendingApplication
              ? `<div class="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-900">**</div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-pmu-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([node.lat, node.lng], { icon: customIcon });

      const currentLoad = node.currentLoadMW ?? Math.round(node.capacityMW * 0.7);
      const utilPct = node.capacityUtilizationPct ?? Math.round((currentLoad / node.capacityMW) * 100);

      let barBgClass = 'bg-emerald-500';
      let badgeBgClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      if (utilPct >= 85) {
        barBgClass = 'bg-rose-500';
        badgeBgClass = 'bg-rose-100 text-rose-800 border-rose-300';
      } else if (utilPct >= 70) {
        barBgClass = 'bg-amber-500';
        badgeBgClass = 'bg-amber-100 text-amber-800 border-amber-300';
      }

      const isPPU = node.substationType === 'PPU' || node.name.startsWith('PPU');
      const subPrefix = isPPU ? 'PPU' : 'PMU';

      const popupContent = `
        <div class="p-2 min-w-[260px] font-sans">
          <div class="flex items-center justify-between border-b pb-1 mb-1.5">
            <span class="font-bold text-sm text-slate-900">${subPrefix} ${node.name}</span>
            <span class="px-1.5 py-0.5 text-[10px] font-black rounded ${
              is275kV
                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                : is33kV
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }">${node.voltage}</span>
          </div>
          <div class="mb-1.5">
            ${
              is33kV
                ? `<div class="bg-amber-100 text-amber-950 font-extrabold text-[10px] px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1 font-mono">
                    <span>☀️ Package 3: Solar-Only (No BESS Required)</span>
                   </div>`
                : `<div class="bg-purple-50 text-purple-900 font-bold text-[10px] px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1 font-mono">
                    <span>🔋 Packages 1 & 2: Hybrid (Solar + BESS)</span>
                   </div>`
            }
          </div>
          <div class="text-xs text-slate-700 space-y-1.5">
            <div><strong>Location:</strong> ${node.state} (${node.district})</div>
            <div><strong>Max Capacity:</strong> <span class="font-bold text-slate-900">${node.capacityMW} MW</span></div>
            <div class="bg-slate-50 p-1.5 rounded border border-slate-200">
              <div class="flex items-center justify-between text-[10px] mb-1">
                <span class="font-bold text-slate-600">Capacity Utilization:</span>
                <span class="px-1 py-0.2 rounded font-extrabold text-[9px] border ${badgeBgClass}">${utilPct}% (${currentLoad}/${node.capacityMW}MW)</span>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div class="h-full ${barBgClass} rounded-full" style="width: ${utilPct}%"></div>
              </div>
            </div>
            <div><strong>Developable Land:</strong> <span class="font-bold text-emerald-700">${(node.landParcels || []).length} Sites Identified</span></div>
            ${
              node.isPendingApplication
                ? `<div class="text-amber-800 font-semibold text-[11px] bg-amber-50 p-1 rounded border border-amber-200">** Queue pending approval</div>`
                : ''
            }
            <div class="pt-1">
              <button id="pmu-btn-${node.id}" class="w-full bg-slate-900 text-amber-400 py-1 px-2 rounded text-xs font-bold hover:bg-slate-800 shadow-sm cursor-pointer">
                ⚡ View ${node.name} Land Parcels
              </button>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`pmu-btn-${node.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectNode(node);
              map.closePopup();
            };
          }
        }, 50);
      });

      marker.on('click', () => {
        onSelectNode(node);
      });

      markersGroup.addLayer(marker);

      // 4. Render nearby candidate land plot polygons & markers if this node is selected
      if (isSelected) {
        (node.landParcels || []).forEach((land) => {
          if (!isValidLatLng(land.lat, land.lng)) return;

          // Polygon Boundary Drawing
          if (land.gpsPolygon && land.gpsPolygon.length >= 3) {
            const polyCoords = land.gpsPolygon
              .filter((p) => isValidLatLng(p.lat, p.lng))
              .map((p) => [p.lat, p.lng] as [number, number]);

            if (polyCoords.length >= 3) {
              const strokeColor = land.overallScore >= 80 ? '#10b981' : land.overallScore >= 65 ? '#f59e0b' : '#ef4444';

              const landPolygon = L.polygon(polyCoords, {
                color: strokeColor,
                fillColor: strokeColor,
                fillOpacity: 0.35,
                weight: 2,
              });

              landPolygon.bindTooltip(
                `<strong>${land.name}</strong><br/>${land.lotNumber} (${land.areaHectares} Ha / ${land.areaAcres} Acres)<br/>AI Score: ${land.overallScore}/100`,
                {
                  permanent: false,
                  className: 'bg-slate-900 text-white text-xs font-sans p-1.5 rounded shadow-lg border border-slate-700',
                }
              );

              landPolygon.on('click', () => {
                onSelectLandParcel(land, node);
              });

              linesGroup.addLayer(landPolygon);
            }
          }

          // Land Marker Icon
          const badgeIcon = land.isBestOverall ? '🏆' : land.isLowestCost ? '💰' : land.isFastestToDevelop ? '⚡' : land.isLowestEnvRisk ? '🌿' : '☀️';
          const landIconHtml = `
            <div class="w-7 h-7 rounded-lg bg-amber-500 border-2 border-slate-900 shadow-md text-slate-950 font-black text-xs flex items-center justify-center hover:scale-125 transition-transform cursor-pointer">
              ${badgeIcon}
            </div>
          `;
          const landIcon = L.divIcon({
            html: landIconHtml,
            className: 'custom-land-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const landMarker = L.marker([land.lat, land.lng], { icon: landIcon });

          const landPopup = `
            <div class="p-2.5 min-w-[270px] font-sans">
              <div class="flex items-center justify-between border-b pb-1 mb-1.5">
                <div class="font-bold text-xs text-slate-900">${land.name}</div>
                <span class="text-xs font-extrabold px-1.5 py-0.5 rounded ${
                  land.overallScore >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }">AI Score: ${land.overallScore}/100</span>
              </div>
              <div class="text-xs space-y-1 text-slate-700">
                <div class="text-[11px] font-mono text-slate-500">
                  <strong>Cadastral:</strong> ${land.lotNumber}, ${land.mukim}
                </div>
                <div class="bg-amber-50 text-amber-900 p-1.5 rounded font-semibold text-[11px] border border-amber-200">
                  📍 <strong>Distance to PMU ${node.name}:</strong> ${land.distanceToPMUKm} km (Cable Route: ${land.estimatedCableLengthKm} km)
                </div>
                <div class="grid grid-cols-2 gap-1 text-[11px] pt-1">
                  <div><strong>Area:</strong> ${land.areaHectares} Ha (${land.areaAcres} Ac)</div>
                  <div><strong>Solar Est:</strong> ${land.maxCapacityMW} MWp</div>
                  <div><strong>Tenure:</strong> ${land.landTitleType.split(' ')[0]}</div>
                  <div><strong>Slope:</strong> ${land.terrainSlope}° (${land.terrainCategory.split(' ')[0]})</div>
                </div>
                <div class="flex flex-wrap gap-1 pt-1">
                  ${land.isBestOverall ? '<span class="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">🏆 Best Overall</span>' : ''}
                  ${land.isLowestCost ? '<span class="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold">💰 Lowest Cost</span>' : ''}
                  ${land.isFastestToDevelop ? '<span class="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded font-bold">⚡ Fast Track</span>' : ''}
                  ${land.isLowestEnvRisk ? '<span class="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.5 rounded font-bold">🌿 Clean Env</span>' : ''}
                </div>
                <div class="pt-2">
                  <button id="feasibility-btn-${land.id}" class="w-full bg-amber-500 text-slate-950 font-black py-1.5 px-2 rounded text-xs hover:bg-amber-400 shadow-xs cursor-pointer">
                    📋 Generate Detailed Feasibility Study
                  </button>
                </div>
              </div>
            </div>
          `;

          landMarker.bindPopup(landPopup);
          landMarker.on('popupopen', () => {
            setTimeout(() => {
              const fBtn = document.getElementById(`feasibility-btn-${land.id}`);
              if (fBtn) {
                fBtn.onclick = () => {
                  onAnalyzeFeasibility(land, node);
                  map.closePopup();
                };
              }
            }, 50);
          });

          landMarker.on('click', () => {
            onSelectLandParcel(land, node);
          });

          markersGroup.addLayer(landMarker);

          // Draw interconnection line connecting Land to PMU
          const line = L.polyline(
            [
              [node.lat, node.lng],
              [land.lat, land.lng],
            ],
            {
              color: '#f59e0b',
              weight: 2.5,
              dashArray: '6, 6',
              opacity: 0.9,
            }
          );

          line.bindTooltip(`${land.distanceToPMUKm} km to PMU`, {
            permanent: false,
            direction: 'center',
            className: 'distance-polyline-tooltip bg-slate-900 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/50 shadow-md',
          });

          linesGroup.addLayer(line);
        });
      }
    });

    // 4. Render Custom Dropped Pin if active
    if (customPin && isValidLatLng(customPin.lat, customPin.lng)) {
      const customPinHtml = `
        <div class="w-7 h-7 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold animate-bounce">
          📍
        </div>
      `;
      const customIcon = L.divIcon({
        html: customPinHtml,
        className: 'custom-pin-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const pinMarker = L.marker([customPin.lat, customPin.lng], { icon: customIcon });

      // Find nearest PMU for custom pin
      let nearestPMU: PMUNode | null = null;
      let minDistance = Infinity;

      nodes.forEach((n) => {
        if (!isValidLatLng(n.lat, n.lng)) return;
        const d = calculateHaversineDistanceKm(customPin.lat, customPin.lng, n.lat, n.lng);
        if (d < minDistance) {
          minDistance = d;
          nearestPMU = n;
        }
      });

      if (nearestPMU) {
        const activeNearestPMU: PMUNode = nearestPMU;
        pinMarker.bindPopup(`
          <div class="p-2 min-w-[220px]">
            <div class="font-bold text-xs text-rose-700 mb-1">📍 Custom Candidate Land Site</div>
            <div class="text-xs space-y-1 text-slate-800">
              <div><strong>GPS:</strong> ${customPin.lat.toFixed(4)}, ${customPin.lng.toFixed(4)}</div>
              <div><strong>Land Area:</strong> ${customPin.areaAcres} Acres</div>
              <div class="bg-amber-100 p-1.5 rounded border border-amber-300 font-bold text-slate-900 mt-1">
                Nearest Node: PMU ${activeNearestPMU.name} (${activeNearestPMU.voltage})<br/>
                <span class="text-amber-700">Distance: ${minDistance} km</span>
              </div>
            </div>
          </div>
        `);

        markersGroup.addLayer(pinMarker);

        // Line from custom pin to nearest PMU
        const customLine = L.polyline(
          [
            [customPin.lat, customPin.lng],
            [activeNearestPMU.lat, activeNearestPMU.lng],
          ],
          {
            color: '#e11d48',
            weight: 3,
            dashArray: '4, 4',
          }
        );

        customLine.bindTooltip(`Nearest PMU ${activeNearestPMU.name}: ${minDistance} km`, {
          permanent: true,
          direction: 'center',
          className: 'custom-pin-tooltip bg-rose-950 text-rose-200 text-[11px] font-bold px-2 py-0.5 rounded border border-rose-500',
        });

        linesGroup.addLayer(customLine);
      }
    }
  }, [nodes, selectedNode, customPin, showRadiusRings, showEnvironmentalOverlay, showJupemOverlay, selectedJupemCategories, allJupemZones, selectedRadiusKm, onSelectNode, onSelectLandParcel, onAnalyzeFeasibility]);

  // Center Map on Selected Node
  useEffect(() => {
    if (selectedNode && mapInstanceRef.current && typeof selectedNode.lat === 'number' && !isNaN(selectedNode.lat) && typeof selectedNode.lng === 'number' && !isNaN(selectedNode.lng)) {
      mapInstanceRef.current.flyTo([selectedNode.lat, selectedNode.lng], 11, { duration: 1.2 });
    }
  }, [selectedNode]);

  return (
    <div
      className={`relative w-full ${
        isFullScreen
          ? 'fixed inset-0 z-[9999] w-screen h-screen bg-slate-950 p-2 sm:p-4 flex flex-col'
          : 'h-[640px] bg-slate-200 rounded-lg overflow-hidden border-2 border-slate-300 shadow-sm'
      }`}
    >
      {/* Full Screen Top Header Bar */}
      {isFullScreen && (
        <div className="bg-slate-900 border-b border-slate-800 p-2.5 px-4 rounded-t-lg flex items-center justify-between z-30 shrink-0 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/40">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold font-mono tracking-tight text-slate-100 flex items-center gap-2">
                <span>LSS6 GEOSPATIAL MAP EXPLORER</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 uppercase font-mono font-bold">
                  FULL SCREEN MODE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Peninsular Malaysia 48 PMU Substation Grid &amp; JUPEM Cadastral Land Parcel Network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFloatingPanels(!showFloatingPanels)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                showFloatingPanels
                  ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
              }`}
              title={showFloatingPanels ? 'Hide all map overlays & panels' : 'Show map overlays & panels'}
            >
              {showFloatingPanels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showFloatingPanels ? 'Hide Panels' : 'Show Panels'}</span>
            </button>

            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                showLegend
                  ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-800/60 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
              title={showLegend ? 'Hide LSS6 Map Legend' : 'Show LSS6 Map Legend'}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{showLegend ? 'Hide Legend' : 'Show Legend'}</span>
            </button>

            <button
              onClick={() => setIsFullScreen(false)}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1.5 rounded text-xs font-bold transition-all shadow-md border border-rose-400"
              title="Exit Full Screen Mode (Esc)"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Exit Full Screen</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-10 relative overflow-hidden" />

      {/* Top-Right Quick Controls Bar (Full Screen, Hide Panels, Hide Legend) */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        {/* Full Screen Toggle Button */}
        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-900 text-amber-300 backdrop-blur-md px-3 py-2 rounded-md border border-slate-700 shadow-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
          title={isFullScreen ? 'Exit Full Screen Mode (Esc)' : 'Open Map to Full Screen for Easy Site Navigation'}
        >
          {isFullScreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-amber-400" />
              <span>Exit Full Screen</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-amber-400" />
              <span className="font-mono uppercase text-[11px] font-black">Full Screen Map</span>
            </>
          )}
        </button>

        {/* Hide / Show All Panels Toggle */}
        <button
          onClick={() => setShowFloatingPanels(!showFloatingPanels)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md border shadow-xl text-xs font-bold backdrop-blur-md transition-all ${
            showFloatingPanels
              ? 'bg-white/95 text-slate-800 border-slate-300 hover:bg-slate-100'
              : 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold ring-2 ring-amber-400/50'
          }`}
          title={showFloatingPanels ? 'Hide all floating panels & HUD overlays for clean map view' : 'Show map panels & HUD controls'}
        >
          {showFloatingPanels ? (
            <>
              <EyeOff className="w-4 h-4 text-slate-600" />
              <span>Hide Panels</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 text-slate-950" />
              <span>Show Panels</span>
            </>
          )}
        </button>

        {/* Hide / Show Legend Toggle */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md border shadow-xl text-xs font-bold backdrop-blur-md transition-all ${
            showLegend
              ? 'bg-white/95 text-slate-800 border-slate-300 hover:bg-slate-100'
              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
          title={showLegend ? 'Hide LSS6 Legend box' : 'Show LSS6 Legend box'}
        >
          <Zap className={`w-4 h-4 ${showLegend ? 'text-amber-600' : 'text-slate-400'}`} />
          <span>{showLegend ? 'Hide Legend' : 'Show Legend'}</span>
        </button>
      </div>

      {/* Floating Control Overlay: Map Layer Switcher, Pin Dropper & GIS Filters (Top-Left) */}
      {showFloatingPanels && (
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 max-h-[calc(100%-2rem)] overflow-y-auto pr-1">
          {/* Layer Switcher */}
          <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-lg border border-slate-300 shadow-md flex items-center justify-between gap-1 text-xs">
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-600 ml-1" />
              <button
                onClick={() => setTileLayerType('streets')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  tileLayerType === 'streets' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setTileLayerType('satellite')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  tileLayerType === 'satellite' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setTileLayerType('terrain')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  tileLayerType === 'terrain' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Terrain
              </button>
            </div>
            <button
              onClick={() => setShowFloatingPanels(false)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100"
              title="Close floating panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pin Dropper Active Toggle Button */}
          <button
            onClick={() => setIsPinDropperActive(!isPinDropperActive)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold shadow-md transition-all border ${
              isPinDropperActive
                ? 'bg-rose-600 text-white border-rose-400 ring-4 ring-rose-500/30 animate-pulse'
                : 'bg-white/95 text-slate-900 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4 text-amber-600" />
            {isPinDropperActive ? 'Click Map to Drop Site Pin' : 'Drop Pin to Calculate Distance'}
          </button>

          {/* JUPEM Land Classification Overlay Panel */}
          <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-lg border border-slate-300 shadow-lg text-xs space-y-2 max-w-[290px]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <label className="flex items-center gap-1.5 font-bold text-slate-900 cursor-pointer">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>JUPEM GIS Land Classification Overlay</span>
              </label>
              <input
                type="checkbox"
                checked={showJupemOverlay}
                onChange={(e) => setShowJupemOverlay(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {showJupemOverlay && (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Filter JUPEM Layers:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedJupemCategories(['agricultural', 'industrial', 'forest_reserve', 'water_catchment', 'commercial'])}
                      className="hover:text-slate-900 font-bold underline"
                    >
                      Select All
                    </button>
                    <span>&bull;</span>
                    <button
                      onClick={() => setSelectedJupemCategories([])}
                      className="hover:text-slate-900 font-bold underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {JUPEM_LAND_CATEGORIES.map((cat) => {
                    const isSelected = selectedJupemCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedJupemCategories(selectedJupemCategories.filter((c) => c !== cat.id));
                          } else {
                            setSelectedJupemCategories([...selectedJupemCategories, cat.id]);
                          }
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all border ${
                          isSelected
                            ? 'bg-slate-900 text-amber-300 border-slate-800 shadow-xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="pt-1 flex items-center justify-between border-t border-slate-200">
                  <button
                    onClick={handleFitJupemBounds}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-900 text-amber-300 hover:bg-slate-800 py-1 px-2 rounded text-[11px] font-bold shadow-xs transition-colors"
                  >
                    <Maximize2 className="w-3 h-3 text-amber-400" />
                    <span>Zoom to Fit JUPEM Overlay</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-500 font-mono italic flex items-center justify-between pt-0.5">
                  <span>Jabatan Ukur & Pemetaan (2026)</span>
                  <span className="font-bold text-emerald-700">{allJupemZones.filter((z) => selectedJupemCategories.includes(z.category)).length} Zones Active</span>
                </div>
              </div>
            )}
          </div>

          {/* Radius Rings Toggle */}
          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-white/95 border border-slate-300 text-slate-700 text-xs shadow-sm">
            <label className="flex items-center gap-2 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={showRadiusRings}
                onChange={(e) => setShowRadiusRings(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <span>Show PMU Distance Buffer Rings</span>
            </label>
            {showRadiusRings && (
              <div className="flex items-center gap-1 pl-5 text-[11px]">
                <span className="text-slate-500 font-medium">Radius:</span>
                {[5, 10, 20, 30].map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRadiusKm(r)}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      selectedRadiusKm === r ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Environmental Exclusion Layer Toggle */}
          <label className="flex items-center gap-2 p-2 rounded-lg bg-white/95 border border-rose-300 text-rose-950 text-xs font-bold cursor-pointer shadow-sm">
            <input
              type="checkbox"
              checked={showEnvironmentalOverlay}
              onChange={(e) => setShowEnvironmentalOverlay(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500"
            />
            <span>🌳 Show Forest Reserve / Water Exclusions</span>
          </label>

          {/* D3 Geospatial Risk Heatmap Overlay Toggle */}
          <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 text-amber-300 border border-amber-500 text-xs font-bold cursor-pointer shadow-sm">
            <input
              type="checkbox"
              checked={showRiskHeatmapOverlay}
              onChange={(e) => setShowRiskHeatmapOverlay(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Show Geospatial Risk Heatmap (D3)</span>
            </span>
          </label>
        </div>
      )}

      {/* Map Legend Overlay (Bottom-Right) */}
      {showLegend && (
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-lg border border-slate-300 shadow-xl text-xs space-y-2 max-w-[240px]">
          <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span>LSS6 Legend</span>
              <Zap className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <button
              onClick={() => setShowLegend(false)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100"
              title="Close Legend"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5 text-slate-700 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-300 flex items-center justify-center text-[8px] font-black text-white">
                1
              </span>
              <span>33 kV Node (152 PMUs / Pkg 3)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-emerald-300 flex items-center justify-center text-[8px] font-black text-white">
                1
              </span>
              <span>132 kV Node (38 PMUs / Hybrid)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-purple-600 border border-purple-300 flex items-center justify-center text-[8px] font-black text-white">
                1
              </span>
              <span>275 kV Node (10 PMUs / Hybrid)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-slate-900 flex items-center justify-center text-[8px]">
                ☀️
              </span>
              <span>Candidate Solar Land Site</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-amber-500 border-b border-dashed border-amber-600"></span>
              <span>Grid Connection Cable</span>
            </div>
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <span>**</span>
              <span>Pending Queue Application</span>
            </div>

            {showJupemOverlay && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="font-bold text-[10px] text-slate-800 font-mono uppercase">JUPEM Land Use Overlay</div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-3 h-3 rounded-xs bg-lime-500 border border-lime-700"></span>
                  <span>Agricultural (Pertanian)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-3 h-3 rounded-xs bg-sky-600 border border-sky-800"></span>
                  <span>Industrial (Perindustrian)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-3 h-3 rounded-xs bg-emerald-700 border border-emerald-900"></span>
                  <span>Forest Reserve (Hutan Simpan)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-3 h-3 rounded-xs bg-cyan-500 border border-cyan-700"></span>
                  <span>Water Catchment (Tadahan Air)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
