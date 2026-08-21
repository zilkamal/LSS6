import React, { useState } from 'react';
import { parseTmyCsv, generateTmyCsvTemplate, SolarResource } from '../services/solarResource';
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

interface TmyUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLat: number;
  targetLon: number;
  onResourceLoaded: (resource: SolarResource) => void;
}

export const TmyUploadModal: React.FC<TmyUploadModalProps> = ({
  isOpen,
  onClose,
  targetLat,
  targetLon,
  onResourceLoaded,
}) => {
  const [csvText, setCsvText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const template = generateTmyCsvTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LSS6_Commercial_TMY_Template_${targetLat.toFixed(2)}N_${targetLon.toFixed(2)}E.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      processCsv(content);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read uploaded file.');
    };
    reader.readAsText(file);
  };

  const processCsv = (content: string) => {
    const { resource, error } = parseTmyCsv(content, targetLat, targetLon);
    if (error || !resource) {
      setErrorMsg(error || 'Failed to parse TMY CSV.');
      setSuccessMsg(null);
    } else {
      setErrorMsg(null);
      setSuccessMsg(
        `Successfully parsed ${resource.provenance.dataset}: ${resource.annualGHI_kwh_m2} kWh/m²/year across 12 calendar months (Grade: BANKABLE, Uncertainty: ±${resource.provenance.datasetUncertainty_pct}%).`
      );
      onResourceLoaded(resource);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 font-mono text-xs">
      <div className="bg-white border border-slate-300 rounded shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col text-slate-900">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 text-white rounded">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Upload Commercial TMY Solar Resource Data (BANKABLE)
              </h3>
              <p className="text-[11px] text-slate-500">
                Ground-calibrated SolarGIS, Meteonorm, Solcast, or Vaisala synthetic time series
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Instructions */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2 text-slate-700">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">TMY Data Verification Standards (Clause 11.1.1)</h4>
            <p className="text-[11px] leading-relaxed">
              Uploading a commercial TMY dataset upgrades the site solar resource grade from <strong>SCREENING (Reanalysis)</strong> to <strong>BANKABLE</strong>. The CSV must contain 12 monthly GHI totals (kWh/m²) and site metadata.
            </p>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Target Coordinates: <strong>{targetLat.toFixed(4)}°N, {targetLon.toFixed(4)}°E</strong>
              </span>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" /> Download TMY Schema Template (.CSV)
              </button>
            </div>
          </div>

          {/* File Upload Zone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded p-6 text-center bg-slate-50/50 transition-colors">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
              id="tmy-csv-file-input"
            />
            <label htmlFor="tmy-csv-file-input" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-emerald-600 animate-bounce" />
              <span className="font-bold text-slate-900">
                {fileName ? fileName : 'Click to select or drop commercial TMY CSV file'}
              </span>
              <span className="text-[10px] text-slate-500">
                Supports SolarGIS, Meteonorm, Solcast, Vaisala format (.csv)
              </span>
            </label>
          </div>

          {/* Status Feedback */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-300 p-3.5 rounded text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">CSV Validation Error:</strong>
                <p className="text-[11px] mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Bankable Resource Loaded:</strong>
                <p className="text-[11px] mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Direct CSV Textarea Paste */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase">
              Or Paste Raw CSV Content Directly:
            </label>
            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                if (e.target.value.trim().length > 20) {
                  processCsv(e.target.value);
                }
              }}
              placeholder="Paste raw TMY CSV lines here..."
              className="w-full bg-white border border-slate-300 rounded p-2 text-[11px] font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
