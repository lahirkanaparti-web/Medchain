import React from 'react';
import { Factory, Truck, Store, ShieldCheck, Search, Activity, CheckCircle2 } from 'lucide-react';

export default function HomeView({ onRoleChange }) {
  return (
    <div className="space-y-8 py-4">
      {/* 1. Clinical Security Hero Section */}
      <div className="bg-white border border-slate-300 rounded p-6 sm:p-10 space-y-6 doc-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-genuine-600 inline-block"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-display">
                Pharmaceutical Verification Network
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-clinical-900 leading-tight">
              Verifiable medicine authenticity from factory line to patient dispensing
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              MedChain audits physical pharmaceutical packaging against encrypted manufacturer baselines and maintains an unalterable custody ledger across supply chain handoffs.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-300 p-4 rounded text-xs space-y-2 shrink-0 min-w-[240px]">
            <div className="flex items-center justify-between font-medium text-slate-700">
              <span>Network Status</span>
              <span className="text-genuine-600 font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Sepolia Live
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-slate-500">
              <span>Custody Verification</span>
              <span className="font-semibold text-slate-800">Sequential</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Visual AI Baseline</span>
              <span className="font-semibold text-slate-800">Active</span>
            </div>
          </div>
        </div>

        {/* Rapid Patient Verification Callout Bar */}
        <div className="bg-clinical-800 text-white p-4 sm:p-5 rounded flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-clinical-900 border border-slate-700 rounded">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-white">
                Have a medicine package to verify?
              </h3>
              <p className="text-xs text-slate-300">
                Scan the batch QR code and take a live packaging photo to check if your medicine is genuine.
              </p>
            </div>
          </div>
          <button
            onClick={() => onRoleChange('patient')}
            className="w-full sm:w-auto px-5 py-2.5 bg-genuine-600 hover:bg-genuine-700 text-white rounded text-xs font-bold transition-colors shrink-0"
          >
            Check Product Authenticity
          </button>
        </div>
      </div>

      {/* 2. Supply Chain Role Portals — Differentiated Layout Treatments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="font-display font-bold text-lg text-clinical-900">
            Supply Chain Portal Destinations
          </h2>
          <span className="text-xs text-slate-500">Select portal by operational role</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Portal 1: Patient / Consumer Verification (Featured Wide Entry) */}
          <div className="bg-white border-2 border-clinical-800 p-6 rounded space-y-4 hover:border-clinical-900 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-clinical-800 uppercase tracking-wider font-display">
                  Public Inspection Station
                </span>
                <span className="p-1.5 bg-clinical-50 text-clinical-800 border border-clinical-200 rounded">
                  <ShieldCheck className="w-5 h-5" />
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-clinical-900">
                Patient & Consumer Product Verification
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan product QR codes, capture live packaging photographs using your device camera, and instantly view verified provenance history and physical authenticity scores.
              </p>
            </div>
            <button
              onClick={() => onRoleChange('patient')}
              className="w-full py-2 bg-clinical-800 hover:bg-clinical-900 text-white text-xs font-bold rounded transition-colors text-center mt-2"
            >
              Open Patient Verification Station
            </button>
          </div>

          {/* Portal 2: Manufacturer Origin Terminal */}
          <div className="bg-white border border-slate-300 p-6 rounded space-y-4 hover:border-slate-400 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-display">
                  Origin Registry
                </span>
                <span className="p-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">
                  <Factory className="w-5 h-5" />
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-clinical-900">
                Pharmaceutical Manufacturer Terminal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register new pharmaceutical batches, pin encrypted reference packaging photography, and issue verifiable digital origin records for supply chain tracking.
              </p>
            </div>
            <button
              onClick={() => onRoleChange('manufacturer')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-clinical-900 text-xs font-bold rounded border border-slate-300 transition-colors text-center mt-2"
            >
              Access Manufacturer Console
            </button>
          </div>

          {/* Portal 3: Distributor Logistics Node */}
          <div className="bg-white border border-slate-300 p-6 rounded space-y-4 hover:border-slate-400 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-display">
                  Logistics Handoff
                </span>
                <span className="p-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">
                  <Truck className="w-5 h-5" />
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-clinical-900">
                Logistics & Wholesale Distributor Terminal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive incoming batch shipments from manufacturers, verify seal integrity, and transfer custody forward to accredited pharmacy networks.
              </p>
            </div>
            <button
              onClick={() => onRoleChange('distributor')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-clinical-900 text-xs font-bold rounded border border-slate-300 transition-colors text-center mt-2"
            >
              Access Distributor Console
            </button>
          </div>

          {/* Portal 4: Accredited Pharmacy Dispensing Terminal */}
          <div className="bg-white border border-slate-300 p-6 rounded space-y-4 hover:border-slate-400 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-display">
                  Dispensing Point
                </span>
                <span className="p-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">
                  <Store className="w-5 h-5" />
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-clinical-900">
                Accredited Pharmacy Terminal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingest inventory from authorized distributors, inspect complete chain-of-custody logs, and record final prescription dispensing to patients.
              </p>
            </div>
            <button
              onClick={() => onRoleChange('pharmacy')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-clinical-900 text-xs font-bold rounded border border-slate-300 transition-colors text-center mt-2"
            >
              Access Pharmacy Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
