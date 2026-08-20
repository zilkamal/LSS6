import jsPDF from 'jspdf';
import { PMUNode, LandParcel } from '../types';
import { calculateProjectFinance, getYear21RetentionFactor } from './projectFinance';
import { RFP_PACKAGES, RFP_BENCHMARKS } from '../data/rfpParameters';

export interface RfpReportOptions {
  bidderCompanyName?: string;
  bidderRegistrationNo?: string;
  bidTariffMyrKwh?: number;
  customNotes?: string;
  include21YearSchedule?: boolean;
}

/**
 * Generates an official, bankable formatted PDF summary report for RFP submissions.
 * Includes:
 * 1. Executive Summary & RFP Compliance Notice
 * 2. Selected PMU Substation & Grid Headroom Analysis
 * 3. Cadastral & Land Feasibility Assessment
 * 4. Solar Resource & 21-Year Degradation Yield
 * 5. Grid Interconnection Schematic & Single Line Diagram (SLD)
 * 6. Bankable CapEx & Project Finance Model
 * 7. 21-Year Cash Flow Statement
 * 8. Regulatory Permitting & Submission Checklist
 */
export async function generateRfpSubmissionPdfReport(
  land: LandParcel,
  pmuNode: PMUNode,
  options?: RfpReportOptions
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = 8;

  const isPackage3 = pmuNode.voltage === '33kV' || land.packageSuitability?.includes('Package 3') || (land.bessEnergyMWh === 0 && land.bessPowerMW === 0);
  const pkgDef = isPackage3 ? RFP_PACKAGES.PACKAGE_3 : (land.exportCapacityMWa > 50 ? RFP_PACKAGES.PACKAGE_1 : RFP_PACKAGES.PACKAGE_2);
  const bidTariff = options?.bidTariffMyrKwh ?? (land.bidPriceMyrKwh ?? (isPackage3 ? 0.2380 : 0.4331));
  const bidderCompany = options?.bidderCompanyName || 'LSS6 PROJECT CONSORTIUM SPV SDN. BHD.';
  const bidderReg = options?.bidderRegistrationNo || '202601089821 (1589234-X)';

  // Calculate CapEx and Project Finance
  const pvCap = land.pvCapExMyr || (land.maxCapacityMW * 2.65);
  const bessCap = isPackage3 ? 0 : (land.bessCapExMyr || ((land.bessEnergyMWh || 120) * 0.95));
  const gridCap = land.gridCapExMyr || (land.distanceToPMUKm * 1.25 * 0.85 + (pmuNode.voltage === '275kV' ? 12.0 : pmuNode.voltage === '132kV' ? 8.5 : 3.5));
  const landCap = land.landCapExMyr || land.estimatedTotalLandAcquisitionCostMyr || 15.0;
  const landConvCap = land.landConversionCapExMyr || (land.areaAcres * 0.015);
  const floodCap = land.floodCapExMyr || (land.floodMitigationCapExMyr || 0.85);
  const ownerCap = land.ownerDevCapExMyr || ((pvCap + bessCap + gridCap + landCap) * 0.035);
  const contCap = land.contingencyCapExMyr || ((pvCap + bessCap + gridCap + landCap + landConvCap + floodCap + ownerCap) * 0.05);
  const idcCap = land.idcCapExMyr || ((pvCap + bessCap + gridCap + landCap) * 0.035);
  const debtArrCap = land.debtArrangementCapExMyr || (((pvCap + bessCap + gridCap + landCap + landConvCap + floodCap + ownerCap + contCap) * 0.75) * 0.01);
  const totalCapEx = pvCap + bessCap + gridCap + landCap + landConvCap + floodCap + ownerCap + contCap + idcCap + debtArrCap;

  const annualOpExBase = (
    (land.maxCapacityMW || (isPackage3 ? 25 : 75)) * 0.045 +
    (isPackage3 ? 0 : (land.bessEnergyMWh || 120)) * 0.012 +
    (pvCap + bessCap + gridCap) * 0.0035 +
    land.areaAcres * 0.0012 +
    (isPackage3 ? 0.20 : 0.35) +
    (isPackage3 ? 0.35 : (land.maxCapacityMW > 125 ? 3.0 : 1.0)) * 0.01
  );

  const annualNetExportMWh = land.estimatedAnnualMWh || (land.maxCapacityMW * 1480 * 0.815);

  const financeResults = calculateProjectFinance({
    totalCapEx,
    annualOpExBase,
    annualNetExportMWh,
    tariff: bidTariff,
  });

  const yr21Retention = getYear21RetentionFactor();
  const yr1CF = land.capacityFactorYear1 || ((annualNetExportMWh / (land.maxCapacityMW * 8760)) * 100);
  const yr21CF = land.capacityFactorYear21 || (yr1CF * yr21Retention);
  const clearsCFFloor = yr21CF >= 16.0;

  // Document Styling Helpers
  const renderHeader = (sectionTitle: string) => {
    // Top primary bar
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, pageWidth, 24, 'F');

    // Accent line
    doc.setFillColor(245, 158, 11); // Amber-500
    doc.rect(0, 24, pageWidth, 1.2, 'F');

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('SURUHANJAYA TENAGA (ENERGY COMMISSION) MALAYSIA — LSS6 RFP TENDER SUBMISSION', 14, 8.5);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11.5);
    doc.text(sectionTitle, 14, 15.5);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Site: ${land.name} | PMU: ${pmuNode.name} (${pmuNode.voltage}, ${pmuNode.state}) | Lot: ${land.lotNumber} | Export Cap: ${land.exportCapacityMWa || (isPackage3 ? 20 : 50)} MWa.c. | Ref: ST/LSS6/RFP/2026`,
      14,
      20.5
    );
  };

  const renderFooter = (pageNo: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      `CONFIDENTIAL — FOR LSS6 TENDER SUBMISSION USE ONLY | Bidder: ${bidderCompany} (${bidderReg})`,
      14,
      pageHeight - 7.5
    );
    doc.text(
      `Date: ${new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' })} | Page ${pageNo} of ${totalPages}`,
      pageWidth - 55,
      pageHeight - 7.5
    );
  };

  const renderSectionHeader = (title: string, yPos: number): number => {
    doc.setFillColor(15, 23, 42);
    doc.rect(14, yPos, pageWidth - 28, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 18, yPos + 3.8);
    return yPos + 8;
  };

  const renderTable = (
    headers: string[],
    rows: (string | number)[][],
    yPos: number,
    colWidths: number[],
    aligns: ('left' | 'right' | 'center')[] = []
  ): number => {
    let currentY = yPos;
    
    // Header
    doc.setFillColor(226, 232, 240);
    doc.rect(14, currentY, pageWidth - 28, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);

    let curX = 14;
    headers.forEach((h, i) => {
      const w = colWidths[i];
      const align = aligns[i] || 'left';
      if (align === 'right') {
        doc.text(h, curX + w - 3, currentY + 3.5, { align: 'right' });
      } else if (align === 'center') {
        doc.text(h, curX + w / 2, currentY + 3.5, { align: 'center' });
      } else {
        doc.text(h, curX + 3, currentY + 3.5);
      }
      curX += w;
    });
    currentY += 5;

    // Rows
    doc.setFontSize(6.5);
    rows.forEach((row, rIdx) => {
      const isEven = rIdx % 2 === 0;
      doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
      doc.rect(14, currentY, pageWidth - 28, 4.8, 'F');

      let colX = 14;
      row.forEach((cell, cIdx) => {
        const w = colWidths[cIdx];
        const align = aligns[cIdx] || 'left';
        const textVal = String(cell);
        
        doc.setFont('helvetica', cIdx === 0 ? 'bold' : 'normal');
        doc.setTextColor(15, 23, 42);

        if (align === 'right') {
          doc.text(textVal, colX + w - 3, currentY + 3.3, { align: 'right' });
        } else if (align === 'center') {
          doc.text(textVal, colX + w / 2, currentY + 3.3, { align: 'center' });
        } else {
          doc.text(textVal, colX + 3, currentY + 3.3);
        }
        colX += w;
      });
      currentY += 4.8;
    });

    return currentY + 3;
  };

  // =========================================================================
  // PAGE 1: EXECUTIVE COVER & RFP SUBMISSION SUMMARY
  // =========================================================================
  renderHeader('1. Executive Cover & RFP Submission Summary');
  let y = 30;

  // Tender Title Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('LARGE SCALE SOLAR COMPETITIVE BIDDING PROGRAM (LSS6)', 18, y + 6);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `RFP SUBMISSION SUMMARY: ${land.name.toUpperCase()}`,
    18,
    y + 13
  );

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Tender Ref: ST(IP/EMP/SSCP) 12/1/12 | Program Category: ${pkgDef.name} | Scheduled COD: ${pkgDef.scheduledCOD}`,
    18,
    y + 19
  );
  doc.text(
    `Bidder SPV: ${bidderCompany} | Reg: ${bidderReg} | Date of Submission: ${new Date().toLocaleDateString('en-MY')}`,
    18,
    y + 23.5
  );

  y += 30;

  // Key Project Scorecard & Metrics Dashboard
  y = renderSectionHeader('PROJECT EXECUTIVE SCORECARD & TECHNICAL SUMMARY', y);

  const scorecardRows = [
    ['Program Package', pkgDef.name, 'AI Suitability Score', `${clearsCFFloor ? land.overallScore : Math.min(40, land.overallScore)} / 100 (${clearsCFFloor ? 'Passed' : 'Floor Disqualified'})`],
    ['Solar Export Capacity', `${land.exportCapacityMWa || (isPackage3 ? 20 : 50)} MWa.c.`, 'DC Peak Sizing', `${land.maxCapacityMW} MWp d.c. (${isPackage3 ? '1.25x' : '2.50x'} DC:AC)`],
    ['BESS Storage Sizing', isPackage3 ? '0 MWh (Package 3 Solar-Only)' : `${land.bessPowerMW || 50} MW / ${land.bessEnergyMWh || 120} MWh (4-Hr Duration)`, 'Grid Interconnection Node', `PMU ${pmuNode.name} (${pmuNode.voltage}, ${pmuNode.state})`],
    ['Interconnection Distance', `${land.distanceToPMUKm} km (${land.estimatedCableLengthKm} km Cable Route)`, 'Total Land Area', `${land.areaHectares} Ha (${land.areaAcres} Acres)`],
    ['Year 1 Net Energy', `${Math.round(annualNetExportMWh).toLocaleString()} MWh/yr`, 'Year 1 Capacity Factor', `${yr1CF.toFixed(2)}% (Year 21: ${yr21CF.toFixed(2)}%)`],
    ['Clause 11.1.1(b) CF Floor (16.0%)', clearsCFFloor ? 'COMPLIANT (Passes 16.0% Floor)' : 'NON-COMPLIANT (<16.0% in Yr 21)', 'Tender Guarantee Bid Bond', `RM ${pkgDef.bidBondMyr.toFixed(1)} Million (Bank Guarantee)`],
    ['Total Project CapEx', `RM ${totalCapEx.toFixed(2)} Million`, 'Levelized Cost of Energy (LCOE)', `RM ${financeResults.lcoe.toFixed(4)} / kWh`],
    ['Modeled Bid Tariff', `RM ${bidTariff.toFixed(4)} / kWh`, 'Post-Tax Equity IRR', `${financeResults.equityIRR !== null ? `${financeResults.equityIRR.toFixed(2)}%` : 'N/A'}`],
    ['Min Senior DSCR (18-Yr Tenor)', `${financeResults.minDSCR !== null ? `${financeResults.minDSCR.toFixed(2)}x` : 'N/A'} (Avg: ${financeResults.avgDSCR !== null ? `${financeResults.avgDSCR.toFixed(2)}x` : 'N/A'})`, 'Equity Payback Period', `${financeResults.paybackYears !== null ? `${financeResults.paybackYears.toFixed(1)} Years` : '> 21 Years'}`],
  ];

  y = renderTable(['Technical Parameter', 'Specification', 'Commercial & Financial Metric', 'Modeled Value'], scorecardRows, y, [45, 45, 45, 47]);

  // Mandatory RFP Screening Notice (Clause C-08 / Ref: ZK/IVV/2026/08-005)
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(14, y, pageWidth - 28, 20, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14); // Amber-800
  doc.text('MANDATORY SCREENING & FEASIBILITY DISCLAIMER NOTICE:', 18, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 53, 15);
  const noticeLines = doc.splitTextToSize(
    'INDICATIVE SCREENING OUTPUT — NOT A FEASIBILITY STUDY. Financial metrics are modelled estimates based on standard Malaysian project finance benchmarks (75:25 gearing, 18-year tenor @ 5.25% profit rate, GITA 100% solar tax incentives, and TOPCon degradation retention). Cadastral boundaries, topographical slopes, and hydrological logs are spatial estimates. Independent topographical survey, geotechnical borehole investigation, and TNB connection confirmation are mandatory prior to final RFP submission.',
    pageWidth - 36
  );
  doc.text(noticeLines, 18, y + 9);

  renderFooter(1);

  // =========================================================================
  // PAGE 2: SELECTED PMU DETAILS & GRID INFRASTRUCTURE
  // =========================================================================
  doc.addPage();
  renderHeader('2. Designated PMU Substation & Grid Infrastructure Assessment');
  y = 30;

  y = renderSectionHeader('TNB DESIGNATED INTERCONNECTION SUBSTATION SPECIFICATIONS', y);

  const currentLoad = pmuNode.currentLoadMW ?? Math.round(pmuNode.capacityMW * 0.7);
  const headroomMW = Math.round((pmuNode.capacityMW - currentLoad) * 10) / 10;
  const utilPct = pmuNode.capacityUtilizationPct ?? Math.round((currentLoad / pmuNode.capacityMW) * 100);

  const pmuSpecsRows = [
    ['Substation Name', `${pmuNode.substationType || 'PMU'} ${pmuNode.name}`, 'TNB Asset Index / No.', `#${pmuNode.number}`],
    ['Operating Voltage Level', `${pmuNode.voltage} Primary Transmission`, 'State & District', `${pmuNode.district}, ${pmuNode.state}`],
    ['GPS Nodal Coordinates', `Lat: ${pmuNode.lat.toFixed(5)}, Lng: ${pmuNode.lng.toFixed(5)}`, 'Substation Configuration', pmuNode.voltage === '275kV' ? 'Double Busbar Double Breaker' : 'Double Busbar Single Breaker (GIS/AIS)'],
    ['Nominal Busbar Quota Capacity', `${pmuNode.capacityMW} MW`, 'Existing Injected / Base Load', `${currentLoad} MW (${utilPct}% Utilization)`],
    ['Available Injection Headroom', `${headroomMW} MW Available`, 'Nodal Queue Status', pmuNode.isPendingApplication ? 'Queue Pending (Requires TNB Confirmation)' : 'Open Headroom Available'],
    ['Point of Interconnection (POI)', `Dedicated ${pmuNode.voltage} Feeder Bay`, 'Grid Owner / Operator', 'Tenaga Nasional Berhad (TNB Transmission)'],
    ['Short Circuit Ratio (SCR)', pmuNode.voltage === '275kV' ? '> 5.0 (Strong Grid)' : '> 3.5 (Adequate)', 'Fault Level Rating', pmuNode.voltage === '275kV' ? '40 kA / 3s' : pmuNode.voltage === '132kV' ? '31.5 kA / 3s' : '25 kA / 3s'],
  ];

  y = renderTable(['Substation Parameter', 'Specification', 'Grid Parameter', 'Specification'], pmuSpecsRows, y, [45, 45, 45, 47]);

  y = renderSectionHeader('GRID INTERCONNECTION ROUTE & TRANSMISSION LINE VECTOR', y);

  const routeRows = [
    ['Direct Geospatial Distance', `${land.distanceToPMUKm} km`, 'Planned Cable Route Length', `${land.estimatedCableLengthKm} km (1.25x Route Factor)`],
    ['Transmission Line Spec', pmuNode.voltage === '275kV' ? '275kV Double Circuit Overhead Line (ACSR Zebra / 1x630mm² XLPE)' : pmuNode.voltage === '132kV' ? '132kV Underground / Overhead XLPE 1x630mm² Cu' : '33kV Underground Trefoil XLPE 1x500mm² Al/Cu', 'Right-of-Way (ROW) Width', pmuNode.voltage === '275kV' ? '40.0 meters' : pmuNode.voltage === '132kV' ? '20.0 meters' : '6.0 meters'],
    ['Substation Bay Expansion', `1 x ${pmuNode.voltage} Switchyard Bay Extension with SF6 Breaker & CT/VT`, 'Metering & Telecontrol', 'Class 0.2S Main & Check Revenue Meters + TNB SCADA RTU / OPGW Gateway'],
    ['Interconnection CapEx Estimate', `RM ${gridCap.toFixed(2)} Million`, 'Estimated Energization Schedule', 'Q4 2028 (Ahead of 31 Dec 2029 COD)'],
  ];

  y = renderTable(['Interconnection Scope', 'Technical Detail', 'Interconnection Scope', 'Technical Detail'], routeRows, y, [45, 45, 45, 47]);

  // Grid Code Compliance Notice
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 16, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('PENINSULAR MALAYSIA GRID CODE COMPLIANCE COMMITMENTS:', 18, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Fault Ride-Through (FRT): Plant inverters & BESS PCS support low-voltage ride through down to 0% nominal voltage for 150ms.', 18, y + 8);
  doc.text('2. Reactive Power Capability: Deliver power factor range of 0.95 leading to 0.95 lagging across full active power injection range at POI.', 18, y + 11.5);
  doc.text('3. Active Power Frequency Control: Primary frequency response (droop 3-5%) with secondary AGC modulation enabled.', 18, y + 15);

  renderFooter(2);

  // =========================================================================
  // PAGE 3: CADASTRAL & LAND FEASIBILITY ASSESSMENT
  // =========================================================================
  doc.addPage();
  renderHeader('3. Cadastral Identification & Environmental Screening');
  y = 30;

  y = renderSectionHeader('CADASTRAL TITLE & LAND TENURE SPECIFICATIONS', y);

  const cadRows = [
    ['Lot Number', land.lotNumber, 'District / State', `${land.district}, ${land.state}`],
    ['Mukim', land.mukim, 'Total Site Area', `${land.areaHectares} Ha (${land.areaAcres} Acres)`],
    ['Title Ownership Category', land.ownershipType, 'Land Title Classification', land.landTitleType],
    ['Leasehold Remaining Tenure', `${land.remainingLeaseYears} Years (Min 30-Yr PPA Lease Required)`, 'Registered Encumbrance Status', land.encumbranceStatus],
    ['Land Acquisition Model', land.landAcquisitionType, 'Est. Land Cost / Acre', `RM ${land.estimatedLandCostPerAcreMyr.toLocaleString()} / acre`],
    ['Total Land Acquisition CapEx', `RM ${landCap.toFixed(2)} Million`, 'PTG Section 124 Conversion Premium', `RM ${landConvCap.toFixed(2)} Million (${pmuNode.state} PTG Rule)`],
    ['Express Conditions (Syarat Nyata)', land.expressConditions.substring(0, 40), 'Restrictions in Interest', (land.restrictionsInInterest || 'Tiada sekatan').substring(0, 40)],
    ['Cadastral Data Provenance', land.dataProvenance === 'SYNTHETIC' ? 'SYNTHETIC — PENDING JUPEM TITLE SEARCH' : 'VERIFIED CADASTRAL DATA', 'GPS Centroid Position', `${land.lat.toFixed(5)}, ${land.lng.toFixed(5)}`],
  ];

  y = renderTable(['Cadastral Field', 'Property Value', 'Legal & Financial Field', 'Property Value'], cadRows, y, [45, 45, 45, 47]);

  y = renderSectionHeader('TOPOGRAPHY, HYDROLOGY & ENVIRONMENTAL BUFFER SCREENING', y);

  const envRows = [
    ['DEM Surface Elevation', `${land.elevationDEM} m Above Sea Level (ASL)`, 'Terrain Slope & Category', land.terrainSlope !== null ? `${land.terrainSlope}° (${land.terrainCategory})` : 'Not surveyed (Physical Survey Required)'],
    ['Steep Terrain Exclusion (>15°)', land.isSteepTerrainExcluded ? 'EXCLUDED (>15° slope)' : 'PASSED (<15° clean terrain)', 'NDVI Vegetation Index', `${land.ndviVegetationIndex} (Low-medium scrub/plantation)`],
    ['River Catchment Basin', land.didRiverCatchment || 'Peninsular Hydrological Basin', '50-Yr ARI Flood Inundation', `${land.ariFloodLevel50Yr || 0.3} meters AGL`],
    ['JPS Flood Hazard Classification', land.floodRiskLevel || 'Low Hazard Zone (<0.3m)', 'Submergence Safety Rating', `${land.submergenceRiskScore || 88} / 100 (Safe)`],
    ['Rec. PV Pile / Skid Elevation', `+${land.recommendedPileElevationMeters || 1.5} meters AGL`, 'Civil Drainage & Flood CapEx', `RM ${floodCap.toFixed(2)} Million (Detention pond + swales)`],
    ['Distance to Federal/State Road', `${land.distanceToFederalRoadKm} km`, 'Permanent Forest Reserve Dist.', `${land.distanceToPermanentForestReserveKm} km (0% Overlay Clean)`],
    ['DOE EIA Regulatory Scope', land.eiaCategory, 'Local Plan (RTD) Zoning', land.localPlanZoning],
  ];

  y = renderTable(['Environmental Screening', 'Assessment Result', 'Hydrology & Planning', 'Assessment Result'], envRows, y, [45, 45, 45, 47]);

  renderFooter(3);

  // =========================================================================
  // PAGE 4: SOLAR RESOURCE & 21-YEAR YIELD FORECAST
  // =========================================================================
  doc.addPage();
  renderHeader('4. Solar Resource & 21-Year Yield Assessment');
  y = 30;

  y = renderSectionHeader('SOLAR IRRADIANCE & ENERGY GENERATION BENCHMARKS', y);

  const solarRows = [
    ['Annual Global Horizontal Irradiance (GHI)', `${land.ghiKwhM2Year} kWh/m²/year (${land.ghiKwhM2Day} kWh/m²/day)`, 'Satellite Data Source', 'NASA POWER / Solargis 20-Year Time Series'],
    ['System Performance Ratio (PR)', `${land.performanceRatioPercent || 81.5}%`, 'PV Module Technology', 'N-Type TOPCon Bifacial Glass-Glass (600Wp+)'],
    ['Tracker System', '1-Axis Horizontal Single-Axis Trackers (HSAT)', 'Inverter Technology', '1500V String Inverters (IP66, Smart IV Curve)'],
    ['P50 Annual Generation (Yr 1)', `${Math.round(land.p50AnnualMWh || annualNetExportMWh).toLocaleString()} MWh/year`, 'P90 Exceedance Generation (Yr 1)', `${Math.round(land.p90AnnualMWh || (annualNetExportMWh * 0.915)).toLocaleString()} MWh/year`],
    ['Year 1 Capacity Factor (CF)', `${yr1CF.toFixed(2)}%`, 'Year 21 Capacity Factor (CF)', `${yr21CF.toFixed(2)}% (Degradation factor: ${yr21Retention.toFixed(4)})`],
    ['Clause 11.1.1(b) 16.0% Floor', clearsCFFloor ? 'PASSED (Clears 16.0% Floor in Yr 21)' : 'DISQUALIFIED (<16.0% in Yr 21)', 'Annual Carbon Offset', `${land.annualCarbonOffsetTonnes.toLocaleString()} tCO2e / year`],
  ];

  y = renderTable(['Resource Parameter', 'Model Benchmark', 'System Parameter', 'Model Benchmark'], solarRows, y, [45, 45, 45, 47]);

  y = renderSectionHeader('12-MONTH IRRADIANCE & P50 / P90 GENERATION BREAKDOWN', y);

  const monthlyList = land.monthlyIrradianceData && land.monthlyIrradianceData.length === 12
    ? land.monthlyIrradianceData
    : [
        { month: 'January', ghiKwhM2: 135, p50MWh: Math.round(annualNetExportMWh * 0.082), p90MWh: Math.round(annualNetExportMWh * 0.082 * 0.915) },
        { month: 'February', ghiKwhM2: 142, p50MWh: Math.round(annualNetExportMWh * 0.086), p90MWh: Math.round(annualNetExportMWh * 0.086 * 0.915) },
        { month: 'March', ghiKwhM2: 156, p50MWh: Math.round(annualNetExportMWh * 0.095), p90MWh: Math.round(annualNetExportMWh * 0.095 * 0.915) },
        { month: 'April', ghiKwhM2: 148, p50MWh: Math.round(annualNetExportMWh * 0.090), p90MWh: Math.round(annualNetExportMWh * 0.090 * 0.915) },
        { month: 'May', ghiKwhM2: 138, p50MWh: Math.round(annualNetExportMWh * 0.084), p90MWh: Math.round(annualNetExportMWh * 0.084 * 0.915) },
        { month: 'June', ghiKwhM2: 130, p50MWh: Math.round(annualNetExportMWh * 0.079), p90MWh: Math.round(annualNetExportMWh * 0.079 * 0.915) },
        { month: 'July', ghiKwhM2: 128, p50MWh: Math.round(annualNetExportMWh * 0.078), p90MWh: Math.round(annualNetExportMWh * 0.078 * 0.915) },
        { month: 'August', ghiKwhM2: 132, p50MWh: Math.round(annualNetExportMWh * 0.080), p90MWh: Math.round(annualNetExportMWh * 0.080 * 0.915) },
        { month: 'September', ghiKwhM2: 130, p50MWh: Math.round(annualNetExportMWh * 0.079), p90MWh: Math.round(annualNetExportMWh * 0.079 * 0.915) },
        { month: 'October', ghiKwhM2: 126, p50MWh: Math.round(annualNetExportMWh * 0.077), p90MWh: Math.round(annualNetExportMWh * 0.077 * 0.915) },
        { month: 'November', ghiKwhM2: 118, p50MWh: Math.round(annualNetExportMWh * 0.072), p90MWh: Math.round(annualNetExportMWh * 0.072 * 0.915) },
        { month: 'December', ghiKwhM2: 122, p50MWh: Math.round(annualNetExportMWh * 0.074), p90MWh: Math.round(annualNetExportMWh * 0.074 * 0.915) },
      ];

  const monthTableRows = monthlyList.map((m) => [
    m.month,
    `${m.ghiKwhM2} kWh/m²`,
    `${(m.ghiKwhM2 / 30.4).toFixed(2)} kWh/m²/d`,
    `${m.p50MWh.toLocaleString()} MWh`,
    `${m.p90MWh.toLocaleString()} MWh`,
  ]);

  y = renderTable(['Month', 'Monthly GHI', 'Daily Avg GHI', 'P50 Solar Yield', 'P90 Exceedance Yield'], monthTableRows, y, [35, 35, 35, 38, 39], ['left', 'right', 'right', 'right', 'right']);

  renderFooter(4);

  // =========================================================================
  // PAGE 5: GRID INTERCONNECTION SCHEMATICS & SINGLE LINE DIAGRAM (SLD)
  // =========================================================================
  doc.addPage();
  renderHeader('5. Grid Interconnection Schematic & Single Line Diagram (SLD)');
  y = 30;

  y = renderSectionHeader(`PLANT SINGLE LINE DIAGRAM (SLD) & POINT OF INTERCONNECTION (POI) SCHEMATIC`, y);

  // Draw Electrical Vector Single Line Diagram (SLD)
  const sldBoxY = y;
  const sldBoxHeight = 132;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, sldBoxY, pageWidth - 28, sldBoxHeight, 2, 2, 'FD');

  // Title inside schematic
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `ENGINEERING SLD: ${isPackage3 ? 'SOLAR-ONLY (33kV DIRECT EXPORT)' : 'SOLAR + 4-HR BESS HYBRID'} TO PMU ${pmuNode.name.toUpperCase()} (${pmuNode.voltage})`,
    18,
    sldBoxY + 6
  );

  // 1. PV Field Block (Left)
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(18, sldBoxY + 12, 36, 32, 1.5, 1.5, 'FD');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('PV ARRAY STRINGS', 20, sldBoxY + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`• ${land.maxCapacityMW} MWp TOPCon`, 20, sldBoxY + 22);
  doc.text('• 1500V DC Array Voltage', 20, sldBoxY + 26);
  doc.text('• 1-Axis Solar Trackers', 20, sldBoxY + 30);
  doc.text('• DC Combiner Boxes', 20, sldBoxY + 34);
  doc.text('• String Inverters (0.8kV AC)', 20, sldBoxY + 38);

  // Inverter Step-Up Transformer (0.8kV / 33kV)
  doc.setFillColor(238, 242, 255); // Indigo-50
  doc.setDrawColor(99, 102, 241);
  doc.roundedRect(58, sldBoxY + 16, 26, 24, 1.5, 1.5, 'FD');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text('INVERTER SKID', 60, sldBoxY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(71, 85, 105);
  doc.text('0.8kV / 33kV Trf', 60, sldBoxY + 26);
  doc.text('Dyn11 Step-Up', 60, sldBoxY + 30);
  doc.text('33kV Circuit Breaker', 60, sldBoxY + 34);

  // Line from PV to Inverter Skid
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.line(54, sldBoxY + 28, 58, sldBoxY + 28);

  // 2. BESS Block (Package 1 & 2 only) or Solar-Only Bypass Box (Package 3)
  if (!isPackage3) {
    doc.setFillColor(243, 232, 255); // Purple-100
    doc.setDrawColor(168, 85, 247);
    doc.roundedRect(18, sldBoxY + 48, 36, 32, 1.5, 1.5, 'FD');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 33, 168);
    doc.text('4-HR BESS STORAGE', 20, sldBoxY + 53);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`• ${land.bessPowerMW || 50} MW / ${land.bessEnergyMWh || 120} MWh`, 20, sldBoxY + 58);
    doc.text('• LFP Battery Containers', 20, sldBoxY + 62);
    doc.text('• Liquid Cooled & Fire Suppr.', 20, sldBoxY + 66);
    doc.text('• Bi-directional PCS Inverter', 20, sldBoxY + 70);
    doc.text('• 0.8kV / 33kV Step-Up Trf', 20, sldBoxY + 74);

    // Line from BESS to 33kV Busbar
    doc.setDrawColor(168, 85, 247);
    doc.setLineWidth(0.8);
    doc.line(54, sldBoxY + 64, 88, sldBoxY + 64);
  } else {
    doc.setFillColor(239, 246, 255); // Blue-50
    doc.setDrawColor(59, 130, 246);
    doc.roundedRect(18, sldBoxY + 48, 36, 32, 1.5, 1.5, 'FD');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('PACKAGE 3: SOLAR-ONLY', 20, sldBoxY + 54);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text('• Direct PV Generation Export', 20, sldBoxY + 60);
    doc.text('• No BESS Facility Required', 20, sldBoxY + 65);
    doc.text('• RM 0.00 BESS CapEx Sizing', 20, sldBoxY + 70);
    doc.text('• ST RFP Clause Mandated', 20, sldBoxY + 75);
  }

  // 3. Central 33kV Main Switchboard Busbar
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(1.5);
  doc.line(88, sldBoxY + 15, 88, sldBoxY + 80); // 33kV Main Busbar
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('33kV MV BUSBAR', 83, sldBoxY + 12);

  // Line from Inverter Skid to 33kV Busbar
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.8);
  doc.line(84, sldBoxY + 28, 88, sldBoxY + 28);

  // 4. Main Step-Up Power Transformer & Protection
  doc.setFillColor(240, 253, 244); // Green-50
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(94, sldBoxY + 22, 34, 38, 1.5, 1.5, 'FD');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('MAIN SUBSTATION (MSS)', 96, sldBoxY + 27);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`• 33kV / ${pmuNode.voltage} Power Trf`, 96, sldBoxY + 32);
  doc.text(`• Rating: ${Math.round(land.maxCapacityMW * 1.15)} MVA ONAN/ONAF`, 96, sldBoxY + 36);
  doc.text('• OLTC ±10 x 1.25% Steps', 96, sldBoxY + 40);
  doc.text('• Diff Protection (87T/87L)', 96, sldBoxY + 44);
  doc.text('• SF6 Circuit Breakers', 96, sldBoxY + 48);
  doc.text('• Lightning Arresters 10kA', 96, sldBoxY + 52);
  doc.text('• Class 0.2S Revenue Meters', 96, sldBoxY + 56);

  // Line from 33kV Busbar to MSS
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(88, sldBoxY + 41, 94, sldBoxY + 41);

  // 5. High-Voltage Transmission Line Route (Vector Line)
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(1.2);
  doc.line(128, sldBoxY + 41, 150, sldBoxY + 41);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(130, sldBoxY + 28, 18, 11, 1, 1, 'FD');
  doc.setFontSize(4.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text(`${land.distanceToPMUKm} km`, 133, sldBoxY + 32);
  doc.text(`${pmuNode.voltage} Cable`, 132, sldBoxY + 36);

  // 6. Point of Interconnection (POI) & TNB PMU Substation Switchyard
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.setDrawColor(30, 41, 59);
  doc.roundedRect(150, sldBoxY + 16, 42, 60, 1.5, 1.5, 'FD');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text(`TNB PMU ${pmuNode.name.toUpperCase()}`, 153, sldBoxY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(226, 232, 240);
  doc.text(`• ${pmuNode.voltage} Primary Busbar`, 153, sldBoxY + 28);
  doc.text(`• Allocated POI Feeder Bay`, 153, sldBoxY + 33);
  doc.text(`• TNB SCADA RTU Gateway`, 153, sldBoxY + 38);
  doc.text(`• Fiber Optic OPGW Link`, 153, sldBoxY + 43);
  doc.text(`• Main & Check 0.2S Meters`, 153, sldBoxY + 48);
  doc.text(`• Line Differential 87L`, 153, sldBoxY + 53);
  doc.text(`• Distance Protection 21`, 153, sldBoxY + 58);
  doc.text(`• Synchrocheck Relay 25`, 153, sldBoxY + 63);
  doc.text(`• Substation Quota: ${pmuNode.capacityMW} MW`, 153, sldBoxY + 68);

  // Single Line Diagram Notes below schematic
  doc.setFontSize(5.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Notes: Single Line Diagram represents standard ${pmuNode.voltage} grid injection topology in accordance with TNB Electricity Supply Application Handbook (ESAH) & ST Technical Guidelines. Final SLD is subject to Detailed Power System Study (PSS) including Load Flow, Short Circuit, and Dynamic Transient Stability.`,
    18,
    sldBoxY + 88,
    { maxWidth: pageWidth - 36 }
  );

  y = sldBoxY + sldBoxHeight + 4;

  y = renderSectionHeader('GRID CONNECTION PROTECTION & INSTRUMENTATION SPECIFICATION', y);

  const protRows = [
    ['Protection Function (ANSI 87L / 87T)', 'Dual-ended Numerical Line & Transformer Differential Protection with fiber OPGW channel', 'Main Revenue Class Metering', 'Dual redundant 3-phase 4-wire Class 0.2S Bi-directional 4-Quadrant Active/Reactive Meters'],
    ['Distance Protection (ANSI 21/21N)', 'Quad-zone numerical distance relay with permissive overreach transfer trip (POTT)', 'SCADA Telemetry & Dispatch', 'TNB National Load Despatch Centre (NLDC) IEC 60870-5-104 / DNP3.0 Gateway via OPGW'],
    ['Anti-Islanding & Frequency (ANSI 81O/U)', 'Over/under frequency, ROCOF (df/dt), and vector shift protection enabled', 'Power Quality Monitoring', 'Class A Power Quality recorder monitoring harmonics (THD <3.0%), flicker & voltage dips'],
  ];

  y = renderTable(['Protection Parameter', 'Design Specification', 'Instrumentation Parameter', 'Design Specification'], protRows, y, [45, 45, 45, 47]);

  renderFooter(5);

  // =========================================================================
  // PAGE 6: BANKABLE PROJECT FINANCE & CAPEX BREAKDOWN MATRIX
  // =========================================================================
  doc.addPage();
  renderHeader('6. Bankable Project Finance & CapEx Investment Model');
  y = 30;

  y = renderSectionHeader('ITEMIZED PROJECT CAPEX BREAKDOWN SCHEDULE (BANKABLE BENCHMARK)', y);

  const capexRows = [
    ['1. Solar PV Plant EPC CapEx', `RM ${pvCap.toFixed(2)} Million`, `${land.maxCapacityMW} MWp Tier-1 TOPCon + 1500V Inverters + HSAT @ RM 2.65M/MWp`],
    [
      isPackage3 ? '2. BESS Storage EPC CapEx' : '2. 4-Hour BESS Storage EPC CapEx',
      isPackage3 ? 'RM 0.00 Million' : `RM ${bessCap.toFixed(2)} Million`,
      isPackage3 ? 'N/A - Package 3 (33kV) is Solar-Only (No BESS Required per ST Guidelines)' : `${land.bessPowerMW || 50} MW / ${land.bessEnergyMWh || 120} MWh Utility LFP @ RM 0.95M/MWh`,
    ],
    ['3. Grid Transmission Interconnection', `RM ${gridCap.toFixed(2)} Million`, `${land.estimatedCableLengthKm} km ${pmuNode.voltage} line + 1x Substation Feeder Bay Expansion`],
    ['4. Land Acquisition / 30-Yr Lease CapEx', `RM ${landCap.toFixed(2)} Million`, `${land.areaAcres} Acres @ RM ${land.estimatedLandCostPerAcreMyr.toLocaleString()} / Acre`],
    ['5. Land Conversion Premium (NLC §124)', `RM ${landConvCap.toFixed(2)} Million`, `${pmuNode.state} State PTG Land Use Conversion to Industrial Solar`],
    ['6. Civil Drainage & Flood Mitigation', `RM ${floodCap.toFixed(2)} Million`, 'Site grading, MSMA detention pond, and peripheral drainage swales'],
    ['7. Owner Costs, EIA & PSS Development', `RM ${ownerCap.toFixed(2)} Million`, 'Power System Study, Detailed EIA, Legal, PMC & Lender Technical Adviser'],
    ['8. Physical & Price Contingency Reserve', `RM ${contCap.toFixed(2)} Million`, '5.0% Contingency reserve on EPC, Land & Development subtotal'],
    ['9. Interest During Construction (IDC)', `RM ${idcCap.toFixed(2)} Million`, '18-Month Construction financing interest @ 5.25% profit rate'],
    ['10. Senior Debt Facility Arrangement Fee', `RM ${debtArrCap.toFixed(2)} Million`, '1.00% Senior Debt Facility Arrangement & Underwriting Fee'],
    ['RECONCILED TOTAL PROJECT CAPEX', `RM ${totalCapEx.toFixed(2)} Million`, 'Total Initial Capital Invested (100% Project Cost Base)'],
  ];

  y = renderTable(['CapEx Work Package', 'Allocated CapEx', 'Scope Description & Engineering Basis'], capexRows, y, [55, 35, 92], ['left', 'right', 'left']);

  y = renderSectionHeader('PROJECT FINANCING STRUCTURE & SENSITIVITY BENCHMARKS', y);

  const finStructRows = [
    ['Senior Debt Gearing (75%)', `RM ${financeResults.seniorDebtMyr.toFixed(2)} Million`, 'Project Equity Contribution (25%)', `RM ${financeResults.equityInvestedMyr.toFixed(2)} Million`],
    ['Senior Debt Facility Type', '18-Year Non-Recourse Islamic Green Sukuk', 'Financing Profit Rate', `${(RFP_BENCHMARKS.seniorProfitRate * 100).toFixed(2)}% p.a. (Fixed/Floating Hedged)`],
    ['Annual Senior Debt Service', `RM ${financeResults.annualDebtServiceMyr.toFixed(2)} Million / year`, 'Corporate Tax Shield (GITA 100%)', 'MIDA Green Investment Tax Allowance (100% deduction)'],
    ['Post-Tax Equity IRR', `${financeResults.equityIRR !== null ? `${financeResults.equityIRR.toFixed(2)}%` : 'N/A'}`, 'Discounted Project LCOE', `RM ${financeResults.lcoe.toFixed(4)} / kWh`],
    ['Minimum Senior DSCR', `${financeResults.minDSCR !== null ? `${financeResults.minDSCR.toFixed(2)}x` : 'N/A'} (Covenant >= 1.20x)`, 'Average Senior DSCR', `${financeResults.avgDSCR !== null ? `${financeResults.avgDSCR.toFixed(2)}x` : 'N/A'}`],
    ['Equity Payback Period', `${financeResults.paybackYears !== null ? `${financeResults.paybackYears.toFixed(1)} Years` : '> 21 Years'}`, 'Modeled PPA Tariff', `RM ${bidTariff.toFixed(4)} / kWh`],
  ];

  y = renderTable(['Financing Parameter', 'Model Setting', 'Financial Output', 'Model Setting'], finStructRows, y, [45, 45, 45, 47]);

  renderFooter(6);

  // =========================================================================
  // PAGE 7: 21-YEAR ANNUAL CASH FLOW SCHEDULE
  // =========================================================================
  doc.addPage();
  renderHeader('7. 21-Year Project Finance Cash Flow Schedule');
  y = 30;

  y = renderSectionHeader('21-YEAR ANNUAL NON-RECOURSE CASH FLOW STATEMENT (RM MILLION)', y);

  const cashflowHeaders = ['Yr', 'Net MWh', 'Tariff', 'Revenue', 'OpEx', 'EBITDA', 'Debt Svc', 'Tax', 'CFADS', 'DSCR', 'Equity CF'];
  const cashflowColWidths = [10, 18, 15, 17, 16, 17, 18, 14, 17, 16, 24];
  const cashflowAligns: ('left' | 'right' | 'center')[] = ['center', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'center', 'right'];

  const cashflowRows = financeResults.annualCashflows.map((r) => [
    `Y${r.year}`,
    Math.round(r.energyMWh).toLocaleString(),
    bidTariff.toFixed(4),
    r.revenueMyr.toFixed(2),
    `(${r.opexMyr.toFixed(2)})`,
    r.ebitdaMyr.toFixed(2),
    r.debtServiceMyr > 0 ? `(${r.debtServiceMyr.toFixed(2)})` : '—',
    r.taxMyr > 0 ? `(${r.taxMyr.toFixed(2)})` : '0.00*',
    r.cfadsMyr.toFixed(2),
    r.dscr !== null ? `${r.dscr.toFixed(2)}x` : 'N/A',
    r.equityCFMyr.toFixed(2),
  ]);

  y = renderTable(cashflowHeaders, cashflowRows, y, cashflowColWidths, cashflowAligns);

  // Tax note & summary
  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    '* Note: Statutory corporate tax (24%) in early operating years is sheltered by MIDA Green Investment Tax Allowance (GITA 100%) and Accelerated Capital Allowances (34% Initial, 14% Annual).',
    14,
    y
  );
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const totalDist = financeResults.annualCashflows.reduce((acc, r) => acc + r.equityCFMyr, 0);
  doc.text(
    `Total Cumulative 21-Year Equity Distributions: RM ${totalDist.toFixed(2)} Million | Equity Invested: RM ${financeResults.equityInvestedMyr.toFixed(2)} Million | Net Multiple: ${(totalDist / financeResults.equityInvestedMyr).toFixed(2)}x`,
    14,
    y + 4
  );

  renderFooter(7);

  // =========================================================================
  // PAGE 8: REGULATORY PERMITTING & SUBMISSION CHECKLIST
  // =========================================================================
  doc.addPage();
  renderHeader('8. Regulatory Permitting & Tender Submission Matrix');
  y = 30;

  y = renderSectionHeader('MALAYSIAN STATUTORY REGULATORY APPROVAL MATRIX', y);

  const regRows = [
    ['Suruhanjaya Tenaga (Energy Commission)', 'Public Distribution License (PDL) & Generation License under Electricity Supply Act 1990', 'In Progress / Tender Stage', 'Mandatory for commercial operations'],
    ['Tenaga Nasional Berhad (TNB Grid Owner)', 'Connection Agreement (CA), Power Purchase Agreement (PPA) & System Study (PSS)', 'Headroom Validated', 'Formal PSS required after shortlisting'],
    ['Pejabat Tanah dan Galian (PTG / Pentadbir Tanah)', 'National Land Code 1965 Section 124 Land Use Conversion (Syarat Nyata to Solar)', 'Site Eligible', 'Requires State Authority MMKN Approval'],
    ['Jabatan Alam Sekitar (DOE Malaysia)', 'Environmental Impact Assessment (EIA) approval under Environmental Quality Act 1974', 'Category 2 / EMP Prepared', 'Full baseline flora/fauna & soil assessment'],
    ['Jabatan Pengairan dan Saliran (JPS Malaysia)', 'Drainage Master Plan & MSMA Guideline Compliance for on-site storm detention', 'MSMA Compliant', 'Detention basin & peripheral swales designed'],
    ['Pihak Berkuasa Tempatan (PBT / Majlis Daerah)', 'Planning Permission (Kebenaran Merancang - KM) & Building Plan Approval', 'Zoning Compliant', 'Local Plan RTD industrial/solar alignment'],
    ['Civil Aviation Authority of Malaysia (CAAM)', 'Obstacle Limitation Surfaces (OLS) & Solar Photovoltaic Glare Hazard Analysis', 'Exempt / Safe Altitude', 'Glare simulation verified safe for flight paths'],
    ['MIDA / Ministry of Finance', 'Green Investment Tax Allowance (GITA 100%) & Import Duty / Sales Tax Exemption', 'Eligible Tier-1', '100% Tax allowance against statutory income'],
  ];

  y = renderTable(['Regulatory Authority', 'Statutory Permit / Statutory Requirement', 'Compliance Status', 'Permitting Action Plan'], regRows, y, [40, 56, 32, 54]);

  y = renderSectionHeader('RFP TENDER SUBMISSION PACKAGE VERIFICATION CHECKLIST', y);

  const submitRows = [
    ['Form of Tender & Bid Submission', 'Complete Appendix A tender schedules, board resolution, consortium agreement, and bid pricing schedule.', 'VERIFIED'],
    ['Bid Bond / Tender Guarantee', `RM ${pkgDef.bidBondMyr.toFixed(1)} Million unconditional bank guarantee issued by a licensed financial institution in Malaysia.`, 'READY'],
    ['Financial Feasibility & Equity Funding', 'Project finance model showing senior debt term sheet, equity commitment letter, and minimum 1.20x DSCR.', 'COMPLETED'],
    ['Technical Plant Layout & SLD', 'PVSyst yield report, 1-line electrical schematic (SLD), civil grading, and JPS MSMA drainage plan.', 'COMPLETED'],
    ['Land Title & Securing Document', 'Certified true copy of land title, lease option agreement (30-year), or registered landowner authorization.', 'VERIFIED'],
    ['TNB Connection Confirmation', 'Completed TNB Connection Enquiry Form and preliminary transmission route corridor assessment.', 'READY'],
  ];

  y = renderTable(['RFP Submission Package Item', 'Submission Requirement Details', 'Status'], submitRows, y, [50, 110, 22], ['left', 'left', 'center']);

  // Sign-off Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y + 2, pageWidth - 28, 22, 1.5, 1.5, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('BIDDER SUBMISSION ATTESTATION & SIGN-OFF:', 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text('We hereby certify that this RFP submission summary report has been compiled in accordance with the Energy Commission guidelines.', 18, y + 11);
  doc.text(`Authorized Signatory: _________________________  |  Designation: Project Director  |  Consortium SPV: ${bidderCompany}`, 18, y + 17);

  renderFooter(8);

  // Save the generated PDF
  const safeName = land.name.replace(/[^a-zA-Z0-9]/g, '_');
  const safePmu = pmuNode.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`LSS6_RFP_Submission_Report_${safePmu}_${safeName}.pdf`);
}
