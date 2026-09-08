import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ShieldCheck, Cpu, Image as ImageIcon } from 'lucide-react';

export default function VerdictCard({ result, livePreviewUrl }) {
  if (!result) return null;

  const isGenuine = result.verdict === 'genuine';
  const confidencePercent = Math.round((result.confidence || 0) * 100);
  const matchPercent = Math.round((result.authenticityScore || 0) * 100);

  // SVG Circular Ring Math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidencePercent / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* 1. Main Verdict Banner */}
      <div
        className={`rounded-2xl p-6 sm:p-8 border shadow-soft-lg transition-all overflow-hidden relative ${
          isGenuine
            ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 border-emerald-500 text-white'
            : 'bg-gradient-to-br from-red-600 via-red-700 to-red-950 border-red-500 text-white'
        }`}
      >
        {/* Subtle Background Glow Accent */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left Verdict Badging */}
          <div className="flex items-center space-x-5">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 shrink-0 shadow-lg"
            >
              {isGenuine ? (
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              ) : (
                <AlertTriangle className="w-12 h-12 stroke-[2.5]" />
              )}
            </motion.div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
                  MobileNetV2 Visual AI Verification
                </span>
                <span className="text-[11px] font-mono uppercase opacity-80">
                  Mode: {result.mode || 'ONNX'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {isGenuine ? 'VERIFIED AUTHENTIC PRODUCT' : 'VERIFICATION FAILED — SUSPECT PRODUCT'}
              </h2>
              <p className="text-sm opacity-90 mt-1 max-w-xl">
                {isGenuine
                  ? 'Physical packaging features & security holograms match the manufacturer IPFS reference baseline.'
                  : 'Physical features deviate significantly from verified reference standards. DO NOT CONSUME.'}
              </p>
            </div>
          </div>

          {/* Right Confidence Score Circular Meter */}
          <div className="flex flex-col items-center bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-md shrink-0 shadow-inner">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-white/20"
                  fill="transparent"
                />
                {/* Animated Fill Ring */}
                <motion.circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                  strokeLinecap="round"
                  className={isGenuine ? 'text-white' : 'text-amber-300'}
                  fill="transparent"
                />
              </svg>
              {/* Inner Percentage */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black leading-none">{confidencePercent}%</span>
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-80 mt-0.5">
                  Confidence
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold opacity-90 mt-2">
              Match Score: {matchPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Image Comparison Panel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-slate-800">
            <ImageIcon className="w-5 h-5 text-trust-500" />
            <h3 className="font-bold text-base">Packaging Physical Image Comparison</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            224×224 Normalised Feature Map Alignment
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Reference Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-trust-500 mr-1" />
                Verified Reference Image
              </span>
              <span className="text-slate-400 font-mono text-[10px]">IPFS Hashed</span>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
              <img
                src={result.ipfsImageUrl || 'https://via.placeholder.com/300?text=IPFS+Reference'}
                alt="Verified Reference"
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-md rounded text-[10px] text-white font-mono">
                Manufacturer Baseline
              </div>
            </div>
          </div>

          {/* User Photo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center">
                <Cpu className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                Your Live Product Photo
              </span>
              <span className="text-slate-400 font-mono text-[10px]">Patient Upload</span>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
              <img
                src={livePreviewUrl || result.ipfsImageUrl}
                alt="Patient Photo"
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-md rounded text-[10px] text-white font-mono">
                Analyzed Sample
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
