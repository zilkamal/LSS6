// Solar Resource Provider Module & Types
// Reference: ZK/SPEC/2026/08-001 Scope: Resource Acquisition & Provenance

export type ResourceGrade = 'BANKABLE' | 'SCREENING' | 'UNAVAILABLE';

export interface MonthlyIrradiance {
  month: number; // 1-12
  ghi_kwh_m2: number; // monthly total GHI
  days: number; // ACTUAL days in month: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  dailyAvg_kwh_m2: number; // ghi_kwh_m2 / days
}

export interface SolarResourceProvenance {
  dataset: string; // e.g. "NASA POWER v9.0 Climatology (SSE-RE)"
  resolution: string; // e.g. "0.5° x 0.625° (~55 km)"
  periodOfRecord: string; // e.g. "1984-2023 (40-Year Climatology)"
  datasetUncertainty_pct: number;
  retrievedAt: string; // ISO timestamp
  biasCorrection: string | null;
}

export interface SolarResource {
  latitude: number;
  longitude: number;
  annualGHI_kwh_m2: number | null;
  monthly: MonthlyIrradiance[];
  grade: ResourceGrade;
  provenance: SolarResourceProvenance;
  warnings: string[];
}

/** Actual calendar day counts for 12 months (non-leap year climatology: Feb = 28) */
export const ACTUAL_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const NASA_BIAS_WARNING =
  'NASA POWER reanalysis at ~55 km resolution. Over Malaysian coastal and monsoon-affected sites this product typically over-reads GHI by 3-8% against ground measurement. Screening use only. Not bankable.';

/**
 * Creates an UNAVAILABLE resource object when API / data fetch fails
 */
export function createUnavailableSolarResource(lat: number, lon: number, reason: string): SolarResource {
  return {
    latitude: lat,
    longitude: lon,
    annualGHI_kwh_m2: null,
    monthly: [],
    grade: 'UNAVAILABLE',
    provenance: {
      dataset: 'Unavailable / Failed Retrieval',
      resolution: 'N/A',
      periodOfRecord: 'N/A',
      datasetUncertainty_pct: 0,
      retrievedAt: new Date().toISOString(),
      biasCorrection: null,
    },
    warnings: [`Solar resource data unavailable for coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)}): ${reason}`],
  };
}

/**
 * Parses raw NASA POWER Climatology point API response into a typed SolarResource (SCREENING)
 */
export function parseNasaPowerResponse(
  rawJson: any,
  lat: number,
  lon: number
): SolarResource {
  try {
    const swParams = rawJson?.properties?.parameter?.ALLSKY_SFC_SW_DWN;
    if (!swParams || typeof swParams !== 'object') {
      return createUnavailableSolarResource(lat, lon, 'Missing ALLSKY_SFC_SW_DWN in NASA POWER payload');
    }

    const monthKeys = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthly: MonthlyIrradiance[] = [];
    let annualSum = 0;

    for (let i = 0; i < 12; i++) {
      const key = monthKeys[i];
      const dailyKwh = Number(swParams[key]);
      if (isNaN(dailyKwh) || dailyKwh <= 0) {
        return createUnavailableSolarResource(lat, lon, `Invalid or missing daily average for month ${key}`);
      }

      const days = ACTUAL_MONTH_DAYS[i];
      const monthlyTotal = Math.round(dailyKwh * days * 10) / 10;
      annualSum += monthlyTotal;

      monthly.push({
        month: i + 1,
        ghi_kwh_m2: monthlyTotal,
        days,
        dailyAvg_kwh_m2: Math.round((monthlyTotal / days) * 100) / 100,
      });
    }

    const annualGHI_kwh_m2 = Math.round(annualSum * 10) / 10;

    return {
      latitude: lat,
      longitude: lon,
      annualGHI_kwh_m2,
      monthly,
      grade: 'SCREENING',
      provenance: {
        dataset: 'NASA POWER v9.0 Climatology (SSE-RE)',
        resolution: '0.5° x 0.625° (~55 km)',
        periodOfRecord: '1984-2023 (40-Year Climatology)',
        datasetUncertainty_pct: 8.0,
        retrievedAt: new Date().toISOString(),
        biasCorrection: 'None applied',
      },
      warnings: [NASA_BIAS_WARNING],
    };
  } catch (err: any) {
    return createUnavailableSolarResource(lat, lon, `Parse error: ${err.message}`);
  }
}

/**
 * Fetches SolarResource from server proxy endpoint (/api/solar-resource)
 */
export async function fetchSolarResource(lat: number, lon: number): Promise<SolarResource> {
  try {
    const res = await fetch(`/api/solar-resource?lat=${lat}&lon=${lon}`);
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.grade === 'UNAVAILABLE' || data.error) {
      return createUnavailableSolarResource(lat, lon, data.error || 'Server indicated resource unavailable');
    }
    return data as SolarResource;
  } catch (err: any) {
    console.warn(`[SolarResource] Fetch failed for (${lat}, ${lon}):`, err);
    return createUnavailableSolarResource(lat, lon, err.message || 'Network request failed');
  }
}

/**
 * Documented TMY CSV template generator for user download (BANKABLE provider)
 */
export function generateTmyCsvTemplate(): string {
  return `# COMMERCIAL TMY SOLAR RESOURCE DATA SCHEMA (BANKABLE)
# Provider: SolarGIS / Meteonorm / Solcast / Vaisala TMY P50
# Site: Peninsular Malaysia Candidate Solar Farm
# Coordinates: Lat 6.1291 N, Lon 102.0363 E
# Period of Record: 2000-2024 (25-Year Synthetic TMY)
# Stated Uncertainty: 3.5%
# Units: Monthly GHI in kWh/m2
Month,MonthName,Days,GHI_kWh_m2
1,Jan,31,148.5
2,Feb,28,161.0
3,Mar,31,182.4
4,Apr,30,175.8
5,May,31,164.2
6,Jun,30,152.0
7,Jul,31,154.6
8,Aug,31,158.3
9,Sep,30,153.9
10,Oct,31,146.2
11,Nov,30,122.8
12,Dec,31,110.5
`;
}

/**
 * Parses user-uploaded commercial TMY CSV file into a BANKABLE SolarResource
 */
export function parseTmyCsv(
  csvContent: string,
  targetLat: number,
  targetLon: number
): { resource?: SolarResource; error?: string } {
  try {
    const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 13) {
      return { error: 'CSV must contain metadata comments and 12 monthly data rows.' };
    }

    let datasetName = 'Commercial Ground-Calibrated TMY (SolarGIS / Meteonorm)';
    let periodOfRecord = '2000-2024 (25-Year Time Series)';
    let statedUncertainty = 3.5;

    // Parse header comments
    for (const line of lines) {
      if (line.startsWith('#')) {
        const lower = line.toLowerCase();
        if (lower.includes('solargis') || lower.includes('meteonorm') || lower.includes('solcast') || lower.includes('vaisala')) {
          datasetName = line.replace(/^#\s*(Provider:)?\s*/i, '').trim();
        }
        if (lower.includes('period')) {
          periodOfRecord = line.replace(/^#\s*(Period of Record:|Period:)?\s*/i, '').trim();
        }
        if (lower.includes('uncertainty')) {
          const match = line.match(/(\d+(\.\d+)?)%/);
          if (match) {
            statedUncertainty = parseFloat(match[1]);
          }
        }
      }
    }

    // Filter out comments and header row
    const dataRows = lines.filter((l) => !l.startsWith('#'));
    if (dataRows.length < 12) {
      return { error: 'CSV must contain at least 12 monthly data rows.' };
    }

    // Check if first row is a column header (e.g. Month, GHI)
    const firstRowCols = dataRows[0].split(',').map((c) => c.trim().toLowerCase());
    const hasHeader = firstRowCols.some((c) => c.includes('month') || c.includes('ghi'));
    const rowsToParse = hasHeader ? dataRows.slice(1, 13) : dataRows.slice(0, 12);

    if (rowsToParse.length < 12) {
      return { error: `Expected 12 month rows, found ${rowsToParse.length}.` };
    }

    const monthly: MonthlyIrradiance[] = [];
    let annualSum = 0;

    for (let i = 0; i < 12; i++) {
      const row = rowsToParse[i];
      const cols = row.split(',').map((c) => c.trim());
      if (cols.length < 2) {
        return { error: `Row ${i + 1} has insufficient columns (expected at least Month, GHI).` };
      }

      // Detect GHI column index (usually last column or column named GHI)
      const ghiValueStr = cols[cols.length - 1];
      const ghiVal = parseFloat(ghiValueStr);
      if (isNaN(ghiVal) || ghiVal <= 0 || ghiVal > 350) {
        return { error: `Row ${i + 1} has invalid GHI value: '${ghiValueStr}'. Expected 50-300 kWh/m2.` };
      }

      const days = ACTUAL_MONTH_DAYS[i];
      annualSum += ghiVal;
      monthly.push({
        month: i + 1,
        ghi_kwh_m2: Math.round(ghiVal * 10) / 10,
        days,
        dailyAvg_kwh_m2: Math.round((ghiVal / days) * 100) / 100,
      });
    }

    const annualGHI_kwh_m2 = Math.round(annualSum * 10) / 10;

    const resource: SolarResource = {
      latitude: targetLat,
      longitude: targetLon,
      annualGHI_kwh_m2,
      monthly,
      grade: 'BANKABLE',
      provenance: {
        dataset: datasetName,
        resolution: 'High-Resolution Site TMY (1 km ground calibrated)',
        periodOfRecord,
        datasetUncertainty_pct: statedUncertainty,
        retrievedAt: new Date().toISOString(),
        biasCorrection: 'Site calibrated with ground pyranometer time series',
      },
      warnings: [],
    };

    return { resource };
  } catch (err: any) {
    return { error: `Failed to parse TMY CSV: ${err.message}` };
  }
}
