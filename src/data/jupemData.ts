export type JupemLandCategory = 'agricultural' | 'industrial' | 'forest_reserve' | 'water_catchment' | 'commercial';

export interface JupemZone {
  id: string;
  jupemCode: string;
  name: string;
  category: JupemLandCategory;
  categoryLabel: string;
  state: string;
  district: string;
  areaHectares: number;
  areaAcres: number;
  permissibilityStatus: 'Permissible (NLC Sec 124 Conversion Required)' | 'Priority Energy / Utility Zone' | 'Prohibited (Conservation Reserve)' | 'Restricted (EIA Approval Required)';
  permissibilityBadge: 'emerald' | 'amber' | 'rose' | 'blue';
  conversionRateMyrPerAcre: number;
  description: string;
  coords: [number, number][]; // Lat/Lng polygon vertices
  color: string;
  fillColor: string;
}

export const JUPEM_LAND_CATEGORIES: { id: JupemLandCategory; label: string; icon: string; color: string }[] = [
  { id: 'agricultural', label: 'Agricultural (Pertanian)', icon: '🌾', color: '#84cc16' },
  { id: 'industrial', label: 'Industrial (Perindustrian)', icon: '🏭', color: '#0284c7' },
  { id: 'forest_reserve', label: 'Forest Reserve (Hutan Simpan)', icon: '🌳', color: '#15803d' },
  { id: 'water_catchment', label: 'Water Catchment (Tadahan Air)', icon: '💧', color: '#06b6d4' },
  { id: 'commercial', label: 'Commercial / Utility (Komersial)', icon: '⚡', color: '#d97706' },
];

export const JUPEM_ZONES_DATA: JupemZone[] = [
  // 1. KEDAH & PERLIS
  {
    id: 'jupem-agri-kd-01',
    jupemCode: 'JUPEM/KD/2026/AGRI-8821',
    name: 'Zone Pertanian Ladang Kelapa Sawit Mukim Sidam Kiri',
    category: 'agricultural',
    categoryLabel: 'Pertanian (Oil Palm Plantation)',
    state: 'Kedah',
    district: 'Kuala Muda',
    areaHectares: 420,
    areaAcres: 1037,
    permissibilityStatus: 'Permissible (NLC Sec 124 Conversion Required)',
    permissibilityBadge: 'emerald',
    conversionRateMyrPerAcre: 42000,
    description: 'JUPEM Cadastral Class III Agricultural zone. Flat topography (<3°), ideal for LSS6 solar utility conversion under NLC 1965 Section 124.',
    coords: [
      [5.62, 100.52],
      [5.66, 100.56],
      [5.63, 100.61],
      [5.59, 100.57],
    ],
    color: '#65a30d',
    fillColor: '#84cc16',
  },
  {
    id: 'jupem-ind-kd-02',
    jupemCode: 'JUPEM/KD/2026/IND-4412',
    name: 'Zon Perindustrian Heavy Tech Kulim Phase 4',
    category: 'industrial',
    categoryLabel: 'Perindustrian (Industrial Zone)',
    state: 'Kedah',
    district: 'Kulim',
    areaHectares: 280,
    areaAcres: 691,
    permissibilityStatus: 'Priority Energy / Utility Zone',
    permissibilityBadge: 'emerald',
    conversionRateMyrPerAcre: 120000,
    description: 'JUPEM Industrial reserve zone designated for green energy generation and high-voltage grid busbar integration near Kulim Hi-Tech Park.',
    coords: [
      [5.41, 100.56],
      [5.45, 100.59],
      [5.43, 100.63],
      [5.39, 100.60],
    ],
    color: '#0369a1',
    fillColor: '#0284c7',
  },
  {
    id: 'jupem-forest-kd-03',
    jupemCode: 'JUPEM/KD/2026/HSK-0091',
    name: 'Hutan Simpan Bukit Perak (Permanent Forest Reserve)',
    category: 'forest_reserve',
    categoryLabel: 'Hutan Simpan Kekal (Permanent Forest Reserve)',
    state: 'Kedah',
    district: 'Pendang',
    areaHectares: 1250,
    areaAcres: 3088,
    permissibilityStatus: 'Prohibited (Conservation Reserve)',
    permissibilityBadge: 'rose',
    conversionRateMyrPerAcre: 0,
    description: 'Jabatan Perhutanan & JUPEM Class I Protection Forest. Strictly prohibited for solar development to preserve bio-diversity corridors.',
    coords: [
      [5.92, 100.60],
      [5.97, 100.65],
      [5.94, 100.70],
      [5.89, 100.64],
    ],
    color: '#166534',
    fillColor: '#15803d',
  },

  // 2. PERAK
  {
    id: 'jupem-agri-pk-01',
    jupemCode: 'JUPEM/PK/2026/AGRI-3310',
    name: 'Zon Pertanian Ladang Sawit Bikam & Sungkai',
    category: 'agricultural',
    categoryLabel: 'Pertanian (Oil Palm Plantation)',
    state: 'Perak',
    district: 'Batang Padang',
    areaHectares: 680,
    areaAcres: 1680,
    permissibilityStatus: 'Permissible (NLC Sec 124 Conversion Required)',
    permissibilityBadge: 'emerald',
    conversionRateMyrPerAcre: 38000,
    description: 'JUPEM Class II Agricultural terrain. Excellent solar irradiation (1,620 kWh/m²/yr) with direct connection access to PMU Bikam 132kV.',
    coords: [
      [3.91, 101.25],
      [3.96, 101.30],
      [3.93, 101.35],
      [3.88, 101.29],
    ],
    color: '#65a30d',
    fillColor: '#84cc16',
  },
  {
    id: 'jupem-ind-pk-02',
    jupemCode: 'JUPEM/PK/2026/IND-9912',
    name: 'Kawasan Perindustrian Kamunting Utara',
    category: 'industrial',
    categoryLabel: 'Perindustrian (Heavy Industrial)',
    state: 'Perak',
    district: 'Larut & Matang',
    areaHectares: 310,
    areaAcres: 766,
    permissibilityStatus: 'Priority Energy / Utility Zone',
    permissibilityBadge: 'emerald',
    conversionRateMyrPerAcre: 85000,
    description: 'Gazetted industrial land with pre-approved utility zoning status. Bypasses standard agricultural land conversion delays.',
    coords: [
      [4.88, 100.70],
      [4.92, 100.74],
      [4.90, 100.78],
      [4.86, 100.73],
    ],
    color: '#0369a1',
    fillColor: '#0284c7',
  },
  {
    id: 'jupem-water-pk-03',
    jupemCode: 'JUPEM/PK/2026/WAT-1002',
    name: 'Tadahan Air Tasik Temenggor Reservoir Buffer',
    category: 'water_catchment',
    categoryLabel: 'Kawasan Tadahan Air (Water Catchment)',
    state: 'Perak',
    district: 'Hulu Perak',
    areaHectares: 2100,
    areaAcres: 5189,
    permissibilityStatus: 'Prohibited (Conservation Reserve)',
    permissibilityBadge: 'rose',
    conversionRateMyrPerAcre: 0,
    description: 'JUPEM Water Resource Protection Zone for hydro-electric catchment. Land clearing strictly restricted by National Water Resources Council.',
    coords: [
      [5.52, 101.32],
      [5.58, 101.39],
      [5.54, 101.44],
      [5.48, 101.36],
    ],
    color: '#0891b2',
    fillColor: '#06b6d4',
  },

  // 3. SELANGOR
  {
    id: 'jupem-agri-sel-01',
    jupemCode: 'JUPEM/SEL/2026/AGRI-5519',
    name: 'Zon Pertanian Ladang Bestari Jaya & Mukim Api-Api',
    category: 'agricultural',
    categoryLabel: 'Pertanian (Oil Palm Estate)',
    state: 'Selangor',
    district: 'Kuala Selangor',
    areaHectares: 510,
    areaAcres: 1260,
    permissibilityStatus: 'Permissible (NLC Sec 124 Conversion Required)',
    permissibilityBadge: 'emerald',
    conversionRateMyrPerAcre: 58000,
    description: 'Corporate agricultural estate. Close proximity to PMU Bestari Jaya 132kV (1.8 km). Highly favorable for utility solar installation.',
    coords: [
      [3.36, 101.39],
      [3.41, 101.43],
      [3.38, 101.48],
      [3.33, 101.44],
    ],
    color: '#65a30d',
    fillColor: '#84cc16',
  },
  {
    id: 'jupem-ind-sel-02',
    jupemCode: 'JUPEM/SEL/2026/IND-7711',
    name: 'Pulau Indah Industrial & Green Tech Corridor',
    category: 'industrial',
    categoryLabel: 'Perindustrian & Utility Corridor',
    state: 'Selangor',
    district: 'Klang',
    areaHectares: 340,
    areaAcres: 840,
    permissibilityStatus: 'Priority Energy / Utility Zone',
    permissibilityBadge: 'emerald',
    conversionRateMyrPerAcre: 180000,
    description: 'JUPEM Masterplan Port Klang industrial zone. Excellent 275kV grid busbar capacity headroom at PMU Pulau Indah.',
    coords: [
      [2.93, 101.30],
      [2.97, 101.34],
      [2.94, 101.38],
      [2.90, 101.33],
    ],
    color: '#0369a1',
    fillColor: '#0284c7',
  },

  // 4. JOHOR
  {
    id: 'jupem-agri-jh-01',
    jupemCode: 'JUPEM/JH/2026/AGRI-1102',
    name: 'Zon Pertanian Ladang Sawit Chaah North',
    category: 'agricultural',
    categoryLabel: 'Pertanian (Oil Palm Estate)',
    state: 'Johor',
    district: 'Segamat',
    areaHectares: 590,
    areaAcres: 1457,
    permissibilityStatus: 'Permissible (NLC Sec 124 Conversion Required)',
    permissibilityBadge: 'emerald',
    conversionRateMyrPerAcre: 48000,
    description: 'Contiguous plantation land under JUPEM Lot Register. Flat topography (<2°), 2.2 km to PMU Chaah 132kV.',
    coords: [
      [2.22, 103.00],
      [2.27, 103.04],
      [2.24, 103.09],
      [2.19, 103.05],
    ],
    color: '#65a30d',
    fillColor: '#84cc16',
  },
  {
    id: 'jupem-forest-jh-02',
    jupemCode: 'JUPEM/JH/2026/HSK-8801',
    name: 'Hutan Simpan Endau-Rompin Buffer Zone',
    category: 'forest_reserve',
    categoryLabel: 'Hutan Simpan Kekal (Permanent Forest Reserve)',
    state: 'Johor',
    district: 'Mersing',
    areaHectares: 3200,
    areaAcres: 7907,
    permissibilityStatus: 'Prohibited (Conservation Reserve)',
    permissibilityBadge: 'rose',
    conversionRateMyrPerAcre: 0,
    description: 'National Park & JUPEM Grade A Biological Sanctuary. Solar utility development prohibited by Johor PTG and Department of Forestry.',
    coords: [
      [2.48, 103.28],
      [2.56, 103.35],
      [2.51, 103.42],
      [2.43, 103.34],
    ],
    color: '#166534',
    fillColor: '#15803d',
  },

  // 5. PAHANG
  {
    id: 'jupem-agri-phg-01',
    jupemCode: 'JUPEM/PHG/2026/AGRI-4401',
    name: 'Zon Pertanian FELDA Mempaga Bentong',
    category: 'agricultural',
    categoryLabel: 'Pertanian (FELDA Agri Zone)',
    state: 'Pahang',
    district: 'Bentong',
    areaHectares: 480,
    areaAcres: 1186,
    permissibilityStatus: 'Permissible (NLC Sec 124 Conversion Required)',
    permissibilityBadge: 'emerald',
    conversionRateMyrPerAcre: 35000,
    description: 'JUPEM agricultural lot survey zone. Low slope angle (2.8°), ideal for ground-mounted single-axis tracker PV array.',
    coords: [
      [3.50, 101.95],
      [3.55, 101.99],
      [3.52, 102.04],
      [3.47, 102.00],
    ],
    color: '#65a30d',
    fillColor: '#84cc16',
  },
  {
    id: 'jupem-ind-phg-02',
    jupemCode: 'JUPEM/PHG/2026/IND-2209',
    name: 'Kawasan Perindustrian Gebeng Heavy Industrial Park',
    category: 'industrial',
    categoryLabel: 'Perindustrian (Gebeng Industrial Zone)',
    state: 'Pahang',
    district: 'Kuantan',
    areaHectares: 410,
    areaAcres: 1013,
    permissibilityStatus: 'Priority Energy / Utility Zone',
    permissibilityBadge: 'emerald',
    conversionRateMyrPerAcre: 95000,
    description: 'JUPEM Gebeng Petrochemical & Energy precinct. Direct 275kV line interconnection to PMU Gebeng.',
    coords: [
      [3.96, 103.35],
      [4.01, 103.39],
      [3.98, 103.44],
      [3.93, 103.40],
    ],
    color: '#0369a1',
    fillColor: '#0284c7',
  },

  // 6. TERENGGANU & KELANTAN
  {
    id: 'jupem-agri-trg-01',
    jupemCode: 'JUPEM/TRG/2026/AGRI-9012',
    name: 'Zon Pertanian Mukim Jertih & Besut',
    category: 'agricultural',
    categoryLabel: 'Pertanian (Agricultural / Rubber)',
    state: 'Terengganu',
    district: 'Besut',
    areaHectares: 390,
    areaAcres: 963,
    permissibilityStatus: 'Permissible (NLC Sec 124 Conversion Required)',
    permissibilityBadge: 'emerald',
    conversionRateMyrPerAcre: 32000,
    description: 'JUPEM agricultural land parcel. Top irradiation tier in East Coast (1,680 kWh/m²/yr). 3.1 km to PMU Besut 132kV.',
    coords: [
      [5.70, 102.45],
      [5.75, 102.49],
      [5.72, 102.54],
      [5.67, 102.50],
    ],
    color: '#65a30d',
    fillColor: '#84cc16',
  },
  {
    id: 'jupem-comm-trg-02',
    jupemCode: 'JUPEM/TRG/2026/COMM-6610',
    name: 'Kawasan Pembangunan Utility Kemaman Port',
    category: 'commercial',
    categoryLabel: 'Komersial & Utility (Commercial / Utility)',
    state: 'Terengganu',
    district: 'Kemaman',
    areaHectares: 230,
    areaAcres: 568,
    permissibilityStatus: 'Priority Energy / Utility Zone',
    permissibilityBadge: 'emerald',
    conversionRateMyrPerAcre: 88000,
    description: 'JUPEM Commercial Utility Precinct. Pre-zoned for renewable energy power generation and battery storage facilities.',
    coords: [
      [4.22, 103.40],
      [4.26, 103.44],
      [4.24, 103.48],
      [4.20, 103.43],
    ],
    color: '#b45309',
    fillColor: '#d97706',
  },
];

import { LandParcel } from '../types';

export function convertLandParcelToJupemZone(land: LandParcel, pmuNodeName: string): JupemZone {
  let category: JupemLandCategory = 'agricultural';
  let categoryLabel = 'Pertanian (Agricultural)';
  let color = '#65a30d';
  let fillColor = '#84cc16';
  let permissibilityStatus: JupemZone['permissibilityStatus'] = 'Permissible (NLC Sec 124 Conversion Required)';
  let permissibilityBadge: JupemZone['permissibilityBadge'] = 'emerald';

  const catLower = (land.categoryOfLandUse || '').toLowerCase();

  if (land.isPermanentForestReserveOverlay) {
    category = 'forest_reserve';
    categoryLabel = 'Hutan Simpan Kekal (Permanent Forest Reserve)';
    color = '#166534';
    fillColor = '#15803d';
    permissibilityStatus = 'Prohibited (Conservation Reserve)';
    permissibilityBadge = 'rose';
  } else if (land.isWaterCatchmentZone) {
    category = 'water_catchment';
    categoryLabel = 'Tadahan Air (Water Catchment Zone)';
    color = '#0891b2';
    fillColor = '#06b6d4';
    permissibilityStatus = 'Prohibited (Conservation Reserve)';
    permissibilityBadge = 'rose';
  } else if (catLower.includes('industrial')) {
    category = 'industrial';
    categoryLabel = 'Perindustrian (Industrial Zone)';
    color = '#0369a1';
    fillColor = '#0284c7';
    permissibilityStatus = 'Priority Energy / Utility Zone';
    permissibilityBadge = 'emerald';
  } else if (catLower.includes('commercial')) {
    category = 'commercial';
    categoryLabel = 'Komersial / Utility (Commercial Zone)';
    color = '#b45309';
    fillColor = '#d97706';
    permissibilityStatus = 'Priority Energy / Utility Zone';
    permissibilityBadge = 'amber';
  } else if (catLower.includes('scrubland') || catLower.includes('mining')) {
    category = 'agricultural';
    categoryLabel = 'Tanah Terbiar / Bekas Lombong (Brownfield Scrubland)';
    color = '#a16207';
    fillColor = '#eab308';
    permissibilityStatus = 'Permissible (NLC Sec 124 Conversion Required)';
    permissibilityBadge = 'emerald';
  } else {
    category = 'agricultural';
    categoryLabel = 'Pertanian (Agricultural Plantation)';
    color = '#65a30d';
    fillColor = '#84cc16';
    permissibilityStatus = 'Permissible (NLC Sec 124 Conversion Required)';
    permissibilityBadge = 'emerald';
  }

  let coords: [number, number][] = [];
  if (Array.isArray(land.gpsPolygon) && land.gpsPolygon.length >= 3) {
    coords = land.gpsPolygon
      .filter((pt) => typeof pt.lat === 'number' && !isNaN(pt.lat) && typeof pt.lng === 'number' && !isNaN(pt.lng))
      .map((pt) => [pt.lat, pt.lng]);
  }
  
  if (coords.length < 3 && typeof land.lat === 'number' && !isNaN(land.lat) && typeof land.lng === 'number' && !isNaN(land.lng)) {
    coords = [
      [land.lat + 0.003, land.lng - 0.003],
      [land.lat + 0.003, land.lng + 0.003],
      [land.lat - 0.003, land.lng + 0.003],
      [land.lat - 0.003, land.lng - 0.003],
    ];
  }

  const stateCodeMap: Record<string, string> = {
    Kedah: 'KD',
    Kelantan: 'KT',
    Terengganu: 'TRG',
    Johor: 'JH',
    Selangor: 'SEL',
    Perak: 'PK',
    Pahang: 'PHG',
    Melaka: 'MLK',
    'N. Sembilan': 'NS',
    'P. Pinang': 'PNG',
    Perlis: 'PLS',
  };
  const stCode = stateCodeMap[land.state] || 'MY';
  const lotNumClean = (land.lotNumber || '9901').replace(/[^0-9]/g, '') || '9901';
  const jupemCode = `JUPEM/${stCode}/2026/LOT-${lotNumClean}`;

  return {
    id: `jupem-${land.id}`,
    jupemCode,
    name: `JUPEM Cadastral Lot ${land.lotNumber} (${land.mukim})`,
    category,
    categoryLabel,
    state: land.state,
    district: land.district,
    areaHectares: land.areaHectares,
    areaAcres: land.areaAcres,
    permissibilityStatus,
    permissibilityBadge,
    conversionRateMyrPerAcre: 35000,
    description: `Official JUPEM Lot Register entry for ${land.name} near PMU ${pmuNodeName}. Express Condition: ${land.expressConditions}. Land Category: ${land.categoryOfLandUse}.`,
    coords,
    color,
    fillColor,
  };
}

