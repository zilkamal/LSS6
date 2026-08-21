import { SolarResource } from './services/solarResource';
import { YieldResult } from './services/yieldEngine';

export type VoltageLevel = '33kV' | '132kV' | '275kV';

export type StateName =
  | 'Johor'
  | 'Kedah'
  | 'Kelantan'
  | 'Melaka'
  | 'N. Sembilan'
  | 'Pahang'
  | 'Perak'
  | 'P. Pinang'
  | 'Selangor'
  | 'Terengganu'
  | 'Perlis'
  | 'Kuala Lumpur'
  | 'Putrajaya';

export type RFPPackageProgram = 'hybrid' | 'package3';

export interface GPSPoint {
  lat: number;
  lng: number;
}

export interface LandParcel {
  id: string;
  pmuId: string;
  name: string;
  
  // Data Provenance & Verification Status (C-06)
  dataProvenance?: 'SYNTHETIC' | 'USER_ENTERED' | 'VERIFIED_JUPEM';

  // 1. Cadastral & Legal Title Details
  lotNumber: string; // e.g. Lot 1482, Lot 8921/A
  mukim: string; // e.g. Mukim Sidam Kiri, Mukim Chemor
  district: string; // e.g. Kuala Muda, Kinta
  state: StateName;
  gpsPolygon: GPSPoint[]; // GPS boundary polygon coordinates for map rendering
  lat: number;
  lng: number;
  areaAcres: number;
  areaHectares: number; // 1 ha ~ 2.471 acres
  ownershipType:
    | 'Unverified / Candidate Plot (Pending JUPEM Title Search)'
    | 'Unverified - Potential Plantation / Agri Land'
    | 'Unverified - Potential State Land (Perbadanan Negeri)'
    | 'Unverified - Potential Private Land'
    | 'Custom User-Specified Land Plot'
    | 'Private Owner'
    | 'FELDA / FELKRA Plantation'
    | 'State Land (Perbadanan Negeri)'
    | 'Corporate Agri (Candidate Estate)'
    | 'Industrial Park Corp'
    | string;
  landTitleType: 'Freehold (Geran Kekal)' | 'Leasehold (Mukim Register)';
  remainingLeaseYears: number; // 99 for Freehold or remaining years
  categoryOfLandUse:
    | 'Agricultural (Oil Palm)'
    | 'Agricultural (Rubber)'
    | 'Former Mining / Tin Reclamation'
    | 'Unutilized Scrubland'
    | 'Industrial Buffer Zone'
    | 'Residential / Housing Scheme (Excluded)'
    | 'Commercial / Central Business District (Excluded)'
    | 'Heavy Industrial Zone (Excluded)';
  expressConditions: string; // Syarat Nyata
  restrictionsInInterest: string; // Sekatan Kepentingan
  encumbranceStatus: string; // Bebanan (Cagaran / Kaveat / Tiada)

  // 2. Satellite & Remote Sensing Data
  ndviVegetationIndex: number; // 0.10 - 0.85
  existingBuildingsCount: number;
  distanceToFederalRoadKm: number;
  distanceToWaterwayKm: number;
  aspectDirection: string; // e.g., South-Facing (180°), Flat (0°)

  // Urban, Residential & Commercial Proximity Exclusions
  distanceToResidentialZoneKm: number; // e.g. 1.8 km
  distanceToCommercialZoneKm: number; // e.g. 3.5 km
  distanceToIndustrialZoneKm: number; // e.g. 2.1 km
  isResidentialExcluded: boolean; // True if inside/adjacent to residential zone (<0.5km)
  isCommercialExcluded: boolean; // True if inside/adjacent to commercial zone (<0.5km)
  isIndustrialExcluded: boolean; // True if inside heavy industrial zone (<0.5km)
  isSuitableForSolarFarm: boolean; // False if residential, commercial, heavy industrial, or steep terrain
  zoningExclusionWarning?: string; // e.g. "⚠️ WARNING: Within 0.8 km of Residential Township - Noise/Glare Assessment & Public Hearing Required"

  // 3. Terrain & Topography
  elevationDEM: number; // meters above sea level
  terrainSlope: number | null; // degrees (null if not surveyed per C-07)
  terrainCategory: 'Flat (<3°)' | 'Gentle Slope (3-8°)' | 'Hilly (8-15°)' | 'Steep (>15°)' | 'Unsurveyed';
  isSteepTerrainExcluded: boolean; // >15 deg
  floodRisk: 'Low' | 'Moderate' | 'High';

  // Flood Assessment & JPS Hydrological History
  floodRiskLevel: 'Low Hazard Zone (<0.3m)' | 'Moderate Hazard Zone (0.3m - 0.8m)' | 'High Inundation Zone (>0.8m)';
  ariFloodLevel50Yr: number; // meters e.g. 0.2m, 0.7m, 1.4m
  didRiverCatchment: string; // e.g. "Sungai Muda River Basin", "Sungai Kinta Catchment", "Sungai Pahang Floodplain"
  historicalFloodEvents: { year: number; eventName: string; depthMeters: number; durationDays: number; impactSummary: string }[];
  submergenceRiskScore: number; // 0-100 (100 = safe from flood, 0 = extreme flood risk)
  recommendedPileElevationMeters: number; // e.g., +1.5m above AGL for PV mounting / inverter skids
  floodMitigationCapExMyr: number; // e.g., RM 0.8M for perimeter bunding & retention pond
  drainageMasterPlanRequirement: string; // e.g., "JPS MSMA Guideline Compliance: On-site detention pond + peripheral swale network"

  // 4. Grid Proximity
  distanceToPMUKm: number; // Straight-line distance to PMU in km
  estimatedCableLengthKm: number; // Cable route distance ~ 1.25x
  distanceToTransmissionLineKm: number;
  distanceToAccessRoadKm: number;

  // 5. Environmental Screening & Exclusions
  distanceToPermanentForestReserveKm: number;
  isPermanentForestReserveOverlay: boolean;
  isNationalParkRamsarBuffer: boolean;
  isWaterCatchmentZone: boolean;
  eiaCategory: 'Category 1: Full EIA Required' | 'Category 2: Preliminary EIA' | 'Exempt / Standard Guidelines';

  // 6. Planning & Local Plan
  localPlanZoning: string; // Rancangan Tempatan Daerah (RTD)
  zoningCompatibility: 'Fully Compatible (Permitted)' | 'Conditional Approval' | 'Rezoning Required';

  // 7. Weighted AI Suitability Score Breakdown (0 - 100)
  scoreDistancePMU: number; // 30% weight
  scoreLandSize: number; // 20% weight
  scoreTerrainSlope: number; // 15% weight
  scoreEnvConstraints: number; // 15% weight
  scoreRoadAccess: number; // 10% weight
  scoreOwnershipTitle: number; // 5% weight
  scorePlanningZoning: number; // 5% weight
  overallScore: number; // 0 - 100 weighted total

  // 8. AI Recommendations & Strategic Badges
  isBestOverall: boolean; // 🏆 Best Overall Site
  isLowestCost: boolean; // 💰 Lowest Connection Cost
  isFastestToDevelop: boolean; // ⚡ Fastest to Develop
  isLowestEnvRisk: boolean; // 🌿 Lowest Environmental Risk
  isLargestContiguous: boolean; // 📐 Mega Parcel >= 150 ha
  packageSuitability: 'Package 1 (Export >50-250 MWa.c.)' | 'Package 2 (Export 30-50 MWa.c. - 60% Bumiputera)' | 'Package 3 (Export 10-30 MWa.c. Solar Only)';

  // 9. Land Acquisition Cost & Investment Terms
  estimatedLandCostPerAcreMyr: number; // MYR per acre (e.g. RM 45,000 / acre)
  estimatedTotalLandAcquisitionCostMyr: number; // Total acquisition CapEx in MYR Million
  landAcquisitionType: 'Direct Outright Purchase' | 'Long-Term 30-Year Lease' | 'Joint Venture (JV / Revenue Share)';

  // 10. Historical Solar Irradiance & Yield Potential (P50 / P90)
  performanceRatioPercent: number; // e.g. 81.5% PR
  p50AnnualMWh: number; // Median 50% probability yield
  p90AnnualMWh: number; // Conservative 90% exceedance probability yield
  monthlyIrradianceData: { month: string; ghiKwhM2: number; p50MWh: number; p90MWh: number }[];

  // ST RFP LSS6-Hybrid 2:1:4 Architecture Sizing
  exportCapacityMWa: number; // Export Capacity (MWa.c.)
  solarCapacityMWa: number; // Solar Facility Installed (2 x Export MWa.c.)
  capacityMWp: number; // DC Peak Capacity (MWp d.c.)
  bessPowerMW: number; // BESS Power Rating (1 x Export MWa.c.)
  bessEnergyMWh: number; // BESS Energy Rating (4-Hour Duration = 4 x Export MWh)
  capacityFactorYear1: number; // Year 1 Capacity Factor (%)
  capacityFactorYear21: number; // Year 21 Capacity Factor after 0.45%/yr degradation (%)
  clearsCapacityFactorFloor: boolean; // True if Year 21 CF >= 16.0% (Clause 11.1.1(b))
  bidBondMyr: number; // Tender Guarantee Bank Guarantee Amount (Pkg 1: RM 3.0M | Pkg 2: RM 1.0M)
  bidPriceMyrKwh?: number; // Required Bid Price / Tariff (RM 0.4331 / kWh @ 12% Equity IRR)
  comparativePriceMyrKwh?: number; // Comparative Price after Merit Points (RM 0.4179 / kWh)

  // Itemized Project Finance CapEx Breakdown (RM Million) - Excludes Bank Guarantee Bid Bond
  pvCapExMyr: number;
  bessCapExMyr: number;
  gridCapExMyr: number;
  landCapExMyr: number;
  landConversionCapExMyr?: number;
  floodCapExMyr: number;
  ownerDevCapExMyr?: number;
  contingencyCapExMyr?: number;
  idcCapExMyr?: number;
  debtArrangementCapExMyr?: number;
  bidBondCapExMyr?: number; // Kept for legacy compatibility, but 0 in CapEx sum (BG guarantee)

  // Solar Metrics
  maxCapacityMW: number; // Equivalent to capacityMWp
  ghiKwhM2Year: number;
  ghiKwhM2Day: number;
  estimatedAnnualMWh: number;
  estimatedLCOEMyr: number; // MYR per kWh
  estimatedIRR: number; // percentage
  estimatedCapExMyr: number; // MYR Million
  interconnectionCostMyr: number; // MYR Million
  annualCarbonOffsetTonnes: number; // Tonnes CO2e avoided per year
  solarResource?: SolarResource;
  yieldResult?: YieldResult;
  notes: string;
}

export interface PMUNode {
  id: string;
  number: number;
  name: string;
  substationType?: 'PMU' | 'PPU'; // Pencawang Masuk Utama (Main Intake) or Pencawang Pembahagian Utama (Distribution)
  state: StateName;
  voltage: VoltageLevel;
  capacityMW: number;
  currentLoadMW?: number;
  availableHeadroomMW?: number;
  capacityUtilizationPct?: number;
  isPendingApplication?: boolean; // ** marked nodes
  lat: number;
  lng: number;
  district: string;
  gridOwnerApproved: boolean;
  description: string;
  landParcels: LandParcel[];
}

export interface CustomLocationAnalysis {
  customLat: number;
  customLng: number;
  customAreaAcres: number;
  nearestPMU: PMUNode;
  distanceToNearestPMUKm: number;
  secondNearestPMU?: PMUNode;
  secondDistanceKm?: number;
  estimatedCableLengthKm: number;
  suggestedVoltage: VoltageLevel;
  ghiKwhM2Year: number;
  ghiKwhM2Day: number;
  maxSolarCapacityMW: number;
  terrainSlope: number | null;
  terrainCategory: 'Flat (<3°)' | 'Gentle Slope (3-8°)' | 'Hilly (8-15°)' | 'Steep (>15°)' | 'Unsurveyed';
  interconnectionCostMyr: number;
  pvCapExMyr: number;
  bessCapExMyr: number;
  gridCapExMyr: number;
  landCapExMyr: number;
  floodCapExMyr: number;
  bidBondCapExMyr: number;
  totalCapExMyr: number;
  lcoeMyrKwh: number;
  irrPercent: number;
  overallScore: number;
  solarResource?: SolarResource;
  yieldResult?: YieldResult;
}

export interface FeasibilityReportData {
  siteName: string;
  nodeName: string;
  state: StateName;
  voltage: VoltageLevel;
  nodeCapacityMW: number;
  distanceToPMUKm: number;
  cableRouteKm: number;
  areaAcres: number;
  areaHectares: number;
  maxCapacityMW: number;
  dataProvenance?: 'SYNTHETIC' | 'USER_ENTERED' | 'VERIFIED_JUPEM';
  lotNumber: string;
  mukim: string;
  district: string;
  ownershipType: string;
  landTitleType: string;
  remainingLeaseYears: number;
  expressConditions: string;
  restrictionsInInterest: string;
  encumbranceStatus: string;
  ndviVegetationIndex: number;
  distanceToPermanentForestReserveKm: number;
  isForestOverlay: boolean;
  terrainSlopeDeg: number | null;
  terrainCategory: string;
  floodRisk: string;
  floodRiskLevel?: string;
  ariFloodLevel50Yr?: number;
  didRiverCatchment?: string;
  historicalFloodEvents?: { year: number; eventName: string; depthMeters: number; durationDays: number; impactSummary: string }[];
  submergenceRiskScore?: number;
  recommendedPileElevationMeters?: number;
  floodMitigationCapExMyr?: number;
  drainageMasterPlanRequirement?: string;
  soilType: string;
  ghiYear: number;
  ghiDay: number;
  annualMWh: number;
  capacityFactor: number;
  capacityFactorYear1?: number;
  capacityFactorYear21?: number;
  clearsCapacityFactorFloor?: boolean;
  exportCapacityMWa?: number;
  solarCapacityMWa?: number;
  bessPowerMW?: number;
  bessEnergyMWh?: number;
  pvCapExMyr: number;
  bessCapExMyr: number;
  gridConnectionCapExMyr: number;
  landAcquisitionCapExMyr?: number;
  bidBondMyr?: number;
  totalCapExMyr: number;
  opExMyrPerYear: number;
  lcoeMyrKwh: number;
  irrPercent: number;
  paybackYears: number;
  annualCarbonOffsetTonnes: number;
  overallScore: number;
  aiReport?: {
    executiveSummary: string;
    cadastralAndLegalReview: string;
    eiaAndEnvironmentalScreening: string;
    interconnectionAnalysis: string;
    solarAndTerrainAssessment: string;
    floodAndHydrologicalAssessment?: string;
    bessAndStoragePlacement: string;
    commercialAndFinancialInsight: string;
    curtailmentAndGridRisk: string;
    carbonOffsetInsight: string;
    ivvAuditSummary?: string;
    riskMatrix: { risk: string; severity: 'Low' | 'Medium' | 'High'; mitigation: string }[];
    regulatoryChecklist: { requirement: string; status: 'Compliant' | 'Pending Review' | 'Action Required'; notes: string }[];
  };
}
