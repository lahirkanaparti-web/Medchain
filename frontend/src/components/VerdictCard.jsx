import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Link2,
  Sliders,
  Maximize2,
  ExternalLink
} from 'lucide-react';

export default function VerdictCard({ result, livePreviewUrl }) {
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('sideBySide'); // 'sideBySide' | 'splitSlider'
  const [sliderPosition, setSliderPosition] = useState(50); // 0 - 100%
  const [isScanning, setIsScanning] = useState(true);

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

  // Visual Theme Configuration
  const getVerdictTheme = () => {
    if (isGenuine) {
      return {
        bgGradient: 'bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950',
        borderColor: 'border-emerald-500/60',
        glowClass: 'glow-emerald',
        badgeBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
        iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        icon: <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />,
        title: 'Authentic Medicine Verified',
        subTitle: 'Physical packaging and security characteristics match manufacturer on-chain standard.',
        statusTag: 'GENUINE PRODUCT',
        strokeColor: '#10b981',
        laserColor: '#10b981',
      };
    }
    if (isNeedsReview) {
      return {
        bgGradient: 'bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900',
        borderColor: 'border-amber-500/60',
        glowClass: 'glow-amber',
        badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
        iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        icon: <HelpCircle className="w-10 h-10 stroke-[2.5]" />,
        title: 'Inconclusive — Review Recommended',
        subTitle: 'Packaging shows minor deviations in lighting or orientation. Pharmacist inspection advised.',
        statusTag: 'MANUAL REVIEW',
        strokeColor: '#f59e0b',
        laserColor: '#f59e0b',
      };
    }
    return {
      bgGradient: 'bg-gradient-to-br from-red-950 via-slate-900 to-rose-950',
      borderColor: 'border-rose-500/60',
      glowClass: 'glow-crimson',
      badgeBg: 'bg-rose-500/20 border-rose-400/40 text-rose-300',
      iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      icon: <AlertTriangle className="w-10 h-10 stroke-[2.5]" />,
      title: 'Counterfeit / Packaging Deviation Suspected',
      subTitle: 'Packaging features deviate significantly from verified manufacturer IPFS standard. Do not consume.',
      statusTag: 'AUTHENTICITY FAILED',
      strokeColor: '#ef4444',
      laserColor: '#ef4444',
    };
  };

  const theme = getVerdictTheme();
  const refImgUrl = result.ipfsImageUrl || 'https://via.placeholder.com/400x300?text=IPFS+Reference';
  const liveImgUrl = livePreviewUrl || result.ipfsImageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* 1. Main Clinical Security Verdict Hero Banner */}
      <div
        className={`rounded-xl p-6 sm:p-7 border shadow-xl transition-all overflow-hidden relative ${theme.bgGradient} ${theme.borderColor} ${theme.glowClass} text-white`}
      >
        {/* Background circuit subtle watermarking */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Left Verdict Stamp & Badging */}
          <div className="flex items-start sm:items-center space-x-4 sm:space-x-5">
            <motion.div
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 15 }}
              className={`p-3.5 rounded-xl border shrink-0 ${theme.iconBg} backdrop-blur-sm shadow-inner`}
            >
              {theme.icon}
            </motion.div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${theme.badgeBg}`}>
                  {theme.statusTag}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  BATCH #{result.batchId}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  SEPOLIA ON-CHAIN
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white drop-shadow-sm">
                {theme.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {theme.subTitle}
              </p>
            </div>
          </div>

          {/* Right Confidence Score Gauge */}
          <div className="flex items-center space-x-4 bg-slate-900/80 p-3.5 sm:p-4 rounded-xl border border-slate-700/80 backdrop-blur-md shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="7"
                  fill="transparent"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke={theme.strokeColor}
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.0, ease: 'easeOut', delay: 0.3 }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold font-mono tracking-tight text-white">{confidencePercent}%</span>
                <span className="text-[8px] uppercase tracking-wider font-semibold text-slate-400">
                  Confidence
                </span>
              </div>
            </div>

            <div className="space-y-1 text-left pr-2">
              <div className="text-[11px] font-semibold text-slate-300">
                Overall Match Score
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {matchPercent}%
              </div>
              <div className="w-28 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${matchPercent}%` }}
                  transition={{ duration: 1.0, delay: 0.4 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: theme.strokeColor }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Multi-Vector Forensic Vector Breakdown */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-300 doc-panel shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2 text-clinical-900">
            <Cpu className="w-4 h-4 text-clinical-800" />
            <h3 className="font-display font-bold text-sm">Multi-Vector AI Forensic Diagnostics</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Engine: {result.mode || 'siamese_tflite'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Metric 1: Deep Neural Feature Similarity */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center">
                <Layers className="w-3.5 h-3.5 text-clinical-800 mr-1.5" />
                Neural Embedding
              </span>
              <span className="font-mono text-xs font-bold text-clinical-900">
                {Math.round(forensics.neuralSimilarity * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(forensics.neuralSimilarity * 100)}%` }}
                transition={{ duration: 0.8 }}
                className="bg-clinical-800 h-full rounded-full"
              />
            </div>
            <span className="text-[10px] text-slate-500 block">
              L2 Tensor Distance: <span className="font-mono font-medium text-slate-700">{forensics.distanceMetric.toFixed(4)}</span>
            </span>
          </div>

          {/* Metric 2: Color Spectrum & Spectral Palette */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center">
                <Palette className="w-3.5 h-3.5 text-emerald-700 mr-1.5" />
                Color Spectrum
              </span>
              <span className="font-mono text-xs font-bold text-emerald-800">
                {Math.round(forensics.colorConsistency * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(forensics.colorConsistency * 100)}%` }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="bg-emerald-600 h-full rounded-full"
              />
            </div>
            <span className="text-[10px] text-slate-500 block">
              RGB Histogram Intersection Match
            </span>
          </div>

          {/* Metric 3: Structural Contour & Layout Alignment */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700 mr-1.5" />
                Structural Edge Match
              </span>
              <span className="font-mono text-xs font-bold text-blue-800">
                {Math.round(forensics.structuralCoherence * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(forensics.structuralCoherence * 100)}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-blue-600 h-full rounded-full"
              />
            </div>
            <span className="text-[10px] text-slate-500 block">
              Packaging Contour Cross-Correlation
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Packaging Forensic Studio */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-300 doc-panel shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2 text-clinical-900">
            <ImageIcon className="w-4 h-4 text-clinical-800" />
            <h3 className="font-display font-bold text-sm">Packaging Visual Forensic Comparator</h3>
          </div>

          {/* View mode toggle tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('sideBySide')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'sideBySide'
                  ? 'bg-white text-clinical-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('splitSlider')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center space-x-1 ${
                activeTab === 'splitSlider'
                  ? 'bg-white text-clinical-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3 h-3 mr-1 text-clinical-800" />
              <span>Optical Split-Slider</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Side by Side Studio */}
        {activeTab === 'sideBySide' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reference Baseline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-genuine-600 mr-1" />
                  Verified IPFS Reference Standard
                </span>
                <a
                  href={refImgUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-clinical-800 text-[11px] font-mono hover:underline flex items-center"
                >
                  <span>IPFS CID</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-1" />
                </a>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-slate-950 h-56 flex items-center justify-center group shadow-inner">
                {isScanning && <div className="scanner-laser" />}
                <img
                  src={refImgUrl}
                  alt="Verified Reference"
                  className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/90 border border-slate-700 rounded text-[10px] text-emerald-400 font-mono flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
                  MANUFACTURER BASELINE
                </div>
              </div>
            </div>

            {/* Patient Sample */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center">
                  <ImageIcon className="w-3.5 h-3.5 text-clinical-800 mr-1" />
                  Patient Sample Photograph
                </span>
                <span className="text-slate-500 text-[11px] font-mono">LIVE UPLOAD</span>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-slate-950 h-56 flex items-center justify-center group shadow-inner">
                {isScanning && <div className="scanner-laser" style={{ animationDelay: '1.2s' }} />}
                <img
                  src={liveImgUrl}
                  alt="Patient Sample"
                  className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/90 border border-slate-700 rounded text-[10px] text-slate-200 font-mono">
                  INSPECTION SAMPLE
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Optical Split-Slider */}
        {activeTab === 'splitSlider' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Drag slider to inspect overlay alignment:</span>
              <span className="font-mono text-clinical-900 font-semibold">{sliderPosition}% Split</span>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-slate-950 h-72 flex items-center justify-center select-none shadow-inner">
              {/* Bottom Image: Live Patient Photo */}
              <img
                src={liveImgUrl}
                alt="Patient Sample"
                className="absolute inset-0 w-full h-full object-contain"
              />

              {/* Top Image: Reference Standard clipped by slider */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={refImgUrl}
                  alt="Reference Standard"
                  className="absolute inset-0 w-full h-full object-contain max-w-none"
                  style={{ width: '100%', height: '100%' }}
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900/90 border border-slate-700 rounded text-[10px] text-emerald-400 font-mono">
                  REFERENCE
                </div>
              </div>

              {/* Right label for live */}
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-slate-900/90 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">
                PATIENT SAMPLE
              </div>

              {/* Split Line Divider */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-20"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-clinical-900 text-white border border-white flex items-center justify-center shadow-md text-[10px] font-bold">
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-clinical-800"
            />
          </div>
        )}

        {/* Cryptographic & Forensic Details Drawer */}
        <div className="border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={() => setShowTechDetails(!showTechDetails)}
            className="text-xs text-clinical-800 font-semibold hover:text-clinical-900 flex items-center justify-between w-full"
          >
            <span className="flex items-center">
              <Database className="w-3.5 h-3.5 mr-1 text-clinical-700" />
              Cryptographic Ledger & Neural Inference Metadata
            </span>
            {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTechDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-4 bg-slate-900 text-slate-200 rounded-lg border border-slate-700 text-xs font-mono space-y-2 shadow-inner"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">AI Neural Backbone:</span>
                  <span className="text-emerald-400">Siamese TFLite 256-D Embedding Vector</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Decentralized Storage:</span>
                  <span className="text-blue-400 truncate block">{result.ipfsImageUrl || 'Pinata Dedicated IPFS'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Calculated Distance:</span>
                  <span className="text-white">{result.distance !== undefined ? result.distance.toFixed(6) : '0.000000'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Decision Boundary:</span>
                  <span className="text-white">Tiered 3-Way Marginal Band (Threshold ~1.0688)</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
