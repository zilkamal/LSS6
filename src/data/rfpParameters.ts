/**
 * LSS6 Program Parameters & Single Source of Truth
 * References:
 * - Suruhanjaya Tenaga (Energy Commission) Malaysia
 * - RFP Ref: ST(IP/EMP/SSCP) 12/1/12 (6) and ST(IP/EMP/SSCP) 12/1/12 (7)
 * - Large Scale Solar (LSS6) - Hybrid and Solar-Only Programs
 */

export interface RFPClauseCitation {
  clause: string;
  document: string;
  description: string;
}

export interface RFPProgramPackage {
  packageId: 'Package 1' | 'Package 2' | 'Package 3';
  name: string;
  category: 'Hybrid' | 'Solar-Only';
  minExportMWac: number;
  maxExportMWac: number;
  voltageMinKV: number;
  voltageMaxKV: number;
  equityRequirement: string;
  bessMandatory: boolean;
  solarAcRatio: number; // e.g. 2.0x export capacity for Hybrid, 1.0x for Solar-Only
  dcAcRatio: number; // 1.25x Solar AC capacity
  bessPowerRatio: number; // 1.0x export capacity for Hybrid, 0 for Solar-Only
  bessDurationHours: number; // 4 hours for Hybrid, 0 for Solar-Only
  bidBondMyr: number;
  scheduledCOD: string; // "31 December 2029"
  capacityFactorFloorPercent: number; // 16.0% in every year of 21 years
  ppaTermYears: number; // 21 years
  citations: Record<string, RFPClauseCitation>;
}

export const RFP_PACKAGES: Record<'PACKAGE_1' | 'PACKAGE_2' | 'PACKAGE_3', RFPProgramPackage> = {
  PACKAGE_1: {
    packageId: 'Package 1',
    name: 'Package 1 (Hybrid PV + 4-Hr BESS, Utility Scale)',
    category: 'Hybrid',
    minExportMWac: 50.01,
    maxExportMWac: 250.0,
    voltageMinKV: 132,
    voltageMaxKV: 275,
    equityRequirement: 'Open Malaysian / Foreign Ownership compliant with ST Guidelines (Min 51% Malaysian)',
    bessMandatory: true,
    solarAcRatio: 2.0,
    dcAcRatio: 1.25,
    bessPowerRatio: 1.0,
    bessDurationHours: 4,
    bidBondMyr: 3.0, // RM 3.0 Million Bank Guarantee
    scheduledCOD: '31 December 2029',
    capacityFactorFloorPercent: 16.0,
    ppaTermYears: 21,
    citations: {
      capacityScope: {
        clause: 'Part 1 §2.1(a)',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (6)',
        description: 'Package 1 export capacity range >50 MWa.c. to 250 MWa.c. with transmission grid interconnection at 132kV / 275kV.',
      },
      architecture: {
        clause: 'Part 2 §1.3(c) & §4.2(b)',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (6)',
        description: 'Mandatory 2:1:4 architecture: Solar AC capacity >= 2x export MWa.c., BESS power >= 1x export MWa.c., BESS duration 4 hours.',
      },
      bidBond: {
        clause: 'Part 1 §24.1 & Appendix C1',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (6)',
        description: 'Tender Guarantee / Bid Bond for Package 1 is RM 3,000,000.00 via Bank Guarantee.',
      },
      capacityFactorFloor: {
        clause: 'Part 2 §11.1.1(b)',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (6)',
        description: 'Minimum Capacity Factor shall not be less than 16.0% in any individual year across the 21-year PPA lifetime.',
      },
      cod: {
        clause: 'Part 1 §5.2',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (6)',
        description: 'Scheduled Commercial Operation Date (SCOD) is 31 December 2029.',
      },
    },
  },
  PACKAGE_2: {
    packageId: 'Package 2',
    name: 'Package 2 (Hybrid PV + 4-Hr BESS, Bumiputera Dedicated)',
    category: 'Hybrid',
    minExportMWac: 30.0,
    maxExportMWac: 50.0,
    voltageMinKV: 132,
    voltageMaxKV: 132,
    equityRequirement: 'Minimum 60% Bumiputera Effective Equity Ownership',
    bessMandatory: true,
    solarAcRatio: 2.0,
    dcAcRatio: 1.25,
    bessPowerRatio: 1.0,
    bessDurationHours: 4,
    bidBondMyr: 1.0, // RM 1.0 Million Bank Guarantee
    scheduledCOD: '31 December 2029',
    capacityFactorFloorPercent: 16.0,
    ppaTermYears: 21,
    citations: {
      capacityScope: {
        clause: 'Part 1 §2.1(b)',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (6)',
        description: 'Package 2 export capacity range 30 MWa.c. to 50 MWa.c. dedicated for Bumiputera bidders with 132kV interconnection.',
      },
      architecture: {
        clause: 'Part 2 §1.3(c) & §4.2(b)',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (6)',
        description: 'Mandatory 2:1:4 architecture: Solar AC capacity >= 2x export MWa.c., BESS power >= 1x export MWa.c., BESS duration 4 hours.',
      },
      bidBond: {
        clause: 'Part 1 §24.1 & Appendix C1',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (6)',
        description: 'Tender Guarantee / Bid Bond for Package 2 is RM 1,000,000.00 via Bank Guarantee.',
      },
      capacityFactorFloor: {
        clause: 'Part 2 §11.1.1(b)',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (6)',
        description: 'Minimum Capacity Factor shall not be less than 16.0% in any individual year across the 21-year PPA lifetime.',
      },
      cod: {
        clause: 'Part 1 §5.2',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (6)',
        description: 'Scheduled Commercial Operation Date (SCOD) is 31 December 2029.',
      },
    },
  },
  PACKAGE_3: {
    packageId: 'Package 3',
    name: 'Package 3 (Solar-Only, 33kV & Below, Bumiputera Dedicated)',
    category: 'Solar-Only',
    minExportMWac: 10.0,
    maxExportMWac: 30.0,
    voltageMinKV: 11,
    voltageMaxKV: 33,
    equityRequirement: 'Minimum 60% Bumiputera Effective Equity Ownership',
    bessMandatory: false, // Strictly NO BESS
    solarAcRatio: 1.0,
    dcAcRatio: 1.25,
    bessPowerRatio: 0,
    bessDurationHours: 0,
    bidBondMyr: 0.35, // RM 350,000.00 Bank Guarantee
    scheduledCOD: '31 December 2029',
    capacityFactorFloorPercent: 16.0,
    ppaTermYears: 21,
    citations: {
      capacityScope: {
        clause: 'Part 1 §2.1(c)',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (7)',
        description: 'Package 3 export capacity range 10 MWa.c. to 30 MWa.c. dedicated for Bumiputera bidders with distribution interconnection at 33kV and below.',
      },
      solarOnlyExemption: {
        clause: 'Part 2 §1.4 & §4.1',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (7)',
        description: 'Package 3 is strictly Solar-Only PV generation; BESS battery storage is not required and is excluded from scope.',
      },
      bidBond: {
        clause: 'Part 1 §24.1 & Appendix C1',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (7)',
        description: 'Tender Guarantee / Bid Bond for Package 3 is RM 350,000.00 via Bank Guarantee.',
      },
      capacityFactorFloor: {
        clause: 'Part 2 §11.1.1(b)',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (7)',
        description: 'Minimum Capacity Factor shall not be less than 16.0% in any individual year across the 21-year PPA lifetime.',
      },
      cod: {
        clause: 'Part 1 §5.2',
        document: 'RFP Ref. ST(IP/EMP/SSCP) 12/1/12 (7)',
        description: 'Scheduled Commercial Operation Date (SCOD) is 31 December 2029.',
      },
    },
  },
};

/**
 * Benchmark Cost & Engineering Parameter Standards
 */
export const RFP_BENCHMARKS = {
  // CapEx unit rates (RM Million)
  pvEpcUnitCostMyrPerMWp_Hybrid: 2.65, // Tier-1 TOPCon bifacial + single-axis tracker + 33kV pooling sub + MV civil
  pvEpcUnitCostMyrPerMWp_SolarOnly: 2.45, // Tier-1 TOPCon bifacial + single-axis tracker + 33kV skid
  bessEpcUnitCostMyrPerMWh: 0.82, // 4-Hour containerized LFP, liquid cooled, BMS, PCS, NFPA 855 fire suppression
  
  // Grid Interconnection rates (RM Million)
  grid33kVCablePerKm: 1.2,
  grid33kVBayCost: 2.5,
  grid132kVCablePerKm: 3.2,
  grid132kVBayCost: 8.5,
  grid275kVCablePerKm: 5.5,
  grid275kVBayCost: 15.0,
  cableRouteMultiplier: 1.35, // Peninsular terrain routing factor

  // Development & Civil Rates (Derived as rate * capacity per C-02)
  ownersCostRateOfEpc: 0.025, // 2.5% of EPC CapEx
  landConversionRateMyrPerMWac: 0.09, // RM 0.09M per MWa.c. export
  floodCivilRateMyrPerMWac: 0.12, // RM 0.12M per MWa.c. export
  contingencyRate: 0.05, // 5% of subtotal EPC & civil

  // OpEx Rates (Derived per C-02)
  solarOpExRateMyrPerMWpYear: 0.045, // RM 45,000 per MWp DC per year
  bessOpExRateMyrPerMWhYear: 0.012, // RM 12,000 per MWh per year
  insuranceRateOfEpc: 0.0035, // 0.35% of EPC CapEx per year
  quitRentRateMyrPerAcreYear: 0.0012, // RM 1,200 per acre per year (RM 0.0012M)
  adminCorporateFixedMyrYear: 0.35, // RM 0.35M per year fixed
  bgCommissionRate: 0.01, // 1.0% per annum on Bank Guarantee bid bond

  // Yield & Technical Parameters (C-10 & C-11)
  bessRoundTripEfficiency: 0.85, // 85% round-trip efficiency on cycled battery energy
  clippingLossRatio: 0.015, // 1.5% clipping loss
  auxiliaryLossRatio: 0.010, // 1.0% plant auxiliary consumption
  bessDailyDischargeCycles: 1.0, // 1 full 4-hour cycle per day = 120 MWh/day for 30 MW export
  yr1Degradation: 0.02, // 2.0% Year 1 TOPCon LID/LeTID degradation
  annualDegradation: 0.0045, // 0.45% per annum linear degradation (Years 2-21)

  // Project Finance Parameters (Appendix A)
  gearingRatio: 0.75, // 75% Senior Debt, 25% Equity
  seniorProfitRate: 0.0525, // 5.25% Islamic financing / Green Sukuk profit rate
  debtTenorYears: 18, // 18 years amortizing senior debt
  ppaLifetimeYears: 21, // 21 years PPA term
  corporateTaxRate: 0.24, // 24% statutory corporate tax rate
  opExEscalationRate: 0.03, // 3.0% CPI annual escalation
  waccDiscountRate: 0.0599, // 5.99% nominal WACC for LCOE discounting
  targetEquityIRR: 0.12, // 12.0% nominal post-tax equity IRR target
  gitaAllowanceRate: 1.00, // 100% Green Investment Tax Allowance on qualifying CapEx
  idcMonths: 18, // Construction period 18 months
  debtArrangementFeeRate: 0.01, // 1.0% of Senior Debt facility
};
