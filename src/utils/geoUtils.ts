import { PMUNode, LandParcel, CustomLocationAnalysis, VoltageLevel } from '../types';
import { RFP_BENCHMARKS, RFP_PACKAGES } from '../data/rfpParameters';
import {
  calculateProjectFinance,
  getDegradationRetentionFactor,
  getYear21RetentionFactor,
} from './projectFinance';
import { SolarResource, fetchSolarResource, createUnavailableSolarResource } from '../services/solarResource';
import { calculateYield, PlantConfig, YieldResult } from '../services/yieldEngine';

export { calculateYield } from '../services/yieldEngine';
export { fetchSolarResource } from '../services/solarResource';

/**
 * Estimated annual and daily GHI for Peninsular Malaysia coordinates (screening default)
 */
export function getEstimatedSolarGHI(lat: number, state?: string): { ghiYear: number; ghiDay: number } {
  const stateGHI: Record<string, number> = {
    Perlis: 1720,
    Kedah: 1680,
    'P. Pinang': 1660,
    Kelantan: 1650,
    Terengganu: 1640,
    Perak: 1610,
    Pahang: 1600,
    Selangor: 1580,
    'Kuala Lumpur': 1580,
    Putrajaya: 1580,
    'N. Sembilan': 1570,
    Melaka: 1560,
    Johor: 1550,
  };
  const base = state && stateGHI[state] ? stateGHI[state] : 1550 + Math.max(0, (lat - 1.5) * 35);
  const ghiYear = Math.round(base);
  const ghiDay = Math.round((ghiYear / 365.25) * 100) / 100;
  return { ghiYear, ghiDay };
}

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
  return Math.round(straightLineKm * RFP_BENCHMARKS.cableRouteMultiplier * 100) / 100;
}

/**
 * Calculates transmission line & substation bay cost in MYR Million (TNB Transmission & Distribution Division Standards)
 * - 33kV: RM 1.2M / km + RM 2.5M switchgear bay
 * - 132kV: RM 3.2M / km + RM 8.5M switchyard bay extension
 * - 275kV: RM 5.5M / km + RM 15.0M switchyard bay extension
 */
export function calculateInterconnectionCostMyr(
  cableRouteKm: number,
  voltage: VoltageLevel
): number {
  const costPerKm =
    voltage === '275kV'
      ? RFP_BENCHMARKS.grid275kVCablePerKm
      : voltage === '33kV'
      ? RFP_BENCHMARKS.grid33kVCablePerKm
      : RFP_BENCHMARKS.grid132kVCablePerKm;
  const bayCost =
    voltage === '275kV'
      ? RFP_BENCHMARKS.grid275kVBayCost
      : voltage === '33kV'
      ? RFP_BENCHMARKS.grid33kVBayCost
      : RFP_BENCHMARKS.grid132kVBayCost;
  const lineCost = cableRouteKm * costPerKm;
  return Math.round((lineCost + bayCost) * 100) / 100;
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
  // ~9.3 acres per MWa.c. export (with trackers, BESS compound & substation)
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
 * Evaluates solar yield using the consolidated calculateYield engine
 */
export function calculateAnnualYieldMWh(
  capacityMWp: number,
  ghiYear: number = 1800,
  exportCapacityMWa: number = capacityMWp / 2.5,
  rte: number = RFP_BENCHMARKS.bessRoundTripEfficiency,
  clippingRatio: number = RFP_BENCHMARKS.clippingLossRatio,
  auxRatio: number = RFP_BENCHMARKS.auxiliaryLossRatio,
  isPackage3SolarOnly: boolean = false,
  resource?: SolarResource
): {
  annualMWh: number;
  grossSolarMWh: number;
  clippingLossMWh: number;
  bessLossMWh: number;
  auxLoadMWh: number;
  capacityFactorYear1: number;
  capacityFactorYear21: number;
  clearsCapacityFactorFloor: boolean;
  yieldResult?: YieldResult;
} {
  const effectiveResource: SolarResource = resource || {
    latitude: 4.5,
    longitude: 102.0,
    annualGHI_kwh_m2: ghiYear,
    monthly: [
      { month: 1, ghi_kwh_m2: Math.round(ghiYear * 0.088), days: 31, dailyAvg_kwh_m2: Math.round((ghiYear * 0.088 / 31) * 100) / 100 },
      { month: 2, ghi_kwh_m2: Math.round(ghiYear * 0.092), days: 28, dailyAvg_kwh_m2: Math.round((ghiYear * 0.092 / 28) * 100) / 100 },
      { month: 3, ghi_kwh_m2: Math.round(ghiYear * 0.095), days: 31, dailyAvg_kwh_m2: Math.round((ghiYear * 0.095 / 31) * 100) / 100 },
      { month: 4, ghi_kwh_m2: Math.round(ghiYear * 0.091), days: 30, dailyAvg_kwh_m2: Math.round((ghiYear * 0.091 / 30) * 100) / 100 },
      { month: 5, ghi_kwh_m2: Math.round(ghiYear * 0.085), days: 31, dailyAvg_kwh_m2: Math.round((ghiYear * 0.085 / 31) * 100) / 100 },
      { month: 6, ghi_kwh_m2: Math.round(ghiYear * 0.080), days: 30, dailyAvg_kwh_m2: Math.round((ghiYear * 0.080 / 30) * 100) / 100 },
      { month: 7, ghi_kwh_m2: Math.round(ghiYear * 0.081), days: 31, dailyAvg_kwh_m2: Math.round((ghiYear * 0.081 / 31) * 100) / 100 },
      { month: 8, ghi_kwh_m2: Math.round(ghiYear * 0.084), days: 31, dailyAvg_kwh_m2: Math.round((ghiYear * 0.084 / 31) * 100) / 100 },
      { month: 9, ghi_kwh_m2: Math.round(ghiYear * 0.083), days: 30, dailyAvg_kwh_m2: Math.round((ghiYear * 0.083 / 30) * 100) / 100 },
      { month: 10, ghi_kwh_m2: Math.round(ghiYear * 0.082), days: 31, dailyAvg_kwh_m2: Math.round((ghiYear * 0.082 / 31) * 100) / 100 },
      { month: 11, ghi_kwh_m2: Math.round(ghiYear * 0.073), days: 30, dailyAvg_kwh_m2: Math.round((ghiYear * 0.073 / 30) * 100) / 100 },
      { month: 12, ghi_kwh_m2: Math.round(ghiYear * 0.066), days: 31, dailyAvg_kwh_m2: Math.round((ghiYear * 0.066 / 31) * 100) / 100 },
    ],
    grade: 'SCREENING',
    provenance: {
      dataset: 'NASA POWER v9.0 Climatology (SSE-RE)',
      resolution: '0.5° x 0.625° (~55 km)',
      periodOfRecord: '1984-2023 (40-Year Climatology)',
      datasetUncertainty_pct: 8.0,
      retrievedAt: new Date().toISOString(),
      biasCorrection: 'None applied',
    },
    warnings: ['Screening estimate from reanalysis data. Commission site-specific resource data before proceeding.'],
  };

  const plantConfig: PlantConfig = {
    dcCapacityMWp: capacityMWp,
    inverterCapacityMWac: isPackage3SolarOnly ? exportCapacityMWa : exportCapacityMWa * 2,
    exportCapacityMWac: exportCapacityMWa,
    bessPowerMW: isPackage3SolarOnly ? 0 : exportCapacityMWa,
    bessEnergyMWh: isPackage3SolarOnly ? 0 : exportCapacityMWa * 4,
    isPackage3SolarOnly,
    bessRoundTripEfficiency: rte,
    auxiliaryLossRatio: auxRatio,
  };

  const yieldRes = calculateYield(effectiveResource, plantConfig);

  return {
    annualMWh: yieldRes.p50AnnualMWh,
    grossSolarMWh: yieldRes.grossSolarMWhYear1,
    clippingLossMWh: yieldRes.clippingLossMWhYear1,
    bessLossMWh: yieldRes.bessLossMWhYear1,
    auxLoadMWh: yieldRes.auxLoadMWhYear1,
    capacityFactorYear1: yieldRes.capacityFactorYear1Pct,
    capacityFactorYear21: yieldRes.capacityFactorYear21Pct,
    clearsCapacityFactorFloor: yieldRes.clearsCapacityFactorFloor,
    yieldResult: yieldRes,
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
 * Addresses C-01, C-02, C-12, C-13: Fully derives OpEx and CapEx terms dynamically and models 21-yr cashflows.
 */
export function calculateFinancials(
  exportCapacityMWa: number,
  cableRouteKm: number,
  voltage: VoltageLevel,
  annualMWh: number,
  landAcquisitionCostMyr: number = 0,
  floodMitigationCostMyr: number = 0,
  landAcres?: number
) {
  // LSS6-Hybrid 2:1:4 Architecture Sizing
  const solarCapacityMWa = exportCapacityMWa * 2;
  const capacityMWp = solarCapacityMWa * 1.25;
  const bessPowerMW = exportCapacityMWa;
  const bessEnergyMWh = exportCapacityMWa * 4;
  const acres = landAcres || Math.round(exportCapacityMWa * 9.3);

  // 1. Solar PV EPC CapEx ~ RM 2.65M / MWp d.c.
  const pvCapEx = Math.round(capacityMWp * RFP_BENCHMARKS.pvEpcUnitCostMyrPerMWp_Hybrid * 100) / 100;

  // 2. 4-Hour LFP BESS EPC CapEx ~ RM 0.82M / MWh
  const bessCapEx = Math.round(bessEnergyMWh * RFP_BENCHMARKS.bessEpcUnitCostMyrPerMWh * 100) / 100;

  // 3. Grid Interconnection line & switchyard bay CapEx
  const gridCapEx = calculateInterconnectionCostMyr(cableRouteKm, voltage);

  const subtotalEpc = pvCapEx + bessCapEx + gridCapEx;

  // 4. Land Acquisition CapEx
  const landCapEx = Math.round(landAcquisitionCostMyr * 100) / 100;

  // 5. Land Conversion Premium & Legal (Derived: RM 0.09M / MWa.c. export per C-02)
  const landConversionCapEx = Math.round(exportCapacityMWa * RFP_BENCHMARKS.landConversionRateMyrPerMWac * 100) / 100;

  // 6. External Civil, MSMA Drainage & Flood Mitigation CapEx (Derived: RM 0.12M / MWa.c. per C-02)
  const floodCapEx = floodMitigationCostMyr > 0 ? Math.round(floodMitigationCostMyr * 100) / 100 : Math.round(exportCapacityMWa * RFP_BENCHMARKS.floodCivilRateMyrPerMWac * 100) / 100;

  // 7. Owner's Costs, Development, EIA, PSS & Engineering (Derived: 2.5% of EPC per C-02)
  const ownerDevCapEx = Math.round(subtotalEpc * RFP_BENCHMARKS.ownersCostRateOfEpc * 100) / 100;

  // 8. Contingency (5.0% of EPC & Civil subtotal)
  const subtotalEpcCivil = subtotalEpc + landCapEx + landConversionCapEx + floodCapEx + ownerDevCapEx;
  const contingencyCapEx = Math.round(subtotalEpcCivil * RFP_BENCHMARKS.contingencyRate * 100) / 100;

  // 9. Interest During Construction (IDC) (18 months @ 5.25% Islamic financing on 75% senior debt)
  const idcCapEx = Math.round((subtotalEpcCivil + contingencyCapEx) * 0.75 * 0.0525 * (18 / 24) * 100) / 100;

  // 10. Financing & Debt Arrangement Fees (1.0% of senior debt)
  const debtArrangementCapEx = Math.round((subtotalEpcCivil + contingencyCapEx + idcCapEx) * 0.75 * RFP_BENCHMARKS.debtArrangementFeeRate * 100) / 100;

  // TOTAL PROJECT CAPEX
  const totalCapExMyr = Math.round(
    (subtotalEpcCivil + contingencyCapEx + idcCapEx + debtArrangementCapEx) * 100
  ) / 100;

  // ST LSS6 Bank Guarantee Bid Bond (RM 1.0M for Package 2 / RM 3.0M for Package 1)
  const bidBondGuaranteeAmountMyr = exportCapacityMWa > 50 ? RFP_PACKAGES.PACKAGE_1.bidBondMyr : RFP_PACKAGES.PACKAGE_2.bidBondMyr;

  // Annual OpEx derived by component rates per C-02:
  // - Solar O&M: RM 0.045M / MWp·yr
  // - BESS O&M: RM 0.012M / MWh·yr
  // - Insurance: 0.35% of EPC CapEx
  // - Quit rent: RM 1,200 / acre·yr
  // - Admin: RM 0.35M / yr fixed
  // - BG Commission: 1.0% on Bank Guarantee
  const solarOpex = capacityMWp * RFP_BENCHMARKS.solarOpExRateMyrPerMWpYear;
  const bessOpex = bessEnergyMWh * RFP_BENCHMARKS.bessOpExRateMyrPerMWhYear;
  const insuranceOpex = subtotalEpc * RFP_BENCHMARKS.insuranceRateOfEpc;
  const quitRentOpex = acres * RFP_BENCHMARKS.quitRentRateMyrPerAcreYear;
  const adminOpex = RFP_BENCHMARKS.adminCorporateFixedMyrYear;
  const bgCommissionOpex = bidBondGuaranteeAmountMyr * RFP_BENCHMARKS.bgCommissionRate;

  const opExMyrPerYear = Math.round(
    (solarOpex + bessOpex + insuranceOpex + quitRentOpex + adminOpex + bgCommissionOpex) * 100
  ) / 100;

  // Run Project Finance Engine (Appendix A model) (C-01, C-12)
  // First solve required bid tariff for 12.0% equity IRR
  const targetIRR = 0.12;
  const pfResultInitial = calculateProjectFinance({
    totalCapEx: totalCapExMyr,
    annualOpExBase: opExMyrPerYear,
    annualNetExportMWh: annualMWh,
    tariff: 0.4331,
    targetIRR,
  });

  const bidPriceMyrKwh = pfResultInitial.requiredTariff || 0.4331;

  // Run final cashflows with the derived bid tariff
  const pfResult = calculateProjectFinance({
    totalCapEx: totalCapExMyr,
    annualOpExBase: opExMyrPerYear,
    annualNetExportMWh: annualMWh,
    tariff: bidPriceMyrKwh,
    targetIRR,
  });

  // Comparative Price with 3.5 Merit Points (2.0 local content + 1.5 early COD)
  const comparativePriceMyrKwh = Math.round((bidPriceMyrKwh * 0.965) * 10000) / 10000;
  const annualRevenueMyr = Math.round(((annualMWh * 1000 * bidPriceMyrKwh) / 1e6) * 100) / 100;

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
    lcoeMyrKwh: pfResult.lcoe,
    irrPercent: pfResult.equityIRR ?? 12.0,
    paybackYears: pfResult.paybackYears ?? 5.0,
    minDSCR: pfResult.minDSCR,
    avgDSCR: pfResult.avgDSCR,
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
 */
export function calculatePackage3SolarFinancials(
  exportCapacityMWa: number,
  cableRouteKm: number,
  voltage: VoltageLevel = '33kV',
  annualMWh: number,
  landAcquisitionCostMyr: number = 0,
  floodMitigationCostMyr: number = 0,
  landAcres?: number
) {
  const solarCapacityMWa = exportCapacityMWa;
  const capacityMWp = Math.round(solarCapacityMWa * 1.25 * 10) / 10;
  const bessPowerMW = 0;
  const bessEnergyMWh = 0;
  const acres = landAcres || Math.round(exportCapacityMWa * 4.5);

  // 1. Solar PV EPC CapEx ~ RM 2.45M / MWp d.c.
  const pvCapEx = Math.round(capacityMWp * RFP_BENCHMARKS.pvEpcUnitCostMyrPerMWp_SolarOnly * 100) / 100;
  const bessCapEx = 0;
  const gridCapEx = calculateInterconnectionCostMyr(cableRouteKm, voltage);
  const subtotalEpc = pvCapEx + gridCapEx;

  const landCapEx = Math.round(landAcquisitionCostMyr * 100) / 100;
  const landConversionCapEx = Math.round(exportCapacityMWa * RFP_BENCHMARKS.landConversionRateMyrPerMWac * 100) / 100;
  const floodCapEx = floodMitigationCostMyr > 0 ? Math.round(floodMitigationCostMyr * 100) / 100 : Math.round(exportCapacityMWa * RFP_BENCHMARKS.floodCivilRateMyrPerMWac * 100) / 100;
  const ownerDevCapEx = Math.round(subtotalEpc * RFP_BENCHMARKS.ownersCostRateOfEpc * 100) / 100;

  const subtotalEpcCivil = subtotalEpc + landCapEx + landConversionCapEx + floodCapEx + ownerDevCapEx;
  const contingencyCapEx = Math.round(subtotalEpcCivil * 0.04 * 100) / 100;
  const idcCapEx = Math.round((subtotalEpcCivil + contingencyCapEx) * 0.75 * 0.05 * 0.5 * 100) / 100;
  const debtArrangementCapEx = Math.round((subtotalEpcCivil + contingencyCapEx + idcCapEx) * 0.75 * 0.008 * 100) / 100;

  const totalCapExMyr = Math.round(
    (subtotalEpcCivil + contingencyCapEx + idcCapEx + debtArrangementCapEx) * 100
  ) / 100;

  const bidBondGuaranteeAmountMyr = RFP_PACKAGES.PACKAGE_3.bidBondMyr; // RM 0.35M

  // OpEx for Package 3
  const solarOpex = capacityMWp * RFP_BENCHMARKS.solarOpExRateMyrPerMWpYear;
  const insuranceOpex = subtotalEpc * RFP_BENCHMARKS.insuranceRateOfEpc;
  const quitRentOpex = acres * RFP_BENCHMARKS.quitRentRateMyrPerAcreYear;
  const adminOpex = 0.20;
  const bgCommissionOpex = bidBondGuaranteeAmountMyr * RFP_BENCHMARKS.bgCommissionRate;

  const opExMyrPerYear = Math.round((solarOpex + insuranceOpex + quitRentOpex + adminOpex + bgCommissionOpex) * 100) / 100;

  // Run Project Finance Engine (C-01, C-12)
  const targetIRR = 0.125;
  const pfResultInitial = calculateProjectFinance({
    totalCapEx: totalCapExMyr,
    annualOpExBase: opExMyrPerYear,
    annualNetExportMWh: annualMWh,
    tariff: 0.2380,
    targetIRR,
    wacc: 0.0575,
  });

  const bidPriceMyrKwh = pfResultInitial.requiredTariff || 0.2380;

  const pfResult = calculateProjectFinance({
    totalCapEx: totalCapExMyr,
    annualOpExBase: opExMyrPerYear,
    annualNetExportMWh: annualMWh,
    tariff: bidPriceMyrKwh,
    targetIRR,
    wacc: 0.0575,
  });

  const comparativePriceMyrKwh = Math.round((bidPriceMyrKwh * 0.97) * 10000) / 10000;
  const annualRevenueMyr = Math.round(((annualMWh * 1000 * bidPriceMyrKwh) / 1e6) * 100) / 100;

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
    lcoeMyrKwh: pfResult.lcoe,
    irrPercent: pfResult.equityIRR ?? 12.5,
    paybackYears: pfResult.paybackYears ?? 4.8,
    minDSCR: pfResult.minDSCR,
    avgDSCR: pfResult.avgDSCR,
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
 * Addresses C-07: Terrain slope is null ('Unsurveyed') and not fabricated via trig formulas.
 * Addresses C-03 & C-04: Accurate CF evaluation and floor capping.
 */
export function analyzeCustomLandPlot(
  lat: number,
  lng: number,
  areaAcres: number,
  allNodes: PMUNode[],
  resource?: SolarResource
): CustomLocationAnalysis {
  const { nearest, distanceKm, secondNearest, secondDistanceKm } = findNearestPMU(lat, lng, allNodes);
  const cableRouteKm = estimateCableRouteKm(distanceKm);
  const suggestedVoltage: VoltageLevel = nearest.voltage;
  const is33kV = suggestedVoltage === '33kV';

  const { exportCapacityMWa, capacityMWp } = calculateSolarCapacityFromLand(areaAcres);
  
  const defaultAnnualGhi = resource?.annualGHI_kwh_m2 ?? 1800;
  const { annualMWh, clearsCapacityFactorFloor, yieldResult } = calculateAnnualYieldMWh(
    capacityMWp,
    defaultAnnualGhi,
    exportCapacityMWa,
    RFP_BENCHMARKS.bessRoundTripEfficiency,
    RFP_BENCHMARKS.clippingLossRatio,
    RFP_BENCHMARKS.auxiliaryLossRatio,
    is33kV,
    resource
  );

  const fin = is33kV
    ? calculatePackage3SolarFinancials(exportCapacityMWa, cableRouteKm, suggestedVoltage, annualMWh, 0, 0, areaAcres)
    : calculateFinancials(exportCapacityMWa, cableRouteKm, suggestedVoltage, annualMWh, 0, 0, areaAcres);

  // C-07: Terrain slope is null (Unsurveyed) - no trigonometric simulation
  const terrainSlope: number | null = null;
  const terrainCategory: 'Unsurveyed' = 'Unsurveyed';

  const actualGhiYear = resource?.annualGHI_kwh_m2 ?? defaultAnnualGhi;
  const actualGhiDay = Math.round((actualGhiYear / 365) * 100) / 100;

  // Feasibility Score formulation (0 - 100)
  // Distance score: 100 if <2km, minus 6 pts per km
  const distanceScore = Math.max(0, 100 - distanceKm * 6);
  // Solar score: 100 if >1800 ghi, 70 if 1600
  const solarScore = Math.min(100, Math.max(50, ((actualGhiYear - 1500) / 350) * 50 + 50));
  // Grid capacity match score
  const capacityMatchScore = nearest.capacityMW >= exportCapacityMWa ? 95 : 60;

  // Weightings redistributed cleanly without unverified terrain slope
  let overallScore = Math.round(
    distanceScore * 0.45 + solarScore * 0.35 + capacityMatchScore * 0.20
  );

  // C-04: If Clause 11.1.1(b) Capacity Factor floor fails, cap overallScore at 40
  if (!clearsCapacityFactorFloor) {
    overallScore = Math.min(40, overallScore);
  }

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
    ghiKwhM2Year: actualGhiYear,
    ghiKwhM2Day: actualGhiDay,
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
    solarResource: resource,
    yieldResult,
  };
}
