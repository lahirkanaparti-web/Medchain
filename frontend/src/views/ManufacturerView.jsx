import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Factory, Upload, CheckCircle2, ExternalLink, Download, RefreshCw, ChevronDown, ChevronUp, FileSpreadsheet, FileText, Sparkles, Camera, ShieldCheck } from 'lucide-react';
import { createBatch, getBatchQRUrl, exportBatch, extractBatchInfo } from '../api/client';
import PinataBadge from '../components/PinataBadge';
import { useWallet } from '../context/WalletContext';

export default function ManufacturerView() {
  const { account, isConnected } = useWallet();
  const [formData, setFormData] = useState({
    drugName: '',
    batchNumber: '',
    mfgDate: '',
    expiryDate: '',
  });

  const [aiSuggested, setAiSuggested] = useState({
    drugName: false,
    batchNumber: false,
    mfgDate: false,
    expiryDate: false,
  });

  const [ocrLoading, setOcrLoading] = useState(false);

  // Support 3 reference image uploads: Front, Back, Seal
  const [images, setImages] = useState({
    front: null,
    back: null,
    seal: null,
  });

  const [previews, setPreviews] = useState({
    front: null,
    back: null,
    seal: null,
  });

  const [loading, setLoading] = useState(false);
  const [createdBatch, setCreatedBatch] = useState(null);
  const [showTechDetails, setShowTechDetails] = useState(false);

  const handleAutofillPhoto = async (file) => {
    if (!file) return;
    setOcrLoading(true);
    toast.loading('Analyzing label photo with AI Assistant...', { id: 'ocr' });

    try {
      const extracted = await extractBatchInfo(file);
      toast.dismiss('ocr');

      let filledCount = 0;
      const newForm = { ...formData };
      const newSuggested = { ...aiSuggested };

      if (extracted.drug_name) {
        newForm.drugName = extracted.drug_name;
        newSuggested.drugName = true;
        filledCount++;
      }
      if (extracted.batch_number) {
        newForm.batchNumber = extracted.batch_number;
        newSuggested.batchNumber = true;
        filledCount++;
      }
      if (extracted.manufacturing_date) {
        newForm.mfgDate = extracted.manufacturing_date;
        newSuggested.mfgDate = true;
        filledCount++;
      }
      if (extracted.expiry_date) {
        newForm.expiryDate = extracted.expiry_date;
        newSuggested.expiryDate = true;
        filledCount++;
      }

      setFormData(newForm);
      setAiSuggested(newSuggested);

      setImages((prev) => ({ ...prev, front: file }));
      setPreviews((prev) => ({ ...prev, front: URL.createObjectURL(file) }));

      if (filledCount > 0) {
        toast.success(`AI Assistant pre-filled ${filledCount} field(s)! Please review before submitting.`);
      } else {
        toast('Label scanned, but no clear text fields could be extracted. Please enter manually.', { icon: '⚠️' });
      }
    } catch (err) {
      console.error(err);
      toast.dismiss('ocr');
      toast.error('Failed to extract batch info from label photo.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleImageChange = (type, file) => {
    if (file) {
      setImages((prev) => ({ ...prev, [type]: file }));
      setPreviews((prev) => ({ ...prev, [type]: URL.createObjectURL(file) }));
      toast.success(`${type} package photo attached.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!images.front) {
      toast.error('Please attach at least the front package photo as baseline standard.');
      return;
    }

    setLoading(true);

    try {
      const mfgTimestamp = Math.floor(new Date(formData.mfgDate).getTime() / 1000);
      const expTimestamp = Math.floor(new Date(formData.expiryDate).getTime() / 1000);

      const payload = new FormData();
      payload.append('drugName', formData.drugName);
      payload.append('batchNumber', formData.batchNumber);
      payload.append('mfgDate', mfgTimestamp);
      payload.append('expiryDate', expTimestamp);

      if (images.front) payload.append('images', images.front);
      if (images.back) payload.append('images', images.back);
      if (images.seal) payload.append('images', images.seal);

      const result = await createBatch(payload);
      setCreatedBatch(result);
      toast.success(`Batch #${result.batchId} successfully registered with verifiable origin record!`);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Failed to register pharmaceutical batch.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!createdBatch) return;
    try {
      await exportBatch(createdBatch.batchId, format);
      toast.success(`Downloaded batch #${createdBatch.batchId} ${format.toUpperCase()} record.`);
    } catch (err) {
      console.error(err);
      toast.error(`Export failed: ${err.message}`);
    }
  };

  const handleReset = () => {
    setFormData({ drugName: '', batchNumber: '', mfgDate: '', expiryDate: '' });
    setAiSuggested({ drugName: false, batchNumber: false, mfgDate: false, expiryDate: false });
    setImages({ front: null, back: null, seal: null });
    setPreviews({ front: null, back: null, seal: null });
    setCreatedBatch(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Background Context Header — Distinct from task form card */}
      <div className="bg-slate-100/70 rounded p-5 sm:p-6 border border-slate-300 space-y-1">
        <h2 className="text-lg font-display font-bold text-pharma-deep">
          Manufacturer Batch Registration Console
        </h2>
        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
          Register new pharmaceutical batches and establish the verified baseline packaging standards for supply chain traceability and authenticity verification.
        </p>
      </div>

      {!createdBatch ? (
        /* Task Form Card */
        <form onSubmit={handleSubmit} className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel space-y-5 shadow-sm">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-pharma-deep">
              New batch registration entry
            </h3>
            <span className="text-xs text-slate-500 font-mono">Step 1 of 1</span>
          </div>

          {/* AI Autofill Helper Box */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-seal-emerald" />
                <span className="text-xs font-bold text-pharma-deep font-display">
                  Autofill details from label photo
                </span>
              </div>
              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                Optional Assistant
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Upload a package label or document photo to automatically pre-fill details below. All fields remain fully editable.
            </p>
            <label className="inline-flex items-center justify-center px-4 py-2 bg-pharma-deep hover:bg-slate-900 text-white font-semibold text-xs rounded transition-colors cursor-pointer space-x-2">
              {ocrLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Reading label photo...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Scan photo to autofill</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={ocrLoading}
                onChange={(e) => handleAutofillPhoto(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Drug name *
                </label>
                {aiSuggested.drugName && (
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center font-mono">
                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-600" />
                    AI-suggested
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Amoxicillin 500mg"
                value={formData.drugName}
                onChange={(e) => {
                  setFormData({ ...formData, drugName: e.target.value });
                  setAiSuggested({ ...aiSuggested, drugName: false });
                }}
                className={`w-full px-3 py-2 rounded border text-xs outline-none ${
                  aiSuggested.drugName
                    ? 'border-amber-400 bg-amber-50/40 focus:ring-1 focus:ring-amber-500'
                    : 'border-slate-300 focus:ring-1 focus:ring-pharma-deep'
                }`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Batch serial number *
                </label>
                {aiSuggested.batchNumber && (
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center font-mono">
                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-600" />
                    AI-suggested
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="e.g. BATCH-2026-X99"
                value={formData.batchNumber}
                onChange={(e) => {
                  setFormData({ ...formData, batchNumber: e.target.value });
                  setAiSuggested({ ...aiSuggested, batchNumber: false });
                }}
                className={`w-full px-3 py-2 rounded border text-xs outline-none font-mono ${
                  aiSuggested.batchNumber
                    ? 'border-amber-400 bg-amber-50/40 focus:ring-1 focus:ring-amber-500'
                    : 'border-slate-300 focus:ring-1 focus:ring-pharma-deep'
                }`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Manufacturing date *
                </label>
                {aiSuggested.mfgDate && (
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center font-mono">
                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-600" />
                    AI-suggested
                  </span>
                )}
              </div>
              <input
                type="date"
                required
                value={formData.mfgDate}
                onChange={(e) => {
                  setFormData({ ...formData, mfgDate: e.target.value });
                  setAiSuggested({ ...aiSuggested, mfgDate: false });
                }}
                className={`w-full px-3 py-2 rounded border text-xs outline-none ${
                  aiSuggested.mfgDate
                    ? 'border-amber-400 bg-amber-50/40 focus:ring-1 focus:ring-amber-500'
                    : 'border-slate-300 focus:ring-1 focus:ring-pharma-deep'
                }`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Expiry date *
                </label>
                {aiSuggested.expiryDate && (
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center font-mono">
                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-600" />
                    AI-suggested
                  </span>
                )}
              </div>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => {
                  setFormData({ ...formData, expiryDate: e.target.value });
                  setAiSuggested({ ...aiSuggested, expiryDate: false });
                }}
                className={`w-full px-3 py-2 rounded border text-xs outline-none ${
                  aiSuggested.expiryDate
                    ? 'border-amber-400 bg-amber-50/40 focus:ring-1 focus:ring-amber-500'
                    : 'border-slate-300 focus:ring-1 focus:ring-pharma-deep'
                }`}
              />
            </div>
          </div>

          {/* Reference Photograph Upload Area — Aligned Package Stage Concept */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-700">
              Reference packaging standards (Attach 1 to 3 baseline photos) *
            </label>
            <p className="text-[11px] text-slate-500">
              These reference photos serve as the physical benchmark against which distributor, pharmacy, and patient inspection photos are evaluated.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Photo 1: Front */}
              <div className="border border-slate-300 rounded p-3 text-center bg-slate-50 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">1. Front of package *</span>
                {previews.front ? (
                  <div className="space-y-1">
                    <img src={previews.front} alt="Front preview" className="h-28 mx-auto object-contain rounded border border-slate-300" />
                    <button
                      type="button"
                      onClick={() => { setImages((p) => ({ ...p, front: null })); setPreviews((p) => ({ ...p, front: null })); }}
                      className="text-[10px] text-red-600 font-semibold hover:underline block mx-auto"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center space-y-1.5 py-4 border-2 border-dashed border-slate-300 rounded bg-white hover:border-pharma-deep transition-colors">
                    <Camera className="w-5 h-5 text-pharma-deep" />
                    <span className="text-[11px] font-semibold text-pharma-deep">Attach front photo</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange('front', e.target.files[0])} className="hidden" />
                  </label>
                )}
              </div>

              {/* Photo 2: Back */}
              <div className="border border-slate-300 rounded p-3 text-center bg-slate-50 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">2. Back of package (optional)</span>
                {previews.back ? (
                  <div className="space-y-1">
                    <img src={previews.back} alt="Back preview" className="h-28 mx-auto object-contain rounded border border-slate-300" />
                    <button
                      type="button"
                      onClick={() => { setImages((p) => ({ ...p, back: null })); setPreviews((p) => ({ ...p, back: null })); }}
                      className="text-[10px] text-red-600 font-semibold hover:underline block mx-auto"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center space-y-1.5 py-4 border-2 border-dashed border-slate-300 rounded bg-white hover:border-pharma-deep transition-colors">
                    <Camera className="w-5 h-5 text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-700">Attach back photo</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange('back', e.target.files[0])} className="hidden" />
                  </label>
                )}
              </div>

              {/* Photo 3: Seal */}
              <div className="border border-slate-300 rounded p-3 text-center bg-slate-50 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">3. Seal close-up (optional)</span>
                {previews.seal ? (
                  <div className="space-y-1">
                    <img src={previews.seal} alt="Seal preview" className="h-28 mx-auto object-contain rounded border border-slate-300" />
                    <button
                      type="button"
                      onClick={() => { setImages((p) => ({ ...p, seal: null })); setPreviews((p) => ({ ...p, seal: null })); }}
                      className="text-[10px] text-red-600 font-semibold hover:underline block mx-auto"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center space-y-1.5 py-4 border-2 border-dashed border-slate-300 rounded bg-white hover:border-pharma-deep transition-colors">
                    <Camera className="w-5 h-5 text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-700">Attach seal photo</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange('seal', e.target.files[0])} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pharma-deep hover:bg-slate-900 text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering batch origin record...</span>
                </>
              ) : (
                <>
                  <Factory className="w-4 h-4" />
                  <span>Register batch record</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Batch Created Success View */
        <div className="bg-white rounded p-6 sm:p-8 border border-slate-300 doc-panel space-y-6 shadow-sm">
          <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
            <div className="p-2 bg-emerald-50 text-seal-emerald rounded border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-seal-emerald uppercase tracking-wider font-display">
                Batch Successfully Registered
              </span>
              <h3 className="text-lg font-display font-bold text-pharma-deep">{createdBatch.drugName}</h3>
              <span className="text-xs font-mono text-slate-600">Batch #{createdBatch.batchId} ({createdBatch.batchNumber})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2 text-xs">
                <span className="font-semibold text-slate-900 block border-b border-slate-200 pb-1">Batch Record Summary</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch serial:</span>
                  <span className="font-mono text-slate-900">#{createdBatch.batchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lot number:</span>
                  <span className="font-mono text-slate-900">{createdBatch.batchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current custodian:</span>
                  <span className="font-mono text-slate-900 truncate max-w-[160px]">{createdBatch.currentCustodian}</span>
                </div>
              </div>

              {/* QR Barcode Section */}
              <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center space-y-2">
                <span className="text-xs font-semibold text-slate-800 block">Verification QR Code</span>
                <img
                  src={getBatchQRUrl(createdBatch.batchId)}
                  alt="Batch QR Code"
                  className="w-32 h-32 mx-auto border p-1 bg-white rounded"
                />
                <p className="text-[11px] text-slate-500">Scan code on physical package for public verification</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 block">Export audit record</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExport('csv')}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-pharma-deep font-semibold text-[11px] rounded border border-slate-300 flex items-center justify-center space-x-1"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-seal-emerald" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-pharma-deep font-semibold text-[11px] rounded border border-slate-300 flex items-center justify-center space-x-1"
                  >
                    <FileText className="w-3 h-3 text-quarantine-crimson" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <button
                  onClick={() => setShowTechDetails(!showTechDetails)}
                  className="text-xs text-pharma-deep font-semibold hover:underline flex items-center justify-between w-full"
                >
                  <span>Technical details</span>
                  {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showTechDetails && (
                  <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block">Transaction hash:</span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${createdBatch.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-pharma-deep hover:underline flex items-center truncate"
                      >
                        <span className="truncate">{createdBatch.txHash}</span>
                        <ExternalLink className="w-3 h-3 ml-1 shrink-0" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleReset}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded border border-slate-300"
              >
                Register another batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
