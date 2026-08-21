// Consolidated Solar Yield Engine & Declared Loss Stack
// Reference: ZK/SPEC/2026/08-001 Scope: Tasks 2, 3, 4, 5, 6, 7, 8

import { SolarResource, MonthlyIrradiance, ACTUAL_MONTH_DAYS, MONTH_NAMES } from './solarResource';

export interface LossStackConfig {
  // Transposition & Tracking Gains (IEC 61724 GTI/GHI)
  transpositionGain: number; // 1.03 default: Fixed tilt ~10° optimal tilt at ~6°N Peninsular Malaysia (+2% to +4%)
  isSingleAxisTracking: boolean; // Tracking gain modeled separately (+12% to +18%)
  trackingGain: number; // 1.14 default: Single-axis tracking at equatorial latitude
  tiltAngleDeg: number; // ~10° optimal fixed tilt in Peninsular Malaysia
  transpositionModelName: string; // e.g. "Fixed-Tilt ~10° Transposition Model (Hay-Davies/Perez)"

  // Module & Optical Gains / Losses
  bifacialGain: number; // 1.04: grass/soil albedo ~0.20; raise only with albedo evidence
  soilingLoss: number; // 0.980: equatorial rainfall aids cleaning; raise loss near palm plantations
  shadingLoss: number; // 0.985: row-to-row + near horizon shading
  iamLoss: number; // 0.990: incidence angle modifier

  // Electrical & Module Quality Losses
  moduleQualityLidLoss: number; // 0.985: module quality tolerance & initial light induced degradation
  mismatchLoss: number; // 0.980: string & module electrical mismatch
  dcWiringLoss: number; // 0.985: DC string & main collector cable ohmic losses
  temperatureLoss: number; // 0.910: critical Malaysian NOCT cell operating conditions (routinely 55-65°C)

  // Inverter & Power Conversion
  inverterEfficiencyLoss: number; // 0.980: inverter AC conversion efficiency (CEC/Euro weighted)

  // AC Collection & Plant Losses
  acWiringTransformerLoss: number; // 0.985: MV collection & main step-up transformer losses
  plantAvailabilityLoss: number; // 0.980: planned balance-of-plant maintenance & scheduled downtime
  gridAvailabilityLoss: number; // 0.990: TNB transmission network outage / dispatch curtailment
}

export const DEFAULT_LOSS_STACK: LossStackConfig = {
  transpositionGain: 1.03, // fixed tilt, ~10°, 6°N (+3% gain)
  isSingleAxisTracking: false,
  trackingGain: 1.14, // single-axis tracker gain (+14%)
  tiltAngleDeg: 10,
  transpositionModelName: 'Fixed-Tilt 10° Transposition (Hay-Davies/Isotropic Model)',
  bifacialGain: 1.04, // grass albedo ~0.20
  soilingLoss: 0.980, // equatorial rainfall aids cleaning; raise loss near plantations
  shadingLoss: 0.985, // row-to-row + near shading
  iamLoss: 0.990, // incidence angle modifier
  moduleQualityLidLoss: 0.985, // module quality / LID
  mismatchLoss: 0.980, // module mismatch
  dcWiringLoss: 0.985, // DC wiring
  temperatureLoss: 0.910, // critical — Malaysian NOCT conditions, cell temp routinely 55-65°C
  inverterEfficiencyLoss: 0.980, // inverter efficiency
  acWiringTransformerLoss: 0.985, // AC wiring + transformer
  plantAvailabilityLoss: 0.980, // plant availability
  gridAvailabilityLoss: 0.990, // grid availability
};

export interface PlantConfig {
  dcCapacityMWp: number; // DC Peak Capacity (MWp)
  inverterCapacityMWac: number; // Inverter AC rating (MWa.c.)
  exportCapacityMWac: number; // Grid Export Capacity (MWa.c.)
  bessPowerMW?: number; // BESS Power (MW)
  bessEnergyMWh?: number; // BESS Energy (MWh) - 4-hour duration
  lossStack?: Partial<LossStackConfig>;
  isPackage3SolarOnly?: boolean;
  isEastCoastMonsoon?: boolean;
  bessRoundTripEfficiency?: number; // default 0.85
  auxiliaryLossRatio?: number; // default 0.010 (1.0%)
}

export interface LossItemDetail {
  stage: string;
  factor: number;
  type: 'gain' | 'loss';
  percentStr: string;
  notes: string;
}

export interface UncertaintyComponents {
  sigmaInterannual_pct: number; // e.g. 3.5% (4.5% east coast)
  sigmaDataset_pct: number; // from resource.provenance (e.g. 8.0% NASA, 3.5% TMY)
  sigmaModel_pct: number; // 3.0%
  sigmaDegradation_pct: number; // 1.5%
  sigmaTotal_pct: number; // quadrature sum
}

export interface MonthlyYieldDetail {
  month: number;
  monthName: string;
  days: number;
  ghi_kwh_m2: number;
  dailyAvgGhi_kwh_m2: number;
  gti_kwh_m2: number;
  impliedPR: number;
  grossYieldMWh: number;
  netYieldMWh: number;
}

export interface YearCapacityFactorDetail {
  year: number;
  retentionFactor: number;
  netEnergyMWh: number;
  capacityFactorPct: number;
  clearsFloor: boolean;
}

export interface YieldResult {
  isCalculable: boolean;
  unavailableReason?: string;

  // Resource Inputs
  annualGHI_kwh_m2: number;
  annualGTI_kwh_m2: number;
  transpositionModel: string;
  tiltAngleDeg: number;
  effectiveTranspositionGain: number;

  // Capacity & Ratings
  dcCapacityMWp: number;
  inverterCapacityMWac: number;
  exportCapacityMWac: number;
  dcAcRatio: number;
  clippingFactor: number;
  clippingWarning?: string;

  // LSS6-Hybrid 2:1:4 Architecture Validation
  hybridArchitectureValid: boolean;
  hybridArchitectureNotes?: string;

  // Loss Stack & Performance Ratio
  lossChain: LossItemDetail[];
  performanceRatio: number; // e.g. 0.785 (78.5%)
  performanceRatioPercent: number;
  prWarning?: string;
  specificYieldKWhKWp: number; // kWh/kWp/year

  // Energy Production Metrics
  grossSolarMWhYear1: number;
  clippingLossMWhYear1: number;
  bessLossMWhYear1: number;
  auxLoadMWhYear1: number;
  netExportMWhYear1: number; // P50 Year 1
  p50AnnualMWh: number;

  // P90 Exceedance Derivation (Task 6)
  uncertainty: UncertaintyComponents;
  p90_1Year_MWh: number;
  p90_10Year_MWh: number;
  p90_20Year_MWh: number;

  // Monthly Breakdown (Task 2 & Task 6)
  monthlyYield: MonthlyYieldDetail[];

  // 21-Year Capacity Factor Gate (Task 7)
  capacityFactorYear1Pct: number;
  capacityFactorYear21Pct: number;
  minimumCapacityFactorPct: number;
  failingYear: number | null;
  clearsCapacityFactorFloor: boolean; // Must be >= 16.0% in every single year of 21 years
  feasibilityVerdict: 'ELIGIBLE' | 'NOT ELIGIBLE';
  feasibilityReason: string;
  yearlyProfile: YearCapacityFactorDetail[];
}

/**
 * Computes clipping loss factor based on DC:AC ratio (Task 5)
 */
export function deriveClippingFactor(dcAcRatio: number): { factor: number; warning?: string } {
  if (dcAcRatio <= 1.20) {
    return { factor: 1.000 };
  } else if (dcAcRatio <= 1.30) {
    // Linear approximation between 1.20 and 1.30 (loss up to 0.5%)
    const loss = (dcAcRatio - 1.20) * 0.05;
    return { factor: Math.round((1.0 - loss) * 10000) / 10000 };
  } else {
    // Above 1.30: Material clipping loss requiring hourly simulation warning
    const loss = 0.005 + (dcAcRatio - 1.30) * 0.08;
    return {
      factor: Math.round((1.0 - Math.min(0.15, loss)) * 10000) / 10000,
      warning: 'Clipping at this DC:AC ratio requires hourly simulation. Annual approximation not valid.',
    };
  }
}

/**
 * Consolidate Yield Engine (Task 8)
 * Single exported function to calculate solar yield across all platform consumers.
 */
export function calculateYield(
  resource: SolarResource,
  config: PlantConfig
): YieldResult {
  // 1. Fail Loud on UNAVAILABLE or missing resource (Hard Rule 1 & 6, Task 1c)
  if (
    resource.grade === 'UNAVAILABLE' ||
    resource.annualGHI_kwh_m2 === null ||
    isNaN(resource.annualGHI_kwh_m2) ||
    resource.monthly.length !== 12
  ) {
    return {
      isCalculable: false,
      unavailableReason: resource.warnings.join(' ') || 'Solar irradiance data unavailable from named provider.',
      annualGHI_kwh_m2: 0,
      annualGTI_kwh_m2: 0,
      transpositionModel: 'Unavailable',
      tiltAngleDeg: 10,
      effectiveTranspositionGain: 1.0,
      dcCapacityMWp: config.dcCapacityMWp,
      inverterCapacityMWac: config.inverterCapacityMWac,
      exportCapacityMWac: config.exportCapacityMWac,
      dcAcRatio: config.inverterCapacityMWac > 0 ? config.dcCapacityMWp / config.inverterCapacityMWac : 1.25,
      clippingFactor: 1.0,
      hybridArchitectureValid: false,
      lossChain: [],
      performanceRatio: 0,
      performanceRatioPercent: 0,
      specificYieldKWhKWp: 0,
      grossSolarMWhYear1: 0,
      clippingLossMWhYear1: 0,
      bessLossMWhYear1: 0,
      auxLoadMWhYear1: 0,
      netExportMWhYear1: 0,
      p50AnnualMWh: 0,
      uncertainty: {
        sigmaInterannual_pct: 3.5,
        sigmaDataset_pct: 8.0,
        sigmaModel_pct: 3.0,
        sigmaDegradation_pct: 1.5,
        sigmaTotal_pct: 9.39,
      },
      p90_1Year_MWh: 0,
      p90_10Year_MWh: 0,
      p90_20Year_MWh: 0,
      monthlyYield: [],
      capacityFactorYear1Pct: 0,
      capacityFactorYear21Pct: 0,
      minimumCapacityFactorPct: 0,
      failingYear: 1,
      clearsCapacityFactorFloor: false,
      feasibilityVerdict: 'NOT ELIGIBLE',
      feasibilityReason: 'Resource data unavailable. Downstream yield calculation disabled.',
      yearlyProfile: [],
    };
  }

  const stack: LossStackConfig = {
    ...DEFAULT_LOSS_STACK,
    ...config.lossStack,
  };

  const annualGHI = resource.annualGHI_kwh_m2;

  // 2. Transposition & Tracking (Task 3)
  const effectiveTranspositionGain = stack.isSingleAxisTracking
    ? stack.trackingGain
    : stack.transpositionGain;

  const transpositionModel = stack.isSingleAxisTracking
    ? `Single-Axis Horizontal Tracking (+${((stack.trackingGain - 1) * 100).toFixed(1)}% Gain)`
    : `${stack.transpositionModelName} (Tilt ${stack.tiltAngleDeg}°)`;

  const annualGTI = Math.round(annualGHI * effectiveTranspositionGain * 10) / 10;

  // 3. DC:AC Ratio and Clipping (Task 5)
  const dcAcRatio =
    config.inverterCapacityMWac > 0
      ? Math.round((config.dcCapacityMWp / config.inverterCapacityMWac) * 1000) / 1000
      : 1.25;

  const { factor: clippingFactor, warning: clippingWarning } = deriveClippingFactor(dcAcRatio);

  // 4. LSS6-Hybrid Architecture Validation (Task 5)
  let hybridArchitectureValid = true;
  let hybridArchitectureNotes: string | undefined;

  if (!config.isPackage3SolarOnly) {
    const requiredSolarMinAc = config.exportCapacityMWac * 2.0;
    const requiredBessPowerMin = config.exportCapacityMWac * 1.0;
    const requiredBessEnergyMin = config.exportCapacityMWac * 4.0;

    const actualSolarAc = config.inverterCapacityMWac;
    const actualBessPower = config.bessPowerMW ?? config.exportCapacityMWac;
    const actualBessEnergy = config.bessEnergyMWh ?? config.exportCapacityMWac * 4;

    if (actualSolarAc < requiredSolarMinAc * 0.98) {
      hybridArchitectureValid = false;
      hybridArchitectureNotes = `Solar Facility (${actualSolarAc.toFixed(1)} MWa.c.) is below the mandatory 2× Export Capacity requirement (${requiredSolarMinAc.toFixed(1)} MWa.c.).`;
    } else if (actualBessPower < requiredBessPowerMin * 0.98 || actualBessEnergy < requiredBessEnergyMin * 0.98) {
      hybridArchitectureValid = false;
      hybridArchitectureNotes = `BESS sizing (${actualBessPower.toFixed(1)} MW / ${actualBessEnergy.toFixed(1)} MWh) does not meet mandatory 1× MW / 4× MWh Export Capacity mandate.`;
    }
  }

  // 5. Declared Loss Stack Product & Performance Ratio (Task 4)
  // PR is the product of pure loss terms (excluding transposition and bifacial gains)
  const pureLossTerms = [
    { name: 'Soiling', factor: stack.soilingLoss, notes: 'Equatorial rainfall aids cleaning; raise near plantations' },
    { name: 'Shading (row-to-row + near)', factor: stack.shadingLoss, notes: 'Horizon, inter-row & near-structure shading' },
    { name: 'Incidence Angle Modifier (IAM)', factor: stack.iamLoss, notes: 'Reflection loss at shallow sun angles' },
    { name: 'Module Quality / LID', factor: stack.moduleQualityLidLoss, notes: 'Nameplate tolerance & light-induced degradation' },
    { name: 'Electrical Mismatch', factor: stack.mismatchLoss, notes: 'String voltage & cell variance mismatch' },
    { name: 'DC Wiring (Ohmic)', factor: stack.dcWiringLoss, notes: 'Resistive I²R losses in DC collection cables' },
    { name: 'Temperature Coefficient', factor: stack.temperatureLoss, notes: 'Malaysian NOCT conditions (cell temp routinely 55-65°C)' },
    { name: 'Inverter Efficiency', factor: stack.inverterEfficiencyLoss, notes: 'Weighted AC conversion efficiency' },
    { name: 'Inverter DC Clipping', factor: clippingFactor, notes: `f(DC:AC=${dcAcRatio.toFixed(2)}) clipping constraint` },
    { name: 'AC Wiring & Step-Up Transformer', factor: stack.acWiringTransformerLoss, notes: 'Medium voltage lines & 33/132kV main transformer' },
    { name: 'Plant Availability', factor: stack.plantAvailabilityLoss, notes: 'Scheduled maintenance & equipment downtime' },
    { name: 'Grid Availability & Dispatch', factor: stack.gridAvailabilityLoss, notes: 'TNB grid reliability (raise in flood districts)' },
  ];

  let calculatedPR = 1.0;
  pureLossTerms.forEach((item) => {
    calculatedPR *= item.factor;
  });
  calculatedPR = Math.round(calculatedPR * 10000) / 10000;

  // PR warning check (Task 4)
  let prWarning: string | undefined;
  if (calculatedPR > 0.82) {
    prWarning = 'PR above 82% is not typical for Peninsular Malaysia. Confirm whether bifacial or transposition gain has been double-counted.';
  }

  // Itemized loss chain list for UI reconciliation (Task 4)
  const lossChain: LossItemDetail[] = [
    {
      stage: stack.isSingleAxisTracking ? 'Single-Axis Tracking Gain' : 'Transposition Gain (GTI/GHI)',
      factor: effectiveTranspositionGain,
      type: 'gain',
      percentStr: `+${((effectiveTranspositionGain - 1) * 100).toFixed(1)}%`,
      notes: transpositionModel,
    },
    {
      stage: 'Bifacial Gain',
      factor: stack.bifacialGain,
      type: 'gain',
      percentStr: `+${((stack.bifacialGain - 1) * 100).toFixed(1)}%`,
      notes: 'Grass albedo ~0.20; raise only with albedo evidence',
    },
    ...pureLossTerms.map((t) => ({
      stage: t.name,
      factor: t.factor,
      type: 'loss' as const,
      percentStr: `-${((1 - t.factor) * 100).toFixed(2)}%`,
      notes: t.notes,
    })),
  ];

  // Specific Yield Year 1 (kWh/kWp/year)
  // Specific Yield = GTI * BifacialGain * PR (reconciles with GHI * Transposition * Bifacial * Losses)
  const specificYieldKWhKWp = Math.round(annualGTI * stack.bifacialGain * calculatedPR * 10) / 10;

  // 6. Year 1 Energy Balance (Task 4 & 5)
  const grossSolarMWhYear1 = Math.round((config.dcCapacityMWp * specificYieldKWhKWp) * 10) / 10;

  // Clipping loss in MWh (if clipping is active)
  const clippingLossMWhYear1 = clippingFactor < 1.0
    ? Math.round(grossSolarMWhYear1 * ((1 - clippingFactor) / clippingFactor) * 10) / 10
    : 0;

  // BESS cycling loss (Hybrid plants only)
  const rte = config.bessRoundTripEfficiency ?? 0.85;
  let bessLossMWhYear1 = 0;
  if (!config.isPackage3SolarOnly && config.exportCapacityMWac > 0) {
    const bessEnergyMWh = config.bessEnergyMWh ?? config.exportCapacityMWac * 4;
    const annualCycledMWh = bessEnergyMWh * 365;
    bessLossMWhYear1 = Math.round(annualCycledMWh * (1.0 - rte) * 10) / 10;
  }

  // Plant auxiliary load (1.0% default)
  const auxRatio = config.auxiliaryLossRatio ?? 0.010;
  const auxLoadMWhYear1 = Math.round(grossSolarMWhYear1 * auxRatio * 10) / 10;

  const netExportMWhYear1 = Math.max(
    0,
    Math.round((grossSolarMWhYear1 - bessLossMWhYear1 - auxLoadMWhYear1) * 10) / 10
  );
  const p50AnnualMWh = netExportMWhYear1;

  // 7. P90 Exceedance Derivation by Quadrature (Task 6)
  const sigmaInterannual = config.isEastCoastMonsoon ? 0.045 : 0.035; // 3.5% (4.5% east coast)
  const sigmaDataset = (resource.provenance.datasetUncertainty_pct || 8.0) / 100; // e.g. 0.080 NASA POWER
  const sigmaModel = 0.030; // 3.0%
  const sigmaDegradation = 0.015; // 1.5%

  const sigmaTotal = Math.sqrt(
    Math.pow(sigmaInterannual, 2) +
    Math.pow(sigmaDataset, 2) +
    Math.pow(sigmaModel, 2) +
    Math.pow(sigmaDegradation, 2)
  );

  const uncertainty: UncertaintyComponents = {
    sigmaInterannual_pct: Math.round(sigmaInterannual * 1000) / 10,
    sigmaDataset_pct: Math.round(sigmaDataset * 1000) / 10,
    sigmaModel_pct: Math.round(sigmaModel * 1000) / 10,
    sigmaDegradation_pct: Math.round(sigmaDegradation * 1000) / 10,
    sigmaTotal_pct: Math.round(sigmaTotal * 1000) / 10,
  };

  // P90 (1-Year): factor = 1 - 1.282 * sigmaTotal
  const p90_1Year_MWh = Math.round(p50AnnualMWh * (1 - 1.282 * sigmaTotal));
  // P90 (10-Year): factor = 1 - 1.282 * (sigmaTotal / sqrt(10))
  const p90_10Year_MWh = Math.round(p50AnnualMWh * (1 - (1.282 * sigmaTotal) / Math.sqrt(10)));
  // P90 (20-Year): factor = 1 - 1.282 * (sigmaTotal / sqrt(20))
  const p90_20Year_MWh = Math.round(p50AnnualMWh * (1 - (1.282 * sigmaTotal) / Math.sqrt(20)));

  // 8. 12-Month Profile using actual monthly resource values & actual days (Task 2 & Task 6)
  const monthlyYield: MonthlyYieldDetail[] = resource.monthly.map((m, idx) => {
    const days = ACTUAL_MONTH_DAYS[idx];
    const monthGHI = m.ghi_kwh_m2;
    const monthGTI = Math.round(monthGHI * effectiveTranspositionGain * 10) / 10;
    
    // Calculate monthly generation from actual monthly GTI
    const monthlyGrossMWh = (config.dcCapacityMWp * monthGTI * stack.bifacialGain * calculatedPR);
    const monthlyBessLoss = bessLossMWhYear1 * (days / 365);
    const monthlyAuxLoss = monthlyGrossMWh * auxRatio;
    const monthlyNetMWh = Math.max(0, monthlyGrossMWh - monthlyBessLoss - monthlyAuxLoss);

    // Implied PR for each month
    const impliedPR = monthGHI > 0
      ? Math.round(((monthlyGrossMWh) / (config.dcCapacityMWp * monthGHI * effectiveTranspositionGain * stack.bifacialGain)) * 1000) / 1000
      : calculatedPR;

    return {
      month: m.month,
      monthName: MONTH_NAMES[idx],
      days,
      ghi_kwh_m2: monthGHI,
      dailyAvgGhi_kwh_m2: Math.round((monthGHI / days) * 100) / 100, // February uses 28 days! (Task 2)
      gti_kwh_m2: monthGTI,
      impliedPR,
      grossYieldMWh: Math.round(monthlyGrossMWh),
      netYieldMWh: Math.round(monthlyNetMWh),
    };
  });

  // 9. 21-Year Capacity Factor Gate (Task 7)
  // Clause 11.1.1(a): CF = Energy_year_n_MWh * 1000 / (8760 * capacity_kWp)
  // Year 1: 2.0% LID step -> retention = 0.980
  // Year n (2-21): 0.45%/yr degradation -> retention = 0.980 * (1 - 0.0045)^(n-1)
  const yearlyProfile: YearCapacityFactorDetail[] = [];
  let minimumCapacityFactorPct = 100.0;
  let failingYear: number | null = null;

  for (let yr = 1; yr <= 21; yr++) {
    const retentionFactor = yr === 1
      ? 0.980 // Year 1 LID (2.0%)
      : 0.980 * Math.pow(1.0 - 0.0045, yr - 1);

    const netEnergyMWh = Math.round(netExportMWhYear1 * retentionFactor * 10) / 10;
    const capacityKWp = config.dcCapacityMWp * 1000;
    const capacityFactorPct = Math.round(((netEnergyMWh * 1000) / (8760 * capacityKWp)) * 10000) / 100;

    const clearsFloor = capacityFactorPct >= 16.00; // RFP Clause 11.1.1(b) 16.0% Floor

    if (capacityFactorPct < minimumCapacityFactorPct) {
      minimumCapacityFactorPct = capacityFactorPct;
    }

    if (!clearsFloor && failingYear === null) {
      failingYear = yr;
    }

    yearlyProfile.push({
      year: yr,
      retentionFactor: Math.round(retentionFactor * 10000) / 10000,
      netEnergyMWh,
      capacityFactorPct,
      clearsFloor,
    });
  }

  const capacityFactorYear1Pct = yearlyProfile[0].capacityFactorPct;
  const capacityFactorYear21Pct = yearlyProfile[20].capacityFactorPct;
  const clearsCapacityFactorFloor = failingYear === null;

  const feasibilityVerdict: 'ELIGIBLE' | 'NOT ELIGIBLE' = clearsCapacityFactorFloor ? 'ELIGIBLE' : 'NOT ELIGIBLE';
  const feasibilityReason = clearsCapacityFactorFloor
    ? `Compliant with RFP Clause 11.1.1(b): Minimum 21-Year Capacity Factor is ${minimumCapacityFactorPct.toFixed(2)}% (clears mandatory 16.00% floor).`
    : `NOT ELIGIBLE — Year ${failingYear} Capacity Factor is ${yearlyProfile[(failingYear ?? 1) - 1].capacityFactorPct.toFixed(2)}% (fails mandatory 16.00% floor under RFP Clause 11.1.1(b)).`;

  return {
    isCalculable: true,
    annualGHI_kwh_m2: annualGHI,
    annualGTI_kwh_m2: annualGTI,
    transpositionModel,
    tiltAngleDeg: stack.tiltAngleDeg,
    effectiveTranspositionGain,
    dcCapacityMWp: config.dcCapacityMWp,
    inverterCapacityMWac: config.inverterCapacityMWac,
    exportCapacityMWac: config.exportCapacityMWac,
    dcAcRatio,
    clippingFactor,
    clippingWarning,
    hybridArchitectureValid,
    hybridArchitectureNotes,
    lossChain,
    performanceRatio: calculatedPR,
    performanceRatioPercent: Math.round(calculatedPR * 1000) / 10,
    prWarning,
    specificYieldKWhKWp,
    grossSolarMWhYear1,
    clippingLossMWhYear1,
    bessLossMWhYear1,
    auxLoadMWhYear1,
    netExportMWhYear1,
    p50AnnualMWh,
    uncertainty,
    p90_1Year_MWh,
    p90_10Year_MWh,
    p90_20Year_MWh,
    monthlyYield,
    capacityFactorYear1Pct,
    capacityFactorYear21Pct,
    minimumCapacityFactorPct,
    failingYear,
    clearsCapacityFactorFloor,
    feasibilityVerdict,
    feasibilityReason,
    yearlyProfile,
  };
}
