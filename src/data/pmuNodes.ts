import { PMUNode, LandParcel, StateName, VoltageLevel } from '../types';
import {
  calculateHaversineDistanceKm,
  estimateCableRouteKm,
  getEstimatedSolarGHI,
  calculateSolarCapacityFromLand,
  calculateAnnualYieldMWh,
  calculateFinancials,
  calculateInterconnectionCostMyr,
  generateMonthlyIrradianceAndYield,
} from '../utils/geoUtils';

/**
 * Creates candidate land plots surrounding a specific PMU
 */
/**
 * Generates polygon boundary vertices around a central lat/lng coordinate based on parcel area
 */
function createPolygonVertices(centerLat: number, centerLng: number, areaAcres: number): { lat: number; lng: number }[] {
  // Rough scaling: 100 acres ~ 0.0035 lat/lng delta
  const delta = Math.sqrt(areaAcres / 100) * 0.0032;
  return [
    { lat: Math.round((centerLat + delta * 0.9) * 10000) / 10000, lng: Math.round((centerLng - delta * 1.1) * 10000) / 10000 },
    { lat: Math.round((centerLat + delta * 1.1) * 10000) / 10000, lng: Math.round((centerLng + delta * 0.8) * 10000) / 10000 },
    { lat: Math.round((centerLat - delta * 0.8) * 10000) / 10000, lng: Math.round((centerLng + delta * 1.2) * 10000) / 10000 },
    { lat: Math.round((centerLat - delta * 1.0) * 10000) / 10000, lng: Math.round((centerLng - delta * 0.9) * 10000) / 10000 },
  ];
}

/**
 * Calculates JPS DID flood history and hydrological assessment profile for candidate land parcels
 */
function getFloodAndHydrologicalProfile(state: StateName, idx: number, dem: number) {
  const catchmentMap: Record<StateName, string> = {
    Kedah: 'Sungai Muda & Sg Kedah River Basin (JPS Station #5804001)',
    Kelantan: 'Sungai Kelantan Basin (JPS Station #5821002 - Tangga Krai)',
    Terengganu: 'Sungai Terengganu & Sg Dungun Catchment (JPS Station #4832001)',
    Johor: 'Sungai Johor & Sg Muar Sub-basin (JPS Station #1836001)',
    Selangor: 'Sungai Klang & Sg Langat Drainage Catchment (JPS Station #3116004)',
    'Kuala Lumpur': 'Sungai Klang Basin & Sg Batu Catchment (JPS Station #3117001)',
    Putrajaya: 'Sungai Langat & Sg Chuau Catchment Basin (JPS Station #2917001)',
    Perak: 'Sungai Perak & Sg Kinta Floodplain (JPS Station #4509001)',
    Pahang: 'Sungai Pahang Main River Basin (JPS Station #3424001 - Temerloh)',
    Melaka: 'Sungai Melaka Coastal Basin (JPS Station #2223001)',
    'N. Sembilan': 'Sungai Linggi & Sg Muar Headwaters (JPS Station #2519001)',
    'P. Pinang': 'Sungai Perai & Sg Muda Estuary (JPS Station #5304001)',
    Perlis: 'Sungai Perlis & Sg Arau Drainage Catchment (JPS Station #6402001)',
  };

  const didRiverCatchment = catchmentMap[state] || 'Peninsular River Catchment System';
  const isEastCoastOrProne = ['Kelantan', 'Terengganu', 'Pahang', 'Johor', 'Kedah'].includes(state);

  if (idx === 0) {
    const ariFloodLevel50Yr = isEastCoastOrProne ? 0.35 : 0.15;
    const submergenceRiskScore = isEastCoastOrProne ? 90 : 96;
    const recommendedPileElevationMeters = isEastCoastOrProne ? 1.5 : 1.2;
    const floodMitigationCapExMyr = 0.45;
    const floodRiskLevel = 'Low Hazard Zone (<0.3m)' as const;
    const historicalEvents = [
      {
        year: 2021,
        eventName: 'Dec 2021 Peninsular Monsoon Inundation',
        depthMeters: isEastCoastOrProne ? 0.4 : 0.2,
        durationDays: 1,
        impactSummary: 'Peripheral swale overflow only; proposed solar plot elevated well above high-water line.',
      },
      {
        year: 2024,
        eventName: 'Nov 2024 Heavy Rainfall Event',
        depthMeters: 0.1,
        durationDays: 0.5,
        impactSummary: 'Minor localized ponding cleared within 12 hours. Zero electrical equipment exposure.',
      },
    ];

    return {
      floodRiskLevel,
      ariFloodLevel50Yr,
      didRiverCatchment,
      historicalFloodEvents: historicalEvents,
      submergenceRiskScore,
      recommendedPileElevationMeters,
      floodMitigationCapExMyr,
      drainageMasterPlanRequirement: 'Standard JPS MSMA Guideline: Peripheral perimeter earth swales & 1x detention pond.',
      floodRisk: 'Low' as const,
    };
  } else if (idx === 1) {
    const ariFloodLevel50Yr = isEastCoastOrProne ? 0.85 : 0.55;
    const submergenceRiskScore = isEastCoastOrProne ? 74 : 82;
    const recommendedPileElevationMeters = isEastCoastOrProne ? 2.1 : 1.6;
    const floodMitigationCapExMyr = 0.95;
    const floodRiskLevel = 'Moderate Hazard Zone (0.3m - 0.8m)' as const;
    const historicalEvents = [
      {
        year: 2014,
        eventName: 'Dec 2014 Great East Coast Flood / Monsoon',
        depthMeters: isEastCoastOrProne ? 1.1 : 0.6,
        durationDays: 4,
        impactSummary: 'Seasonal river overflow in low-lying buffer zone. Requires elevated mounting piles & bund.',
      },
      {
        year: 2021,
        eventName: 'Dec 2021 Peninsular Heavy Inundation',
        depthMeters: isEastCoastOrProne ? 0.7 : 0.4,
        durationDays: 2.5,
        impactSummary: 'Runoff pooling in southern corner. Requires raised inverter skids & armor bunding.',
      },
      {
        year: 2023,
        eventName: 'Mar 2023 Flash Monsoon Event',
        depthMeters: 0.3,
        durationDays: 1,
        impactSummary: 'Temporary waterlogging. Detention basin mitigation required prior to LSS commissioning.',
      },
    ];

    return {
      floodRiskLevel,
      ariFloodLevel50Yr,
      didRiverCatchment,
      historicalFloodEvents: historicalEvents,
      submergenceRiskScore,
      recommendedPileElevationMeters,
      floodMitigationCapExMyr,
      drainageMasterPlanRequirement: 'JPS Approval Required: Earth bunding perimeter, dual culvert gates & MSMA detention basin.',
      floodRisk: 'Moderate' as const,
    };
  } else {
    const isHighFlood = isEastCoastOrProne && dem < 25;
    const ariFloodLevel50Yr = isHighFlood ? 1.45 : 0.40;
    const submergenceRiskScore = isHighFlood ? 62 : 88;
    const recommendedPileElevationMeters = isHighFlood ? 2.5 : 1.4;
    const floodMitigationCapExMyr = isHighFlood ? 1.65 : 0.60;
    const floodRiskLevel = isHighFlood
      ? ('High Inundation Zone (>0.8m)' as const)
      : ('Low Hazard Zone (<0.3m)' as const);
    const historicalEvents = [
      {
        year: 2021,
        eventName: 'Dec 2021 Flash Floods & Monsoon Runoff',
        depthMeters: isHighFlood ? 1.3 : 0.3,
        durationDays: isHighFlood ? 5 : 1.5,
        impactSummary: isHighFlood
          ? 'Significant catchment inundation recorded by JPS gauge. High pile elevation & reinforced bund mandatory.'
          : 'Minor runoff along eastern boundary. Easily managed with standard drainage channels.',
      },
      {
        year: 2024,
        eventName: 'Nov 2024 Monsoon Surge',
        depthMeters: isHighFlood ? 0.8 : 0.2,
        durationDays: isHighFlood ? 2 : 0.5,
        impactSummary: 'Catchment spillover handled by natural topography buffer.',
      },
    ];

    return {
      floodRiskLevel,
      ariFloodLevel50Yr,
      didRiverCatchment,
      historicalFloodEvents: historicalEvents,
      submergenceRiskScore,
      recommendedPileElevationMeters,
      floodMitigationCapExMyr,
      drainageMasterPlanRequirement: isHighFlood
        ? 'Mandatory JPS Hydrological Impact Assessment (HIA) + 50-Year ARI Retention Pond & Raised Transformer Foundations.'
        : 'Standard JPS MSMA Guideline: Perimeter earth swale & culvert connection.',
      floodRisk: isHighFlood ? ('High' as const) : ('Low' as const),
    };
  }
}

/**
 * Creates candidate land plots surrounding a specific PMU with full cadastral, satellite, terrain, environmental, and score weighting metrics.
 */
function generateLandParcelsForNode(
  pmuId: string,
  pmuName: string,
  state: StateName,
  pmuLat: number,
  pmuLng: number,
  nodeCapacityMW: number,
  voltage: VoltageLevel,
  districtName: string
): LandParcel[] {
  const { ghiYear, ghiDay } = getEstimatedSolarGHI(pmuLat, state);

  // Determine coastal & town settlement orientation so land offsets clear municipal/village housing grids and sit cleanly in outer agricultural plantations or industrial corridors
  const searchKey = `${pmuName} ${districtName} ${state}`.toLowerCase();
  const isChukai = searchKey.includes('chukai');
  
  const isWestCoast =
    pmuLng < 103.65 &&
    (searchKey.includes('pontian') ||
      searchKey.includes('kukup') ||
      searchKey.includes('batu pahat') ||
      searchKey.includes('muar') ||
      searchKey.includes('klang') ||
      searchKey.includes('sabak bernam') ||
      searchKey.includes('kuala langat') ||
      searchKey.includes('kota setar') ||
      searchKey.includes('kuala muda') ||
      searchKey.includes('seberang perai') ||
      searchKey.includes('manjung') ||
      searchKey.includes('lumut') ||
      searchKey.includes('yan') ||
      searchKey.includes('sg. karang') ||
      searchKey.includes('tanjung laboh') ||
      searchKey.includes('parit yusof') ||
      searchKey.includes('botanic') ||
      searchKey.includes('sungai besar') ||
      searchKey.includes('mergong'));

  const isEastCoast =
    pmuLng > 103.2 &&
    (searchKey.includes('kemaman') ||
      searchKey.includes('mersing') ||
      searchKey.includes('kuantan') ||
      searchKey.includes('dungun') ||
      searchKey.includes('besut') ||
      searchKey.includes('bachok') ||
      searchKey.includes('kota bharu') ||
      searchKey.includes('pasir puteh') ||
      searchKey.includes('pekan') ||
      searchKey.includes('chukai') ||
      searchKey.includes('gemok'));

  let lngOffA = 0.035;
  let latOffA = 0.032;
  let lngOffB = -0.045;
  let latOffB = -0.038;
  let lngOffC = -0.058;
  let latOffC = 0.042;

  let mukimA = `Mukim ${pmuName} Outer Estate A`;
  let mukimB = `Mukim ${pmuName} Industrial Reserve B`;
  let mukimC = `Mukim ${pmuName} Plantation C`;

  if (isChukai) {
    // PMU Chukai sits near Chukai town center & Kampung Mak Chili.
    // Offset 4.5km - 7.5km West / Northwest inland into Mukim Pasir Gajah & Mukim Teluk Kalong oil palm estates
    latOffA = 0.038;
    lngOffA = -0.042;
    latOffB = 0.048;
    lngOffB = -0.055;
    latOffC = 0.028;
    lngOffC = -0.062;

    mukimA = 'Mukim Pasir Gajah (Outer Plantation Estate)';
    mukimB = 'Mukim Teluk Kalong (Green Energy Corridor)';
    mukimC = 'Mukim Ibok (Contiguous Oil Palm Parcel)';
  } else if (isWestCoast) {
    // West coast: sea lies to the West. Push offsets 3.8km - 7.2km East / Inland into mainland agricultural estates
    lngOffA = 0.038;
    latOffA = 0.028;
    lngOffB = 0.052;
    latOffB = -0.022;
    lngOffC = 0.065;
    latOffC = 0.038;
  } else if (isEastCoast) {
    // East coast: sea lies to the East. Push offsets 3.8km - 7.2km West / Inland into mainland agricultural estates
    lngOffA = -0.038;
    latOffA = 0.028;
    lngOffB = -0.052;
    latOffB = -0.022;
    lngOffC = -0.065;
    latOffC = 0.038;
  } else {
    // Inland nodes: push offsets 3.5km - 6.0km into surrounding agricultural/industrial sectors
    lngOffA = 0.035;
    latOffA = 0.032;
    lngOffB = -0.042;
    latOffB = -0.035;
    lngOffC = 0.052;
    latOffC = 0.042;
  }

  const isBakri = pmuName.toLowerCase().includes('bakri') || pmuId === '132-1';

  // Generate 3 land parcel options per PMU
  const offsets = [
    {
      suffix: isBakri ? 'Lot 8179 (Bakri Candidate Site)' : 'Prime Agribusiness Estate Lot A',
      lotNo: isBakri ? 'Lot 8179' : `Lot ${Math.floor(1000 + pmuLat * 3500 % 8000)}`,
      mukim: isBakri ? 'Mukim Bakri' : mukimA,
      district: isBakri ? 'Muar' : districtName,
      latOff: latOffA,
      lngOff: lngOffA,
      acres: isBakri ? 140 : Math.round(nodeCapacityMW * 2.8),
      ownership: 'Unverified / Candidate Plot (Pending JUPEM Title Search)' as const,
      title: 'Freehold (Geran Kekal)' as const,
      leaseYrs: 99,
      landCat: 'Agricultural (Oil Palm)' as const,
      expressCond: 'Syarat Nyata: Tanaman Kelapa Sawit (Syarat Khas Pertanian)',
      restrictions: 'Tiada Sekatan (Bebas Dipindah Milik)',
      encumbrance: 'Tiada Bebanan (Unencumbered)',
      ndvi: 0.42,
      buildings: 0,
      roadKm: 0.3,
      waterKm: 1.1,
      aspect: 'South-Facing (180° Optimal)',
      dem: 32,
      slopeDeg: 1.8,
      flood: 'Low' as const,
      forestKm: 5.4,
      isForestOverlay: false,
      isRamsar: false,
      isCatchment: false,
      eiaCat: 'Category 2: Preliminary EIA' as const,
      rtdZoning: 'Rancangan Tempatan Daerah (RTD) - Zoning Pertanian Khas',
      zoningCompat: 'Fully Compatible (Permitted)' as const,
      distResKm: 3.8,
      distComKm: 5.2,
      distIndKm: 4.1,
    },
    {
      suffix: 'State Reclaimed Land Lot B',
      lotNo: `Lot ${Math.floor(2000 + pmuLng * 2800 % 8000)}/B`,
      mukim: mukimB,
      district: districtName,
      latOff: latOffB,
      lngOff: lngOffB,
      acres: Math.round(nodeCapacityMW * 3.6),
      ownership: 'Unverified - Potential State Land (Perbadanan Negeri)' as const,
      title: 'Leasehold (Mukim Register)' as const,
      leaseYrs: 88,
      landCat: 'Former Mining / Tin Reclamation' as const,
      expressCond: 'Syarat Nyata: Pembangunan Bekas Perlombongan & Pemprosesan Tenaga',
      restrictions: 'Sekatan: Boleh dipindah milik dengan kebenaran Pihak Berkuasa Negeri',
      encumbrance: 'Bebanan: Hakmilik Kerajaan Negeri',
      ndvi: 0.18,
      buildings: 1,
      roadKm: 0.1,
      waterKm: 0.6,
      aspect: 'Flat / Horizontal (0°)',
      dem: 18,
      slopeDeg: 0.9,
      flood: 'Low' as const,
      forestKm: 8.2,
      isForestOverlay: false,
      isRamsar: false,
      isCatchment: false,
      eiaCat: 'Exempt / Standard Guidelines' as const,
      rtdZoning: 'RTD - Zoning Bekas Perlombongan & Buffer Tenaga Boleh Baharu',
      zoningCompat: 'Fully Compatible (Permitted)' as const,
      distResKm: 4.2,
      distComKm: 5.8,
      distIndKm: 3.9,
    },
    {
      suffix: 'Plantation Expansion Contiguous Parcel C',
      lotNo: `Lot PT ${Math.floor(4000 + (pmuLat + pmuLng) * 1500 % 9000)}`,
      mukim: mukimC,
      district: districtName,
      latOff: latOffC,
      lngOff: lngOffC,
      acres: Math.round(nodeCapacityMW * 4.2),
      ownership: 'Unverified - Potential Plantation / Agri Land' as const,
      title: 'Leasehold (Mukim Register)' as const,
      leaseYrs: 76,
      landCat: 'Unutilized Scrubland' as const,
      expressCond: 'Syarat Nyata: Tanaman Agrikultur & Ternakan',
      restrictions: 'Sekatan: Kebenaran Lembaga Land Rights FELDA required',
      encumbrance: 'Tiada Bebanan (Unencumbered)',
      ndvi: 0.29,
      buildings: 0,
      roadKm: 0.8,
      waterKm: 1.8,
      aspect: 'South-East (135°)',
      dem: 45,
      slopeDeg: 3.4,
      flood: 'Low' as const,
      forestKm: 3.1,
      isForestOverlay: false,
      isRamsar: false,
      isCatchment: false,
      eiaCat: 'Category 2: Preliminary EIA' as const,
      rtdZoning: 'RTD - Zoning Pertanian & Cadangan Laluan Grid TNB',
      zoningCompat: 'Conditional Approval' as const,
      distResKm: 5.0,
      distComKm: 6.5,
      distIndKm: 5.5,
    },
  ];

  const parcels = offsets.map((off, idx) => {
    const lat = Math.round((pmuLat + off.latOff) * 10000) / 10000;
    const lng = Math.round((pmuLng + off.lngOff) * 10000) / 10000;
    const distanceToPMUKm = calculateHaversineDistanceKm(pmuLat, pmuLng, lat, lng);
    const estimatedCableLengthKm = estimateCableRouteKm(distanceToPMUKm);

    const areaHectares = Math.round(off.acres * 0.404686 * 10) / 10;
    
    // RFP LSS6 2:1:4 Architecture Sizing
    const { exportCapacityMWa, solarCapacityMWa, capacityMWp, bessPowerMW, bessEnergyMWh } = calculateSolarCapacityFromLand(off.acres);
    const { annualMWh, capacityFactorYear1, capacityFactorYear21, clearsCapacityFactorFloor } = calculateAnnualYieldMWh(capacityMWp, ghiYear, exportCapacityMWa);

    const estimatedLandCostPerAcreMyr = idx === 0 ? 52000 : idx === 1 ? 38000 : 44000;
    const estimatedTotalLandAcquisitionCostMyr = Math.round((off.acres * estimatedLandCostPerAcreMyr / 1000000) * 100) / 100;
    const landAcquisitionType: 'Direct Outright Purchase' | 'Long-Term 30-Year Lease' | 'Joint Venture (JV / Revenue Share)' =
      idx === 0 ? 'Direct Outright Purchase' : idx === 1 ? 'Long-Term 30-Year Lease' : 'Joint Venture (JV / Revenue Share)';

    const floodProfile = getFloodAndHydrologicalProfile(state, idx, off.dem);

    // Reconciled financial metrics including 4-hr BESS & Bid Bond CapEx
    const fin = calculateFinancials(
      exportCapacityMWa,
      estimatedCableLengthKm,
      voltage,
      annualMWh,
      estimatedTotalLandAcquisitionCostMyr,
      floodProfile.floodMitigationCapExMyr
    );

    const { performanceRatioPercent, p50AnnualMWh, p90AnnualMWh, monthlyIrradianceData } =
      generateMonthlyIrradianceAndYield(ghiYear, capacityMWp, annualMWh);

    const terrainCategory: 'Flat (<3°)' | 'Gentle Slope (3-8°)' | 'Hilly (8-15°)' | 'Steep (>15°)' =
      off.slopeDeg < 3 ? 'Flat (<3°)' : off.slopeDeg <= 8 ? 'Gentle Slope (3-8°)' : off.slopeDeg <= 15 ? 'Hilly (8-15°)' : 'Steep (>15°)';

    // Calculate AI Weighted Suitability Score Breakdown (0 - 100)
    const scoreDistancePMU = Math.max(10, Math.round(100 - distanceToPMUKm * 8));
    const scoreLandSize = Math.min(100, Math.round((off.acres / (exportCapacityMWa * 9.3)) * 90));
    const scoreTerrainSlope = off.slopeDeg < 3 ? 98 : off.slopeDeg < 8 ? 82 : 55;
    const scoreEnvConstraints = off.isForestOverlay ? 10 : off.forestKm > 4 ? 98 : 80;
    const scoreRoadAccess = off.roadKm < 0.5 ? 95 : off.roadKm < 2 ? 80 : 60;
    const scoreOwnershipTitle = off.title.startsWith('Freehold') ? 100 : 85;
    const scorePlanningZoning = off.zoningCompat === 'Fully Compatible (Permitted)' ? 100 : 80;

    // Sum weighted total (0-100)
    const overallScore = Math.min(
      99,
      Math.max(
        35,
        Math.round(
          scoreDistancePMU * 0.3 +
            scoreLandSize * 0.2 +
            scoreTerrainSlope * 0.15 +
            scoreEnvConstraints * 0.15 +
            scoreRoadAccess * 0.1 +
            scoreOwnershipTitle * 0.05 +
            scorePlanningZoning * 0.05
        )
      )
    );

    // Carbon Offset ~ 0.63 tonnes CO2e per MWh in Malaysia grid mix
    const annualCarbonOffsetTonnes = Math.round(annualMWh * 0.63);

    // Package suitability classification under ST RFP LSS6-Hybrid
    const packageSuitability: 'Package 1 (Export >50-250 MWa.c.)' | 'Package 2 (Export 30-50 MWa.c. - 60% Bumiputera)' | 'Package 3 (Export 10-30 MWa.c. Solar Only)' =
      exportCapacityMWa > 50 ? 'Package 1 (Export >50-250 MWa.c.)' : 'Package 2 (Export 30-50 MWa.c. - 60% Bumiputera)';

    const gpsPolygon = createPolygonVertices(lat, lng, off.acres);

    return {
      id: `${pmuId}-land-${idx + 1}`,
      pmuId,
      name: `${pmuName} - ${off.suffix}`,
      lotNumber: off.lotNo,
      mukim: off.mukim,
      district: off.district,
      state,
      gpsPolygon,
      lat,
      lng,
      areaAcres: off.acres,
      areaHectares,
      ownershipType: off.ownership,
      landTitleType: off.title,
      remainingLeaseYears: off.leaseYrs,
      categoryOfLandUse: off.landCat,
      expressConditions: off.expressCond,
      restrictionsInInterest: off.restrictions,
      encumbranceStatus: off.encumbrance,

      ndviVegetationIndex: off.ndvi,
      existingBuildingsCount: off.buildings,
      distanceToFederalRoadKm: off.roadKm,
      distanceToWaterwayKm: off.waterKm,
      aspectDirection: off.aspect,

      elevationDEM: off.dem,
      terrainSlope: off.slopeDeg,
      terrainCategory,
      isSteepTerrainExcluded: off.slopeDeg > 15,
      floodRisk: floodProfile.floodRisk,
      floodRiskLevel: floodProfile.floodRiskLevel,
      ariFloodLevel50Yr: floodProfile.ariFloodLevel50Yr,
      didRiverCatchment: floodProfile.didRiverCatchment,
      historicalFloodEvents: floodProfile.historicalFloodEvents,
      submergenceRiskScore: floodProfile.submergenceRiskScore,
      recommendedPileElevationMeters: floodProfile.recommendedPileElevationMeters,
      floodMitigationCapExMyr: floodProfile.floodMitigationCapExMyr,
      drainageMasterPlanRequirement: floodProfile.drainageMasterPlanRequirement,

      distanceToPMUKm,
      estimatedCableLengthKm,
      distanceToTransmissionLineKm: Math.round(distanceToPMUKm * 0.7 * 10) / 10,
      distanceToAccessRoadKm: off.roadKm,

      distanceToPermanentForestReserveKm: off.forestKm,
      isPermanentForestReserveOverlay: off.isForestOverlay,
      isNationalParkRamsarBuffer: off.isRamsar,
      isWaterCatchmentZone: off.isCatchment,
      eiaCategory: off.eiaCat,

      // Urban, Residential & Commercial Zoning Proximity
      distanceToResidentialZoneKm: off.distResKm,
      distanceToCommercialZoneKm: off.distComKm,
      distanceToIndustrialZoneKm: off.distIndKm,
      isResidentialExcluded: off.distResKm < 0.5,
      isCommercialExcluded: off.distComKm < 0.5,
      isIndustrialExcluded: off.distIndKm < 0.5,
      isSuitableForSolarFarm:
        off.distResKm >= 0.5 &&
        off.distComKm >= 0.5 &&
        off.distIndKm >= 0.5 &&
        off.slopeDeg <= 15 &&
        !off.landCat.includes('Residential') &&
        !off.landCat.includes('Commercial') &&
        !off.landCat.includes('Heavy Industrial'),
      zoningExclusionWarning:
        off.distResKm < 1.0
          ? '⚠️ PROXIMITY ALERT: Site is within 1.0 km of Urban Residential Settlement — Glare/Noise Assessment & Local Public Hearing Required under PLANMalaysia LSS Guidelines.'
          : undefined,

      localPlanZoning: off.rtdZoning,
      zoningCompatibility: off.zoningCompat,

      scoreDistancePMU,
      scoreLandSize,
      scoreTerrainSlope,
      scoreEnvConstraints,
      scoreRoadAccess,
      scoreOwnershipTitle,
      scorePlanningZoning,
      overallScore,

      // Placeholder badges
      isBestOverall: false,
      isLowestCost: false,
      isFastestToDevelop: false,
      isLowestEnvRisk: false,
      isLargestContiguous: areaHectares >= 150,
      packageSuitability,

      estimatedLandCostPerAcreMyr,
      estimatedTotalLandAcquisitionCostMyr,
      landAcquisitionType,

      performanceRatioPercent,
      p50AnnualMWh,
      p90AnnualMWh,
      monthlyIrradianceData,

      exportCapacityMWa,
      solarCapacityMWa,
      capacityMWp,
      bessPowerMW,
      bessEnergyMWh,
      capacityFactorYear1,
      capacityFactorYear21,
      clearsCapacityFactorFloor,
      bidBondMyr: fin.bidBondGuaranteeAmountMyr,
      bidPriceMyrKwh: fin.bidPriceMyrKwh,
      comparativePriceMyrKwh: fin.comparativePriceMyrKwh,

      pvCapExMyr: fin.pvCapExMyr,
      bessCapExMyr: fin.bessCapExMyr,
      gridCapExMyr: fin.gridCapExMyr,
      landCapExMyr: fin.landCapExMyr,
      landConversionCapExMyr: fin.landConversionCapExMyr,
      floodCapExMyr: fin.floodCapExMyr,
      ownerDevCapExMyr: fin.ownerDevCapExMyr,
      contingencyCapExMyr: fin.contingencyCapExMyr,
      idcCapExMyr: fin.idcCapExMyr,
      debtArrangementCapExMyr: fin.debtArrangementCapExMyr,
      bidBondCapExMyr: 0, // Excluded from CapEx sum per IV&V Defect IVV-05 (Bank Guarantee)

      maxCapacityMW: capacityMWp,
      ghiKwhM2Year: ghiYear,
      ghiKwhM2Day: ghiDay,
      estimatedAnnualMWh: annualMWh,
      estimatedLCOEMyr: fin.lcoeMyrKwh,
      estimatedIRR: fin.irrPercent,
      estimatedCapExMyr: fin.totalCapExMyr,
      interconnectionCostMyr: fin.gridCapExMyr,
      annualCarbonOffsetTonnes,
      notes: `LSS6-Hybrid 2:1:4 site located ${distanceToPMUKm} km from PMU ${pmuName} (${voltage}). Operating under RFP Part 2 §1.3(c) (Solar a.c. ≥ 2 × BESS power & ≥ 2 × Export Capacity): ${solarCapacityMWa} MWa.c. Solar (${capacityMWp} MWp d.c.) + ${bessPowerMW} MW / ${bessEnergyMWh} MWh (4-Hr BESS) exporting ${exportCapacityMWa} MWa.c. ${areaHectares < 118 ? `[Land Note: ${capacityMWp} MWp requires ~118 ha; site provides ${areaHectares} ha (${off.acres} acres), so ~${Math.round(118 - areaHectares)} ha of contiguous adjacent land must be secured].` : ''}`,
    };
  });

  // Automatically tag recommendations across candidate sites for this PMU
  let highestScoreParcel = parcels[0];
  let lowestCostParcel = parcels[0];
  let fastestParcel = parcels[0];
  let lowestRiskParcel = parcels[0];

  parcels.forEach((p) => {
    if (p.overallScore > highestScoreParcel.overallScore) highestScoreParcel = p;
    if (p.interconnectionCostMyr < lowestCostParcel.interconnectionCostMyr) lowestCostParcel = p;
    if (p.scoreOwnershipTitle + p.scorePlanningZoning > fastestParcel.scoreOwnershipTitle + fastestParcel.scorePlanningZoning) fastestParcel = p;
    if (p.distanceToPermanentForestReserveKm > lowestRiskParcel.distanceToPermanentForestReserveKm) lowestRiskParcel = p;
  });

  highestScoreParcel.isBestOverall = true;
  lowestCostParcel.isLowestCost = true;
  fastestParcel.isFastestToDevelop = true;
  lowestRiskParcel.isLowestEnvRisk = true;

  return parcels;
}

export const PMU_NODES: PMUNode[] = [
  // ==========================================
  // 132 kV NODES (38 Total)
  // ==========================================
  {
    id: '132-1',
    number: 1,
    name: 'Bakri',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 50,
    lat: 2.0512,
    lng: 102.6618,
    district: 'Muar',
    gridOwnerApproved: true,
    description: '132kV Main Intake Substation near Bakri industrial hub in Muar district.',
    landParcels: [],
  },
  {
    id: '132-2',
    number: 2,
    name: 'Bukit Siput',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.4891,
    lng: 102.8312,
    district: 'Segamat',
    gridOwnerApproved: true,
    description: 'Strategically located in Segamat with vast agricultural oil palm terrain nearby.',
    landParcels: [],
  },
  {
    id: '132-3',
    number: 3,
    name: 'Jalan Nyior',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.1523,
    lng: 103.3214,
    district: 'Kluang',
    gridOwnerApproved: true,
    description: 'Servicing central Johor grid corridor with high capacity throughput.',
    landParcels: [],
  },
  {
    id: '132-4',
    number: 4,
    name: 'Jementah',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.4381,
    lng: 102.6845,
    district: 'Segamat',
    gridOwnerApproved: true,
    description: 'Located in northern Johor near Tangkak border with abundant flat land.',
    landParcels: [],
  },
  {
    id: '132-5',
    number: 5,
    name: 'Mengkibol',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 1.9812,
    lng: 103.3421,
    district: 'Kluang',
    gridOwnerApproved: true,
    description: 'Adjacent to rail and road corridors in Kluang district.',
    landParcels: [],
  },
  {
    id: '132-6',
    number: 6,
    name: 'Parit Yusof',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 1.9511,
    lng: 102.7234,
    district: 'Batu Pahat',
    gridOwnerApproved: true,
    description: 'Coastal plain region in Muar/Batu Pahat boundary with flat agricultural topography.',
    landParcels: [],
  },
  {
    id: '132-7',
    number: 7,
    name: 'Saleng',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 1.6321,
    lng: 103.6312,
    district: 'Kulai',
    gridOwnerApproved: true,
    description: 'High demand corridor in Kulai with proximity to industrial parks.',
    landParcels: [],
  },
  {
    id: '132-8',
    number: 8,
    name: 'Seelong',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 1.6021,
    lng: 103.7312,
    district: 'Kulai / Johor Bahru',
    gridOwnerApproved: true,
    description: 'Near Senai airport logistics zone with high power stability.',
    landParcels: [],
  },
  {
    id: '132-9',
    number: 9,
    name: 'Senai Hi-Tech East',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 1.6214,
    lng: 103.6812,
    district: 'Kulai',
    gridOwnerApproved: true,
    description: 'Dedicated high-tech industrial park PMU with robust transmission capacity.',
    landParcels: [],
  },
  {
    id: '132-10',
    number: 10,
    name: 'Sg. Karang',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 1.3412,
    lng: 103.5412,
    district: 'Pontian',
    gridOwnerApproved: true,
    description: 'Southwestern Johor coastal Node with flat terrain access.',
    landParcels: [],
  },
  {
    id: '132-11',
    number: 11,
    name: 'Tg. Agas',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 50,
    lat: 2.0612,
    lng: 102.5612,
    district: 'Muar / Tangkak',
    gridOwnerApproved: true,
    description: '50MW interconnection node adjacent to Tangkak/Muar border.',
    landParcels: [],
  },
  {
    id: '132-12',
    number: 12,
    name: 'Pagoh Education Hub',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.1412,
    lng: 102.7312,
    district: 'Muar',
    gridOwnerApproved: true,
    description: 'Interconnection node serving Pagoh Special Economic Zone and university township.',
    landParcels: [],
  },
  {
    id: '132-13',
    number: 13,
    name: 'Taman Universiti',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 1.5412,
    lng: 103.6212,
    district: 'Skudai / Iskandar Puteri',
    gridOwnerApproved: true,
    description: 'Key node in Western Iskandar Malaysia urban-industrial belt.',
    landParcels: [],
  },
  {
    id: '132-14',
    number: 14,
    name: 'Kukup',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 1.3212,
    lng: 103.4512,
    district: 'Pontian',
    gridOwnerApproved: true,
    description: 'Southern Pontian node near coastal agricultural lands.',
    landParcels: [],
  },
  {
    id: '132-15',
    number: 15,
    name: 'Tanjung Laboh',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 1.7812,
    lng: 102.9512,
    district: 'Batu Pahat',
    gridOwnerApproved: true,
    description: 'Coastal node south of Batu Pahat town with flat topography.',
    landParcels: [],
  },
  {
    id: '132-16',
    number: 16,
    name: 'Pasak',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 1.7212,
    lng: 103.8812,
    district: 'Kota Tinggi',
    gridOwnerApproved: true,
    description: 'Kota Tinggi eastern sub-region node surrounded by large oil palm estates.',
    landParcels: [],
  },
  {
    id: '132-17',
    number: 17,
    name: 'LILO Tanjung Gemok - Mersing',
    state: 'Johor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.4212,
    lng: 103.8312,
    district: 'Mersing',
    gridOwnerApproved: true,
    description: 'Line-In-Line-Out (LILO) node on the Mersing coastal transmission line.',
    landParcels: [],
  },
  {
    id: '132-18',
    number: 18,
    name: 'Mergong',
    state: 'Johor' as any, // Fixed in mapping to Kedah
    stateReal: 'Kedah',
    voltage: '132kV',
    capacityMW: 100,
    lat: 6.1312,
    lng: 100.3512,
    district: 'Kota Setar',
    gridOwnerApproved: true,
    description: 'Primary node near Alor Setar with flat paddy land and high solar GHI (>1,850 kWh/m²/yr).',
    landParcels: [],
  } as any,
  {
    id: '132-19',
    number: 19,
    name: 'Kedah Rubber City**',
    state: 'Kedah',
    voltage: '132kV',
    capacityMW: 100,
    isPendingApplication: true,
    lat: 6.2212,
    lng: 100.5812,
    district: 'Padang Terap',
    gridOwnerApproved: false,
    description: 'Located in Padang Terap border economic zone. **Subject to pending applications in queue.',
    landParcels: [],
  },
  {
    id: '132-20',
    number: 20,
    name: 'Rantau Panjang',
    state: 'Kelantan',
    voltage: '132kV',
    capacityMW: 100,
    lat: 6.0212,
    lng: 101.9712,
    district: 'Pasir Mas',
    gridOwnerApproved: true,
    description: 'Northern Kelantan border node with high annual solar yield.',
    landParcels: [],
  },
  {
    id: '132-21',
    number: 21,
    name: 'Tunjung',
    state: 'Kelantan',
    voltage: '132kV',
    capacityMW: 100,
    lat: 6.0712,
    lng: 102.2412,
    district: 'Kota Bharu',
    gridOwnerApproved: true,
    description: 'Central Kelantan regional hub node with ample surrounding agricultural land.',
    landParcels: [],
  },
  {
    id: '132-22',
    number: 22,
    name: 'A Famosa',
    state: 'Melaka',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.4412,
    lng: 102.2112,
    district: 'Alor Gajah',
    gridOwnerApproved: true,
    description: 'Northern Melaka interconnection node with excellent road and grid access.',
    landParcels: [],
  },
  {
    id: '132-23',
    number: 23,
    name: 'Metacorp',
    state: 'Melaka',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.2712,
    lng: 102.2812,
    district: 'Melaka Tengah',
    gridOwnerApproved: true,
    description: 'Melaka central industrial transmission node.',
    landParcels: [],
  },
  {
    id: '132-24',
    number: 24,
    name: 'Sg. Rambai',
    state: 'Melaka',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.1212,
    lng: 102.4912,
    district: 'Jasin',
    gridOwnerApproved: true,
    description: 'Southern Melaka border node facing Muar with flat topography.',
    landParcels: [],
  },
  {
    id: '132-25',
    number: 25,
    name: 'Bahau',
    state: 'N. Sembilan',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.8012,
    lng: 102.4112,
    district: 'Jempol',
    gridOwnerApproved: true,
    description: 'Jempol district node surrounded by extensive oil palm plantations.',
    landParcels: [],
  },
  {
    id: '132-26',
    number: 26,
    name: 'Kg. Rupah',
    state: 'N. Sembilan',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.5812,
    lng: 102.3912,
    district: 'Kuala Pilah',
    gridOwnerApproved: true,
    description: 'Kuala Pilah sub-region node with gentle valley terrain.',
    landParcels: [],
  },
  {
    id: '132-27',
    number: 27,
    name: 'Pajam',
    state: 'N. Sembilan',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.8412,
    lng: 101.8412,
    district: 'Seremban',
    gridOwnerApproved: true,
    description: 'Northern Negeri Sembilan node near Nilai solar belt.',
    landParcels: [],
  },
  {
    id: '132-28',
    number: 28,
    name: 'Jambu Rias',
    state: 'Pahang',
    voltage: '132kV',
    capacityMW: 100,
    lat: 3.4812,
    lng: 102.1012,
    district: 'Karak / Bentong',
    gridOwnerApproved: true,
    description: 'Western Pahang transmission node with proximity to East Coast highway.',
    landParcels: [],
  },
  {
    id: '132-29',
    number: 29,
    name: 'LILO Kerayong - Kg. Awah',
    state: 'Pahang',
    voltage: '132kV',
    capacityMW: 100,
    lat: 3.3912,
    lng: 102.3812,
    district: 'Maran',
    gridOwnerApproved: true,
    description: 'LILO node along central Pahang 132kV power corridor.',
    landParcels: [],
  },
  {
    id: '132-30',
    number: 30,
    name: 'Kelebang',
    state: 'Perak',
    voltage: '132kV',
    capacityMW: 100,
    lat: 4.6612,
    lng: 101.1012,
    district: 'Ipoh / Kinta',
    gridOwnerApproved: true,
    description: 'Northern Ipoh industrial zone PMU with former tin mining flatlands nearby.',
    landParcels: [],
  },
  {
    id: '132-31',
    number: 31,
    name: 'Meru Raya',
    state: 'Perak',
    voltage: '132kV',
    capacityMW: 100,
    lat: 4.6712,
    lng: 101.0712,
    district: 'Kinta',
    gridOwnerApproved: true,
    description: 'Bandar Meru Raya high-growth development corridor PMU.',
    landParcels: [],
  },
  {
    id: '132-32',
    number: 32,
    name: 'Proton City**',
    state: 'Perak',
    voltage: '132kV',
    capacityMW: 100,
    isPendingApplication: true,
    lat: 3.7512,
    lng: 101.5412,
    district: 'Muallim / Tanjung Malim',
    gridOwnerApproved: false,
    description: 'Automotive industrial hub in Tanjung Malim. **Subject to pending applications in queue.',
    landParcels: [],
  },
  {
    id: '132-33',
    number: 33,
    name: 'Simpang Ampat East',
    state: 'P. Pinang',
    voltage: '132kV',
    capacityMW: 100,
    lat: 5.2812,
    lng: 100.4812,
    district: 'Seberang Perai Selatan',
    gridOwnerApproved: true,
    description: 'Mainland Penang southern corridor node with flat industrial hinterland.',
    landParcels: [],
  },
  {
    id: '132-34',
    number: 34,
    name: 'Bandar Botanic',
    state: 'Selangor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.9912,
    lng: 101.4412,
    district: 'Klang',
    gridOwnerApproved: true,
    description: 'Klang southern zone PMU with flat coastal alluvial soils.',
    landParcels: [],
  },
  {
    id: '132-35',
    number: 35,
    name: 'Sungai Besar',
    state: 'Selangor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 3.6712,
    lng: 100.9812,
    district: 'Sabak Bernam',
    gridOwnerApproved: true,
    description: 'Northern Selangor agricultural belt node with vast flat terrain.',
    landParcels: [],
  },
  {
    id: '132-36',
    number: 36,
    name: 'Teluk Panglima Garang',
    state: 'Selangor',
    voltage: '132kV',
    capacityMW: 100,
    lat: 2.9112,
    lng: 101.4612,
    district: 'Kuala Langat',
    gridOwnerApproved: true,
    description: 'Kuala Langat industrial-agricultural transition node.',
    landParcels: [],
  },
  {
    id: '132-37',
    number: 37,
    name: 'Ulu Yam**',
    state: 'Selangor',
    voltage: '132kV',
    capacityMW: 50,
    isPendingApplication: true,
    lat: 3.4312,
    lng: 101.6512,
    district: 'Hulu Selangor',
    gridOwnerApproved: false,
    description: 'Hulu Selangor sub-station. **Subject to pending applications in queue.',
    landParcels: [],
  },
  {
    id: '132-38',
    number: 38,
    name: 'Chukai',
    state: 'Terengganu',
    voltage: '132kV',
    capacityMW: 100,
    lat: 4.2312,
    lng: 103.4212,
    district: 'Kemaman',
    gridOwnerApproved: true,
    description: 'Kemaman industrial corridor node in southern Terengganu.',
    landParcels: [],
  },

  // ==========================================
  // 275 kV NODES (10 Total)
  // ==========================================
  {
    id: '275-1',
    number: 1,
    name: 'Sg. Mati',
    state: 'Johor',
    voltage: '275kV',
    capacityMW: 250,
    lat: 2.1412,
    lng: 102.5612,
    district: 'Tangkak',
    gridOwnerApproved: true,
    description: '275kV High Voltage transmission backbone node in Tangkak / North Johor.',
    landParcels: [],
  },
  {
    id: '275-2',
    number: 2,
    name: 'LILO Yong Peng North - Bukit Batu',
    state: 'Johor',
    voltage: '275kV',
    capacityMW: 250,
    lat: 2.0112,
    lng: 103.0612,
    district: 'Batu Pahat / Yong Peng',
    gridOwnerApproved: true,
    description: '275kV LILO Node connecting central Johor backbone to Bukit Batu grid.',
    landParcels: [],
  },
  {
    id: '275-3',
    number: 3,
    name: 'LILO Sedenak - Bukit Batu',
    state: 'Johor',
    voltage: '275kV',
    capacityMW: 250,
    lat: 1.7112,
    lng: 103.5212,
    district: 'Kulai',
    gridOwnerApproved: true,
    description: 'High capacity 275kV LILO node serving Sedenak tech park and surrounding land.',
    landParcels: [],
  },
  {
    id: '275-4',
    number: 4,
    name: 'LILO Skudai - Gelang Patah',
    state: 'Johor',
    voltage: '275kV',
    capacityMW: 250,
    lat: 1.4812,
    lng: 103.5812,
    district: 'Iskandar Puteri',
    gridOwnerApproved: true,
    description: '275kV strategic node serving western Iskandar economic zone.',
    landParcels: [],
  },
  {
    id: '275-5',
    number: 5,
    name: 'Batu Pahat East - Yong Peng North/Bukit Batu (DC LILO)',
    state: 'Johor',
    voltage: '275kV',
    capacityMW: 250,
    lat: 1.8712,
    lng: 102.9812,
    district: 'Batu Pahat',
    gridOwnerApproved: true,
    description: 'Double-Circuit LILO 275kV Node providing 250MW export capacity.',
    landParcels: [],
  },
  {
    id: '275-6',
    number: 6,
    name: 'Bedong',
    state: 'Kedah',
    voltage: '275kV',
    capacityMW: 250,
    lat: 5.7212,
    lng: 100.5112,
    district: 'Kuala Muda',
    gridOwnerApproved: true,
    description: 'Major 275kV hub in Central Kedah with exceptional solar radiation (>1,880 kWh/m²/yr).',
    landParcels: [],
  },
  {
    id: '275-7',
    number: 7,
    name: 'Kelemak',
    state: 'Melaka',
    voltage: '275kV',
    capacityMW: 250,
    lat: 2.3812,
    lng: 102.2312,
    district: 'Alor Gajah',
    gridOwnerApproved: true,
    description: 'Primary 275kV transmission hub for Melaka state with 250MW capacity.',
    landParcels: [],
  },
  {
    id: '275-8',
    number: 8,
    name: 'Bentong South',
    state: 'Pahang',
    voltage: '275kV',
    capacityMW: 250,
    lat: 3.4812,
    lng: 101.9012,
    district: 'Bentong',
    gridOwnerApproved: true,
    description: '275kV gateway node connecting East Coast grid to Central Region.',
    landParcels: [],
  },
  {
    id: '275-9',
    number: 9,
    name: 'Batu Gajah',
    state: 'Perak',
    voltage: '275kV',
    capacityMW: 250,
    lat: 4.4712,
    lng: 101.0312,
    district: 'Kinta',
    gridOwnerApproved: true,
    description: '275kV heavy industry & former mining land node with vast unutilized flat sites.',
    landParcels: [],
  },
  {
    id: '275-10',
    number: 10,
    name: 'Chuping',
    state: 'Perlis',
    voltage: '275kV',
    capacityMW: 200,
    lat: 6.4912,
    lng: 100.3212,
    district: 'Padang Besar / Chuping',
    gridOwnerApproved: true,
    description: 'Northernmost 275kV Node in Perlis Valley with highest solar irradiance in Peninsular Malaysia (>1,950 kWh/m²/yr).',
    landParcels: [],
  },
];

// Populate candidate land parcels for each node dynamically
PMU_NODES.forEach((node) => {
  // Correct Mergong state if needed
  if (node.id === '132-18') {
    node.state = 'Kedah';
  }
  node.landParcels = generateLandParcelsForNode(
    node.id,
    node.name,
    node.state,
    node.lat,
    node.lng,
    node.capacityMW,
    node.voltage,
    node.district
  );

  // Compute current load MW, available headroom MW & capacity utilization percentage
  const primaryLandMW = node.landParcels[0]?.exportCapacityMWa || 0;
  const loadFactor = 0.52 + ((node.number * 13) % 36) / 100; // Realistic load between 52% and 87%
  const currentLoad = Math.min(node.capacityMW, Math.max(primaryLandMW, Math.round(node.capacityMW * loadFactor * 10) / 10));
  node.currentLoadMW = currentLoad;
  node.availableHeadroomMW = Math.max(0, Math.round((node.capacityMW - currentLoad) * 10) / 10);
  node.capacityUtilizationPct = Math.min(100, Math.round((currentLoad / node.capacityMW) * 100));
});
