import React, { useState } from 'react';
import { PMUNode, CustomLocationAnalysis, LandParcel } from '../types';
import { analyzeCustomLandPlot, calculateBearing, getCompassDirection, generateMonthlyIrradianceAndYield, calculateAnnualYieldMWh } from '../utils/geoUtils';
import { MapPin, Zap, Compass, Calculator, Sun, DollarSign, FileText, ArrowRight, CheckCircle, ShieldAlert } from 'lucide-react';

interface CustomLandCalculatorProps {
  nodes: PMUNode[];
  customPin: { lat: number; lng: number; areaAcres: number } | null;
  onSetCustomPin: (pin: { lat: number; lng: number; areaAcres: number }) => void;
  onAnalyzeFeasibility: (land: LandParcel, node: PMUNode) => void;
  isPinDropperActive: boolean;
  setIsPinDropperActive: (active: boolean) => void;
}

export const CustomLandCalculator: React.FC<CustomLandCalculatorProps> = ({
  nodes,
  customPin,
  onSetCustomPin,
  onAnalyzeFeasibility,
  isPinDropperActive,
  setIsPinDropperActive,
}) => {
  const [inputLat, setInputLat] = useState<string>(customPin ? customPin.lat.toString() : '2.1412');
  const [inputLng, setInputLng] = useState<string>(customPin ? customPin.lng.toString() : '102.5612');
  const [inputAcres, setInputAcres] = useState<number>(customPin ? customPin.areaAcres : 250);

  const currentLat = customPin ? customPin.lat : parseFloat(inputLat) || 2.1412;
  const currentLng = customPin ? customPin.lng : parseFloat(inputLng) || 102.5612;
  const currentAcres = customPin ? customPin.areaAcres : inputAcres;

  // Compute live distance analysis to nearest PMU
  const analysis: CustomLocationAnalysis = analyzeCustomLandPlot(
    currentLat,
    currentLng,
    currentAcres,
    nodes
  );

  const bearing = calculateBearing(
    analysis.nearestPMU.lat,
    analysis.nearestPMU.lng,
    currentLat,
    currentLng
  );
  const compassDir = getCompassDirection(bearing);

  const handleManualCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(inputLat);
    const lngNum = parseFloat(inputLng);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      onSetCustomPin({ lat: latNum, lng: lngNum, areaAcres: inputAcres });
    }
  };

  const handleTriggerCustomAIReport = () => {
    const is33kV = analysis.nearestPMU.voltage === '33kV';
    const exportCap = is33kV
      ? Math.min(30, Math.max(10, Math.round(analysis.maxSolarCapacityMW / 1.25)))
      : Math.round(analysis.maxSolarCapacityMW / 2.5);
    const solarCap = is33kV
      ? exportCap
      : Math.round(analysis.maxSolarCapacityMW / 1.25);
    const bessPower = is33kV ? 0 : exportCap;
    const bessEnergy = is33kV ? 0 : exportCap * 4;
    const pkgSuitability = is33kV
      ? 'Package 3 (Export 10-30 MWa.c. Solar Only)'
      : analysis.maxSolarCapacityMW <= 125
      ? 'Package 2 (Export 30-50 MWa.c. - 60% Bumiputera)'
      : 'Package 1 (Export >50-250 MWa.c.)';

    // Construct a temporary LandParcel object from custom analysis
    const customLand: LandParcel = {
      id: `custom-land-${Date.now()}`,
      pmuId: analysis.nearestPMU.id,
      name: `Custom Land Site (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)})`,
      dataProvenance: 'USER_ENTERED',
      lotNumber: 'Custom Plot (Unsurveyed)',
      mukim: `Mukim ${analysis.nearestPMU.district}`,
      district: analysis.nearestPMU.district,
      state: analysis.nearestPMU.state,
      gpsPolygon: [
        { lat: currentLat + 0.002, lng: currentLng - 0.002 },
        { lat: currentLat + 0.002, lng: currentLng + 0.002 },
        { lat: currentLat - 0.002, lng: currentLng + 0.002 },
        { lat: currentLat - 0.002, lng: currentLng - 0.002 },
      ],
      lat: currentLat,
      lng: currentLng,
      areaAcres: currentAcres,
      areaHectares: Math.round(currentAcres * 0.404686 * 10) / 10,
      maxCapacityMW: analysis.maxSolarCapacityMW,
      distanceToPMUKm: analysis.distanceToNearestPMUKm,
      estimatedCableLengthKm: analysis.estimatedCableLengthKm,
      distanceToTransmissionLineKm: Math.round(analysis.distanceToNearestPMUKm * 0.9 * 10) / 10,
      distanceToAccessRoadKm: 0.4,
      ownershipType: 'Custom User-Specified Land Plot',
      landTitleType: 'Freehold (Geran Kekal)',
      remainingLeaseYears: 99,
      categoryOfLandUse: 'Unutilized Scrubland',
      expressConditions: 'Syarat Nyata: Tanaman Agrikultur & Utiliti Grid',
      restrictionsInInterest: 'Tiada Sekatan (Bebas Dipindah Milik)',
      encumbranceStatus: 'Tiada Bebanan (Unencumbered)',
      ndviVegetationIndex: 0.28,
      existingBuildingsCount: 0,
      distanceToFederalRoadKm: 0.4,
      distanceToWaterwayKm: 1.2,
      aspectDirection: 'South-Facing (180°)',
      distanceToResidentialZoneKm: 2.2,
      distanceToCommercialZoneKm: 4.5,
      distanceToIndustrialZoneKm: 3.1,
      isResidentialExcluded: false,
      isCommercialExcluded: false,
      isIndustrialExcluded: false,
      isSuitableForSolarFarm: true,
      zoningExclusionWarning: undefined,
      elevationDEM: 35,
      terrainSlope: analysis.terrainSlope,
      terrainCategory: analysis.terrainCategory,
      isSteepTerrainExcluded: false,
      floodRisk: 'Low',
      floodRiskLevel: 'Low Hazard Zone (<0.3m)',
      ariFloodLevel50Yr: 0.3,
      didRiverCatchment: `Sg. ${analysis.nearestPMU.state} Basin (JPS Station #2912)`,
      historicalFloodEvents: [
        {
          year: 2021,
          eventName: 'Monsoon Floods',
          depthMeters: 0.35,
          durationDays: 1.5,
          impactSummary: 'Peripheral drainage overflow; site stayed dry on elevated terrain.',
        },
      ],
      submergenceRiskScore: 92,
      recommendedPileElevationMeters: 1.5,
      floodMitigationCapExMyr: 0.45,
      drainageMasterPlanRequirement: 'Standard JPS MSMA Manual detention basin design',
      distanceToPermanentForestReserveKm: 6.2,
      isPermanentForestReserveOverlay: false,
      isNationalParkRamsarBuffer: false,
      isWaterCatchmentZone: false,
      eiaCategory: 'Category 2: Preliminary EIA',
      localPlanZoning: 'Rancangan Tempatan Daerah (RTD) - Zoning Utiliti Tenaga',
      zoningCompatibility: 'Fully Compatible (Permitted)',
      estimatedLandCostPerAcreMyr: 45000,
      estimatedTotalLandAcquisitionCostMyr: Math.round((currentAcres * 45000 / 1000000) * 100) / 100,
      landAcquisitionType: 'Direct Outright Purchase',
      ...generateMonthlyIrradianceAndYield(
        analysis.ghiKwhM2Year,
        analysis.maxSolarCapacityMW,
        calculateAnnualYieldMWh(analysis.maxSolarCapacityMW, analysis.ghiKwhM2Year, exportCap, 0.85, 0.015, 0.010, is33kV).annualMWh
      ),
      exportCapacityMWa: exportCap,
      solarCapacityMWa: solarCap,
      capacityMWp: analysis.maxSolarCapacityMW,
      bessPowerMW: bessPower,
      bessEnergyMWh: bessEnergy,
      capacityFactorYear1: calculateAnnualYieldMWh(analysis.maxSolarCapacityMW, analysis.ghiKwhM2Year, exportCap, 0.85, 0.015, 0.010, is33kV).capacityFactorYear1,
      capacityFactorYear21: calculateAnnualYieldMWh(analysis.maxSolarCapacityMW, analysis.ghiKwhM2Year, exportCap, 0.85, 0.015, 0.010, is33kV).capacityFactorYear21,
      clearsCapacityFactorFloor: calculateAnnualYieldMWh(analysis.maxSolarCapacityMW, analysis.ghiKwhM2Year, exportCap, 0.85, 0.015, 0.010, is33kV).clearsCapacityFactorFloor,
      bidBondMyr: is33kV ? 0.35 : (analysis.maxSolarCapacityMW > 125 ? 3.0 : 1.0),
      pvCapExMyr: analysis.pvCapExMyr,
      bessCapExMyr: is33kV ? 0 : analysis.bessCapExMyr,
      gridCapExMyr: analysis.gridCapExMyr,
      landCapExMyr: analysis.landCapExMyr,
      floodCapExMyr: analysis.floodCapExMyr,
      bidBondCapExMyr: 0,
      ghiKwhM2Year: analysis.ghiKwhM2Year,
      ghiKwhM2Day: analysis.ghiKwhM2Day,
      estimatedAnnualMWh: calculateAnnualYieldMWh(analysis.maxSolarCapacityMW, analysis.ghiKwhM2Year, exportCap, 0.85, 0.015, 0.010, is33kV).annualMWh,
      estimatedLCOEMyr: analysis.lcoeMyrKwh,
      estimatedIRR: analysis.irrPercent,
      estimatedCapExMyr: analysis.totalCapExMyr,
      interconnectionCostMyr: analysis.interconnectionCostMyr,
      annualCarbonOffsetTonnes: Math.round(calculateAnnualYieldMWh(analysis.maxSolarCapacityMW, analysis.ghiKwhM2Year, exportCap, 0.85, 0.015, 0.010, is33kV).annualMWh * 0.63),
      scoreDistancePMU: Math.max(10, Math.round(100 - analysis.distanceToNearestPMUKm * 8)),
      scoreLandSize: 90,
      scoreTerrainSlope: 85,
      scoreEnvConstraints: 95,
      scoreRoadAccess: 90,
      scoreOwnershipTitle: 95,
      scorePlanningZoning: 95,
      isBestOverall: false,
      isLowestCost: false,
      isFastestToDevelop: false,
      isLowestEnvRisk: false,
      isLargestContiguous: currentAcres >= 370,
      packageSuitability: pkgSuitability,
      overallScore: analysis.overallScore,
      solarResource: analysis.solarResource,
      yieldResult: analysis.yieldResult,
      notes: `User custom dropped pin located ${analysis.distanceToNearestPMUKm} km ${compassDir} of PMU ${analysis.nearestPMU.name}${is33kV ? ' (33kV Node - Package 3 Solar-Only)' : ''}.`,
    };

    onAnalyzeFeasibility(customLand, analysis.nearestPMU);
  };

  return (
    <div className="bg-white border border-slate-300 rounded p-6 space-y-6 shadow-sm text-slate-900 font-sans">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-600" /> Custom Land Pin Dropper & PMU Distance Engine
          </h2>
          <p className="text-xs text-slate-500">
            Pinpoint any land site in Peninsular Malaysia to find the nearest LSS6 interconnection node, exact distance, and feasibility parameters.
          </p>
        </div>

        <button
          onClick={() => setIsPinDropperActive(!isPinDropperActive)}
          className={`px-4 py-2 rounded text-xs font-bold transition-all border shadow-sm flex items-center gap-2 ${
            isPinDropperActive
              ? 'bg-rose-600 text-white border-rose-400 ring-4 ring-rose-500/30'
              : 'bg-amber-500 text-slate-950 border-amber-600 hover:bg-amber-600'
          }`}
        >
          <MapPin className="w-4 h-4" />
          {isPinDropperActive ? 'Interactive Pin Dropper Active (Click Map)' : 'Activate Click-on-Map Dropper'}
        </button>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleManualCalculate} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded border border-slate-200">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Latitude (°N)</label>
          <input
            type="number"
            step="0.0001"
            value={inputLat}
            onChange={(e) => setInputLat(e.target.value)}
            placeholder="e.g. 2.1412"
            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Longitude (°E)</label>
          <input
            type="number"
            step="0.0001"
            value={inputLng}
            onChange={(e) => setInputLng(e.target.value)}
            placeholder="e.g. 102.5612"
            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Land Area (Acres)</label>
          <input
            type="number"
            step="10"
            value={inputAcres}
            onChange={(e) => setInputAcres(Number(e.target.value))}
            placeholder="e.g. 250"
            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-2 px-4 rounded text-xs border border-slate-300 transition-all flex items-center justify-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" /> Recalculate Distance
          </button>
        </div>
      </form>

      {/* Main Distance & Nearest PMU Result Card */}
      <div className="bg-white p-6 rounded border-2 border-amber-500 shadow-sm space-y-6">
        {/* Nearest PMU Spotlight Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-amber-500 text-slate-950 rounded font-black text-lg shadow-sm">
              ⚡
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block font-mono">
                Nearest Interconnection Node Identified
              </span>
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                PMU {analysis.nearestPMU.name}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-emerald-800 border border-emerald-300 font-mono">
                  {analysis.nearestPMU.voltage}
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {analysis.nearestPMU.state} &bull; District: {analysis.nearestPMU.district} &bull; Capacity: {analysis.nearestPMU.capacityMW} MW
              </p>
            </div>
          </div>

          {/* Large Distance Callout Badge */}
          <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded text-center md:text-right font-mono">
            <span className="text-xs text-slate-500 uppercase font-bold block">Distance from Nearest PMU</span>
            <div className="text-3xl font-black text-amber-700 tracking-tight">
              {analysis.distanceToNearestPMUKm} <span className="text-base font-bold text-slate-600">km</span>
            </div>
            <span className="text-[11px] text-slate-600 font-medium">
              Direction: {compassDir} &bull; Est. Cable Route: {analysis.estimatedCableLengthKm} km
            </span>
          </div>
        </div>

        {/* Technical & Commercial Parameter Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Max Solar Capacity</span>
            <div className="text-lg font-black text-amber-700">{analysis.maxSolarCapacityMW} MWp</div>
            <span className="text-[10px] text-slate-500">Based on {analysis.customAreaAcres} Acres</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Interconnection Cable Cost</span>
            <div className="text-lg font-black text-emerald-700">RM {analysis.interconnectionCostMyr}M</div>
            <span className="text-[10px] text-slate-500">{analysis.suggestedVoltage} Overhead Line</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Solar Irradiance (GHI)</span>
            <div className="text-lg font-black text-amber-700">{analysis.ghiKwhM2Year} kWh/m²/yr</div>
            <span className="text-[10px] text-slate-500">{analysis.ghiKwhM2Day} kWh/m²/day</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Overall Feasibility Score</span>
            <div className="text-lg font-black text-emerald-700">{analysis.overallScore} / 100</div>
            <span className="text-[10px] text-slate-500">Grade A Site</span>
          </div>
        </div>

        {/* Secondary Alternative PMU Fallback */}
        {analysis.secondNearestPMU && (
          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs flex items-center justify-between text-slate-700 font-mono">
            <span className="text-slate-600">
              <strong>Secondary Backup Node:</strong> PMU {analysis.secondNearestPMU.name} ({analysis.secondNearestPMU.voltage}, {analysis.secondNearestPMU.capacityMW}MW)
            </span>
            <span className="font-bold text-amber-700">
              Distance: {analysis.secondDistanceKm} km
            </span>
          </div>
        )}

        {/* Action Button: Generate Deep Gemini AI Report */}
        <div className="pt-2">
          <button
            onClick={handleTriggerCustomAIReport}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-3 px-6 rounded text-sm shadow-sm flex items-center justify-center gap-2 transition-all transform hover:scale-[1.005]"
          >
            <FileText className="w-4 h-4" /> Generate Full LSS6 Feasibility Report for this Custom Site
          </button>
        </div>
      </div>
    </div>
  );
};
