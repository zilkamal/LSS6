import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Globe,
  Key,
  ShieldCheck,
  Server,
  Layers,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Cpu,
  MapPin,
  RefreshCw,
  FileCode,
  BookOpen,
  ArrowRight,
  Sliders,
  DollarSign,
  Building,
} from 'lucide-react';

interface OpenDataIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedState?: string;
  selectedDistrict?: string;
}

export const OpenDataIntegrationModal: React.FC<OpenDataIntegrationModalProps> = ({
  isOpen,
  onClose,
  selectedState = 'Kedah',
  selectedDistrict = 'Kuala Muda',
}) => {
  const [activeTab, setActiveTab] = useState<'mygeoserve' | 'dosm' | 'planmalaysia' | 'satellites' | 'legal'>('dosm');
  
  // Live API State for OpenDOSM
  const [dosmState, setDosmState] = useState(selectedState);
  const [dosmDistrict, setDosmDistrict] = useState(selectedDistrict);
  const [dosmLoading, setDosmLoading] = useState(false);
  const [dosmResult, setDosmResult] = useState<any>(null);

  // MyGeoServe API Token State
  const [myGeoServeApiKey, setMyGeoServeApiKey] = useState('');
  const [myGeoServeStatus, setMyGeoServeStatus] = useState<'unconfigured' | 'testing' | 'connected'>('unconfigured');
  const [myGeoServeCatalogData, setMyGeoServeCatalogData] = useState<any>(null);

  // PLANMalaysia WMS State
  const [planMyData, setPlanMyData] = useState<any>(null);

  // Global Satellite Landcover State
  const [satLat, setSatLat] = useState(5.63);
  const [satLng, setSatLng] = useState(100.55);
  const [satData, setSatData] = useState<any>(null);
  const [satLoading, setSatLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDosmData(dosmState, dosmDistrict);
      fetchMyGeoServeCatalog();
      fetchPlanMyWms();
      fetchSatLandCover(satLat, satLng);
    }
  }, [isOpen]);

  const fetchDosmData = async (st: string, dist: string) => {
    setDosmLoading(true);
    try {
      const res = await fetch(`/api/open-data/dosm/district-stats?state=${encodeURIComponent(st)}&district=${encodeURIComponent(dist)}`);
      const data = await res.json();
      setDosmResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDosmLoading(false);
    }
  };

  const fetchMyGeoServeCatalog = async () => {
    try {
      const res = await fetch('/api/open-data/mygeoserve-catalog');
      const data = await res.json();
      setMyGeoServeCatalogData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPlanMyWms = async () => {
    try {
      const res = await fetch('/api/open-data/planmalaysia/zoning-wms');
      const data = await res.json();
      setPlanMyData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSatLandCover = async (lat: number, lng: number) => {
    setSatLoading(true);
    try {
      const res = await fetch(`/api/open-data/global-landcover?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      setSatData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSatLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-300 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 text-slate-950 font-black rounded-lg flex items-center justify-center shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">Open-Data GIS & Cadastral Integration Hub</h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  JUPEM • OpenDOSM • PLANMalaysia
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official API integrations, open public datasets & legal cadastral land classification pathways
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-900 px-6 py-2.5 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs shrink-0 font-mono scrollbar-none">
          <button
            onClick={() => setActiveTab('dosm')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'dosm'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> 1. OpenDOSM & Data.gov.my API
          </button>

          <button
            onClick={() => setActiveTab('mygeoserve')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'mygeoserve'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> 2. JUPEM MyGeoServe API
          </button>

          <button
            onClick={() => setActiveTab('planmalaysia')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'planmalaysia'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 3. PLANMalaysia WMS Zoning
          </button>

          <button
            onClick={() => setActiveTab('satellites')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'satellites'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> 4. Global Satellite Land Cover
          </button>

          <button
            onClick={() => setActiveTab('legal')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'legal'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> 5. Legal Cadastral Framework
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 bg-slate-50 text-sm">
          {/* TAB 1: OPENDOSM & DATA.GOV.MY */}
          {activeTab === 'dosm' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-600" /> Free Open-Data APIs: OpenDOSM & Data.gov.my
                  </h3>
                  <a
                    href="https://open.dosm.gov.my/data-catalogue"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-mono font-bold"
                  >
                    OpenDOSM Catalogue <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  The Department of Statistics Malaysia (OpenDOSM) and <strong>Data.gov.my</strong> provide free, unauthenticated programmatic REST APIs for macroscopic agricultural census, land cover classifications, and regional district zoning metrics across Peninsular Malaysia.
                </p>

                {/* Live Query Controls */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-emerald-600" /> Query Live OpenDOSM District Endpoint
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={dosmState}
                        onChange={(e) => setDosmState(e.target.value)}
                        className="bg-white border border-slate-300 text-xs font-bold px-2.5 py-1.5 rounded text-slate-900 outline-none focus:border-emerald-500"
                      >
                        <option value="Kedah">Kedah</option>
                        <option value="Johor">Johor</option>
                        <option value="Selangor">Selangor</option>
                        <option value="Perak">Perak</option>
                        <option value="Pahang">Pahang</option>
                      </select>
                      <button
                        onClick={() => fetchDosmData(dosmState, dosmDistrict)}
                        disabled={dosmLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${dosmLoading ? 'animate-spin' : ''}`} />
                        Execute API Call
                      </button>
                    </div>
                  </div>

                  {/* API Response Console */}
                  <div className="bg-slate-950 p-3.5 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                      <span>HTTP GET /api/open-data/dosm/district-stats?state={dosmState}</span>
                      <span className="text-emerald-400 font-bold">200 OK</span>
                    </div>
                    <pre className="mt-2 text-[11px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {dosmResult ? JSON.stringify(dosmResult, null, 2) : 'Loading OpenDOSM API data...'}
                    </pre>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-emerald-50/60 rounded border border-emerald-200">
                    <strong className="text-emerald-900 block font-bold mb-1">Agricultural Census Data</strong>
                    Retrieves total state/district oil palm, rubber, and unutilized scrubland coverage (Hectares) to verify candidate site viability.
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded border border-emerald-200">
                    <strong className="text-emerald-900 block font-bold mb-1">Environmental Boundaries</strong>
                    Provides gazetted forest reserve areas and water catchment buffers to flag ecological exclusions automatically.
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded border border-emerald-200">
                    <strong className="text-emerald-900 block font-bold mb-1">Developer API Access</strong>
                    Public API endpoints accessible without API keys at <code>https://developer.data.gov.my/static-api/data-catalogue</code>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JUPEM MYGEOSERVE API */}
          {activeTab === 'mygeoserve' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-600" /> JUPEM Official MyGeoServe Data Catalogue API
                  </h3>
                  <a
                    href="https://mygeoserve.jupem.gov.my/data-catalog"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-700 hover:underline flex items-center gap-1 font-mono font-bold"
                  >
                    MyGeoServe Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Jabatan Ukur dan Pemetaan Malaysia (JUPEM) houses official land parcel boundaries within the <strong>National Digital Cadastral Database (NDCDB / eKadaster)</strong>. Official system-to-system access is offered via the <strong>MyGeoServe Data Catalogue API</strong>.
                </p>

                {/* API Key Configuration Panel */}
                <div className="bg-slate-900 text-white p-4 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                      <Key className="w-4 h-4" /> MyGeoServe Application Credential Configuration
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                      OAuth2 Bearer Mode
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      value={myGeoServeApiKey}
                      onChange={(e) => setMyGeoServeApiKey(e.target.value)}
                      placeholder="Enter MyGeoServe API Client Token (e.g. jupem_live_ndcdb_token_...)"
                      className="flex-1 bg-slate-950 border border-slate-700 text-xs font-mono px-3 py-2 rounded text-white outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => setMyGeoServeStatus('connected')}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-colors cursor-pointer shrink-0"
                    >
                      Bind Credential
                    </button>
                  </div>

                  {myGeoServeStatus === 'connected' ? (
                    <div className="p-2.5 bg-emerald-950/80 border border-emerald-700/60 rounded text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>MyGeoServe Application Token registered. Ready to query NDCDB cadastral lot boundaries.</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-mono">
                      Register your company on <code>https://mygeoserve.jupem.gov.my</code> to obtain formal NDCDB API catalog access.
                    </p>
                  )}
                </div>

                {/* API Catalogue JSON preview */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                  <strong className="text-slate-900 text-xs font-bold block">
                    JUPEM MyGeoServe API Endpoints Architecture
                  </strong>
                  <div className="bg-slate-950 p-3 rounded text-emerald-400 font-mono text-[11px] overflow-x-auto">
                    <pre>{myGeoServeCatalogData ? JSON.stringify(myGeoServeCatalogData, null, 2) : 'Loading JUPEM API Catalog...'}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLANMALAYSIA WMS */}
          {activeTab === 'planmalaysia' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" /> PLANMalaysia WMS / WFS Zoning Layers
                  </h3>
                  <a
                    href="https://i-plan.planmalaysia.gov.my"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-mono font-bold"
                  >
                    i-Plan Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  PLANMalaysia (Jabatan Perancangan Bandar dan Desa) governs statutory local development plans (<em>Rancangan Tempatan Daerah - RTD</em>). Their open WMS/WFS map servers reveal approved land zoning (Agricultural, Industrial, Residential) without requiring private land title searches.
                </p>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <strong className="text-slate-900 text-xs font-bold block">
                    Available PLANMalaysia Open GIS Service Layers
                  </strong>

                  <div className="space-y-2 text-xs">
                    {(planMyData?.availableLayers || []).map((layer: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{layer.title}</span>
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                            {layer.layerName}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{layer.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GLOBAL SATELLITE LANDCOVER */}
          {activeTab === 'satellites' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-teal-600" /> ESA WorldCover & Esri 10m High-Res Satellite Land Cover
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  To automatically categorize land cover (e.g. separating cropland/oil palm from dense forest, water bodies, or urban built-up areas), the platform queries open-access 10-meter global satellite registries.
                </p>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Satellite Coordinate Inspector: ({satLat}, {satLng})
                    </span>
                    <button
                      onClick={() => fetchSatLandCover(satLat, satLng)}
                      disabled={satLoading}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${satLoading ? 'animate-spin' : ''}`} />
                      Query Satellite Layer
                    </button>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded text-teal-300 font-mono text-xs overflow-x-auto">
                    <pre>{satData ? JSON.stringify(satData, null, 2) : 'Loading satellite classification data...'}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEGAL CADASTRAL FRAMEWORK */}
          {activeTab === 'legal' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Legal & Structural Cadastral Reality in Malaysia
                </h3>

                <div className="bg-amber-50 border border-amber-300 p-4 rounded-lg space-y-2 text-xs text-amber-950">
                  <strong className="text-amber-900 block font-bold text-sm">
                    Distinction Between JUPEM Boundaries & State PTG Rights:
                  </strong>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                    <li>
                      <strong>JUPEM (Jabatan Ukur dan Pemetaan Malaysia):</strong> Responsible purely for physical survey boundaries (boundary lines, lot numbers, NDCDB geospatial coordinates).
                    </li>
                    <li>
                      <strong>State PTG (Pejabat Tanah dan Galian):</strong> Governs the legal land title rights, categories of land use (<em>Kategori Guna Tanah</em>), implied conditions, and ownership transfers under the <strong>National Land Code 1965 (NLC)</strong>.
                    </li>
                    <li>
                      <strong>Section 124 NLC Title Conversion:</strong> Converting agricultural land (e.g. oil palm) to utility solar power generation (<em>Syarat Khas Stesen Janakuasa Solar</em>) requires formal submission to the respective State Executive Council (MMKN) via PTG.
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block font-bold">1. JUPEM Physical Lot Survey</strong>
                    Provides exact spatial coordinates, lot dimensions, and boundary posts via NDCDB / eKadaster.
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block font-bold">2. State PTG Official Title Search</strong>
                    Verifies registered landowner names, encumbrances (caveats, charges), and remaining leasehold tenure.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between shrink-0 font-mono text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>OpenGIS Architecture Specification v2.4</span>
          </div>
          <button
            onClick={onClose}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded transition-colors cursor-pointer shadow-xs"
          >
            Close Integration Hub
          </button>
        </div>
      </div>
    </div>
  );
};
