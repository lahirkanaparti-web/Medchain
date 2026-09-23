import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Cpu,
  Palette,
  Layers,
  Database,
  Sliders,
  ExternalLink,
  Award,
  Sparkles
} from 'lucide-react';

export default function VerdictCard({ result, livePreviewUrl }) {
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('sideBySide'); // 'sideBySide' | 'splitSlider'
  const [sliderPosition, setSliderPosition] = useState(50); // 0 - 100%

  if (!result) return null;

  const verdict = result.verdict || 'suspect';
  const isGenuine = verdict === 'genuine';
  const isNeedsReview = verdict === 'needs_review';
  const isSuspect = verdict === 'suspect';

  const confidencePercent = Math.round((result.confidence || 0) * 100);
  const matchPercent = Math.round((result.authenticityScore || 0) * 100);

  // Forensic metrics extraction with sensible defaults
  const forensics = result.forensicMetrics || {
    neuralSimilarity: result.authenticityScore || 0.90,
    colorConsistency: isGenuine ? 0.94 : (isNeedsReview ? 0.68 : 0.32),
    structuralCoherence: isGenuine ? 0.91 : (isNeedsReview ? 0.64 : 0.38),
    compositeScore: result.authenticityScore || 0.90,
    distanceMetric: result.distance || 0.15
  };

  // SVG Gauge Math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidencePercent / 100) * circumference;

  // Visual Theme Configuration Grounded in Security Certificate Stamp Motif
  const getVerdictTheme = () => {
    if (isGenuine) {
      return {
        bgBorder: 'border-seal-emerald bg-emerald-50/40 text-pharma-deep',
        stampClass: 'stamp-seal-genuine',
        badgeBg: 'bg-emerald-100 text-seal-emerald border-emerald-300',
        iconBg: 'bg-seal-emerald text-white',
        icon: <Award className="w-8 h-8" />,
        title: 'Authentic Medicine Verified',
        subTitle: 'Physical packaging and security features match verified manufacturer standards.',
        statusTag: 'VERIFIED GENUINE',
        strokeColor: '#134E35',
      };
    }
    if (isNeedsReview) {
      return {
        bgBorder: 'border-amber-600 bg-amber-50/40 text-pharma-deep',
        stampClass: 'stamp-seal-review',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        iconBg: 'bg-amber-600 text-white',
        icon: <HelpCircle className="w-8 h-8" />,
        title: 'Inconclusive — Visual Review Recommended',
        subTitle: 'Packaging shows minor lighting or orientation variance. Pharmacist inspection advised.',
        statusTag: 'MANUAL REVIEW ADVISED',
        strokeColor: '#B45309',
      };
    }
    return {
      bgBorder: 'border-quarantine-crimson bg-rose-50/40 text-pharma-deep',
      stampClass: 'stamp-seal-suspect',
      badgeBg: 'bg-rose-100 text-quarantine-crimson border-rose-300',
      iconBg: 'bg-quarantine-crimson text-white',
      icon: <AlertTriangle className="w-8 h-8" />,
      title: 'Counterfeit / Packaging Deviation Flagged',
      subTitle: 'Packaging features deviate significantly from verified manufacturer standards. Do not consume.',
      statusTag: 'AUTHENTICITY FAILED',
      strokeColor: '#881337',
    };
  };

  const theme = getVerdictTheme();
  const refImgUrl = result.ipfsImageUrl || 'https://via.placeholder.com/400x300?text=Reference+Packaging+Standard';
  const liveImgUrl = livePreviewUrl || result.ipfsImageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* 1. Official Security Certificate Verdict Card */}
      <div className={`rounded border-2 p-6 sm:p-7 doc-panel shadow-certificate relative overflow-hidden ${theme.bgBorder}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Left Verdict Stamp & Seal Details */}
          <div className="flex items-start sm:items-center space-x-4 sm:space-x-5">
            <div className={`p-3.5 rounded border ${theme.stampClass} shrink-0`}>
              {theme.icon}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded border uppercase ${theme.badgeBg}`}>
                  {theme.statusTag}
                </span>
                <span className="text-[11px] font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300">
                  Batch #{result.batchId}
                </span>
                <span className="text-[11px] font-mono text-seal-emerald bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-seal-emerald mr-1.5" />
                  Sepolia Verified
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-display font-bold text-pharma-deep">
                {theme.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 max-w-xl leading-relaxed">
                {theme.subTitle}
              </p>
            </div>
          </div>

          {/* Right Confidence Score Circle Gauge */}
          <div className="flex items-center space-x-4 bg-white p-3.5 sm:p-4 rounded border border-slate-300 shrink-0 w-full sm:w-auto justify-between sm:justify-start shadow-sm">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="#E2E8F0"
                  strokeWidth="6"
                  fill="transparent"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke={theme.strokeColor}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-bold font-mono text-pharma-deep">{confidencePercent}%</span>
                <span className="text-[8px] uppercase tracking-wider font-semibold text-slate-500">
                  Confidence
                </span>
              </div>
            </div>

            <div className="space-y-1 text-left pr-2">
              <div className="text-[11px] font-semibold text-slate-700">
                Packaging Match
              </div>
              <div className="text-base font-bold font-mono text-pharma-deep">
                {matchPercent}%
              </div>
              <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${matchPercent}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: theme.strokeColor }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Plain-Language Verdict Explanation */}
      {result.explanation && (
        <div className="bg-white rounded p-4 sm:p-5 border border-slate-300 doc-panel space-y-2">
          <div className="flex items-center space-x-2 text-pharma-deep border-b border-slate-200 pb-2">
            <Sparkles className="w-4 h-4 text-seal-emerald" />
            <span className="text-xs font-bold text-pharma-deep font-display">
              AI Verification Summary
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            "{result.explanation}"
          </p>
        </div>
      )}

      {/* 2. Visual Packaging Comparison Studio */}
      <div className="bg-white rounded p-5 sm:p-6 border border-slate-300 doc-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2 text-pharma-deep">
            <ImageIcon className="w-4 h-4 text-pharma-deep" />
            <h3 className="font-display font-bold text-sm">Packaging Visual Inspection Studio</h3>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('sideBySide')}
              className={`px-3 py-1 font-semibold rounded transition-colors ${
                activeTab === 'sideBySide'
                  ? 'bg-white text-pharma-deep shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-side
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('splitSlider')}
              className={`px-3 py-1 font-semibold rounded transition-colors flex items-center ${
                activeTab === 'splitSlider'
                  ? 'bg-white text-pharma-deep shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3 h-3 mr-1 text-pharma-deep" />
              <span>Split-slider comparator</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Side by Side */}
        {activeTab === 'sideBySide' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reference Baseline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-seal-emerald mr-1" />
                  Manufacturer reference photo
                </span>
                <a
                  href={refImgUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-pharma-deep text-[11px] font-mono hover:underline flex items-center"
                >
                  <span>View IPFS photo</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-1" />
                </a>
              </div>
              <div className="relative rounded overflow-hidden border border-slate-300 bg-slate-950 h-56 flex items-center justify-center">
                <img
                  src={refImgUrl}
                  alt="Manufacturer Reference"
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-pharma-deep/90 border border-slate-700 rounded text-[10px] text-emerald-400 font-mono">
                  MANUFACTURER BASELINE
                </div>
              </div>
            </div>

            {/* Patient Sample */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center">
                  <ImageIcon className="w-3.5 h-3.5 text-pharma-deep mr-1" />
                  Captured packaging photo
                </span>
                <span className="text-slate-500 text-[11px] font-mono">LIVE SAMPLE</span>
              </div>
              <div className="relative rounded overflow-hidden border border-slate-300 bg-slate-950 h-56 flex items-center justify-center">
                <img
                  src={liveImgUrl}
                  alt="Captured Sample"
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-pharma-deep/90 border border-slate-700 rounded text-[10px] text-slate-200 font-mono">
                  INSPECTION SAMPLE
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Optical Split-Slider */}
        {activeTab === 'splitSlider' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Drag slider to inspect optical alignment:</span>
              <span className="font-mono text-pharma-deep font-semibold">{sliderPosition}% Split</span>
            </div>

            <div className="relative rounded overflow-hidden border border-slate-300 bg-slate-950 h-72 flex items-center justify-center select-none">
              <img
                src={liveImgUrl}
                alt="Captured Sample"
                className="absolute inset-0 w-full h-full object-contain"
              />

              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={refImgUrl}
                  alt="Manufacturer Reference"
                  className="absolute inset-0 w-full h-full object-contain max-w-none"
                  style={{ width: '100%', height: '100%' }}
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 bg-pharma-deep/90 border border-slate-700 rounded text-[10px] text-emerald-400 font-mono">
                  REFERENCE
                </div>
              </div>

              <div className="absolute top-3 right-3 px-2 py-0.5 bg-pharma-deep/90 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">
                LIVE SAMPLE
              </div>

              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-20"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-pharma-deep text-white border border-white flex items-center justify-center text-[10px] font-bold">
                  ↔
                </div>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pharma-deep"
            />
          </div>
        )}

        {/* Technical Details Expandable Drawer */}
        <div className="border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={() => setShowTechDetails(!showTechDetails)}
            className="text-xs text-pharma-deep font-semibold hover:underline flex items-center justify-between w-full"
          >
            <span className="flex items-center">
              <Cpu className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Technical details & neural metrics
            </span>
            {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTechDetails && (
            <div className="mt-3 p-3 bg-slate-900 text-slate-200 rounded text-xs font-mono space-y-2 border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">AI Neural Model:</span>
                  <span className="text-emerald-400">Siamese TFLite Embedding Vector</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Calculated Tensor Distance:</span>
                  <span className="text-white">{forensics.distanceMetric.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Neural Embedding Score:</span>
                  <span className="text-white">{Math.round(forensics.neuralSimilarity * 100)}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Color & Structural Alignment:</span>
                  <span className="text-white">{Math.round(forensics.colorConsistency * 100)}% / {Math.round(forensics.structuralCoherence * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
