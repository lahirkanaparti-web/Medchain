import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Factory, Upload, CheckCircle2, ExternalLink, Download, RefreshCw, Sparkles } from 'lucide-react';
import { createBatch, getBatchQRUrl } from '../api/client';

export default function ManufacturerView() {
  const [formData, setFormData] = useState({
    drugName: '',
    batchNumber: '',
    mfgDate: '',
    expiryDate: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createdBatch, setCreatedBatch] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please upload a reference product photograph for IPFS hashing.');
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
      payload.append('image', selectedFile);

      const result = await createBatch(payload);
      setCreatedBatch(result);
      toast.success(`Batch #${result.batchId} successfully minted on-chain!`);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Failed to mint pharmaceutical batch on blockchain.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ drugName: '', batchNumber: '', mfgDate: '', expiryDate: '' });
    setSelectedFile(null);
    setFilePreview(null);
    setCreatedBatch(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-trust-50 text-trust-500 rounded-xl border border-trust-100 shadow-sm">
            <Factory className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manufacturer Operations Portal</h2>
            <p className="text-sm text-slate-500">
              Mint ERC721 custody tokens, attach Pinata IPFS reference image CIDs, and issue QR barcodes.
            </p>
          </div>
        </div>
      </div>

      {!createdBatch ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-6">
          <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Register New Pharmaceutical Batch</span>
            <span className="text-xs font-normal text-slate-400">ERC721 Token Mint</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Drug Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Amoxicillin 500mg"
                value={formData.drugName}
                onChange={(e) => setFormData({ ...formData, drugName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-trust-500 focus:border-trust-500 text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Batch Serial Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BATCH-2026-X99"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-trust-500 focus:border-trust-500 text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Manufacturing Date *
              </label>
              <input
                type="date"
                required
                value={formData.mfgDate}
                onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-trust-500 focus:border-trust-500 text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-trust-500 focus:border-trust-500 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Reference Packaging Photograph (IPFS Pinata Upload) *
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-trust-500 transition-colors bg-slate-50">
              {filePreview ? (
                <div className="space-y-3">
                  <img src={filePreview} alt="Preview" className="max-h-48 mx-auto rounded-xl shadow-md border" />
                  <p className="text-xs text-slate-500 font-mono">{selectedFile?.name}</p>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                    className="text-xs text-red-600 font-medium hover:underline"
                  >
                    Change Photograph
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-trust-500" />
                  <span className="text-sm font-semibold text-slate-700">Click to upload reference packaging image</span>
                  <span className="text-xs text-slate-400">PNG, JPG, WEBP up to 10MB</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-trust-500 hover:bg-trust-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Confirming on-chain...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Mint Batch Token & Issue QR Code</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-6">
          <div className="flex items-center space-x-3 text-genuine-600 border-b border-slate-100 pb-4">
            <CheckCircle2 className="w-8 h-8" />
            <div>
              <h3 className="font-bold text-xl text-slate-900">Batch Token Successfully Minted!</h3>
              <p className="text-xs text-slate-500">Immutable ERC721 Custody Token Recorded on Ethereum Sepolia</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3 text-sm">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Batch ID</span>
                <span className="font-extrabold text-xl text-trust-500 block">#{createdBatch.batchId}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Drug & Batch #</span>
                <span className="font-semibold text-slate-800 block">{createdBatch.drugName}</span>
                <span className="text-xs font-mono text-slate-500">{createdBatch.batchNumber}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">IPFS Image Hash (CID)</span>
                <a
                  href={createdBatch.ipfsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-trust-500 hover:underline flex items-center mt-1 truncate"
                >
                  <span className="truncate">{createdBatch.ipfsHash}</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 shrink-0" />
                </a>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Transaction Hash</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${createdBatch.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-slate-600 hover:text-trust-500 hover:underline flex items-center mt-0.5 truncate"
                >
                  <span className="truncate">{createdBatch.txHash}</span>
                  <ExternalLink className="w-3 h-3 ml-1 shrink-0 opacity-70" />
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4 shadow-inner">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Issued Batch QR Code</span>
              <img
                src={getBatchQRUrl(createdBatch.batchId)}
                alt={`Batch #${createdBatch.batchId} QR`}
                className="w-48 h-48 bg-white p-3 rounded-2xl border border-slate-200 shadow-md"
              />
              <a
                href={getBatchQRUrl(createdBatch.batchId)}
                download={`medchain_batch_${createdBatch.batchId}_qr.png`}
                className="px-4 py-2.5 bg-trust-500 hover:bg-trust-600 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG Barcode</span>
              </a>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-all text-sm"
          >
            + Register Another Batch
          </button>
        </div>
      )}
    </div>
  );
}
