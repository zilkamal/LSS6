import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Calendar,
  Building2,
  MapPin,
  Zap,
  Award,
  Clock,
  TrendingUp,
  Briefcase,
  FileText,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Info,
  DollarSign,
  Layers,
  Calculator,
} from 'lucide-react';

interface LSS6BiddingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LSS6BiddingWizardModal: React.FC<LSS6BiddingWizardModalProps> = ({ isOpen, onClose }) => {
  const [packageType, setPackageType] = useState<'pkg1' | 'pkg2' | 'pkg3'>('pkg3');
  const [targetCapacityMW, setTargetCapacityMW] = useState<number>(25);
  const [isBumiputeraStatus, setIsBumiputeraStatus] = useState<boolean>(true);
  const [regionZone, setRegionZone] = useState<'southern' | 'central' | 'northern' | 'eastern'>('southern');
  const [localContentPct, setLocalContentPct] = useState<number>(32); // Min 20%, >30% gets +2.0 merit points
  const [targetCodMonth, setTargetCodMonth] = useState<number>(6); // Months before Dec 2029 (e.g. 6 months early = June 2029)
  const [inputBidPriceSen, setInputBidPriceSen] = useState<number>(21.5); // sen/kWh
  const [hasSolarExperience, setHasSolarExperience] = useState<boolean>(true);
  const [hasBessExperience, setHasBessExperience] = useState<boolean>(false);

  if (!isOpen) return null;

  // Validation logic based on latest RFP
  let capacityValid = false;
  let capacityMin = 60;
  let capacityMax = 500;
  let bessRequired = false;
  let bidBondAmountMyr = 0.35; // RM 350,000 for Package 3

  if (packageType === 'pkg1' || packageType === 'pkg2') {
    capacityMin = 60;
    capacityMax = 500;
    bessRequired = true;
    bidBondAmountMyr = 1.0; // RM 1.0M for Hybrid
    capacityValid = targetCapacityMW >= 60 && targetCapacityMW <= 500;
  } else {
    capacityMin = 10;
    capacityMax = 29.99; // 10 MW to <30 MW
    bessRequired = false;
    bidBondAmountMyr = 0.35; // RM 350,000 for Package 3 (Appendix C1)
    capacityValid = targetCapacityMW >= 10 && targetCapacityMW <= 30;
  }

  const isBumiCompliant = packageType === 'pkg1' || (packageType !== 'pkg1' && isBumiputeraStatus);

  // Latest RFP Merit Scoring & Comparative Price Calculation
  // Local Content Merit: 2.0 merit points for > 30% local content (min is 20%)
  const localContentMerit = localContentPct > 30 ? 2.0 : 0.0;
  // SCOD Merit: 0.5 points per full month earlier than 1 December 2029
  const scodMerit = Math.max(0, targetCodMonth * 0.5);
  const totalMeritScore = Math.min(10.0, localContentMerit + scodMerit);

  // Comparative Price = Bid Price * (100 - Total Merit Score) / 100
  const comparativePriceSen = inputBidPriceSen * ((100 - totalMeritScore) / 100);

  // Readiness Score Calculation
  let readinessScore = 0;
  if (capacityValid) readinessScore += 25;
  if (isBumiCompliant) readinessScore += 25;
  if (hasSolarExperience) readinessScore += 20;
  if (localContentPct >= 20) readinessScore += 15; // Meets min local content
  if (localContentPct > 30) readinessScore += 5; // Merit bonus
  if (regionZone === 'southern' || regionZone === 'central') readinessScore += 10;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded font-black text-xs uppercase tracking-wider font-mono">
              ST RFP 2026
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded">
                  Ref: ST(IP/EMP/SSCP) 12/1/12 (7)
                </span>
                <span className="text-xs text-slate-400 font-mono">17 August 2026</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Energy Commission (ST) Bidding Strategy & Qualification Wizard
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 flex-1">
          {/* Key Guidelines Summary Callout */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg border border-slate-800 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" /> Official Tender Milestones & Critical Deadlines
              </span>
              <span className="text-[11px] text-rose-400 font-bold bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded">
                Bid Closing: 17 Nov 2026, 3:00 PM
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-slate-300">
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Clarification Deadline</span>
                <strong className="text-amber-400 text-xs block">18 September 2026</strong>
                <span className="text-[9px] text-slate-400 block">via lss6solar@st.gov.my</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Mandatory Submission</span>
                <strong className="text-blue-400 text-xs block">3-Box Physical System</strong>
                <span className="text-[9px] text-slate-400 block">Max 5kg/box + 2 USBs</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Package 3 Bid Bond</span>
                <strong className="text-emerald-400 text-xs block">RM 350,000.00</strong>
                <span className="text-[9px] text-slate-400 block">Form Appendix C1</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Mandatory COD</span>
                <strong className="text-purple-300 text-xs block">31 Dec 2029</strong>
                <span className="text-[9px] text-slate-400 block">21-Year PPA Term (≥16% CF)</span>
              </div>
            </div>
          </div>

          {/* Interactive Bidding Configurator Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Form Configuration */}
            <div className="lg:col-span-2 space-y-5 bg-slate-50 p-5 rounded-lg border border-slate-200">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-200 pb-2">
                <Building2 className="w-4 h-4 text-amber-600" /> Step 1: Select Your Bidding Tender Package
              </h3>

              {/* Package Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPackageType('pkg1');
                    if (targetCapacityMW < 60) setTargetCapacityMW(100);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer font-mono ${
                    packageType === 'pkg1'
                      ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Package 1</span>
                  <strong className="text-slate-900 text-xs block">Open Hybrid Tender</strong>
                  <span className="text-[11px] text-slate-600 font-bold block mt-1">Solar + 4-Hr BESS</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Scale: 60MW – 500MW (132/275kV)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPackageType('pkg2');
                    setIsBumiputeraStatus(true);
                    if (targetCapacityMW < 60) setTargetCapacityMW(100);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer font-mono ${
                    packageType === 'pkg2'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">Package 2</span>
                  <strong className="text-slate-900 text-xs block">Bumiputera Hybrid</strong>
                  <span className="text-[11px] text-slate-600 font-bold block mt-1">Solar + 4-Hr BESS</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Scale: 60MW – 100MW (132kV)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPackageType('pkg3');
                    setIsBumiputeraStatus(true);
                    if (targetCapacityMW > 30 || targetCapacityMW < 10) setTargetCapacityMW(25);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer font-mono ${
                    packageType === 'pkg3'
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/20 shadow-xs'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-bold text-purple-700 uppercase block">Package 3 (LSS6-Solar)</span>
                  <strong className="text-slate-900 text-xs block">Solar-Only (No BESS)</strong>
                  <span className="text-[11px] text-purple-700 font-bold block mt-1">RM 0 BESS • 33kV & below</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Scale: 10MW to &lt;30MW (150MW Quota)</span>
                </button>
              </div>

              {/* Target Capacity Input */}
              <div className="space-y-2 font-mono">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Targeted Solar Export Capacity (MWa.c.):
                  </label>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Allowed Limits: {capacityMin} MW – {capacityMax.toFixed(0)} MW
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={capacityMin}
                    max={capacityMax}
                    step={packageType === 'pkg3' ? 1 : 10}
                    value={targetCapacityMW}
                    onChange={(e) => setTargetCapacityMW(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="relative shrink-0">
                    <input
                      type="number"
                      value={targetCapacityMW}
                      onChange={(e) => setTargetCapacityMW(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 border border-slate-300 rounded font-mono text-sm font-bold text-right bg-white"
                    />
                    <span className="absolute right-2 top-2 text-xs text-slate-400 font-bold">MW</span>
                  </div>
                </div>

                {!capacityValid && (
                  <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Bidding capacity must be strictly between {capacityMin} MW and {capacityMax} MW for {packageType === 'pkg3' ? 'Package 3' : 'Packages 1 & 2'}.
                  </p>
                )}
              </div>

              {/* Step 2: Strategic Qualifications & Local Content */}
              <div className="space-y-3 font-mono">
                <h4 className="text-xs font-black text-slate-900 uppercase border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>Step 2: Mandatory Qualifications & Local Sourcing</span>
                  <span className="text-[10px] text-slate-500 normal-case font-normal">Section 13.0 & 20.0 Requirements</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Bumiputera Status */}
                  <label className="flex items-center gap-2 p-2.5 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={isBumiputeraStatus}
                      onChange={(e) => setIsBumiputeraStatus(e.target.checked)}
                      disabled={packageType !== 'pkg1'}
                      className="rounded accent-amber-600"
                    />
                    <span>
                      <strong>≥60% Bumiputera Equity Mandate</strong>
                      <span className="block text-[10px] text-slate-500">Lead member min 30%, each member min 5%</span>
                    </span>
                  </label>

                  {/* Prior Solar Facility Experience */}
                  <label className="flex items-center gap-2 p-2.5 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={hasSolarExperience}
                      onChange={(e) => setHasSolarExperience(e.target.checked)}
                      className="rounded accent-amber-600"
                    />
                    <span>
                      <strong>Solar Track Record (≥10 MW)</strong>
                      <span className="block text-[10px] text-slate-500">Mandatory applicant/shareholder track record</span>
                    </span>
                  </label>
                </div>

                {/* Local Content Slider (>30% awards 2.0 merit points) */}
                <div className="p-3 bg-white rounded border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      Local Content (% of Total CapEx):
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                      localContentPct > 30
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : localContentPct >= 20
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {localContentPct}% {localContentPct > 30 ? '(+2.0 Merit Points)' : localContentPct >= 20 ? '(Meets Min 20%)' : '(Below 20% Min)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={1}
                    value={localContentPct}
                    onChange={(e) => setLocalContentPct(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    * Minimum requirement is 20% local content. Achieving &gt;30% grants 2.0 merit score reduction on comparative tariff evaluation.
                  </p>
                </div>
              </div>

              {/* Step 3: Interactive Comparative Price Simulator */}
              <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-amber-400" />
                    Comparative Price Evaluation Simulator
                  </span>
                  <span className="text-[10px] text-slate-300 bg-slate-700 px-2 py-0.5 rounded">
                    ST Formula: Bid × (100 - Merit) / 100
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Your Nominal Bid Price (sen/kWh):</label>
                    <input
                      type="number"
                      step={0.1}
                      value={inputBidPriceSen}
                      onChange={(e) => setInputBidPriceSen(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-amber-400 font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Months Early before Dec 2029:</label>
                    <input
                      type="number"
                      min={0}
                      max={18}
                      value={targetCodMonth}
                      onChange={(e) => setTargetCodMonth(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-cyan-400 font-bold text-sm"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">+{scodMerit.toFixed(1)} pts (0.5 pts/mo)</span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Evaluated Comparative Price</span>
                    <strong className="text-emerald-400 text-base block font-black">
                      {comparativePriceSen.toFixed(3)} sen/kWh
                    </strong>
                    <span className="text-[9px] text-slate-400 block">
                      Total Merit: -{totalMeritScore.toFixed(1)}% discount
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Scorecard & Bidding Timelines */}
            <div className="space-y-5">
              {/* Readiness Scorecard */}
              <div className="bg-slate-900 text-white p-5 rounded-lg border border-slate-800 font-mono space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase">ST Bid Readiness Index</span>
                  <span className="text-xs font-black text-amber-400">{readinessScore} / 100</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-amber-400">{readinessScore}%</div>
                  <div>
                    <strong className="text-xs block text-slate-200">
                      {readinessScore >= 80 ? 'High Bid Viability' : readinessScore >= 60 ? 'Moderate Readiness' : 'Requires Alignment'}
                    </strong>
                    <span className="text-[10px] text-slate-400">
                      {capacityValid ? 'Capacity rules satisfied' : 'Fix capacity MW range'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] border-t border-slate-800 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Solar Export:</span>
                    <strong className="text-amber-400">{targetCapacityMW} MWa.c.</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">BESS Storage:</span>
                    <strong className={bessRequired ? 'text-emerald-400' : 'text-blue-400'}>
                      {bessRequired ? `${(targetCapacityMW * 0.5).toFixed(0)} MW (4-Hr)` : 'None (Solar-Only RM 0)'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bid Bond (App C1):</span>
                    <strong className="text-emerald-400">RM {(bidBondAmountMyr * 1000000).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Local Content Score:</span>
                    <strong className={localContentPct > 30 ? 'text-emerald-400' : 'text-slate-300'}>
                      {localContentPct}% ({localContentMerit > 0 ? '+2.0 pts' : 'Standard'})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Early COD Merit:</span>
                    <strong className="text-cyan-400">+{scodMerit.toFixed(1)} pts ({targetCodMonth} mos)</strong>
                  </div>
                </div>
              </div>

              {/* 3-Box Submission System Card */}
              <div className="bg-blue-500/10 border-2 border-blue-500/40 p-4 rounded-lg font-mono space-y-2.5">
                <h4 className="text-xs font-black text-blue-900 uppercase flex items-center gap-1.5 border-b border-blue-300/60 pb-1">
                  <Layers className="w-4 h-4 text-blue-700" /> Mandatory 3-Box Submission System
                </h4>

                <div className="space-y-1.5 text-[11px] text-slate-700">
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 block text-[11px]">Box 1: Mandatory Requirements</strong>
                    <span className="text-[10px] text-slate-600 block">Bid Bond, Consortium Agreement, Experience track record</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 block text-[11px]">Box 2: Technical Proposal</strong>
                    <span className="text-[10px] text-slate-600 block">Nodal interconnection at 33kV, SLD, plant layout, PVSyst</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 block text-[11px]">Box 3: Commercial Proposal</strong>
                    <span className="text-[10px] text-slate-600 block">Financial model, bid price, local content declaration</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Forecasted Economic & Environmental Impact Section */}
          <div className="bg-slate-900 text-white p-5 rounded-lg border border-slate-800 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" /> LSS6 Projected National Economic & Carbon Impact
              </span>
              <span className="text-[10px] text-slate-400">Malaysia Net-Zero 2050 Benchmark</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Private Sector Capital</span>
                <strong className="text-amber-400 text-sm block">RM 13B – RM 15B</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Total Foreign & Domestic Direct CapEx</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">EPCC Job Creation</span>
                <strong className="text-emerald-400 text-sm block">15,000 – 20,000</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">New Skilled Construction & Engineering Jobs</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">CO2 Emission Reduction</span>
                <strong className="text-blue-400 text-sm block">2.6 Million Tonnes</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Annual Carbon Offsets (tCO2e/yr)</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Local EPCC Opportunities</span>
                <strong className="text-purple-300 text-sm block">High Priority Pipeline</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Domestic Supply Chain & Contractors</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-300 flex items-center justify-between font-mono text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Energy Commission (Suruhanjaya Tenaga) RFP Ref ST(IP/EMP/SSCP) 12/1/12 (7)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold transition-colors cursor-pointer"
          >
            Close Strategy Wizard
          </button>
        </div>
      </div>
    </div>
  );
};
