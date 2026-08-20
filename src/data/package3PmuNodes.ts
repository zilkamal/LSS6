import { PMUNode, LandParcel, StateName, VoltageLevel } from '../types';
import {
  calculateHaversineDistanceKm,
  estimateCableRouteKm,
  getEstimatedSolarGHI,
  calculatePackage3SolarFinancials,
  generateMonthlyIrradianceAndYield,
} from '../utils/geoUtils';

/**
 * Generates polygon boundary vertices around a central lat/lng coordinate based on parcel area
 */
function createPolygonVertices(centerLat: number, centerLng: number, areaAcres: number): { lat: number; lng: number }[] {
  const delta = Math.sqrt(areaAcres / 60) * 0.0028;
  return [
    { lat: Math.round((centerLat + delta * 0.85) * 10000) / 10000, lng: Math.round((centerLng - delta * 1.05) * 10000) / 10000 },
    { lat: Math.round((centerLat + delta * 1.05) * 10000) / 10000, lng: Math.round((centerLng + delta * 0.85) * 10000) / 10000 },
    { lat: Math.round((centerLat - delta * 0.85) * 10000) / 10000, lng: Math.round((centerLng + delta * 1.15) * 10000) / 10000 },
    { lat: Math.round((centerLat - delta * 0.95) * 10000) / 10000, lng: Math.round((centerLng - delta * 0.85) * 10000) / 10000 },
  ];
}

/**
 * Calculates JPS DID flood history and hydrological assessment profile for Package 3 candidate land parcels
 */
function getFloodAndHydrologicalProfile(state: StateName, idx: number) {
  const catchmentMap: Record<string, string> = {
    Kedah: 'Sungai Muda & Sg Kedah River Basin (JPS Station #5804001)',
    Kelantan: 'Sungai Kelantan Basin (JPS Station #5821002 - Tangga Krai)',
    Johor: 'Sungai Johor & Sg Tebrau Drainage Sub-basin (JPS Station #1836001)',
    'Kuala Lumpur': 'Sungai Klang & Sg Batu Urban Drainage Catchment (JPS Station #3117001)',
    Putrajaya: 'Sungai Langat & Sg Chuau Basin (JPS Station #2917001)',
    Melaka: 'Sungai Melaka & Sg Duyong Basin (JPS Station #2222001)',
    'N. Sembilan': 'Sungai Linggi Basin (JPS Station #2619001)',
    Pahang: 'Sungai Kuantan & Sg Pahang Basin (JPS Station #3833001)',
    Perak: 'Sungai Kinta & Sg Perak Basin (JPS Station #4511001)',
    Perlis: 'Sungai Perlis Basin (JPS Station #6402001)',
    'P. Pinang': 'Sungai Juru & Sg Perai Catchment (JPS Station #5304001)',
    Selangor: 'Sungai Klang & Sg Langat Basin (JPS Station #3115001)',
    Terengganu: 'Sungai Terengganu Basin (JPS Station #5130001)',
  };

  const didRiverCatchment = catchmentMap[state] || 'Peninsular River Catchment Basin';
  const isUrban = state === 'Kuala Lumpur' || state === 'Putrajaya';

  if (idx === 0) {
    return {
      floodRiskLevel: 'Low Hazard Zone (<0.3m)' as const,
      ariFloodLevel50Yr: isUrban ? 0.20 : 0.25,
      didRiverCatchment,
      historicalFloodEvents: [
        {
          year: 2021,
          eventName: 'Dec 2021 Peninsular Monsoon Inundation',
          depthMeters: isUrban ? 0.25 : 0.30,
          durationDays: 1,
          impactSummary: 'Peripheral drainage overflow; candidate site elevated on natural plateau above flood level.',
        },
        {
          year: 2024,
          eventName: 'Nov 2024 Heavy Precipitation Event',
          depthMeters: 0.1,
          durationDays: 0.5,
          impactSummary: 'Localized surface runoff cleared within 8 hours. No asset risk.',
        },
      ],
      submergenceRiskScore: isUrban ? 92 : 94,
      recommendedPileElevationMeters: 1.2,
      floodMitigationCapExMyr: 0.35,
      drainageMasterPlanRequirement: 'Standard JPS MSMA Guideline: Perimeter earth swale & on-site detention (OSD) pond.',
      floodRisk: 'Low' as const,
    };
  } else if (idx === 1) {
    return {
      floodRiskLevel: 'Moderate Hazard Zone (0.3m - 0.8m)' as const,
      ariFloodLevel50Yr: 0.55,
      didRiverCatchment,
      historicalFloodEvents: [
        {
          year: 2014,
          eventName: 'Dec 2014 Monsoon Flood Season',
          depthMeters: 0.6,
          durationDays: 3,
          impactSummary: 'Seasonal river buffer overflow. Requires elevated mounting structures (+1.8m AGL).',
        },
      ],
      submergenceRiskScore: 80,
      recommendedPileElevationMeters: 1.8,
      floodMitigationCapExMyr: 0.75,
      drainageMasterPlanRequirement: 'Enhanced JPS MSMA: Peripheral bunding & dedicated dual discharge culverts.',
      floodRisk: 'Moderate' as const,
    };
  } else {
    return {
      floodRiskLevel: 'Low Hazard Zone (<0.3m)' as const,
      ariFloodLevel50Yr: 0.18,
      didRiverCatchment,
      historicalFloodEvents: [
        {
          year: 2021,
          eventName: 'Dec 2021 Flash Storm Runoff',
          depthMeters: 0.15,
          durationDays: 0.5,
          impactSummary: 'Rapid sheet runoff drained safely through roadside reserve.',
        },
      ],
      submergenceRiskScore: 95,
      recommendedPileElevationMeters: 1.1,
      floodMitigationCapExMyr: 0.25,
      drainageMasterPlanRequirement: 'Standard JPS MSMA: Perimeter drainage channel connecting to existing culvert.',
      floodRisk: 'Low' as const,
    };
  }
}

/**
 * Generates candidate land parcels with cadastral, solar yield, flood, and financial models for Package 3 (33kV)
 */
function generatePackage3CandidateLandParcels(
  pmuId: string,
  pmuName: string,
  state: StateName,
  districtName: string,
  pmuLat: number,
  pmuLng: number
): LandParcel[] {
  const configs = [
    {
      idSuffix: 'plot-a',
      name: `${pmuName} Prime Solar Plot A`,
      lotNumber: 'Lot 1042 / Geran 45891',
      mukim: `Mukim ${districtName}`,
      areaAcres: 65,
      distanceKm: 2.1,
      bearingOffset: 45,
      ownershipType: 'Unverified - Potential Plantation / Agri Land',
      landCostPerAcre: 48000,
      exportCapacityMWa: 20,
    },
    {
      idSuffix: 'plot-b',
      name: `${pmuName} Industrial Buffer Plot B`,
      lotNumber: 'Lot 2871 / Geran 91043',
      mukim: `Mukim ${districtName}`,
      areaAcres: 80,
      distanceKm: 3.4,
      bearingOffset: 160,
      ownershipType: 'Unverified - Potential State Land (Perbadanan Negeri)',
      landCostPerAcre: 52000,
      exportCapacityMWa: 25,
    },
    {
      idSuffix: 'plot-c',
      name: `${pmuName} Contiguous Agri Plot C`,
      lotNumber: 'Lot 3105 / HSM 12844',
      mukim: `Mukim ${districtName}`,
      areaAcres: 100,
      distanceKm: 4.8,
      bearingOffset: 280,
      ownershipType: 'Unverified - Potential Private Land',
      landCostPerAcre: 42000,
      exportCapacityMWa: 30,
    },
  ];

  const parcels: LandParcel[] = configs.map((cfg, idx) => {
    const rad = (cfg.bearingOffset * Math.PI) / 180;
    const distDeg = cfg.distanceKm / 111.32;
    const parcelLat = Math.round((pmuLat + distDeg * Math.cos(rad)) * 10000) / 10000;
    const parcelLng = Math.round((pmuLng + (distDeg * Math.sin(rad)) / Math.cos((pmuLat * Math.PI) / 180)) * 10000) / 10000;

    const distanceToPMUKm = calculateHaversineDistanceKm(parcelLat, parcelLng, pmuLat, pmuLng);
    const estimatedCableLengthKm = estimateCableRouteKm(distanceToPMUKm);
    const { ghiYear, ghiDay } = getEstimatedSolarGHI(parcelLat, state);

    const exportCapacityMWa = cfg.exportCapacityMWa;
    const capacityMWp = Math.round(exportCapacityMWa * 1.25 * 10) / 10;
    const annualMWh = Math.round(capacityMWp * 1450);
    const monthlyData = generateMonthlyIrradianceAndYield(ghiYear, capacityMWp, annualMWh);

    const landCostPerAcre = cfg.landCostPerAcre;
    const totalLandAcquisitionCostMyr = Math.round(((cfg.areaAcres * landCostPerAcre) / 1000000) * 100) / 100;
    const floodProfile = getFloodAndHydrologicalProfile(state, idx);

    const fin = calculatePackage3SolarFinancials(
      exportCapacityMWa,
      estimatedCableLengthKm,
      '33kV',
      annualMWh,
      totalLandAcquisitionCostMyr,
      floodProfile.floodMitigationCapExMyr
    );

    const scoreDistancePMU = Math.max(50, Math.round(100 - distanceToPMUKm * 8));
    const scoreLandSize = cfg.areaAcres >= 60 ? 95 : 80;
    const scoreTerrainSlope = idx === 0 ? 95 : idx === 1 ? 90 : 88;
    const scoreEnvConstraints = floodProfile.submergenceRiskScore;
    const scoreRoadAccess = 92;
    const scoreOwnershipTitle = 88;
    const scorePlanningZoning = 90;

    const overallScore = Math.round(
      scoreDistancePMU * 0.3 +
        scoreLandSize * 0.2 +
        scoreTerrainSlope * 0.15 +
        scoreEnvConstraints * 0.15 +
        scoreRoadAccess * 0.1 +
        scoreOwnershipTitle * 0.05 +
        scorePlanningZoning * 0.05
    );

    const capacityFactorYear1 = Math.round(((annualMWh / (capacityMWp * 8760)) * 100) * 10) / 10;
    const capacityFactorYear21 = Math.round((capacityFactorYear1 * Math.pow(1 - 0.0045, 20)) * 10) / 10;
    const isUrban = state === 'Kuala Lumpur' || state === 'Putrajaya';

    return {
      id: `${pmuId}-${cfg.idSuffix}`,
      pmuId,
      name: cfg.name,
      lotNumber: cfg.lotNumber,
      mukim: cfg.mukim,
      district: districtName,
      state,
      gpsPolygon: createPolygonVertices(parcelLat, parcelLng, cfg.areaAcres),
      lat: parcelLat,
      lng: parcelLng,
      areaAcres: cfg.areaAcres,
      areaHectares: Math.round((cfg.areaAcres / 2.47105) * 10) / 10,
      ownershipType: cfg.ownershipType,
      landTitleType: (idx === 0 ? 'Freehold' : idx === 1 ? 'Malay Reserve / Leasehold' : 'Leasehold') as any,
      remainingLeaseYears: 99,
      currentLandUse: isUrban ? 'Commercial / Industrial Buffer' : 'Oil Palm Plantation (Agri)',
      titleTenure: 'Freehold (Pegangan Bebas)',
      categoryOfLandUse: isUrban ? 'Industrial Buffer Zone' : 'Agricultural (Oil Palm)',
      expressConditions: 'Syarat Nyata: Penjanaan Tenaga Solar Berskala Besar (LSS) & Kemudahan Grid 33kV',
      restrictionsInInterest: 'Sekatan Kepentingan: Tanah ini tidak boleh dipindahmilik tanpa kebenaran Pihak Berkuasa Negeri',
      encumbranceStatus: 'Bebanan: Tiada Kaveat / Bebas Gadaian',
      ndviVegetationIndex: isUrban ? 0.25 : 0.65,
      existingBuildingsCount: isUrban ? 2 : 0,
      distanceToFederalRoadKm: 0.5 + idx * 0.4,
      distanceToWaterwayKm: 1.2 + idx * 0.6,
      aspectDirection: 'Flat / Optimal South Orientation',
      distanceToResidentialZoneKm: isUrban ? 1.5 : 3.8,
      distanceToCommercialZoneKm: isUrban ? 1.2 : 4.5,
      distanceToIndustrialZoneKm: isUrban ? 0.8 : 2.5,
      isResidentialExcluded: false,
      isCommercialExcluded: false,
      isIndustrialExcluded: false,
      isSuitableForSolarFarm: true,
      elevationDEM: isUrban ? 45 : 35 + idx * 8,
      terrainSlope: idx === 0 ? 1.8 : 2.5,
      terrainCategory: 'Flat (<3°)',
      isSteepTerrainExcluded: false,
      ...floodProfile,
      distanceToPMUKm,
      estimatedCableLengthKm,
      distanceToTransmissionLineKm: Math.round(distanceToPMUKm * 0.6 * 10) / 10,
      distanceToAccessRoadKm: 0.3 + idx * 0.2,
      distanceToPermanentForestReserveKm: isUrban ? 4.5 : 8.2 + idx * 2,
      isPermanentForestReserveOverlay: false,
      isNationalParkRamsarBuffer: false,
      isWaterCatchmentZone: false,
      eiaCategory: 'Category 2: Preliminary EIA',
      localPlanZoning: `Rancangan Tempatan Daerah (RTD) ${districtName} - Zon Tenaga & Pertanian`,
      zoningCompatibility: 'Fully Compatible (Permitted)',
      scoreDistancePMU,
      scoreLandSize,
      scoreTerrainSlope,
      scoreEnvConstraints,
      scoreRoadAccess,
      scoreOwnershipTitle,
      scorePlanningZoning,
      overallScore,
      isBestOverall: idx === 0,
      isLowestCost: idx === 0,
      isFastestToDevelop: idx === 0,
      isLowestEnvRisk: idx === 0,
      isLargestContiguous: idx === 2,
      packageSuitability: 'Package 3 (Export 10-30 MWa.c. Solar Only)',
      estimatedLandCostPerAcreMyr: landCostPerAcre,
      estimatedTotalLandAcquisitionCostMyr: totalLandAcquisitionCostMyr,
      landAcquisitionType: 'Long-Term 30-Year Lease',
      performanceRatioPercent: 83.5,
      p50AnnualMWh: monthlyData.p50AnnualMWh,
      p90AnnualMWh: monthlyData.p90AnnualMWh,
      monthlyIrradianceData: monthlyData.monthlyIrradianceData,
      exportCapacityMWa,
      solarCapacityMWa: exportCapacityMWa,
      capacityMWp,
      bessPowerMW: 0,
      bessEnergyMWh: 0,
      capacityFactorYear1,
      capacityFactorYear21,
      clearsCapacityFactorFloor: capacityFactorYear21 >= 16.0,
      bidBondMyr: 0.35, // RM 350,000.00 bank guarantee as per latest RFP Part 1 Section 24.1 & Appendix C1
      bidPriceMyrKwh: fin.bidPriceMyrKwh,
      comparativePriceMyrKwh: fin.comparativePriceMyrKwh,
      pvCapExMyr: fin.pvCapExMyr,
      bessCapExMyr: 0,
      gridCapExMyr: fin.gridCapExMyr,
      landCapExMyr: fin.landCapExMyr,
      landConversionCapExMyr: fin.landConversionCapExMyr,
      floodCapExMyr: fin.floodCapExMyr,
      ownerDevCapExMyr: fin.ownerDevCapExMyr,
      contingencyCapExMyr: fin.contingencyCapExMyr,
      idcCapExMyr: fin.idcCapExMyr,
      debtArrangementCapExMyr: fin.debtArrangementCapExMyr,
      bidBondCapExMyr: 0,
      maxCapacityMW: capacityMWp,
      ghiKwhM2Year: ghiYear,
      ghiKwhM2Day: ghiDay,
      estimatedAnnualMWh: annualMWh,
      estimatedLCOEMyr: fin.lcoeMyrKwh,
      estimatedIRR: fin.irrPercent,
      estimatedCapExMyr: fin.totalCapExMyr,
      interconnectionCostMyr: fin.gridCapExMyr,
      annualCarbonOffsetTonnes: Math.round(annualMWh * 0.68),
      notes: `LSS6-Solar Package 3 (Bumiputera Solar RFP) candidate site located ${distanceToPMUKm} km from PMU ${pmuName} (33kV). Designed for 10–30 MWa.c. Solar-Only grid connection at 33kV distribution level with ≥60% Bumiputera equity ownership requirement.`,
    };
  });

  return parcels;
}

/**
 * ALL 152 OFFICIAL DESIGNATED PMU NODAL POINTS FOR PACKAGE 3 (LSS6-Solar Bumiputera RFP)
 * As published in Suruhanjaya Tenaga RFP LSS6-Solar Section 2.0 Interconnection and Nodal Points (Pages 29, 30, 31 & 32)
 * Interconnection: 33kV and below | Quota: 150 MWa.c. | Requirement: ≥60% Bumiputera Equity
 */
export const PMU_NODES_PACKAGE_3: PMUNode[] = [
  // ==========================================
  // JOHOR (No. 1 to 22)
  // ==========================================
  { id: 'pkg3-1', number: 1, name: 'Batu Pahat East', state: 'Johor', voltage: '33kV', capacityMW: 30, lat: 1.8548, lng: 102.9325, district: 'Batu Pahat', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #1 in Batu Pahat district for LSS6-Solar Package 3 (Bumiputera).', landParcels: [] },
  { id: 'pkg3-2', number: 2, name: 'Cahaya Baru', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 1.5034, lng: 103.9512, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #2 in eastern Johor Bahru corridor for LSS6-Solar Package 3.', landParcels: [] },
  { id: 'pkg3-3', number: 3, name: 'Tampoi Industri', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.4988, lng: 103.7024, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #3 in Tampoi industrial precinct for LSS6-Solar Package 3.', landParcels: [] },
  { id: 'pkg3-4', number: 4, name: 'Senai H-Tech East', state: 'Johor', voltage: '33kV', capacityMW: 30, lat: 1.6023, lng: 103.6510, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #4 in Senai High-Tech corridor for LSS6-Solar Package 3.', landParcels: [] },
  { id: 'pkg3-5', number: 5, name: 'Tanjung Langsat', state: 'Johor', voltage: '33kV', capacityMW: 30, lat: 1.4623, lng: 104.0125, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #5 in Tanjung Langsat heavy industrial & energy hub.', landParcels: [] },
  { id: 'pkg3-6', number: 6, name: 'Permas Jaya', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.5012, lng: 103.8156, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #6 in Permas Jaya for LSS6-Solar Package 3.', landParcels: [] },
  { id: 'pkg3-7', number: 7, name: 'Ulu Tiram', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 1.6002, lng: 103.8201, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #7 in Ulu Tiram agricultural & growth corridor.', landParcels: [] },
  { id: 'pkg3-8', number: 8, name: 'JBCC', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.4628, lng: 103.7634, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #8 in Johor Bahru City Centre grid zone.', landParcels: [] },
  { id: 'pkg3-9', number: 9, name: 'Pelangi Indah', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 1.5645, lng: 103.7923, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #9 in Pelangi Indah northern Johor Bahru sector.', landParcels: [] },
  { id: 'pkg3-10', number: 10, name: 'Perling', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.4889, lng: 103.6821, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #10 in Perling urban periphery for Package 3.', landParcels: [] },
  { id: 'pkg3-11', number: 11, name: 'Tanjung Kupang', state: 'Johor', voltage: '33kV', capacityMW: 30, lat: 1.3654, lng: 103.5892, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #11 in Tanjung Kupang / Gelang Patah coastal zone.', landParcels: [] },
  { id: 'pkg3-12', number: 12, name: 'Financial Center', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.4682, lng: 103.7589, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #12 in JB Financial Center zone for Package 3.', landParcels: [] },
  { id: 'pkg3-13', number: 13, name: 'Pasir Gudang Town Centre', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 1.4721, lng: 103.9045, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #13 in Pasir Gudang industrial municipality.', landParcels: [] },
  { id: 'pkg3-14', number: 14, name: 'South Key', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.4923, lng: 103.7745, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #14 in South Key central Johor Bahru.', landParcels: [] },
  { id: 'pkg3-15', number: 15, name: 'Skudai', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 1.5342, lng: 103.6589, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #15 in Skudai university corridor for Package 3.', landParcels: [] },
  { id: 'pkg3-16', number: 16, name: 'Tebrau 33kV', state: 'Johor', voltage: '33kV', capacityMW: 30, lat: 1.5289, lng: 103.7654, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #16 in Tebrau Industrial Estate for Package 3.', landParcels: [] },
  { id: 'pkg3-17', number: 17, name: 'Pasak', state: 'Johor', voltage: '33kV', capacityMW: 30, lat: 1.7321, lng: 103.9012, district: 'Kota Tinggi', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #17 in Kota Tinggi plantation district for Package 3.', landParcels: [] },
  { id: 'pkg3-18', number: 18, name: 'Sedenak', state: 'Johor', voltage: '33kV', capacityMW: 30, lat: 1.7123, lng: 103.5345, district: 'Kulai', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #18 in Kulai / Sedenak growth valley for Package 3.', landParcels: [] },
  { id: 'pkg3-19', number: 19, name: 'Senai', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 1.5982, lng: 103.6421, district: 'Kulai', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #19 in Senai industrial zone for Package 3.', landParcels: [] },
  { id: 'pkg3-20', number: 20, name: 'Sungai Abong', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 2.0623, lng: 102.5892, district: 'Muar', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #20 in Sungai Abong, Muar district for Package 3.', landParcels: [] },
  { id: 'pkg3-21', number: 21, name: 'Pontian', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 1.4982, lng: 103.3892, district: 'Pontian', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #21 in coastal Pontian district for Package 3.', landParcels: [] },
  { id: 'pkg3-22', number: 22, name: 'Bukit Siput', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 2.4823, lng: 102.8345, district: 'Segamat', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #22 in Segamat northern agricultural belt for Package 3.', landParcels: [] },

  // ==========================================
  // KEDAH (No. 23 to 31)
  // ==========================================
  { id: 'pkg3-23', number: 23, name: 'Kota Setar', state: 'Kedah', voltage: '33kV', capacityMW: 25, lat: 6.1245, lng: 100.3689, district: 'Kota Setar', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #23 in Kota Setar district for LSS6-Solar Package 3.', landParcels: [] },
  { id: 'pkg3-24', number: 24, name: 'A.Setar GIS', state: 'Kedah', voltage: '33kV', capacityMW: 25, lat: 6.1189, lng: 100.3721, district: 'Kota Setar', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #24 Gas Insulated Switchgear substation in Alor Setar.', landParcels: [] },
  { id: 'pkg3-25', number: 25, name: 'Mergong', state: 'Kedah', voltage: '33kV', capacityMW: 30, lat: 6.1389, lng: 100.3512, district: 'Kota Setar', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #25 in Mergong industrial estate (Dual-listed: 132kV Hybrid & 33kV Solar).', landParcels: [] },
  { id: 'pkg3-26', number: 26, name: 'Amanjaya', state: 'Kedah', voltage: '33kV', capacityMW: 30, lat: 5.6892, lng: 100.5212, district: 'Kuala Muda', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #26 in Amanjaya / Sungai Petani northern growth hub.', landParcels: [] },
  { id: 'pkg3-27', number: 27, name: 'Tikam Batu', state: 'Kedah', voltage: '33kV', capacityMW: 30, lat: 5.5892, lng: 100.4423, district: 'Kuala Muda', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #27 confirmed specifically for Package 3 (Kuala Muda, Kedah).', landParcels: [] },
  { id: 'pkg3-28', number: 28, name: 'Tanjung Pauh', state: 'Kedah', voltage: '33kV', capacityMW: 25, lat: 6.2892, lng: 100.4212, district: 'Kubang Pasu', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #28 in Kubang Pasu agricultural flatlands.', landParcels: [] },
  { id: 'pkg3-29', number: 29, name: 'Bukit Kayu Hitam', state: 'Kedah', voltage: '33kV', capacityMW: 30, lat: 6.5189, lng: 100.4212, district: 'Kubang Pasu', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #29 near Bukit Kayu Hitam border economic zone.', landParcels: [] },
  { id: 'pkg3-30', number: 30, name: 'Guthrie', state: 'Kedah', voltage: '33kV', capacityMW: 30, lat: 5.3645, lng: 100.5589, district: 'Kulim', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #30 confirmed specifically for Package 3 in Kulim, Kedah (near Kulim Hi-Tech).', landParcels: [] },
  { id: 'pkg3-31', number: 31, name: 'Teluk Ewa', state: 'Kedah', voltage: '33kV', capacityMW: 20, lat: 6.4212, lng: 99.7612, district: 'Langkawi', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #31 on Langkawi Island for Package 3.', landParcels: [] },

  // ==========================================
  // KELANTAN (No. 32 to 35)
  // ==========================================
  { id: 'pkg3-32', number: 32, name: 'Kandis', state: 'Kelantan', voltage: '33kV', capacityMW: 25, lat: 5.9892, lng: 102.3892, district: 'Bachok', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #32 in Bachok coastal solar corridor.', landParcels: [] },
  { id: 'pkg3-33', number: 33, name: 'Tunjung', state: 'Kelantan', voltage: '33kV', capacityMW: 30, lat: 6.0689, lng: 102.2412, district: 'Kota Bharu', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #33 in Bandar Baru Tunjung, Kota Bharu.', landParcels: [] },
  { id: 'pkg3-34', number: 34, name: 'Panchor', state: 'Kelantan', voltage: '33kV', capacityMW: 25, lat: 6.1345, lng: 102.2982, district: 'Kota Bharu', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #34 in Panchor, Kota Bharu.', landParcels: [] },
  { id: 'pkg3-35', number: 35, name: 'Kota Bharu', state: 'Kelantan', voltage: '33kV', capacityMW: 25, lat: 6.1245, lng: 102.2512, district: 'Kota Bharu', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #35 in central Kota Bharu for Package 3.', landParcels: [] },

  // ==========================================
  // KUALA LUMPUR (No. 36 to 63)
  // ==========================================
  { id: 'pkg3-36', number: 36, name: 'Titiwangsa', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1789, lng: 101.7089, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #36 in Titiwangsa precinct for Package 3.', landParcels: [] },
  { id: 'pkg3-37', number: 37, name: 'TNB HQ', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 25, lat: 3.1212, lng: 101.6745, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #37 at TNB Headquarters Complex (Bangsar / Lembah Pantai).', landParcels: [] },
  { id: 'pkg3-38', number: 38, name: 'SPPK Cheras', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.0982, lng: 101.7412, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #38 in Cheras sector for Package 3.', landParcels: [] },
  { id: 'pkg3-39', number: 39, name: 'Pudu Ulu', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1245, lng: 101.7289, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #39 in Pudu Ulu for Package 3.', landParcels: [] },
  { id: 'pkg3-40', number: 40, name: 'Sun City', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1489, lng: 101.7123, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #40 in Sun City precinct.', landParcels: [] },
  { id: 'pkg3-41', number: 41, name: 'Galloway', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1445, lng: 101.7045, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #41 in Bukit Bintang / Galloway sector.', landParcels: [] },
  { id: 'pkg3-42', number: 42, name: 'Wangsa Maju', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 25, lat: 3.2012, lng: 101.7345, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #42 in Wangsa Maju northern district.', landParcels: [] },
  { id: 'pkg3-43', number: 43, name: 'Segambut', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 25, lat: 3.1892, lng: 101.6623, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #43 in Segambut industrial hub.', landParcels: [] },
  { id: 'pkg3-44', number: 44, name: 'Damansara City', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1512, lng: 101.6612, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #44 in Damansara City sector.', landParcels: [] },
  { id: 'pkg3-45', number: 45, name: 'Brickfield', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1312, lng: 101.6889, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #45 in Brickfields / KL Sentral periphery.', landParcels: [] },
  { id: 'pkg3-46', number: 46, name: 'Manjalara', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 25, lat: 3.1982, lng: 101.6345, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #46 in Bandar Manjalara / Kepong.', landParcels: [] },
  { id: 'pkg3-47', number: 47, name: 'Pandan Maju', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1345, lng: 101.7589, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #47 in Pandan Maju corridor.', landParcels: [] },
  { id: 'pkg3-48', number: 48, name: 'KL Pavillion', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1489, lng: 101.7134, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #48 in Bukit Bintang commercial core.', landParcels: [] },
  { id: 'pkg3-49', number: 49, name: 'Sri Hartamas', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1612, lng: 101.6545, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #49 in Sri Hartamas.', landParcels: [] },
  { id: 'pkg3-50', number: 50, name: 'Bukit Mahkamah', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1712, lng: 101.6712, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #50 in Jalan Duta precinct.', landParcels: [] },
  { id: 'pkg3-51', number: 51, name: 'Matrade', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 25, lat: 3.1782, lng: 101.6689, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #51 at MATRADE Exhibition & Convention zone.', landParcels: [] },
  { id: 'pkg3-52', number: 52, name: 'Kg. Lanjut', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1689, lng: 101.7112, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #52 in Kampung Lanjut / Titiwangsa.', landParcels: [] },
  { id: 'pkg3-53', number: 53, name: 'Damansara Heights', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1489, lng: 101.6545, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #53 in Bukit Damansara sector.', landParcels: [] },
  { id: 'pkg3-54', number: 54, name: 'Bandar Tun Razak', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 25, lat: 3.0892, lng: 101.7212, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #54 in Bandar Tun Razak / Cheras.', landParcels: [] },
  { id: 'pkg3-55', number: 55, name: 'Pavillion Bukit Jalil', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 25, lat: 3.0512, lng: 101.6712, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #55 in Bukit Jalil growth corridor.', landParcels: [] },
  { id: 'pkg3-56', number: 56, name: 'Vision City', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1612, lng: 101.6982, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #56 in Chow Kit / Jalan Sultan Ismail.', landParcels: [] },
  { id: 'pkg3-57', number: 57, name: 'Bkt Bintang City Center', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1412, lng: 101.7089, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #57 in Bukit Bintang City Centre (BBCC).', landParcels: [] },
  { id: 'pkg3-58', number: 58, name: 'Mid Valley', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 25, lat: 3.1189, lng: 101.6782, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #58 in Mid Valley Megamall & KL Eco City zone.', landParcels: [] },
  { id: 'pkg3-59', number: 59, name: 'Jalan Imbi (System 1)', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1445, lng: 101.7112, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #59 in Jalan Imbi commercial corridor.', landParcels: [] },
  { id: 'pkg3-60', number: 60, name: 'Bukit Jalil', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 25, lat: 3.0589, lng: 101.6889, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #60 in National Sports Complex / Bukit Jalil technology park.', landParcels: [] },
  { id: 'pkg3-61', number: 61, name: 'KLCC', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 25, lat: 3.1578, lng: 101.7123, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #61 in Kuala Lumpur City Centre (KLCC).', landParcels: [] },
  { id: 'pkg3-62', number: 62, name: 'Pantai', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1145, lng: 101.6623, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #62 in Pantai / Bangsar South.', landParcels: [] },
  { id: 'pkg3-63', number: 63, name: 'Danau Desa', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1012, lng: 101.6845, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #63 in Danau Desa / Taman Desa.', landParcels: [] },

  // ==========================================
  // MELAKA (No. 64 to 69)
  // ==========================================
  { id: 'pkg3-64', number: 64, name: 'Metacorp (MTC)P-MLK', state: 'Melaka', voltage: '33kV', capacityMW: 25, lat: 2.3850, lng: 102.1850, district: 'Alor Gajah', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #64 in Alor Gajah industrial area.', landParcels: [] },
  { id: 'pkg3-65', number: 65, name: 'Jasin', state: 'Melaka', voltage: '33kV', capacityMW: 30, lat: 2.3120, lng: 102.4320, district: 'Jasin', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #65 in Jasin agricultural and solar growth belt.', landParcels: [] },
  { id: 'pkg3-66', number: 66, name: 'Pulau Melaka (PMKA)', state: 'Melaka', voltage: '33kV', capacityMW: 20, lat: 2.1812, lng: 102.2489, district: 'Melaka Tengah', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #66 at Pulau Melaka coastal development.', landParcels: [] },
  { id: 'pkg3-67', number: 67, name: 'Pulau Gadong (PGAD) - MLK', state: 'Melaka', voltage: '33kV', capacityMW: 25, lat: 2.2345, lng: 102.2156, district: 'Melaka Tengah', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #67 in Pulau Gadong sector.', landParcels: [] },
  { id: 'pkg3-68', number: 68, name: 'Cheng', state: 'Melaka', voltage: '33kV', capacityMW: 25, lat: 2.2612, lng: 102.2289, district: 'Melaka Tengah', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #68 in Cheng industrial hub.', landParcels: [] },
  { id: 'pkg3-69', number: 69, name: 'Ujung Pasir', state: 'Melaka', voltage: '33kV', capacityMW: 20, lat: 2.1889, lng: 102.2689, district: 'Melaka Tengah', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #69 in Ujung Pasir coastal periphery.', landParcels: [] },

  // ==========================================
  // NEGERI SEMBILAN (No. 70 to 72)
  // ==========================================
  { id: 'pkg3-70', number: 70, name: 'Paroi', state: 'N. Sembilan', voltage: '33kV', capacityMW: 25, lat: 2.7212, lng: 101.9892, district: 'Seremban', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #70 in Paroi / Seremban East.', landParcels: [] },
  { id: 'pkg3-71', number: 71, name: 'Enstek (ESTK)', state: 'N. Sembilan', voltage: '33kV', capacityMW: 30, lat: 2.7545, lng: 101.7823, district: 'Seremban', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #71 in Bandar Enstek technology & education park.', landParcels: [] },
  { id: 'pkg3-72', number: 72, name: 'Arab Malaysian Industry', state: 'N. Sembilan', voltage: '33kV', capacityMW: 25, lat: 2.7012, lng: 101.8923, district: 'Seremban', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #72 in Nilai / Arab Malaysian industrial park.', landParcels: [] },

  // ==========================================
  // PAHANG (No. 73 to 77)
  // ==========================================
  { id: 'pkg3-73', number: 73, name: 'Kerayong', state: 'Pahang', voltage: '33kV', capacityMW: 30, lat: 3.2623, lng: 102.4512, district: 'Bera', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #73 in Bera / Kerayong plantation district.', landParcels: [] },
  { id: 'pkg3-74', number: 74, name: 'Gebeng', state: 'Pahang', voltage: '33kV', capacityMW: 30, lat: 3.9823, lng: 103.3612, district: 'Kuantan', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #74 in Gebeng heavy industrial & petrochemical park.', landParcels: [] },
  { id: 'pkg3-75', number: 75, name: 'Bandar Indera Mahkota', state: 'Pahang', voltage: '33kV', capacityMW: 25, lat: 3.8345, lng: 103.2982, district: 'Kuantan', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #75 in Bandar Indera Mahkota, Kuantan.', landParcels: [] },
  { id: 'pkg3-76', number: 76, name: 'Kuantan Batu 4', state: 'Pahang', voltage: '33kV', capacityMW: 25, lat: 3.8112, lng: 103.2889, district: 'Kuantan', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #76 in Kuantan Batu 4 corridor.', landParcels: [] },
  { id: 'pkg3-77', number: 77, name: 'Tanjung Gemuk', state: 'Pahang', voltage: '33kV', capacityMW: 25, lat: 2.6689, lng: 103.6123, district: 'Rompin', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #77 in Tanjung Gemuk, Rompin district.', landParcels: [] },

  // ==========================================
  // PERAK (No. 78 to 83)
  // ==========================================
  { id: 'pkg3-78', number: 78, name: 'Greentown', state: 'Perak', voltage: '33kV', capacityMW: 20, lat: 4.5982, lng: 101.0892, district: 'Kinta', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #78 in Greentown commercial center, Ipoh.', landParcels: [] },
  { id: 'pkg3-79', number: 79, name: 'Jln Gopeng', state: 'Perak', voltage: '33kV', capacityMW: 25, lat: 4.5612, lng: 101.1123, district: 'Kinta', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #79 in Jalan Gopeng corridor, Ipoh.', landParcels: [] },
  { id: 'pkg3-80', number: 80, name: 'Pengkalan Industri', state: 'Perak', voltage: '33kV', capacityMW: 25, lat: 4.5423, lng: 101.0689, district: 'Kinta', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #80 in Pengkalan Industrial Area, Ipoh.', landParcels: [] },
  { id: 'pkg3-81', number: 81, name: 'Kinta Valley Resort', state: 'Perak', voltage: '33kV', capacityMW: 25, lat: 4.5212, lng: 101.1423, district: 'Kinta', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #81 in Kinta Valley.', landParcels: [] },
  { id: 'pkg3-82', number: 82, name: 'Menglembu', state: 'Perak', voltage: '33kV', capacityMW: 25, lat: 4.5689, lng: 101.0423, district: 'Kinta', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #82 in Menglembu industrial area, Ipoh.', landParcels: [] },
  { id: 'pkg3-83', number: 83, name: 'Lumut', state: 'Perak', voltage: '33kV', capacityMW: 30, lat: 4.2345, lng: 100.6312, district: 'Manjung', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #83 in Lumut port and maritime industrial zone.', landParcels: [] },

  // ==========================================
  // PERLIS (No. 84 to 85)
  // ==========================================
  { id: 'pkg3-84', number: 84, name: 'Bukit Keteri South', state: 'Perlis', voltage: '33kV', capacityMW: 30, lat: 6.5212, lng: 100.2589, district: 'Kangar', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #84 in Bukit Keteri limestone/quarry belt.', landParcels: [] },
  { id: 'pkg3-85', number: 85, name: 'Kangar', state: 'Perlis', voltage: '33kV', capacityMW: 25, lat: 6.4389, lng: 100.1982, district: 'Kangar', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #85 in Kangar capital district.', landParcels: [] },

  // ==========================================
  // PULAU PINANG (No. 86 to 106)
  // ==========================================
  { id: 'pkg3-86', number: 86, name: 'Bayan Lepas No. 1', state: 'P. Pinang', voltage: '33kV', capacityMW: 25, lat: 5.2982, lng: 100.2612, district: 'Barat Daya', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #86 in Bayan Lepas Free Industrial Zone.', landParcels: [] },
  { id: 'pkg3-87', number: 87, name: 'Bayan Baru', state: 'P. Pinang', voltage: '33kV', capacityMW: 25, lat: 5.3289, lng: 100.2892, district: 'Barat Daya', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #87 in Bayan Baru commercial area.', landParcels: [] },
  { id: 'pkg3-88', number: 88, name: 'Sungai Ara', state: 'P. Pinang', voltage: '33kV', capacityMW: 20, lat: 5.3189, lng: 100.2712, district: 'Barat Daya', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #88 in Sungai Ara valley.', landParcels: [] },
  { id: 'pkg3-89', number: 89, name: 'Simpang Ampat East', state: 'P. Pinang', voltage: '33kV', capacityMW: 30, lat: 5.2812, lng: 100.4823, district: 'S. Perai Selatan', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #89 in Simpang Ampat, Seberang Perai Selatan.', landParcels: [] },
  { id: 'pkg3-90', number: 90, name: 'Batu Kawan South', state: 'P. Pinang', voltage: '33kV', capacityMW: 30, lat: 5.2512, lng: 100.4345, district: 'S. Perai Selatan', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #90 in Batu Kawan Industrial Park (BKIP).', landParcels: [] },
  { id: 'pkg3-91', number: 91, name: 'Bukit Tambun', state: 'P. Pinang', voltage: '33kV', capacityMW: 25, lat: 5.2712, lng: 100.4512, district: 'S. Perai Selatan', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #91 in Bukit Tambun growth area.', landParcels: [] },
  { id: 'pkg3-92', number: 92, name: 'Sungai Kecil', state: 'P. Pinang', voltage: '33kV', capacityMW: 25, lat: 5.1612, lng: 100.5123, district: 'S. Perai Selatan', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #92 in Sungai Kecil near Nibong Tebal.', landParcels: [] },
  { id: 'pkg3-93', number: 93, name: 'Seberang Jaya', state: 'P. Pinang', voltage: '33kV', capacityMW: 25, lat: 5.3982, lng: 100.4012, district: 'S. Perai Tengah', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #93 in Seberang Jaya township.', landParcels: [] },
  { id: 'pkg3-94', number: 94, name: 'Prai Industri No. 1', state: 'P. Pinang', voltage: '33kV', capacityMW: 30, lat: 5.3612, lng: 100.3892, district: 'S. Perai Tengah', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #94 in Prai Industrial Estate.', landParcels: [] },
  { id: 'pkg3-95', number: 95, name: 'Bukit Tengah', state: 'P. Pinang', voltage: '33kV', capacityMW: 25, lat: 5.3512, lng: 100.4289, district: 'S. Perai Tengah', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #95 in Bukit Tengah commercial zone.', landParcels: [] },
  { id: 'pkg3-96', number: 96, name: 'Bukit Mertajam', state: 'P. Pinang', voltage: '33kV', capacityMW: 25, lat: 5.3623, lng: 100.4612, district: 'S. Perai Tengah', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #96 in central Bukit Mertajam.', landParcels: [] },
  { id: 'pkg3-97', number: 97, name: 'Prai GIS', state: 'P. Pinang', voltage: '33kV', capacityMW: 30, lat: 5.3789, lng: 100.3982, district: 'S. Perai Tengah', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #97 Gas Insulated Switchgear in Prai.', landParcels: [] },
  { id: 'pkg3-98', number: 98, name: 'Bukit Minyak', state: 'P. Pinang', voltage: '33kV', capacityMW: 30, lat: 5.3189, lng: 100.4512, district: 'S. Perai Tengah', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #98 in Bukit Minyak Industrial Park.', landParcels: [] },
  { id: 'pkg3-99', number: 99, name: 'Butterworth North', state: 'P. Pinang', voltage: '33kV', capacityMW: 25, lat: 5.4189, lng: 100.3712, district: 'S. Perai Utara', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #99 in Butterworth North.', landParcels: [] },
  { id: 'pkg3-100', number: 100, name: 'Dato Keramat', state: 'P. Pinang', voltage: '33kV', capacityMW: 20, lat: 5.4112, lng: 100.3189, district: 'Timur Laut', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #100 in Jalan Dato Keramat, George Town.', landParcels: [] },
  { id: 'pkg3-101', number: 101, name: 'Farlim', state: 'P. Pinang', voltage: '33kV', capacityMW: 20, lat: 5.3912, lng: 100.2892, district: 'Timur Laut', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #101 in Farlim / Bandar Baru Air Itam.', landParcels: [] },
  { id: 'pkg3-102', number: 102, name: 'Sungai Pinang', state: 'P. Pinang', voltage: '33kV', capacityMW: 20, lat: 5.4012, lng: 100.3289, district: 'Timur Laut', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #102 in Sungai Pinang industrial zone.', landParcels: [] },
  { id: 'pkg3-103', number: 103, name: 'Air Terjun', state: 'P. Pinang', voltage: '33kV', capacityMW: 20, lat: 5.4312, lng: 100.2982, district: 'Timur Laut', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #103 in Waterfall / Pulau Tikus.', landParcels: [] },
  { id: 'pkg3-104', number: 104, name: 'Tanjong Tokong', state: 'P. Pinang', voltage: '33kV', capacityMW: 20, lat: 5.4589, lng: 100.3089, district: 'Timur Laut', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #104 in Tanjong Tokong / Seri Tanjung Pinang.', landParcels: [] },
  { id: 'pkg3-105', number: 105, name: 'Gelugor', state: 'P. Pinang', voltage: '33kV', capacityMW: 25, lat: 5.3789, lng: 100.3089, district: 'Timur Laut', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #105 in Gelugor / USM precinct.', landParcels: [] },
  { id: 'pkg3-106', number: 106, name: 'Bayan Mutiara', state: 'P. Pinang', voltage: '33kV', capacityMW: 25, lat: 5.3489, lng: 100.3123, district: 'Timur Laut', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #106 in Bayan Mutiara waterfront development.', landParcels: [] },

  // ==========================================
  // PUTRAJAYA (No. 107 to 110)
  // ==========================================
  { id: 'pkg3-107', number: 107, name: 'Putrajaya Central/11', state: 'Putrajaya', voltage: '33kV', capacityMW: 25, lat: 2.9312, lng: 101.6912, district: 'Putrajaya', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #107 in Presint 11 / Putrajaya Central.', landParcels: [] },
  { id: 'pkg3-108', number: 108, name: 'Dato Abu Bakar Baginda-ABBA', state: 'Putrajaya', voltage: '33kV', capacityMW: 25, lat: 2.9612, lng: 101.7289, district: 'Putrajaya', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #108 in Kampung Dato Abu Bakar Baginda.', landParcels: [] },
  { id: 'pkg3-109', number: 109, name: 'Serdang', state: 'Putrajaya', voltage: '33kV', capacityMW: 25, lat: 2.9812, lng: 101.7112, district: 'Putrajaya', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #109 in Serdang / MARDI corridor.', landParcels: [] },
  { id: 'pkg3-110', number: 110, name: 'Serdang (2)', state: 'Putrajaya', voltage: '33kV', capacityMW: 25, lat: 2.9889, lng: 101.7189, district: 'Putrajaya', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #110 in Serdang sector 2.', landParcels: [] },

  // ==========================================
  // SELANGOR (No. 111 to 152)
  // ==========================================
  { id: 'pkg3-111', number: 111, name: 'Taman Melawati', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.2112, lng: 101.7512, district: 'Gombak', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #111 in Taman Melawati.', landParcels: [] },
  { id: 'pkg3-112', number: 112, name: 'KL East', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.2245, lng: 101.7312, district: 'Gombak', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #112 in KL East growth corridor.', landParcels: [] },
  { id: 'pkg3-113', number: 113, name: 'Batu Arang', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 3.3189, lng: 101.4689, district: 'Gombak', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #113 in Batu Arang former mining/agricultural area.', landParcels: [] },
  { id: 'pkg3-114', number: 114, name: 'Ampang', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.1512, lng: 101.7612, district: 'Gombak', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #114 in Ampang Jaya sector.', landParcels: [] },
  { id: 'pkg3-115', number: 115, name: 'Ladang Kundang', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 3.2789, lng: 101.5212, district: 'Gombak', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #115 in Kundang agricultural & industrial valley.', landParcels: [] },
  { id: 'pkg3-116', number: 116, name: 'New Rawangland', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 3.3212, lng: 101.5789, district: 'Gombak', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #116 in Rawang growth belt.', landParcels: [] },
  { id: 'pkg3-117', number: 117, name: 'Batu Caves', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.2389, lng: 101.6789, district: 'Gombak', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #117 in Batu Caves industrial area.', landParcels: [] },
  { id: 'pkg3-118', number: 118, name: 'Balakong', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0289, lng: 101.7512, district: 'Hulu Langat', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #118 in Balakong industrial corridor.', landParcels: [] },
  { id: 'pkg3-119', number: 119, name: 'Sungai Ramal', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 2.9812, lng: 101.7612, district: 'Hulu Langat', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #119 in Sungai Ramal / Kajang.', landParcels: [] },
  { id: 'pkg3-120', number: 120, name: 'Beranang', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 2.8712, lng: 101.8712, district: 'Hulu Langat', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #120 in Beranang agricultural and industrial zone.', landParcels: [] },
  { id: 'pkg3-121', number: 121, name: 'Kajang Estate', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 2.9912, lng: 101.7889, district: 'Hulu Langat', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #121 in Kajang Estate.', landParcels: [] },
  { id: 'pkg3-122', number: 122, name: 'Mahkota Cheras (MCRS)', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0512, lng: 101.7889, district: 'Hulu Langat', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #122 in Bandar Mahkota Cheras.', landParcels: [] },
  { id: 'pkg3-123', number: 123, name: 'Cheras Jaya', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0212, lng: 101.7612, district: 'Hulu Langat', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #123 in Kawasan Perindustrian Cheras Jaya.', landParcels: [] },
  { id: 'pkg3-124', number: 124, name: 'National Uni', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 2.9289, lng: 101.7789, district: 'Hulu Langat', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #124 near Universiti Kebangsaan Malaysia (UKM), Bangi.', landParcels: [] },
  { id: 'pkg3-125', number: 125, name: 'Bandar Botanic', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 2.9982, lng: 101.4423, district: 'Klang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #125 in Bandar Botanic, South Klang.', landParcels: [] },
  { id: 'pkg3-126', number: 126, name: 'Pandamaran', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0112, lng: 101.4212, district: 'Klang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #126 in Pandamaran industrial sector.', landParcels: [] },
  { id: 'pkg3-127', number: 127, name: 'Kota Kemuning', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0012, lng: 101.5345, district: 'Klang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #127 in Kota Kemuning / Bukit Rimau.', landParcels: [] },
  { id: 'pkg3-128', number: 128, name: 'Vallambrosa', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 3.0512, lng: 101.4112, district: 'Klang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #128 in Kapar / Vallambrosa agricultural corridor.', landParcels: [] },
  { id: 'pkg3-129', number: 129, name: 'NKS', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0389, lng: 101.4289, district: 'Klang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #129 in North Klang Straits sector.', landParcels: [] },
  { id: 'pkg3-130', number: 130, name: 'Maxharta', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0489, lng: 101.4589, district: 'Klang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #130 in central Klang commercial area.', landParcels: [] },
  { id: 'pkg3-131', number: 131, name: 'Meru', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 3.1389, lng: 101.4389, district: 'Klang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #131 in Meru industrial and agricultural zone.', landParcels: [] },
  { id: 'pkg3-132', number: 132, name: 'Pulau Indah', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 2.9489, lng: 101.3289, district: 'Klang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #132 in Pulau Indah / Port Klang Free Zone (PKFZ).', landParcels: [] },
  { id: 'pkg3-133', number: 133, name: 'Ingerback', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0289, lng: 101.3982, district: 'Klang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #133 in Port Klang industrial area.', landParcels: [] },
  { id: 'pkg3-134', number: 134, name: 'CBPS', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0189, lng: 101.4123, district: 'Klang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #134 in Klang South.', landParcels: [] },
  { id: 'pkg3-135', number: 135, name: 'Telok Panglima Garang', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 2.9189, lng: 101.4689, district: 'Kuala Langat', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #135 in Telok Panglima Garang industrial zone.', landParcels: [] },
  { id: 'pkg3-136', number: 136, name: 'Banting', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 2.8123, lng: 101.5012, district: 'Kuala Langat', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #136 in Banting agricultural and solar flatlands.', landParcels: [] },
  { id: 'pkg3-137', number: 137, name: 'Kuala Selangor', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 3.3389, lng: 101.2512, district: 'Kuala Selangor', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #137 in coastal Kuala Selangor agricultural belt.', landParcels: [] },
  { id: 'pkg3-138', number: 138, name: 'Batu Tiga', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0789, lng: 101.5512, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #138 in Batu Tiga industrial area, Shah Alam.', landParcels: [] },
  { id: 'pkg3-139', number: 139, name: 'Subang Jaya Town Center', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0745, lng: 101.5892, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #139 in SS15 / Subang Jaya City Center.', landParcels: [] },
  { id: 'pkg3-140', number: 140, name: 'Shah Alam Seksyen 18', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0489, lng: 101.5212, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #140 in Seksyen 18, Shah Alam.', landParcels: [] },
  { id: 'pkg3-141', number: 141, name: 'Hicom G', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 3.0212, lng: 101.5689, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #141 in HICOM Industrial Estate, Seksyen 26, Shah Alam.', landParcels: [] },
  { id: 'pkg3-142', number: 142, name: 'Kg. Subang', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 3.1489, lng: 101.5389, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #142 in Kampung Baru Subang.', landParcels: [] },
  { id: 'pkg3-143', number: 143, name: 'Puchong Perdana', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0012, lng: 101.6012, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #143 in Puchong Perdana / Lakeside.', landParcels: [] },
  { id: 'pkg3-144', number: 144, name: 'Serdang Raya', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0389, lng: 101.7012, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #144 in Taman Serdang Raya.', landParcels: [] },
  { id: 'pkg3-145', number: 145, name: 'KL North', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.2189, lng: 101.6212, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #145 in Sungai Buloh / KL North.', landParcels: [] },
  { id: 'pkg3-146', number: 146, name: 'Shah Alam Bandar', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0712, lng: 101.5189, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #146 in Shah Alam City Centre.', landParcels: [] },
  { id: 'pkg3-147', number: 147, name: 'Penaga', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0889, lng: 101.5712, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #147 in Bukit Jelutong / Penaga.', landParcels: [] },
  { id: 'pkg3-148', number: 148, name: 'Shah Alam South', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0312, lng: 101.5389, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #148 in Seksyen 23 / 24, Shah Alam South.', landParcels: [] },
  { id: 'pkg3-149', number: 149, name: 'Subang Uda New', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.1112, lng: 101.5412, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #149 in Subang Perdana / UDA.', landParcels: [] },
  { id: 'pkg3-150', number: 150, name: 'DCA', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.1289, lng: 101.5589, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #150 at Sultan Abdul Aziz Shah Airport (Subang Airport) aviation zone.', landParcels: [] },
  { id: 'pkg3-151', number: 151, name: 'Puchong Jaya', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0489, lng: 101.6212, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #151 in Bandar Puchong Jaya commercial corridor.', landParcels: [] },
  { id: 'pkg3-152', number: 152, name: 'New Seapark', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.1112, lng: 101.6289, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #152 in Section 21 / Sea Park, Petaling Jaya.', landParcels: [] },
  { id: 'pkg3-153', number: 153, name: 'Proton (Prot) Sam', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 3.0560, lng: 101.5580, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #153 at Proton manufacturing facility, Shah Alam.', landParcels: [] },
  { id: 'pkg3-154', number: 154, name: 'GIS / Mutiara Damansara', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.1580, lng: 101.6090, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #154 Gas Insulated Switchgear in Mutiara Damansara.', landParcels: [] },
  { id: 'pkg3-155', number: 155, name: 'Bukit Jelutong', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.1020, lng: 101.5320, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #155 in Bukit Jelutong township corridor.', landParcels: [] },
  { id: 'pkg3-156', number: 156, name: 'Shah Alam East', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0780, lng: 101.5420, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #156 in Shah Alam East.', landParcels: [] },
  { id: 'pkg3-157', number: 157, name: 'Petaling Jaya South', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0820, lng: 101.6390, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #157 in PJ South / PJS precinct.', landParcels: [] },
  { id: 'pkg3-158', number: 158, name: 'Taman Jaya GIS', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.1040, lng: 101.6520, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #158 in Taman Jaya, Petaling Jaya.', landParcels: [] },
  { id: 'pkg3-159', number: 159, name: 'Kota Damansara', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.1520, lng: 101.5810, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #159 in Kota Damansara.', landParcels: [] },
  { id: 'pkg3-160', number: 160, name: 'Setia Alam', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 3.1320, lng: 101.4620, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #160 in Setia Alam growth corridor.', landParcels: [] },
  { id: 'pkg3-161', number: 161, name: 'Shah Alam West', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0640, lng: 101.4920, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #161 in Shah Alam West sector.', landParcels: [] },
  { id: 'pkg3-162', number: 162, name: 'Kg. Cempaka', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.1180, lng: 101.6010, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #162 in Kampung Cempaka / PJ.', landParcels: [] },
  { id: 'pkg3-163', number: 163, name: 'Temasya', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.0880, lng: 101.5820, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #163 in Temasya Industrial Park, Glenmarie.', landParcels: [] },
  { id: 'pkg3-164', number: 164, name: 'Sri Damansara', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.1940, lng: 101.6050, district: 'Petaling', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #164 in Bandar Sri Damansara.', landParcels: [] },
  { id: 'pkg3-165', number: 165, name: 'Sg. Besar', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 3.7150, lng: 100.9850, district: 'Sabak Bernam', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #165 in Sungai Besar agricultural & paddy belt.', landParcels: [] },
  { id: 'pkg3-166', number: 166, name: 'Cyberjaya Central', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 2.9220, lng: 101.6550, district: 'Sepang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #166 in Cyberjaya Tech Hub.', landParcels: [] },
  { id: 'pkg3-167', number: 167, name: 'Air Hitam', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 2.8850, lng: 101.6920, district: 'Sepang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #167 in Air Hitam / Dengkil corridor.', landParcels: [] },
  { id: 'pkg3-168', number: 168, name: 'IOI Mayang', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 2.9680, lng: 101.7120, district: 'Sepang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #168 in IOI Resort City / Mayang.', landParcels: [] },
  { id: 'pkg3-169', number: 169, name: 'KLIA', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 2.7450, lng: 101.6980, district: 'Sepang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #169 at Kuala Lumpur International Airport.', landParcels: [] },
  { id: 'pkg3-170', number: 170, name: 'Bandar Baru Salak Tinggi', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 2.8080, lng: 101.7380, district: 'Sepang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #170 in Bandar Baru Salak Tinggi.', landParcels: [] },
  { id: 'pkg3-171', number: 171, name: 'Cyberjaya North', substationType: 'PMU', state: 'Selangor', voltage: '33kV', capacityMW: 30, lat: 2.9480, lng: 101.6620, district: 'Sepang', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #171 in Cyberjaya North.', landParcels: [] },
  { id: 'pkg3-172', number: 172, name: 'Seberang Jerteh', substationType: 'PMU', state: 'Terengganu', voltage: '33kV', capacityMW: 30, lat: 5.7480, lng: 102.4920, district: 'Besut', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #172 in Seberang Jerteh, Besut.', landParcels: [] },
  { id: 'pkg3-173', number: 173, name: 'Gong Badak', substationType: 'PMU', state: 'Terengganu', voltage: '33kV', capacityMW: 30, lat: 5.3850, lng: 103.0880, district: 'Kuala Nerus', gridOwnerApproved: true, description: 'Designated 33kV Nodal Point #173 in Gong Badak industrial and university zone.', landParcels: [] },

  // =========================================================================
  // PENCAWANG PEMBAHAGIAN UTAMA (PPU) - DISTRIBUTION SUBSTATIONS (No. 1 to 53)
  // Official Section 2.0 PPU List (Pages 33-34 in latest ST RFP LSS6-Solar)
  // =========================================================================
  { id: 'ppu-1', number: 1, name: 'Bukit Indah', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.4820, lng: 103.6550, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #1 in Bukit Indah, Iskandar Puteri.', landParcels: [] },
  { id: 'ppu-2', number: 2, name: 'Bakar Batu', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.4920, lng: 103.7820, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #2 in Bakar Batu / SouthKey.', landParcels: [] },
  { id: 'ppu-3', number: 3, name: 'Mutiara Rini', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.5280, lng: 103.6380, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #3 in Mutiara Rini, Skudai.', landParcels: [] },
  { id: 'ppu-4', number: 4, name: 'Impian Emas', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.5450, lng: 103.6820, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #4 in Taman Impian Emas, Skudai.', landParcels: [] },
  { id: 'ppu-5', number: 5, name: 'PGTE', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 1.4680, lng: 103.9120, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #5 in Pasir Gudang Terminal Estate.', landParcels: [] },
  { id: 'ppu-6', number: 6, name: 'Johor Jaya No.1', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.5380, lng: 103.7980, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #6 in Taman Johor Jaya.', landParcels: [] },
  { id: 'ppu-7', number: 7, name: 'Nalin', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.4850, lng: 103.7380, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #7 in Nalin / Larkin.', landParcels: [] },
  { id: 'ppu-8', number: 8, name: 'Permai (PRMI)', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.5120, lng: 103.7120, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #8 in Permai area.', landParcels: [] },
  { id: 'ppu-9', number: 9, name: 'Pulai Perdana', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.5580, lng: 103.6050, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #9 in Taman Pulai Perdana / Kangkar Pulai.', landParcels: [] },
  { id: 'ppu-10', number: 10, name: 'Taman Daya 2', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.5520, lng: 103.7650, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #10 in Taman Daya Sector 2.', landParcels: [] },
  { id: 'ppu-11', number: 11, name: 'Permas Jaya 2 (PJY2)', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.4980, lng: 103.8250, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #11 in Bandar Baru Permas Jaya 2.', landParcels: [] },
  { id: 'ppu-12', number: 12, name: 'Damansara Aliff', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.5050, lng: 103.7220, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #12 in Damansara Aliff / Tampoi.', landParcels: [] },
  { id: 'ppu-13', number: 13, name: 'Century', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.4820, lng: 103.7620, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #13 in Taman Century, Johor Bahru.', landParcels: [] },
  { id: 'ppu-14', number: 14, name: 'Keluli', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 1.4620, lng: 103.8950, district: 'Johor Bahru', gridOwnerApproved: true, description: 'Designated PPU #14 in Kawasan Perindustrian Pasir Gudang (Keluli).', landParcels: [] },
  { id: 'ppu-15', number: 15, name: 'I-Park', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 1.6620, lng: 103.6050, district: 'Kulai', gridOwnerApproved: true, description: 'Designated PPU #15 in i-Park Indahpura, Kulai.', landParcels: [] },
  { id: 'ppu-16', number: 16, name: 'Perindustrian Murni', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 25, lat: 1.6480, lng: 103.6180, district: 'Kulai', gridOwnerApproved: true, description: 'Designated PPU #16 in Kawasan Perindustrian Murni Senai/Kulai.', landParcels: [] },
  { id: 'ppu-17', number: 17, name: 'Puteri Kulai (PTRJ)', substationType: 'PPU', state: 'Johor', voltage: '33kV', capacityMW: 20, lat: 1.6780, lng: 103.5850, district: 'Kulai', gridOwnerApproved: true, description: 'Designated PPU #17 in Taman Puteri Kulai.', landParcels: [] },
  { id: 'ppu-18', number: 18, name: 'Mergong Industri', substationType: 'PPU', state: 'Kedah', voltage: '33kV', capacityMW: 25, lat: 6.1380, lng: 100.3520, district: 'Kota Setar', gridOwnerApproved: true, description: 'Designated PPU #18 in Kawasan Perusahaan Mergong, Alor Setar.', landParcels: [] },
  { id: 'ppu-19', number: 19, name: 'Waktu Cerah', substationType: 'PPU', state: 'Kedah', voltage: '33kV', capacityMW: 25, lat: 5.6620, lng: 100.5180, district: 'Kuala Muda', gridOwnerApproved: true, description: 'Designated PPU #19 in Sungai Petani / Bakar Arang industrial belt.', landParcels: [] },
  { id: 'ppu-20', number: 20, name: 'Star Hill', substationType: 'PPU', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1480, lng: 101.7120, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated PPU #20 in Bukit Bintang / Starhill precinct.', landParcels: [] },
  { id: 'ppu-21', number: 21, name: 'Danau Kota', substationType: 'PPU', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.2050, lng: 101.7180, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated PPU #21 in Danau Kota, Setapak.', landParcels: [] },
  { id: 'ppu-22', number: 22, name: 'Wangsa Maju', substationType: 'PPU', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1980, lng: 101.7380, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated PPU #22 in Seksyen 2 / Wangsa Maju.', landParcels: [] },
  { id: 'ppu-23', number: 23, name: 'Magna Park', substationType: 'PPU', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.2180, lng: 101.6450, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated PPU #23 in Metro Prima / Kepong.', landParcels: [] },
  { id: 'ppu-24', number: 24, name: 'Pearl Point', substationType: 'PPU', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.0850, lng: 101.6720, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated PPU #24 along Jalan Klang Lama.', landParcels: [] },
  { id: 'ppu-25', number: 25, name: 'Metroplex', substationType: 'PPU', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1680, lng: 101.6920, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated PPU #25 in Chow Kit / Jalan Putra.', landParcels: [] },
  { id: 'ppu-26', number: 26, name: 'Prima Setapak', substationType: 'PPU', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1950, lng: 101.7120, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated PPU #26 in Jalan Genting Kelang, Setapak.', landParcels: [] },
  { id: 'ppu-27', number: 27, name: 'Scott Garden', substationType: 'PPU', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.0920, lng: 101.6750, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated PPU #27 in Old Klang Road commercial sector.', landParcels: [] },
  { id: 'ppu-28', number: 28, name: 'Alam Damai', substationType: 'PPU', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.0680, lng: 101.7380, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated PPU #28 in Alam Damai, Cheras.', landParcels: [] },
  { id: 'ppu-29', number: 29, name: 'Great Eastern', substationType: 'PPU', state: 'Kuala Lumpur', voltage: '33kV', capacityMW: 20, lat: 3.1580, lng: 101.7320, district: 'Kuala Lumpur', gridOwnerApproved: true, description: 'Designated PPU #29 in Jalan Ampang Embassy Row.', landParcels: [] },
  { id: 'ppu-30', number: 30, name: 'Taman Cempaka (TCPK)-MLK', substationType: 'PPU', state: 'Melaka', voltage: '33kV', capacityMW: 20, lat: 2.2180, lng: 102.2450, district: 'Melaka Tengah', gridOwnerApproved: true, description: 'Designated PPU #30 in Taman Cempaka, Melaka Tengah.', landParcels: [] },
  { id: 'ppu-31', number: 31, name: 'Sikamat (SKMT)-NS', substationType: 'PPU', state: 'N. Sembilan', voltage: '33kV', capacityMW: 20, lat: 2.7480, lng: 101.9620, district: 'Seremban', gridOwnerApproved: true, description: 'Designated PPU #31 in Sikamat, Seremban.', landParcels: [] },
  { id: 'ppu-32', number: 32, name: 'Pinji Lane', substationType: 'PPU', state: 'Perak', voltage: '33kV', capacityMW: 20, lat: 4.5780, lng: 101.0920, district: 'Kinta', gridOwnerApproved: true, description: 'Designated PPU #32 in Pasir Pinji / Ipoh.', landParcels: [] },
  { id: 'ppu-33', number: 33, name: 'Bayan Bay', substationType: 'PPU', state: 'P. Pinang', voltage: '33kV', capacityMW: 20, lat: 5.3350, lng: 100.3080, district: 'Timur Laut', gridOwnerApproved: true, description: 'Designated PPU #33 in Queensbay / Bayan Bay.', landParcels: [] },
  { id: 'ppu-34', number: 34, name: 'Gurney Park', substationType: 'PPU', state: 'P. Pinang', voltage: '33kV', capacityMW: 20, lat: 5.4380, lng: 100.3120, district: 'Timur Laut', gridOwnerApproved: true, description: 'Designated PPU #34 in Gurney Drive, George Town.', landParcels: [] },
  { id: 'ppu-35', number: 35, name: 'Tanjung Tokong', substationType: 'PPU', state: 'P. Pinang', voltage: '33kV', capacityMW: 20, lat: 5.4520, lng: 100.3080, district: 'Timur Laut', gridOwnerApproved: true, description: 'Designated PPU #35 in Tanjong Tokong.', landParcels: [] },
  { id: 'ppu-36', number: 36, name: 'Taman Melawati', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.2120, lng: 101.7480, district: 'Gombak', gridOwnerApproved: true, description: 'Designated PPU #36 in Taman Melawati.', landParcels: [] },
  { id: 'ppu-37', number: 37, name: 'Rawang Batu 16', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.3150, lng: 101.5780, district: 'Gombak', gridOwnerApproved: true, description: 'Designated PPU #37 in Rawang Batu 16.', landParcels: [] },
  { id: 'ppu-38', number: 38, name: 'Selayang Utama', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.2450, lng: 101.6520, district: 'Gombak', gridOwnerApproved: true, description: 'Designated PPU #38 in Bandar Baru Selayang.', landParcels: [] },
  { id: 'ppu-39', number: 39, name: 'Taman Segar No 2', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.0880, lng: 101.7420, district: 'Hulu Langat', gridOwnerApproved: true, description: 'Designated PPU #39 in Taman Segar, Cheras.', landParcels: [] },
  { id: 'ppu-40', number: 40, name: 'Saujana Impian', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.0180, lng: 101.7820, district: 'Hulu Langat', gridOwnerApproved: true, description: 'Designated PPU #40 in Saujana Impian, Kajang.', landParcels: [] },
  { id: 'ppu-41', number: 41, name: 'New Kajang Town', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 2.9920, lng: 101.7920, district: 'Hulu Langat', gridOwnerApproved: true, description: 'Designated PPU #41 in Bandar Kajang.', landParcels: [] },
  { id: 'ppu-42', number: 42, name: 'Sg. Buaya', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.3780, lng: 101.5280, district: 'Hulu Selangor', gridOwnerApproved: true, description: 'Designated PPU #42 in Bandar Sungai Buaya agricultural/utility corridor.', landParcels: [] },
  { id: 'ppu-43', number: 43, name: 'Sri Alam', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.0320, lng: 101.4550, district: 'Klang', gridOwnerApproved: true, description: 'Designated PPU #43 in Sri Alam / Taman Berkeley Klang.', landParcels: [] },
  { id: 'ppu-44', number: 44, name: 'Per. Raja Muda Musa', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.0180, lng: 101.4280, district: 'Klang', gridOwnerApproved: true, description: 'Designated PPU #44 in Persiaran Raja Muda Musa, Port Klang.', landParcels: [] },
  { id: 'ppu-45', number: 45, name: 'Jalan Langat', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 2.9980, lng: 101.4420, district: 'Klang', gridOwnerApproved: true, description: 'Designated PPU #45 along Jalan Langat, Klang.', landParcels: [] },
  { id: 'ppu-46', number: 46, name: 'Tmn. Per. Jln Teratai (Top Glove)', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.1250, lng: 101.4380, district: 'Klang', gridOwnerApproved: true, description: 'Designated PPU #46 in Meru Industrial Estate (Jalan Teratai).', landParcels: [] },
  { id: 'ppu-47', number: 47, name: 'Pekan Jenjarum', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 2.8750, lng: 101.4980, district: 'Kuala Langat', gridOwnerApproved: true, description: 'Designated PPU #47 in Jenjarom agricultural & solar potential belt.', landParcels: [] },
  { id: 'ppu-48', number: 48, name: 'Puncakalam', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 25, lat: 3.2280, lng: 101.4280, district: 'Kuala Selangor', gridOwnerApproved: true, description: 'Designated PPU #48 in Bandar Puncak Alam growth corridor.', landParcels: [] },
  { id: 'ppu-49', number: 49, name: 'Equine Park', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 2.9920, lng: 101.6720, district: 'Petaling', gridOwnerApproved: true, description: 'Designated PPU #49 in Taman Equine, Seri Kembangan.', landParcels: [] },
  { id: 'ppu-50', number: 50, name: '33 Bandar Utama', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.1480, lng: 101.6150, district: 'Petaling', gridOwnerApproved: true, description: 'Designated PPU #50 in Bandar Utama 33kV.', landParcels: [] },
  { id: 'ppu-51', number: 51, name: 'Pusat Bandar Puchong', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.0320, lng: 101.6180, district: 'Petaling', gridOwnerApproved: true, description: 'Designated PPU #51 in Pusat Bandar Puchong.', landParcels: [] },
  { id: 'ppu-52', number: 52, name: 'Sunway Pyramid', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.0720, lng: 101.6050, district: 'Petaling', gridOwnerApproved: true, description: 'Designated PPU #52 in Bandar Sunway / Subang.', landParcels: [] },
  { id: 'ppu-53', number: 53, name: '33 Petaling Jaya', substationType: 'PPU', state: 'Selangor', voltage: '33kV', capacityMW: 20, lat: 3.1020, lng: 101.6420, district: 'Petaling', gridOwnerApproved: true, description: 'Designated PPU #53 in Central Petaling Jaya.', landParcels: [] },
];

// Automatically generate candidate land parcels for all Package 3 PMUs and PPUs
PMU_NODES_PACKAGE_3.forEach((node) => {
  node.landParcels = generatePackage3CandidateLandParcels(
    node.id,
    `${node.substationType === 'PPU' ? 'PPU' : 'PMU'} ${node.name}`,
    node.state,
    node.district,
    node.lat,
    node.lng
  );
});
