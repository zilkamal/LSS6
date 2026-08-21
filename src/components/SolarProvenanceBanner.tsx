import React from 'react';
import { SolarResource, ResourceGrade } from '../services/solarResource';
import { ShieldCheck, AlertTriangle, XCircle, FileSpreadsheet, Info } from 'lucide-react';

interface SolarProvenanceBannerProps {
  resource?: SolarResource | null;
  onUploadTmyClick?: () => void;
  compact?: boolean;
}

export const SolarProvenanceBanner: React.FC<SolarProvenanceBannerProps> = ({
  resource,
  onUploadTmyClick,
  compact = false,
}) => {
  const grade: ResourceGrade = resource?.grade || 'SCREENING';
  const provenance = resource?.provenance;
  const uncertainty = provenance?.datasetUncertainty_pct ?? (grade === 'BANKABLE' ? 3.5 : 8.0);
  const dataset = provenance?.dataset || (grade === 'BANKABLE' ? 'Commercial Ground-Calibrated TMY' : 'NASA POWER v9.0 Climatology (SSE-RE)');
  const period = provenance?.periodOfRecord || '1984-2023 (40-Year Climatology)';
  const resolution = provenance?.resolution || '0.5° x 0.625° (~55 km)';

  if (grade === 'BANKABLE') {
    return (
      <div
        id="solar-provenance-banner-bankable"
        className={`bg-emerald-50 border border-emerald-300 rounded text-emerald-950 font-mono shadow-xs ${
          compact ? 'p-2.5 text-xs' : 'p-4 text-xs space-y-2'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black bg-emerald-600 text-white uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> BANKABLE RESOURCE DATA
            </span>
            <span className="font-bold text-emerald-900 text-xs">
              {dataset}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-emerald-800">
            <span><strong>Period:</strong> {period}</span>
            <span><strong>Resolution:</strong> {resolution}</span>
            <span><strong>Stated Uncertainty:</strong> &plusmn;{uncertainty.toFixed(1)}%</span>
          </div>
        </div>

        {!compact && (
          <p className="text-[11px] text-emerald-900 leading-relaxed pt-1 border-t border-emerald-200/70">
            Certified site-specific solar resource data. Suitable for bankable project finance modeling, lender technical advisory (LTA) review, and Suruhanjaya Tenaga LSS6 bid submission.
          </p>
        )}
      </div>
    );
  }

  if (grade === 'UNAVAILABLE') {
    return (
      <div
        id="solar-provenance-banner-unavailable"
        className={`bg-rose-50 border-2 border-rose-400 rounded text-rose-950 font-mono shadow-xs ${
          compact ? 'p-2.5 text-xs' : 'p-4 text-xs space-y-2'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black bg-rose-600 text-white uppercase tracking-wider">
              <XCircle className="w-3.5 h-3.5 mr-1" /> DATA UNAVAILABLE
            </span>
            <span className="font-bold text-rose-900">
              Solar Resource Provider Unavailable
            </span>
          </div>

          {onUploadTmyClick && (
            <button
              onClick={onUploadTmyClick}
              className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Upload Bankable TMY CSV
            </button>
          )}
        </div>

        <p className="text-[11px] text-rose-900 leading-relaxed">
          Solar irradiance data could not be verified from a named source. All downstream energy yields, Capacity Factor floor evaluations, and financial LCOE outputs have been suppressed to prevent ungrounded engineering conclusions.
        </p>
      </div>
    );
  }

  // SCREENING Grade (Amber)
  return (
    <div
      id="solar-provenance-banner-screening"
      className={`bg-amber-50/90 border border-amber-300 rounded text-amber-950 font-mono shadow-xs ${
        compact ? 'p-2.5 text-xs' : 'p-4 text-xs space-y-2'
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black bg-amber-600 text-slate-950 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-slate-950" /> SCREENING GRADE
          </span>
          <span className="font-bold text-amber-950">
            {dataset}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-amber-900">
          <span><strong>Period:</strong> {period}</span>
          <span><strong>Resolution:</strong> {resolution}</span>
          <span><strong>Uncertainty:</strong> &plusmn;{uncertainty.toFixed(1)}%</span>
          {onUploadTmyClick && (
            <button
              onClick={onUploadTmyClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded transition-colors ml-2 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Upload TMY (Bankable)
            </button>
          )}
        </div>
      </div>

      {!compact && (
        <div className="pt-1 border-t border-amber-200 text-[11px] text-amber-950 space-y-1">
          <p className="leading-relaxed font-semibold">
            Screening estimate from reanalysis data at ~55 km resolution. Not suitable for bid submission or lender review. Commission site-specific resource data before proceeding.
          </p>
          <p className="text-amber-800 text-[10px] flex items-center gap-1">
            <Info className="w-3 h-3 inline shrink-0" />
            Over Malaysian coastal and monsoon-affected sites this reanalysis product typically over-reads GHI by 3–8% against ground measurement.
          </p>
        </div>
      )}
    </div>
  );
};
