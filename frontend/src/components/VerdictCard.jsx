import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';

export default function VerdictCard({ result, livePreviewUrl }) {
  const [showTechDetails, setShowTechDetails] = useState(false);

  if (!result) return null;

  const isGenuine = result.verdict === 'genuine';
  const confidencePercent = Math.round((result.confidence || 0) * 100);
  const matchPercent = Math.round((result.authenticityScore || 0) * 100);

  // SVG Gauge Math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidencePercent / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* 1. Main Clinical Security Verdict Banner */}
      <div
        className={`rounded p-6 sm:p-8 border doc-panel transition-all overflow-hidden relative ${
          isGenuine
            ? 'bg-genuine-600 border-genuine-700 text-white'
            : 'bg-suspect-600 border-suspect-700 text-white'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left Verdict Stamp & Badging */}
          <div className="flex items-center space-x-5">
            <motion.div
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 15 }}
              className="p-3.5 bg-white/10 rounded border border-white/20 shrink-0"
            >
              {isGenuine ? (
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              ) : (
                <AlertTriangle className="w-10 h-10 stroke-[2.5]" />
              )}
            </motion.div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 border border-white/20">
                  Official Security Inspection Report
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight">
                {isGenuine ? 'Verified authentic product' : 'Suspect product — authenticity check failed'}
              </h2>
              <p className="text-xs sm:text-sm text-white/90 max-w-xl leading-relaxed">
                {isGenuine
                  ? 'Physical packaging features and security markings match the official manufacturer reference baseline.'
                  : 'Physical packaging features deviate significantly from verified manufacturer standards. Do not dispense or consume.'}
              </p>
            </div>
          </div>

          {/* Right Confidence Score Gauge */}
          <div className="flex flex-col items-center bg-black/20 p-4 rounded border border-white/20 shrink-0">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="7"
                  className="text-white/20"
                  fill="transparent"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.0, ease: 'easeOut', delay: 0.3 }}
                  strokeLinecap="round"
                  className="text-white"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-bold leading-none">{confidencePercent}%</span>
                <span className="text-[9px] uppercase font-semibold opacity-80 mt-0.5">
                  Confidence
                </span>
              </div>
            </div>
            <span className="text-[11px] font-medium opacity-90 mt-1">
              Authenticity score: {matchPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Packaging Forensic Comparison Grid */}
      <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2 text-clinical-900">
            <ImageIcon className="w-4 h-4 text-clinical-800" />
            <h3 className="font-display font-bold text-sm">Packaging visual forensic comparison</h3>
          </div>
          <span className="text-xs text-slate-500">
            Side-by-side feature inspection
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Reference Baseline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-genuine-600 mr-1" />
                Verified manufacturer reference
              </span>
              <span className="text-slate-500 text-[11px]">IPFS standard</span>
            </div>
            <div className="relative rounded overflow-hidden border border-slate-300 bg-slate-900 h-48 flex items-center justify-center">
              <img
                src={result.ipfsImageUrl || 'https://via.placeholder.com/300?text=IPFS+Reference'}
                alt="Verified Reference"
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-clinical-900/90 rounded text-[10px] text-white font-medium">
                Baseline standard
              </div>
            </div>
          </div>

          {/* Patient Sample */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center">
                <ImageIcon className="w-3.5 h-3.5 text-clinical-800 mr-1" />
                Patient sample photograph
              </span>
              <span className="text-slate-500 text-[11px]">Analyzed photo</span>
            </div>
            <div className="relative rounded overflow-hidden border border-slate-300 bg-slate-900 h-48 flex items-center justify-center">
              <img
                src={livePreviewUrl || result.ipfsImageUrl}
                alt="Patient Sample"
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-clinical-900/90 rounded text-[10px] text-white font-medium">
                Inspection sample
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Technical Details Drawer */}
        <div className="border-t border-slate-200 pt-3">
          <button
            onClick={() => setShowTechDetails(!showTechDetails)}
            className="text-xs text-clinical-800 font-semibold hover:text-clinical-900 flex items-center space-x-1"
          >
            <span>{showTechDetails ? 'Hide technical details' : 'View technical details'}</span>
            {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTechDetails && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 space-y-1">
              <p><span className="font-semibold">AI Model:</span> MobileNetV2 / Siamese TFLite Neural Network</p>
              <p><span className="font-semibold">Model Mode:</span> {result.mode || 'ONNX'} Inference Engine</p>
              <p><span className="font-semibold">Authenticity Distance Metric:</span> {result.distance ? result.distance.toFixed(4) : 'N/A'}</p>
              <p><span className="font-semibold">Feature Vector Dimensions:</span> 224×224 Normalised Layer Output</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
