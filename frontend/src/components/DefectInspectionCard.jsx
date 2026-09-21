import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, Upload, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { inspectDefects } from '../api/client';

export default function DefectInspectionCard({ batchId, onInspectionResult }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPEG/PNG).');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setInspectionResult(null);
  };

  const handleInspect = async () => {
    if (!selectedFile) {
      toast.error('Please upload or capture a photo of the product package first.');
      return;
    }

    setInspecting(true);

    try {
      toast('Analyzing physical package integrity with Groq Vision AI...', { icon: '🔍' });
      const res = await inspectDefects(batchId, selectedFile);
      setInspectionResult(res);

      if (res.severity === 'major') {
        toast.error('AI Warning: Major physical damage detected on shipment photo!');
      } else if (res.severity === 'minor') {
        toast('AI Advisory: Minor physical packaging defects detected.', { icon: '⚠️' });
      } else {
        toast.success('AI Verification: Package appears physically intact.');
      }

      if (onInspectionResult) {
        onInspectionResult(res);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Physical defect inspection failed.';
      toast.error(errMsg);
    } finally {
      setInspecting(false);
    }
  };

  const resetInspection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setInspectionResult(null);
  };

  return (
    <div className="bg-slate-50 rounded p-4 border border-slate-300 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-clinical-800" />
          <h4 className="text-xs font-display font-bold text-clinical-900">
            Agent #5: AI Physical Defect Inspector (Groq Vision)
          </h4>
        </div>
        <span className="text-[10px] bg-clinical-100 text-clinical-900 font-mono px-2 py-0.5 rounded border border-clinical-200">
          Optional Pre-Receipt Check
        </span>
      </div>

      <p className="text-[11px] text-slate-600 leading-relaxed">
        Upload a photo of the received packaging or container to inspect for physical damage (cracks, crushed items, broken seals, leaks, discoloration).
      </p>

      {/* Upload Input & Preview */}
      {!inspectionResult && (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <label className="flex-1 cursor-pointer">
              <div className="border-2 border-dashed border-slate-300 hover:border-clinical-800 rounded p-3 text-center bg-white transition-colors">
                <Camera className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-700 block">
                  {selectedFile ? selectedFile.name : 'Select or Capture Receipt Photo'}
                </span>
                <span className="text-[10px] text-slate-500">Supports JPG, PNG</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {previewUrl && (
              <div className="w-16 h-16 rounded border border-slate-300 overflow-hidden shrink-0 bg-black/5">
                <img src={previewUrl} alt="Receipt preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {selectedFile && (
            <button
              type="button"
              onClick={handleInspect}
              disabled={inspecting}
              className="w-full py-2 px-4 bg-clinical-800 hover:bg-clinical-900 text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {inspecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Inspecting Package Integrity...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run AI Physical Defect Inspection</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Inspection Results Card */}
      {inspectionResult && (
        <div className="space-y-3">
          <div
            className={`p-3.5 rounded border text-xs space-y-2 ${
              inspectionResult.severity === 'major'
                ? 'bg-red-50 border-red-300 text-red-900'
                : inspectionResult.severity === 'minor'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center space-x-1.5 uppercase tracking-wide text-[11px]">
                {inspectionResult.severity === 'major' && <ShieldAlert className="w-4 h-4 text-red-600" />}
                {inspectionResult.severity === 'minor' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                {inspectionResult.severity === 'none' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                <span>Physical Severity: {inspectionResult.severity.toUpperCase()}</span>
              </span>

              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                  inspectionResult.severity === 'major'
                    ? 'bg-red-200 text-red-900'
                    : inspectionResult.severity === 'minor'
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-emerald-200 text-emerald-900'
                }`}
              >
                {inspectionResult.has_defects ? 'Defects Flagged' : 'Package Intact'}
              </span>
            </div>

            {/* List of Defects */}
            {inspectionResult.defects_found && inspectionResult.defects_found.length > 0 ? (
              <div className="space-y-1 pt-1 border-t border-black/10">
                <span className="font-semibold block text-[11px]">Observed Physical Damage:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {inspectionResult.defects_found.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-[11px] pt-1">No structural breaches, cracks, or leaks observed.</p>
            )}

            {/* Recommendation */}
            <div className="pt-1.5 border-t border-black/10">
              <span className="font-semibold block text-[11px]">AI Advisory Recommendation:</span>
              <p className="text-[11px] leading-relaxed italic">{inspectionResult.recommendation}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Human visual inspection remains final authority.</span>
            <button
              type="button"
              onClick={resetInspection}
              className="text-clinical-800 hover:underline font-semibold"
            >
              Re-inspect photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
