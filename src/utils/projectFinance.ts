/**
 * LSS6 Project Finance Engine & 21-Year Annual Cashflow Model
 * Reference: Appendix A - IV&V Correction ZK/IVV/2026/08-005
 * 
 * Implements:
 * 1. 21-Year Annual Financial Model (Revenue, OpEx, EBITDA, Debt Amortization, Tax & GITA, CFADS, DSCR, Equity CF)
 * 2. Newton-Raphson Solver on Equity Cashflow Vector for Post-Tax Equity IRR with Bisection fallback
 * 3. Exact Minimum & Average DSCR over senior debt tenor (18 years)
 * 4. Discounted LCOE over 21-year lifetime at project WACC
 * 5. Cumulative Equity Cashflow Breakeven / Payback Period
 * 6. Goal-Seek Bisection Solver for Required Bid Tariff at target Equity IRR (12.0%)
 */

import { RFP_BENCHMARKS } from '../data/rfpParameters';

export interface ProjectFinanceInputs {
  totalCapEx: number; // Total Project CapEx in RM Million (excluding bank guarantee bid bond)
  annualOpExBase: number; // Year 1 Base OpEx in RM Million
  annualNetExportMWh: number; // Year 1 Net Export Generation in MWh
  tariff: number; // Bid Price / Tariff in RM / kWh (e.g. 0.4331 or 0.2380)
  opExEscalation?: number; // Annual OpEx escalation rate (default 3.0% CPI = 0.03)
  yr1Degradation?: number; // Year 1 degradation rate (default 2.0% = 0.02)
  annualDegradation?: number; // Annual degradation rate for years 2-21 (default 0.45% = 0.0045)
  gearing?: number; // Senior Debt ratio (default 75% = 0.75)
  profitRate?: number; // Senior Debt Islamic profit / interest rate (default 5.25% = 0.0525)
  tenor?: number; // Senior Debt amortization tenor in years (default 18)
  ppaTerm?: number; // PPA lifetime in years (default 21)
  taxRate?: number; // Statutory corporate tax rate (default 24% = 0.24)
  wacc?: number; // Discount rate for LCOE (default 5.99% = 0.0599)
  targetIRR?: number; // Target Equity IRR for required tariff goal seek (default 12.0% = 0.12)
}

export interface AnnualCashflowRow {
  year: number;
  degradationFactor: number;
  energyMWh: number;
  revenueMyr: number; // in RM Million
  opexMyr: number; // in RM Million
  ebitdaMyr: number; // in RM Million
  openingDebtMyr: number;
  interestMyr: number;
  principalMyr: number;
  debtServiceMyr: number;
  closingDebtMyr: number;
  capitalAllowanceMyr: number;
  gitaAllowanceMyr: number;
  taxableIncomeMyr: number;
  taxMyr: number;
  cfadsMyr: number;
  dscr: number | null;
  equityCFMyr: number;
  cumulativeEquityCFMyr: number;
}

export interface ProjectFinanceResults {
  equityIRR: number | null; // e.g. 12.0 for 12.0%, null if unsolvable
  minDSCR: number | null; // Minimum DSCR over senior debt tenor
  avgDSCR: number | null; // Average DSCR over senior debt tenor
  lcoe: number; // LCOE in RM / kWh
  paybackYears: number | null; // Years to equity payback, null if not recovered in 21 yrs
  requiredTariff: number | null; // Tariff (RM/kWh) to achieve target IRR
  annualCashflows: AnnualCashflowRow[];
  equityInvestedMyr: number;
  seniorDebtMyr: number;
  annualDebtServiceMyr: number;
}

/**
 * Returns degradation retention factor for year y (1-indexed)
 * Clause C-11: Year 1 = 1.0; Year y = (1 - yr1Degradation) * (1 - annualDegradation)^(y - 2)
 */
export function getDegradationRetentionFactor(
  year: number,
  yr1Degradation: number = RFP_BENCHMARKS.yr1Degradation,
  annualDegradation: number = RFP_BENCHMARKS.annualDegradation
): number {
  if (year <= 1) return 1.0;
  return (1.0 - yr1Degradation) * Math.pow(1.0 - annualDegradation, year - 2);
}

/**
 * Year 21 Retention Factor calculation (C-11)
 */
export function getYear21RetentionFactor(
  yr1Degradation: number = RFP_BENCHMARKS.yr1Degradation,
  annualDegradation: number = RFP_BENCHMARKS.annualDegradation
): number {
  return getDegradationRetentionFactor(21, yr1Degradation, annualDegradation);
}

/**
 * Solves Internal Rate of Return (IRR) on cash flow vector using Newton-Raphson with Bisection fallback
 * @param cashflows Array where cashflows[0] is initial outlay (negative) and cashflows[1..N] are periodic inflows
 * @returns Rate in percent (e.g. 12.0 for 12%), or null if non-convergent / unsolvable
 */
export function solveIRR(cashflows: number[]): number | null {
  if (!cashflows || cashflows.length < 2) return null;
  const initialOutlay = cashflows[0];
  if (initialOutlay >= 0) return null; // Must have negative initial outlay

  const hasPositiveInflow = cashflows.slice(1).some((cf) => cf > 0);
  if (!hasPositiveInflow) return null; // No positive returns

  const npv = (rate: number): number => {
    let sum = 0;
    for (let t = 0; t < cashflows.length; t++) {
      sum += cashflows[t] / Math.pow(1 + rate, t);
    }
    return sum;
  };

  const npvDerivative = (rate: number): number => {
    let sum = 0;
    for (let t = 1; t < cashflows.length; t++) {
      sum -= (t * cashflows[t]) / Math.pow(1 + rate, t + 1);
    }
    return sum;
  };

  // 1. Newton-Raphson solver
  let rate = 0.10; // Initial guess 10%
  const maxIterations = 100;
  const tolerance = 1e-7;

  for (let i = 0; i < maxIterations; i++) {
    if (rate <= -0.999) rate = -0.99;
    const fVal = npv(rate);
    const fPrime = npvDerivative(rate);

    if (Math.abs(fPrime) < 1e-12) break; // Avoid division by zero

    const nextRate = rate - fVal / fPrime;
    if (Math.abs(nextRate - rate) < tolerance) {
      if (nextRate > -0.95 && nextRate < 5.0) {
        return Math.round(nextRate * 10000) / 100; // e.g. 12.35%
      }
    }
    rate = nextRate;
  }

  // 2. Bisection fallback across [-0.90, 3.0]
  let low = -0.90;
  let high = 3.00;
  let fLow = npv(low);
  let fHigh = npv(high);

  if (fLow * fHigh <= 0) {
    for (let iter = 0; iter < 100; iter++) {
      const mid = (low + high) / 2;
      const fMid = npv(mid);
      if (Math.abs(fMid) < 1e-6 || (high - low) / 2 < 1e-6) {
        return Math.round(mid * 10000) / 100;
      }
      if (fLow * fMid < 0) {
        high = mid;
        fHigh = fMid;
      } else {
        low = mid;
        fLow = fMid;
      }
    }
  }

  return null; // Could not solve
}

/**
 * Computes 21-year project finance cash flows and returns all core financial indicators
 */
export function calculateProjectFinance(inputs: ProjectFinanceInputs): ProjectFinanceResults {
  const {
    totalCapEx,
    annualOpExBase,
    annualNetExportMWh,
    tariff,
    opExEscalation = RFP_BENCHMARKS.opExEscalationRate,
    yr1Degradation = RFP_BENCHMARKS.yr1Degradation,
    annualDegradation = RFP_BENCHMARKS.annualDegradation,
    gearing = RFP_BENCHMARKS.gearingRatio,
    profitRate = RFP_BENCHMARKS.seniorProfitRate,
    tenor = RFP_BENCHMARKS.debtTenorYears,
    ppaTerm = RFP_BENCHMARKS.ppaLifetimeYears,
    taxRate = RFP_BENCHMARKS.corporateTaxRate,
    wacc = RFP_BENCHMARKS.waccDiscountRate,
    targetIRR = RFP_BENCHMARKS.targetEquityIRR,
  } = inputs;

  const seniorDebtMyr = Math.round(totalCapEx * gearing * 100) / 100;
  const equityInvestedMyr = Math.round((totalCapEx - seniorDebtMyr) * 100) / 100;

  // Constant annual debt service payment (Annuity Formula)
  // A = Debt * [ r*(1+r)^N / ((1+r)^N - 1) ]
  let annualDebtServiceMyr = 0;
  if (seniorDebtMyr > 0 && tenor > 0 && profitRate > 0) {
    const factor = Math.pow(1 + profitRate, tenor);
    annualDebtServiceMyr = (seniorDebtMyr * (profitRate * factor)) / (factor - 1);
  }

  let remainingDebt = seniorDebtMyr;
  const cashflows: AnnualCashflowRow[] = [];
  const equityCashflowVector: number[] = [-equityInvestedMyr];
  const dscrVector: number[] = [];

  // Capital Allowance schedule: Initial Allowance 20% (Yr 1) + Annual Allowance 14% (Yrs 1-6)
  // Qualifying CapEx (EPC & Grid ~ 90% of CapEx)
  const qualifyingAssetCapEx = totalCapEx * 0.90;
  let remainingGITA = qualifyingAssetCapEx * RFP_BENCHMARKS.gitaAllowanceRate; // 100% GITA pool

  let cumulativeEquityCF = -equityInvestedMyr;
  let paybackYears: number | null = null;

  // Discounted sums for LCOE
  let discountedTotalCost = totalCapEx * 1e6; // CapEx in RM
  let discountedTotalEnergyKWh = 0;

  for (let yr = 1; yr <= ppaTerm; yr++) {
    const degFactor = getDegradationRetentionFactor(yr, yr1Degradation, annualDegradation);
    const energyMWh = annualNetExportMWh * degFactor;
    const energyKWh = energyMWh * 1000;
    const revenueMyr = (energyKWh * tariff) / 1e6;
    const opexMyr = annualOpExBase * Math.pow(1 + opExEscalation, yr - 1);
    const ebitdaMyr = revenueMyr - opexMyr;

    // Debt service
    let interestMyr = 0;
    let principalMyr = 0;
    let debtServiceMyr = 0;

    if (yr <= tenor && remainingDebt > 0.001) {
      interestMyr = remainingDebt * profitRate;
      principalMyr = Math.min(remainingDebt, annualDebtServiceMyr - interestMyr);
      debtServiceMyr = interestMyr + principalMyr;
      remainingDebt = Math.max(0, remainingDebt - principalMyr);
    }

    // Capital Allowance (Initial 20% Yr 1 + Annual 14% Yrs 1-6)
    let capitalAllowanceMyr = 0;
    if (yr === 1) {
      capitalAllowanceMyr = qualifyingAssetCapEx * 0.34; // 20% initial + 14% annual
    } else if (yr <= 6) {
      capitalAllowanceMyr = qualifyingAssetCapEx * 0.14; // 14% annual
    }

    // Statutory Income before tax
    const incomeBeforeTax = ebitdaMyr - interestMyr - capitalAllowanceMyr;
    
    // GITA Tax Allowance deduction (offsets up to 70% of statutory income)
    let gitaAllowanceMyr = 0;
    let taxableIncomeMyr = 0;

    if (incomeBeforeTax > 0) {
      const maxGitaDeduction = incomeBeforeTax * 0.70;
      gitaAllowanceMyr = Math.min(remainingGITA, maxGitaDeduction);
      remainingGITA = Math.max(0, remainingGITA - gitaAllowanceMyr);
      taxableIncomeMyr = Math.max(0, incomeBeforeTax - gitaAllowanceMyr);
    }

    const taxMyr = taxableIncomeMyr * taxRate;
    const cfadsMyr = ebitdaMyr - taxMyr;

    let dscr: number | null = null;
    if (debtServiceMyr > 0) {
      dscr = Math.round((cfadsMyr / debtServiceMyr) * 1000) / 1000;
      dscrVector.push(dscr);
    }

    const equityCFMyr = cfadsMyr - debtServiceMyr;
    equityCashflowVector.push(equityCFMyr);

    const prevCumulative = cumulativeEquityCF;
    cumulativeEquityCF += equityCFMyr;

    // Check equity payback crossing
    if (prevCumulative < 0 && cumulativeEquityCF >= 0 && paybackYears === null) {
      const fraction = (0 - prevCumulative) / equityCFMyr;
      paybackYears = Math.round(((yr - 1) + fraction) * 10) / 10;
    }

    // LCOE Discounted sums
    const discountFactor = Math.pow(1 + wacc, yr);
    discountedTotalCost += (opexMyr * 1e6) / discountFactor;
    discountedTotalEnergyKWh += energyKWh / discountFactor;

    cashflows.push({
      year: yr,
      degradationFactor: Math.round(degFactor * 10000) / 10000,
      energyMWh: Math.round(energyMWh * 10) / 10,
      revenueMyr: Math.round(revenueMyr * 100) / 100,
      opexMyr: Math.round(opexMyr * 100) / 100,
      ebitdaMyr: Math.round(ebitdaMyr * 100) / 100,
      openingDebtMyr: Math.round((remainingDebt + principalMyr) * 100) / 100,
      interestMyr: Math.round(interestMyr * 100) / 100,
      principalMyr: Math.round(principalMyr * 100) / 100,
      debtServiceMyr: Math.round(debtServiceMyr * 100) / 100,
      closingDebtMyr: Math.round(remainingDebt * 100) / 100,
      capitalAllowanceMyr: Math.round(capitalAllowanceMyr * 100) / 100,
      gitaAllowanceMyr: Math.round(gitaAllowanceMyr * 100) / 100,
      taxableIncomeMyr: Math.round(taxableIncomeMyr * 100) / 100,
      taxMyr: Math.round(taxMyr * 100) / 100,
      cfadsMyr: Math.round(cfadsMyr * 100) / 100,
      dscr,
      equityCFMyr: Math.round(equityCFMyr * 100) / 100,
      cumulativeEquityCFMyr: Math.round(cumulativeEquityCF * 100) / 100,
    });
  }

  // 1. Solve Equity IRR
  const equityIRR = solveIRR(equityCashflowVector);

  // 2. Derive min and avg DSCR across senior debt tenor
  const minDSCR = dscrVector.length > 0 ? Math.min(...dscrVector) : null;
  const avgDSCR = dscrVector.length > 0 ? Math.round((dscrVector.reduce((a, b) => a + b, 0) / dscrVector.length) * 100) / 100 : null;

  // 3. Derive LCOE (in RM / kWh)
  const lcoe = discountedTotalEnergyKWh > 0 ? Math.round((discountedTotalCost / discountedTotalEnergyKWh) * 10000) / 10000 : 0;

  // 4. Goal-Seek for Required Tariff to hit target Equity IRR (12.0%)
  const requiredTariff = solveRequiredTariff(inputs, targetIRR);

  return {
    equityIRR,
    minDSCR: minDSCR !== null ? Math.round(minDSCR * 100) / 100 : null,
    avgDSCR,
    lcoe,
    paybackYears,
    requiredTariff,
    annualCashflows: cashflows,
    equityInvestedMyr,
    seniorDebtMyr,
    annualDebtServiceMyr: Math.round(annualDebtServiceMyr * 100) / 100,
  };
}

/**
 * Goal-seek bisection solver to find tariff at which equity IRR equals target (default 12.0%)
 */
export function solveRequiredTariff(inputs: ProjectFinanceInputs, targetIRR: number = 0.12): number | null {
  let lowTariff = 0.05; // RM 0.05 / kWh
  let highTariff = 1.50; // RM 1.50 / kWh
  const targetPct = targetIRR * 100; // e.g. 12.0%
  const tolerance = 0.0001;

  for (let iter = 0; iter < 40; iter++) {
    const midTariff = (lowTariff + highTariff) / 2;
    const testInputs = { ...inputs, tariff: midTariff };
    
    // Quick cashflow evaluation for midTariff
    const res = calculateProjectFinanceQuickIRR(testInputs);
    if (res === null) {
      lowTariff = midTariff;
      continue;
    }

    if (Math.abs(res - targetPct) < 0.01 || (highTariff - lowTariff) < tolerance) {
      return Math.round(midTariff * 10000) / 10000;
    }

    if (res < targetPct) {
      lowTariff = midTariff;
    } else {
      highTariff = midTariff;
    }
  }

  return Math.round(((lowTariff + highTariff) / 2) * 10000) / 10000;
}

/**
 * Fast IRR evaluator helper for bisection loop
 */
function calculateProjectFinanceQuickIRR(inputs: ProjectFinanceInputs): number | null {
  const {
    totalCapEx,
    annualOpExBase,
    annualNetExportMWh,
    tariff,
    opExEscalation = RFP_BENCHMARKS.opExEscalationRate,
    yr1Degradation = RFP_BENCHMARKS.yr1Degradation,
    annualDegradation = RFP_BENCHMARKS.annualDegradation,
    gearing = RFP_BENCHMARKS.gearingRatio,
    profitRate = RFP_BENCHMARKS.seniorProfitRate,
    tenor = RFP_BENCHMARKS.debtTenorYears,
    ppaTerm = RFP_BENCHMARKS.ppaLifetimeYears,
    taxRate = RFP_BENCHMARKS.corporateTaxRate,
  } = inputs;

  const seniorDebtMyr = totalCapEx * gearing;
  const equityInvestedMyr = totalCapEx - seniorDebtMyr;

  let annualDebtServiceMyr = 0;
  if (seniorDebtMyr > 0 && tenor > 0 && profitRate > 0) {
    const factor = Math.pow(1 + profitRate, tenor);
    annualDebtServiceMyr = (seniorDebtMyr * (profitRate * factor)) / (factor - 1);
  }

  let remainingDebt = seniorDebtMyr;
  const equityCashflowVector: number[] = [-equityInvestedMyr];
  const qualifyingAssetCapEx = totalCapEx * 0.90;
  let remainingGITA = qualifyingAssetCapEx * RFP_BENCHMARKS.gitaAllowanceRate;

  for (let yr = 1; yr <= ppaTerm; yr++) {
    const degFactor = getDegradationRetentionFactor(yr, yr1Degradation, annualDegradation);
    const energyMWh = annualNetExportMWh * degFactor;
    const revenueMyr = (energyMWh * 1000 * tariff) / 1e6;
    const opexMyr = annualOpExBase * Math.pow(1 + opExEscalation, yr - 1);
    const ebitdaMyr = revenueMyr - opexMyr;

    let interestMyr = 0;
    let principalMyr = 0;
    let debtServiceMyr = 0;

    if (yr <= tenor && remainingDebt > 0.001) {
      interestMyr = remainingDebt * profitRate;
      principalMyr = Math.min(remainingDebt, annualDebtServiceMyr - interestMyr);
      debtServiceMyr = interestMyr + principalMyr;
      remainingDebt = Math.max(0, remainingDebt - principalMyr);
    }

    let capitalAllowanceMyr = 0;
    if (yr === 1) capitalAllowanceMyr = qualifyingAssetCapEx * 0.34;
    else if (yr <= 6) capitalAllowanceMyr = qualifyingAssetCapEx * 0.14;

    const incomeBeforeTax = ebitdaMyr - interestMyr - capitalAllowanceMyr;
    let gitaAllowanceMyr = 0;
    let taxableIncomeMyr = 0;

    if (incomeBeforeTax > 0) {
      const maxGitaDeduction = incomeBeforeTax * 0.70;
      gitaAllowanceMyr = Math.min(remainingGITA, maxGitaDeduction);
      remainingGITA = Math.max(0, remainingGITA - gitaAllowanceMyr);
      taxableIncomeMyr = Math.max(0, incomeBeforeTax - gitaAllowanceMyr);
    }

    const taxMyr = taxableIncomeMyr * taxRate;
    const cfadsMyr = ebitdaMyr - taxMyr;
    const equityCFMyr = cfadsMyr - debtServiceMyr;
    equityCashflowVector.push(equityCFMyr);
  }

  return solveIRR(equityCashflowVector);
}
