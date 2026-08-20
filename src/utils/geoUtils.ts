import { PMUNode, LandParcel, CustomLocationAnalysis, VoltageLevel } from '../types';

/**
 * Calculates straight-line Haversine distance in kilometers between two GPS points
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Calculates bearing between two lat/lng points in degrees (0-360)
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (Math.round((θ * 180) / Math.PI) + 360) % 360;
}

/**
 * Returns compass direction name (e.g. N, NE, E, SE, S, SW, W, NW)
 */
export function getCompassDirection(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

/**
 * Estimates cable route distance based on terrain & rights of way (~1.35x straight-line in Peninsular Malaysia)
 */
export function estimateCableRouteKm(straightLineKm: number): number {
  return Math.round(straightLineKm * 1.35 * 100) / 100;
}

/**
 * Calculates transmission line & substation bay cost in MYR Million (TNB Transmission & Distribution Division Standards)
 * - 33kV underground / overhead feeder ~ RM 1.2M / km + RM 2.5M switchgear panel & protection upgrade
 * - 132kV double-circuit overhead line ~ RM 3.2M / km + RM 8.5M switchyard bay extension & protection upgrade
 * - 275kV double-circuit overhead line ~ RM 5.5M / km + RM 15.0M switchyard bay extension & protection upgrade
 */
export function calculateInterconnectionCostMyr(
  cableRouteKm: number,
  voltage: VoltageLevel
): number {
  const costPerKm = voltage === '275kV' ? 5.5 : voltage === '33kV' ? 1.2 : 3.2;
  const bayCost = voltage === '275kV' ? 15.0 : voltage === '33kV' ? 2.5 : 8.5;
  const lineCost = cableRouteKm * costPerKm;
  return Math.round((lineCost + bayCost) * 100) / 100;
}

/**
 * Estimates solar GHI (Global Horizontal Irradiation) based on Malaysian State Latitude
 * Northern Peninsular (Perlis, Kedah) has higher GHI (~1800-1950 kWh/m²/yr)
 * Eastern Peninsular (Kelantan, Terengganu, Pahang) ~1650-1800 kWh/m²/yr
 * Southern/Central (Johor, Melaka, Selangor, Perak, Kuala Lumpur) ~1550-1700 kWh/m²/yr
 */
export function getEstimatedSolarGHI(lat: number, state: string): { ghiYear: number; ghiDay: number } {
  let baseGHI = 1650;
  if (state === 'Perlis' || state === 'Kedah') {
    baseGHI = 1880 + (lat - 5.5) * 40;
  } else if (state === 'P. Pinang') {
    baseGHI = 1800;
  } else if (state === 'Kelantan' || state === 'Terengganu') {
    baseGHI = 1750;
  } else if (state === 'Pahang') {
    baseGHI = 1680;
  } else if (state === 'Perak') {
    baseGHI = 1660;
  } else if (state === 'Selangor' || state === 'N. Sembilan' || state === 'Melaka' || state === 'Kuala Lumpur') {
    baseGHI = 1630;
  } else if (state === 'Johor') {
    baseGHI = 1600;
  }
  const ghiYear = Math.round(baseGHI);
  const ghiDay = Math.round((ghiYear / 365) * 100) / 100;
  return { ghiYear, ghiDay };
}

/**
 * Calculates Solar PV System Metrics under ST RFP LSS6-Hybrid 2:1:4 Architecture
 * - Solar Facility (MWa.c.) = 2 x Export Capacity (MWa.c.)
 * - Solar PV DC Peak Capacity (MWp) = 1.25 x Solar Facility (MWa.c.)
 * - BESS Power Rating (MW) = 1 x Export Capacity (MWa.c.)
 * - BESS Energy Rating (MWh) = 4 x Export Capacity (MWa.c.) (4-Hour Duration)
 */
export function calculateSolarCapacityFromLand(acres: number): {
  exportCapacityMWa: number;
  solarCapacityMWa: number;
  capacityMWp: number;
  bessPowerMW: number;
  bessEnergyMWh: number;
} {
  // 113.3 Ha (~280 acres) with single-axis trackers + 4-hr BESS compound + substation fits ~30 MWa.c. Export / 60 MWa.c. Solar
  const exportCapacityMWa = Math.max(10, Math.round((acres / 9.3) * 10) / 10);
  const solarCapacityMWa = exportCapacityMWa * 2;
  const capacityMWp = Math.round(solarCapacityMWa * 1.25 * 10) / 10;
  const bessPowerMW = exportCapacityMWa;
  const bessEnergyMWh = exportCapacityMWa * 4;

  return {
    exportCapacityMWa,
    solarCapacityMWa,
    capacityMWp,
    bessPowerMW,
    bessEnergyMWh,
  };
}

/**
 * Calculates Annual Net Export Energy Yield (MWh/year) & Capacity Factor (CF)
 * Clause 11.1.1(b) Mandate: Minimum CF in any year over 21 years shall NOT be less than 16.0%
 * CF (%) = Annual Net Export Energy (kWh) / (8,760 x rated kWp)
 */
export function calculateAnnualYieldMWh(
  capacityMWp: number,
  ghiYear: number = 1655,
  exportCapacityMWa: number = capacityMWp / 2.5
): {
  annualMWh: number;
  capacityFactorYear1: number;
  capacityFactorYear21: number;
  clearsCapacityFactorFloor: boolean;
} {
  // Case B Design-To-Comply Yield Model (RFP §11.1.1 compliant)
  // Single-axis horizontal tracking (+9% gain) + TOPCon bifacial modules (+7% gain)
  const trackerGain = 1.09;
  const bifacialGain = 1.07;
  const performanceRatio = 0.840; // String inverters, robotic cleaning, high-albedo ground cover
  
  // Specific yield Year 1 = GHI * tracker * bifacial * PR ~ 1,621 kWh/kWp
  const specificYieldKWhKWp = (ghiYear / 1000) * trackerGain * bifacialGain * performanceRatio * 1000;
  
  // Gross solar energy yield at inverter transformer terminals (MWh)
  const grossSolarMWh = (capacityMWp * 1000 * specificYieldKWhKWp) / 1000;
  
  // Net Export Energy after BESS 85% round-trip efficiency on charged power (141 MWh/day) & 2% clipping/losses
  // 121,604 MWh solar yield yields ~111,005 MWh net export for 75 MWp DC
  const netExportRatio = 111005 / 121604;
  const netExportMWh = grossSolarMWh * netExportRatio;
  const annualMWh = Math.round(netExportMWh);

  // RFP Clause 11.1.1(a) Capacity Factor calculation on rated kWp (d.c.) basis
  // CF = Annual Net Export Energy (kWh) / (8,760 h * rated peak capacity kWp)
  const capacityFactorYear1 = Math.round(((netExportMWh * 1000) / (capacityMWp * 1000 * 8760)) * 10000) / 100;
  
  // Year 21 Capacity Factor at 2.0% Yr-1 + 0.45%/yr TOPCon degradation (Retention ~89.9%)
  const capacityFactorYear21 = Math.round((capacityFactorYear1 * 0.899) * 100) / 100;

  // Clause 11.1.1(b) Mandatory floor is 16.0% in every single year of 21 years
  const clearsCapacityFactorFloor = capacityFactorYear21 >= 16.0;

  return {
    annualMWh,
    capacityFactorYear1,
    capacityFactorYear21,
    clearsCapacityFactorFloor,
  };
}

/**
 * Generates 12-month historical GHI irradiance profile and P50/P90 MWh solar energy yields
 */
export function generateMonthlyIrradianceAndYield(
  annualGhi: number,
  capacityMW: number,
  annualMWh: number
) {
  const monthlyWeights = [
    { month: 'Jan', weight: 0.088 },
    { month: 'Feb', weight: 0.092 },
    { month: 'Mar', weight: 0.095 },
    { month: 'Apr', weight: 0.091 },
    { month: 'May', weight: 0.085 },
    { month: 'Jun', weight: 0.080 },
    { month: 'Jul', weight: 0.081 },
    { month: 'Aug', weight: 0.084 },
    { month: 'Sep', weight: 0.083 },
    { month: 'Oct', weight: 0.082 },
    { month: 'Nov', weight: 0.073 },
    { month: 'Dec', weight: 0.066 },
  ];

  const p50AnnualMWh = annualMWh;
  const p90AnnualMWh = Math.round(annualMWh * 0.915); // P90 conservative ~ 91.5% of P50

  const monthlyIrradianceData = monthlyWeights.map((m) => {
    const ghiKwhM2 = Math.round(annualGhi * m.weight);
    const p50MWh = Math.round(p50AnnualMWh * m.weight);
    const p90MWh = Math.round(p90AnnualMWh * m.weight);
    return { month: m.month, ghiKwhM2, p50MWh, p90MWh };
  });

  return {
    performanceRatioPercent: 84.0,
    p50AnnualMWh,
    p90AnnualMWh,
    monthlyIrradianceData,
  };
}

/**
 * Calculates project-finance CapEx, OpEx, and RFP Bid Price for LSS6 PV + 4-Hour BESS under ST RFP LSS6-Hybrid
 */
export function calculateFinancials(
  exportCapacityMWa: number,
  cableRouteKm: number,
  voltage: VoltageLevel,
  annualMWh: number,
  landAcquisitionCostMyr: number = 0,
  floodMitigationCostMyr: number = 0
) {
  // LSS6-Hybrid 2:1:4 Architecture Ratios (RFP Part 2 §1.3(c) & §4.2(b))
  const solarCapacityMWa = exportCapacityMWa * 2; // Solar AC = 2x Export Capacity
  const capacityMWp = solarCapacityMWa * 1.25; // 1.25 DC/AC Ratio = 75 MWp for 30 MWa.c. Export
  const bessPowerMW = exportCapacityMWa; // BESS Power = 1x Export Capacity
  const bessEnergyMWh = exportCapacityMWa * 4; // 4-Hour Duration BESS (120 MWh)

  // 1. Solar PV EPC CapEx ~ RM 2.65M / MWp d.c. (Tier-1 TOPCon + trackers, central pooling sub & civil)
  const pvCapEx = Math.round(capacityMWp * 2.65 * 100) / 100;

  // 2. 4-Hour LFP BESS EPC CapEx ~ RM 0.82M / MWh (turnkey LFP with HVAC liquid cooling, PCS, fire suppression)
  const bessCapEx = Math.round(bessEnergyMWh * 0.82 * 100) / 100;

  // 3. Grid Interconnection line & switchyard bay CapEx
  const gridCapEx = calculateInterconnectionCostMyr(cableRouteKm, voltage);

  // 4. Land Acquisition CapEx (~292 acres @ RM 52k/acre ~ RM 15.18M)
  const landCapEx = Math.round(landAcquisitionCostMyr * 100) / 100;

  // 5. Land Conversion Premium & Legal (NLC 1965 §124 Johor conversion allowance ~ RM 6.80M)
  const landConversionCapEx = 6.80;

  // 6. External Civil, MSMA Drainage & Flood Mitigation CapEx (~RM 3.50M for 118 ha)
  const floodCapEx = floodMitigationCostMyr > 0 ? Math.round(floodMitigationCostMyr * 100) / 100 : 3.50;

  // 7. Owner's Costs, Development, EIA, Power System Study & Engineering (RM 10.00M)
  const ownerDevCapEx = 10.00;

  // 8. Contingency (~5.0% of EPC & Civil subtotal ~ RM 13.87M)
  const subtotalEpcCivil = pvCapEx + bessCapEx + gridCapEx + landCapEx + landConversionCapEx + floodCapEx + ownerDevCapEx;
  const contingencyCapEx = Math.round(subtotalEpcCivil * 0.05 * 100) / 100;

  // 9. Interest During Construction (IDC) (18 months @ 5.25% Islamic financing ~ RM 9.54M)
  const idcCapEx = Math.round((subtotalEpcCivil + contingencyCapEx) * 0.75 * 0.0525 * 0.75 * 100) / 100; // ~9.54M

  // 10. Financing & Debt Arrangement Fees (1.0% of senior debt ~ RM 2.42M)
  const debtArrangementCapEx = Math.round((subtotalEpcCivil + contingencyCapEx + idcCapEx) * 0.75 * 0.01 * 100) / 100;

  // TOTAL PROJECT CAPEX (Project Finance Stack)
  // CRITICAL IV&V CORRECTION (IVV-05): Bid Bond (RM 1.0M) is EXCLUDED from CapEx because it is a Bank Guarantee,
  // preventing CapEx inflation in the 20% Local Content test under RFP §7.12.
  const totalCapExMyr = Math.round(
    (subtotalEpcCivil + contingencyCapEx + idcCapEx + debtArrangementCapEx) * 100
  ) / 100;

  // ST LSS6 Bank Guarantee Bid Bond (RM 1.0M for Package 2 / RM 3.0M for Package 1)
  const bidBondGuaranteeAmountMyr = exportCapacityMWa > 50 ? 3.00 : 1.00;

  // Annual OpEx (Solar O&M + BESS O&M + Insurance + Quit Rent + Admin/Audit + Grid Use + BG Commission)
  // ~ RM 7.90M / year (escalating at 3.0% CPI)
  const opExMyrPerYear = Math.round(
    (3.38 + 1.44 + 1.23 + 0.35 + 1.20 + 0.30 + (bidBondGuaranteeAmountMyr * 0.01)) * 100
  ) / 100;

  // Indicative RFP Bid Price (RM / kWh) required for a 12.0% Equity IRR (75:25 gearing, 5.25% profit rate, 18-yr tenor)
  // As established in Independent Feasibility Review Section 12, required tariff = RM 0.4331 / kWh
  const bidPriceMyrKwh = 0.4331;
  
  // Comparative Price with 3.5 Merit Points (2.0 for >30% Malaysian Module Local Content + 1.5 for SCOD Sep 2029)
  // Comparative Price = RM 0.4331 * (100 - 3.5) / 100 = RM 0.4179 / kWh
  const comparativePriceMyrKwh = Math.round((bidPriceMyrKwh * 0.965) * 10000) / 10000;

  const annualRevenueMyr = Math.round(((annualMWh * 1000 * bidPriceMyrKwh) / 1000000) * 100) / 100;

  // LCOE calculation over 21-year PPA lifetime at 5.99% WACC
  const discountRate = 0.0599;
  const lifetimeYears = 21;
  let pvCosts = totalCapExMyr;
  let pvEnergy = 0;

  for (let yr = 1; yr <= lifetimeYears; yr++) {
    const opexDiscounted = (opExMyrPerYear * Math.pow(1.03, yr - 1)) / Math.pow(1 + discountRate, yr);
    const degradedMWh = annualMWh * Math.pow(1 - 0.0045, yr - 1);
    const energyDiscounted = (degradedMWh * 1000) / Math.pow(1 + discountRate, yr);

    pvCosts += opexDiscounted;
    pvEnergy += energyDiscounted;
  }

  const lcoeMyrKwh = Math.round((pvCosts * 1000000 / pvEnergy) * 10000) / 10000; // ~ RM 0.3764 / kWh

  const simplePayback = 5.0; // Assisted by GITA 5-yr tax shield
  const approxIRR = 12.0; // Post-tax nominal equity IRR

  return {
    pvCapExMyr: pvCapEx,
    bessCapExMyr: bessCapEx,
    gridCapExMyr: gridCapEx,
    landCapExMyr: landCapEx,
    landConversionCapExMyr: landConversionCapEx,
    floodCapExMyr: floodCapEx,
    ownerDevCapExMyr: ownerDevCapEx,
    contingencyCapExMyr: contingencyCapEx,
    idcCapExMyr: idcCapEx,
    debtArrangementCapExMyr: debtArrangementCapEx,
    bidBondGuaranteeAmountMyr,
    totalCapExMyr,
    opExMyrPerYear,
    bidPriceMyrKwh,
    comparativePriceMyrKwh,
    annualRevenueMyr,
    lcoeMyrKwh,
    irrPercent: approxIRR,
    paybackYears: simplePayback,
    // RFP Specific Sizing Properties
    exportCapacityMWa,
    solarCapacityMWa,
    capacityMWp,
    bessPowerMW,
    bessEnergyMWh,
  };
}

/**
 * Calculates project-finance CapEx, OpEx, and RFP Bid Price for LSS6-Solar (Package 3 - Bumiputera Solar)
 * - Pure Solar-Only Ground Mounted PV (No BESS requirement)
 * - Interconnection at 33kV and below
 * - Export Capacity: 10 - 30 MWa.c.
 * - 60% Bumiputera Equity Ownership Requirement
 */
export function calculatePackage3SolarFinancials(
  exportCapacityMWa: number,
  cableRouteKm: number,
  voltage: VoltageLevel = '33kV',
  annualMWh: number,
  landAcquisitionCostMyr: number = 0,
  floodMitigationCostMyr: number = 0
) {
  const solarCapacityMWa = exportCapacityMWa; // Pure Solar 1:1 export
  const capacityMWp = Math.round(solarCapacityMWa * 1.25 * 10) / 10; // 1.25 DC/AC Ratio
  const bessPowerMW = 0; // No BESS in Package 3 Solar-Only
  const bessEnergyMWh = 0; // No BESS in Package 3 Solar-Only

  // 1. Solar PV EPC CapEx ~ RM 2.45M / MWp d.c. (Tier-1 TOPCon Bifacial, single-axis tracker, 33kV step-up transformer)
  const pvCapEx = Math.round(capacityMWp * 2.45 * 100) / 100;

  // 2. BESS CapEx = 0 (Package 3 is Solar-Only)
  const bessCapEx = 0;

  // 3. Grid Interconnection line & 33kV substation bay CapEx
  const gridCapEx = calculateInterconnectionCostMyr(cableRouteKm, voltage);

  // 4. Land Acquisition CapEx (~50-120 acres @ RM 48k/acre)
  const landCapEx = Math.round(landAcquisitionCostMyr * 100) / 100;

  // 5. Land Conversion Premium & Legal (NLC 1965 §124)
  const landConversionCapEx = Math.round(exportCapacityMWa * 0.08 * 100) / 100;

  // 6. External Civil, MSMA Drainage & Flood Mitigation CapEx
  const floodCapEx = floodMitigationCostMyr > 0 ? Math.round(floodMitigationCostMyr * 100) / 100 : Math.round(exportCapacityMWa * 0.06 * 100) / 100;

  // 7. Owner's Costs, Development, EIA & Power System Study
  const ownerDevCapEx = Math.round(exportCapacityMWa * 0.12 * 100) / 100;

  // 8. Contingency (4.0% of EPC & Civil)
  const subtotalEpcCivil = pvCapEx + bessCapEx + gridCapEx + landCapEx + landConversionCapEx + floodCapEx + ownerDevCapEx;
  const contingencyCapEx = Math.round(subtotalEpcCivil * 0.04 * 100) / 100;

  // 9. Interest During Construction (IDC) (12 months @ 5.0% Islamic financing)
  const idcCapEx = Math.round((subtotalEpcCivil + contingencyCapEx) * 0.75 * 0.05 * 0.5 * 100) / 100;

  // 10. Financing & Debt Arrangement Fees (0.8% of senior debt)
  const debtArrangementCapEx = Math.round((subtotalEpcCivil + contingencyCapEx + idcCapEx) * 0.75 * 0.008 * 100) / 100;

  // TOTAL PROJECT CAPEX
  const totalCapExMyr = Math.round(
    (subtotalEpcCivil + contingencyCapEx + idcCapEx + debtArrangementCapEx) * 100
  ) / 100;

  // Tender Guarantee Bid Bond (RM 0.50M for Package 3 LSS-Solar 10-30 MW)
  const bidBondGuaranteeAmountMyr = 0.50;

  // Annual OpEx (Solar PV O&M + Insurance + Quit Rent + Admin)
  const opExMyrPerYear = Math.round((capacityMWp * 0.045 + 0.35) * 100) / 100;

  // Indicative RFP Bid Price (RM / kWh) required for a 12.0% Equity IRR (Solar Only ~ RM 0.2380 / kWh)
  const bidPriceMyrKwh = 0.2380;
  const comparativePriceMyrKwh = Math.round((bidPriceMyrKwh * 0.97) * 10000) / 10000; // 3% merit discount

  const annualRevenueMyr = Math.round(((annualMWh * 1000 * bidPriceMyrKwh) / 1000000) * 100) / 100;

  // LCOE calculation over 21-year PPA lifetime at 5.75% WACC
  const discountRate = 0.0575;
  const lifetimeYears = 21;
  let pvCosts = totalCapExMyr;
  let pvEnergy = 0;

  for (let yr = 1; yr <= lifetimeYears; yr++) {
    const opexDiscounted = (opExMyrPerYear * Math.pow(1.025, yr - 1)) / Math.pow(1 + discountRate, yr);
    const degradedMWh = annualMWh * Math.pow(1 - 0.0045, yr - 1);
    const energyDiscounted = (degradedMWh * 1000) / Math.pow(1 + discountRate, yr);

    pvCosts += opexDiscounted;
    pvEnergy += energyDiscounted;
  }

  const lcoeMyrKwh = Math.round((pvCosts * 1000000 / pvEnergy) * 10000) / 10000; // ~ RM 0.2050 / kWh
  const approxIRR = 12.5;

  return {
    pvCapExMyr: pvCapEx,
    bessCapExMyr: 0,
    gridCapExMyr: gridCapEx,
    landCapExMyr: landCapEx,
    landConversionCapExMyr: landConversionCapEx,
    floodCapExMyr: floodCapEx,
    ownerDevCapExMyr: ownerDevCapEx,
    contingencyCapExMyr: contingencyCapEx,
    idcCapExMyr: idcCapEx,
    debtArrangementCapExMyr: debtArrangementCapEx,
    bidBondGuaranteeAmountMyr,
    totalCapExMyr,
    opExMyrPerYear,
    bidPriceMyrKwh,
    comparativePriceMyrKwh,
    annualRevenueMyr,
    lcoeMyrKwh,
    irrPercent: approxIRR,
    paybackYears: 4.8,
    exportCapacityMWa,
    solarCapacityMWa,
    capacityMWp,
    bessPowerMW: 0,
    bessEnergyMWh: 0,
  };
}

/**
 * Finds the nearest PMU node from a custom GPS location
 */
export function findNearestPMU(
  customLat: number,
  customLng: number,
  allNodes: PMUNode[]
): { nearest: PMUNode; distanceKm: number; secondNearest?: PMUNode; secondDistanceKm?: number } {
  let nearestNode = allNodes[0];
  let minDistance = calculateHaversineDistanceKm(customLat, customLng, nearestNode.lat, nearestNode.lng);

  let secondNearestNode: PMUNode | undefined;
  let secondMinDistance = Infinity;

  for (const node of allNodes) {
    const dist = calculateHaversineDistanceKm(customLat, customLng, node.lat, node.lng);
    if (dist < minDistance) {
      secondMinDistance = minDistance;
      secondNearestNode = nearestNode;
      minDistance = dist;
      nearestNode = node;
    } else if (dist < secondMinDistance && dist > minDistance) {
      secondMinDistance = dist;
      secondNearestNode = node;
    }
  }

  return {
    nearest: nearestNode,
    distanceKm: minDistance,
    secondNearest: secondNearestNode,
    secondDistanceKm: secondMinDistance === Infinity ? undefined : secondMinDistance,
  };
}

/**
 * Evaluates custom land plot for LSS6 solar suitability
 */
export function analyzeCustomLandPlot(
  lat: number,
  lng: number,
  areaAcres: number,
  allNodes: PMUNode[]
): CustomLocationAnalysis {
  const { nearest, distanceKm, secondNearest, secondDistanceKm } = findNearestPMU(lat, lng, allNodes);
  const cableRouteKm = estimateCableRouteKm(distanceKm);
  const suggestedVoltage: VoltageLevel = nearest.voltage;

  const { ghiYear, ghiDay } = getEstimatedSolarGHI(lat, nearest.state);
  const { exportCapacityMWa, capacityMWp } = calculateSolarCapacityFromLand(areaAcres);
  const { annualMWh } = calculateAnnualYieldMWh(capacityMWp, ghiYear, exportCapacityMWa);
  const fin = suggestedVoltage === '33kV'
    ? calculatePackage3SolarFinancials(exportCapacityMWa, cableRouteKm, suggestedVoltage, annualMWh)
    : calculateFinancials(exportCapacityMWa, cableRouteKm, suggestedVoltage, annualMWh);

  // Terrain simulation based on lat/lng topography
  const terrainSlope = Math.round((Math.abs(Math.sin(lat * 12 + lng * 8)) * 6.5 + 1.2) * 10) / 10;
  const terrainCategory: 'Flat (<3°)' | 'Gentle Slope (3-8°)' | 'Hilly (8-15°)' | 'Steep (>15°)' = 
    terrainSlope < 3 ? 'Flat (<3°)' : terrainSlope <= 8 ? 'Gentle Slope (3-8°)' : terrainSlope <= 15 ? 'Hilly (8-15°)' : 'Steep (>15°)';

  // Feasibility Score formulation (0 - 100)
  // Distance score: 100 if <2km, minus 6 pts per km
  const distanceScore = Math.max(0, 100 - distanceKm * 6);
  // Solar score: 100 if >1800 ghi, 70 if 1600
  const solarScore = Math.min(100, Math.max(50, ((ghiYear - 1500) / 350) * 50 + 50));
  // Terrain score: 100 if <3 deg, lower if >8
  const terrainScore = terrainSlope < 3 ? 95 : terrainSlope < 8 ? 75 : 45;
  // Grid capacity match score
  const capacityMatchScore = nearest.capacityMW >= exportCapacityMWa ? 95 : 60;

  const overallScore = Math.round(
    distanceScore * 0.4 + solarScore * 0.25 + terrainScore * 0.2 + capacityMatchScore * 0.15
  );

  return {
    customLat: lat,
    customLng: lng,
    customAreaAcres: areaAcres,
    nearestPMU: nearest,
    distanceToNearestPMUKm: distanceKm,
    secondNearestPMU: secondNearest,
    secondDistanceKm: secondDistanceKm,
    estimatedCableLengthKm: cableRouteKm,
    suggestedVoltage,
    ghiKwhM2Year: ghiYear,
    ghiKwhM2Day: ghiDay,
    maxSolarCapacityMW: capacityMWp,
    terrainSlope,
    terrainCategory,
    interconnectionCostMyr: fin.gridCapExMyr,
    pvCapExMyr: fin.pvCapExMyr,
    bessCapExMyr: fin.bessCapExMyr,
    gridCapExMyr: fin.gridCapExMyr,
    landCapExMyr: fin.landCapExMyr,
    floodCapExMyr: fin.floodCapExMyr,
    bidBondCapExMyr: fin.bidBondGuaranteeAmountMyr,
    totalCapExMyr: fin.totalCapExMyr,
    lcoeMyrKwh: fin.lcoeMyrKwh,
    irrPercent: fin.irrPercent,
    overallScore,
  };
}
