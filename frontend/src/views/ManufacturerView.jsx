import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Factory, Upload, CheckCircle2, ExternalLink, Download, RefreshCw, ChevronDown, ChevronUp, FileSpreadsheet, FileText, Sparkles, Bot } from 'lucide-react';
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
    toast.loading('Analyzing label photo with Groq Vision AI...', { id: 'ocr' });

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

      // Also set as Front reference image preview
      setImages((prev) => ({ ...prev, front: file }));
      setPreviews((prev) => ({ ...prev, front: URL.createObjectURL(file) }));

      if (filledCount > 0) {
        toast.success(`Groq Vision AI pre-filled ${filledCount} field(s)! Please review before submitting.`);
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
      toast.success(`${type.toUpperCase()} package photograph attached.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!images.front) {
      toast.error('Please attach at least the Front of Package reference photograph.');
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

      // Append up to 3 image files
      if (images.front) payload.append('images', images.front);
      if (images.back) payload.append('images', images.back);
      if (images.seal) payload.append('images', images.seal);

      const result = await createBatch(payload);
      setCreatedBatch(result);
      toast.success(`Batch #${result.batchId} successfully registered with ${result.ipfsHashes?.length || 1} reference standards on Pinata IPFS!`);
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
      toast.success(`Downloaded batch #${createdBatch.batchId} ${format.toUpperCase()} audit record.`);
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
      {/* Clinical Origin Header */}
      <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-2.5 bg-clinical-50 text-clinical-800 rounded border border-clinical-200 shrink-0 mt-0.5">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-clinical-900">
              Manufacturer Batch Registration
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Create a verifiable digital origin record and attach 1–3 reference packaging standards (Front, Back, Seal close-up) pinned to Pinata IPFS cloud storage for supply chain tracking.
            </p>
          </div>
        </div>
      </div>

      {!createdBatch ? (
        <form onSubmit={handleSubmit} className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel space-y-5">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-clinical-900">
              Register new pharmaceutical batch
            </h3>
            <span className="text-xs text-slate-500">Origin record entry</span>
          </div>

          {/* Groq Vision OCR Autofill Box */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-clinical-800" />
                <span className="text-xs font-bold text-clinical-900 font-display">
                  Groq Vision AI — Autofill from Packaging Photo
                </span>
              </div>
              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Optional Assistant
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Upload a label photo or Certificate of Analysis to automatically pre-fill form fields below. All fields remain 100% editable for human review.
            </p>
            <label className="inline-flex items-center justify-center px-4 py-2 bg-clinical-800 hover:bg-clinical-900 text-white font-semibold text-xs rounded transition-colors cursor-pointer space-x-2">
              {ocrLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning label with Groq Vision...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Autofill from photo</span>
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
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center">
                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-600" />
                    AI-suggested — please verify
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
                    : 'border-slate-300 focus:ring-1 focus:ring-clinical-800 focus:border-clinical-800'
                }`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Batch serial number *
                </label>
                {aiSuggested.batchNumber && (
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center">
                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-600" />
                    AI-suggested — please verify
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
                className={`w-full px-3 py-2 rounded border text-xs outline-none ${
                  aiSuggested.batchNumber
                    ? 'border-amber-400 bg-amber-50/40 focus:ring-1 focus:ring-amber-500'
                    : 'border-slate-300 focus:ring-1 focus:ring-clinical-800 focus:border-clinical-800'
                }`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Manufacturing date *
                </label>
                {aiSuggested.mfgDate && (
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center">
                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-600" />
                    AI-suggested — please verify
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
                    : 'border-slate-300 focus:ring-1 focus:ring-clinical-800 focus:border-clinical-800'
                }`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Expiry date *
                </label>
                {aiSuggested.expiryDate && (
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center">
                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-600" />
                    AI-suggested — please verify
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
                    : 'border-slate-300 focus:ring-1 focus:ring-clinical-800 focus:border-clinical-800'
                }`}
              />
            </div>
          </div>


          {/* Multiple Reference Image Upload Grid (1-3 images) */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-700">
              Reference packaging standards (Attach 1 to 3 multi-angle photos to pin to Pinata IPFS) *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Image 1: Front of package */}
              <div className="border border-slate-300 rounded p-3 text-center bg-slate-50 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">1. Front of package *</span>
                {previews.front ? (
                  <div className="space-y-1">
                    <img src={previews.front} alt="Front preview" className="h-28 mx-auto object-contain rounded border" />
                    <button
                      type="button"
                      onClick={() => { setImages((p) => ({ ...p, front: null })); setPreviews((p) => ({ ...p, front: null })); }}
                      className="text-[10px] text-red-600 font-semibold hover:underline block mx-auto"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center space-y-1 py-3 border-2 border-dashed border-slate-300 rounded hover:bg-slate-100">
                    <Upload className="w-5 h-5 text-clinical-800" />
                    <span className="text-[11px] font-semibold text-clinical-900">Upload Front</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange('front', e.target.files[0])} className="hidden" />
                  </label>
                )}
              </div>

              {/* Image 2: Back of package */}
              <div className="border border-slate-300 rounded p-3 text-center bg-slate-50 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">2. Back of package (optional)</span>
                {previews.back ? (
                  <div className="space-y-1">
                    <img src={previews.back} alt="Back preview" className="h-28 mx-auto object-contain rounded border" />
                    <button
                      type="button"
                      onClick={() => { setImages((p) => ({ ...p, back: null })); setPreviews((p) => ({ ...p, back: null })); }}
                      className="text-[10px] text-red-600 font-semibold hover:underline block mx-auto"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center space-y-1 py-3 border-2 border-dashed border-slate-300 rounded hover:bg-slate-100">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-700">Upload Back</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange('back', e.target.files[0])} className="hidden" />
                  </label>
                )}
              </div>

              {/* Image 3: Seal close-up */}
              <div className="border border-slate-300 rounded p-3 text-center bg-slate-50 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">3. Seal close-up (optional)</span>
                {previews.seal ? (
                  <div className="space-y-1">
                    <img src={previews.seal} alt="Seal preview" className="h-28 mx-auto object-contain rounded border" />
                    <button
                      type="button"
                      onClick={() => { setImages((p) => ({ ...p, seal: null })); setPreviews((p) => ({ ...p, seal: null })); }}
                      className="text-[10px] text-red-600 font-semibold hover:underline block mx-auto"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center space-y-1 py-3 border-2 border-dashed border-slate-300 rounded hover:bg-slate-100">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-700">Upload Seal</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange('seal', e.target.files[0])} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-clinical-800 hover:bg-clinical-900 text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Registering batch & pinning images to Pinata IPFS...</span>
              </>
            ) : (
              <span>Register batch</span>
            )}
          </button>
        </form>
      ) : (
        /* Confirmation State */
        <div className="bg-white rounded p-6 border border-slate-300 doc-panel space-y-5">
          <div className="flex items-center space-x-3 text-genuine-600 border-b border-slate-200 pb-3">
            <CheckCircle2 className="w-7 h-7" />
            <div>
              <h3 className="font-display font-bold text-base text-clinical-900">Batch registered successfully</h3>
              <p className="text-xs text-slate-500">Digital origin record issued & packaging images pinned to Pinata IPFS</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">Batch serial ID:</span>
                <span className="font-bold text-base text-clinical-900 block">#{createdBatch.batchId}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">Drug & lot code:</span>
                <span className="font-semibold text-slate-800 block">{createdBatch.drugName}</span>
                <span className="text-[11px] text-slate-500 font-mono">{createdBatch.batchNumber}</span>
              </div>

              {/* Pinata IPFS Gateway Links */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 block">Pinata IPFS Gateway Assets</span>
                <div className="space-y-1.5">
                  {(createdBatch.ipfsHashes || [createdBatch.ipfsHash]).map((cid, i) => (
                    <PinataBadge key={i} cid={cid} label={`Ref #${i + 1}`} />
                  ))}
                </div>
              </div>

              {/* Export Audit Buttons */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 block">Export Batch Record</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExport('csv')}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-clinical-900 font-semibold text-[11px] rounded border border-slate-300 flex items-center justify-center space-x-1"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-clinical-900 font-semibold text-[11px] rounded border border-slate-300 flex items-center justify-center space-x-1"
                  >
                    <FileText className="w-3 h-3 text-red-600" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* Expandable Technical Details */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <button
                  onClick={() => setShowTechDetails(!showTechDetails)}
                  className="text-xs text-clinical-800 font-semibold hover:text-clinical-900 flex items-center justify-between w-full"
                >
                  <span>Technical details</span>
                  {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showTechDetails && (
                  <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Transaction Hash:</span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${createdBatch.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-slate-700 hover:underline flex items-center truncate"
                      >
                        <span className="truncate">{createdBatch.txHash}</span>
                        <ExternalLink className="w-3 h-3 ml-1 shrink-0" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Issued QR Barcode */}
            <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded border border-slate-200 text-center space-y-3">
              <span className="text-xs font-semibold text-slate-700">Issued packaging QR barcode</span>
              <img
                src={getBatchQRUrl(createdBatch.batchId)}
                alt={`Batch #${createdBatch.batchId} QR`}
                className="w-40 h-40 bg-white p-2 border border-slate-300 rounded shadow-sm"
              />
              <a
                href={getBatchQRUrl(createdBatch.batchId)}
                download={`medchain_batch_${createdBatch.batchId}_qr.png`}
                className="px-4 py-2 bg-clinical-800 hover:bg-clinical-900 text-white font-semibold text-xs rounded transition-colors flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                <span>Download QR barcode</span>
              </a>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-clinical-900 font-semibold rounded border border-slate-300 text-xs transition-colors"
          >
            Register another batch
          </button>
        </div>
      )}
    </div>
  );
}
