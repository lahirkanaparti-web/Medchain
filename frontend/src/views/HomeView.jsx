import React from 'react';
import { Factory, Truck, Store, ShieldCheck, ShieldAlert, CheckCircle2, ArrowRight, Activity, Award } from 'lucide-react';

export default function HomeView({ onRoleChange }) {
  return (
    <div className="space-y-8 py-2">
      {/* 1. Distinct Security & Forensic Hero Banner */}
      <div className="bg-white border border-slate-300 rounded p-6 sm:p-10 space-y-6 doc-panel shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-seal-emerald inline-block"></span>
              <span className="text-xs font-semibold text-slate-600 font-display">
                Pharmaceutical Traceability & Authenticity Network
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-pharma-deep leading-tight">
              Verifiable medicine authenticity from factory line to patient dispensing.
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Verify your medicine's authenticity, inspect physical packaging standards, and trace complete chain-of-custody logs across verified supply chain handoffs.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-300 p-4 rounded text-xs space-y-2 shrink-0 min-w-[250px]">
            <div className="flex items-center justify-between font-medium text-slate-700">
              <span>Network status</span>
              <span className="text-seal-emerald font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-seal-emerald" /> Sepolia Live
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-slate-600">
              <span>Custody ledger</span>
              <span className="font-mono text-slate-900 font-medium">Immutable</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>AI defect & provenance</span>
              <span className="font-mono text-slate-900 font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Rapid Patient Verification Callout */}
        <div className="bg-pharma-deep text-white p-5 rounded flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-slate-900 border border-slate-700 rounded shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-white">
                Have a medicine package to verify?
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Scan the code on your package and take a photo to check if your medicine is genuine.
              </p>
            </div>
          </div>
          <button
            onClick={() => onRoleChange('patient')}
            className="w-full sm:w-auto px-5 py-2.5 bg-seal-emerald hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors shrink-0 flex items-center justify-center space-x-1.5"
          >
            <span>Verify product authenticity</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Supply Chain Role Destinations — Differentiated Layout Treatments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="font-display font-bold text-base text-pharma-deep">
            Supply Chain Portal Destinations
          </h2>
          <span className="text-xs text-slate-500">Select terminal by role</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Destination 1: Patient / Consumer Verification (Featured Primary Card) */}
          <div className="bg-white border-2 border-pharma-deep p-6 rounded space-y-4 flex flex-col justify-between shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-pharma-deep font-display">
                  Public Inspection Terminal
                </span>
                <span className="p-2 bg-emerald-50 text-seal-emerald border border-emerald-200 rounded">
                  <ShieldCheck className="w-5 h-5" />
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-pharma-deep">
                Patient & Consumer Product Verification
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan product QR codes, capture live packaging photographs using your device camera, and view verified provenance history and physical authenticity scores.
              </p>
            </div>
            <button
              onClick={() => onRoleChange('patient')}
              className="w-full py-2.5 bg-pharma-deep hover:bg-slate-900 text-white text-xs font-bold rounded transition-colors text-center mt-2 flex items-center justify-center space-x-1"
            >
              <span>Open patient verification terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination 2: Manufacturer Origin Terminal */}
          <div className="bg-white border border-slate-300 p-6 rounded space-y-4 flex flex-col justify-between hover:border-slate-400 transition-colors doc-panel">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 font-display">
                  Batch Origin Registry
                </span>
                <span className="p-2 bg-slate-50 text-slate-700 border border-slate-200 rounded">
                  <Factory className="w-5 h-5" />
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-pharma-deep">
                Pharmaceutical Manufacturer Terminal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register new pharmaceutical batches, attach reference packaging photography standards, and create verifiable origin records for supply chain tracking.
              </p>
            </div>
            <button
              onClick={() => onRoleChange('manufacturer')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-pharma-deep text-xs font-bold rounded border border-slate-300 transition-colors text-center mt-2"
            >
              Access manufacturer console
            </button>
          </div>

          {/* Destination 3: Distributor Logistics Node */}
          <div className="bg-white border border-slate-300 p-6 rounded space-y-4 flex flex-col justify-between hover:border-slate-400 transition-colors doc-panel">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 font-display">
                  Logistics & Distribution
                </span>
                <span className="p-2 bg-slate-50 text-slate-700 border border-slate-200 rounded">
                  <Truck className="w-5 h-5" />
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-pharma-deep">
                Logistics & Wholesale Distributor Terminal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect incoming batch shipments from manufacturers, perform physical defect analysis, and record GPS-tagged custody handoffs to pharmacy networks.
              </p>
            </div>
            <button
              onClick={() => onRoleChange('distributor')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-pharma-deep text-xs font-bold rounded border border-slate-300 transition-colors text-center mt-2"
            >
              Access distributor console
            </button>
          </div>

          {/* Destination 4: Accredited Pharmacy Dispensing Terminal */}
          <div className="bg-white border border-slate-300 p-6 rounded space-y-4 flex flex-col justify-between hover:border-slate-400 transition-colors doc-panel">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 font-display">
                  Prescription Dispensing
                </span>
                <span className="p-2 bg-slate-50 text-slate-700 border border-slate-200 rounded">
                  <Store className="w-5 h-5" />
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-pharma-deep">
                Accredited Pharmacy Terminal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingest inventory from authorized distributors, inspect complete chain-of-custody records, and record prescription dispensing to patients.
              </p>
            </div>
            <button
              onClick={() => onRoleChange('pharmacy')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-pharma-deep text-xs font-bold rounded border border-slate-300 transition-colors text-center mt-2"
            >
              Access pharmacy console
            </button>
          </div>

          {/* Destination 5: Autonomous Regulator Audit Log (Full Width Feature Bar) */}
          <div className="md:col-span-2 bg-slate-50 border border-slate-300 p-6 rounded space-y-4 doc-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-quarantine-crimson" />
                  <h3 className="font-display font-bold text-base text-pharma-deep">
                    Autonomous AI Regulator Audit Trail
                  </h3>
                </div>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                  Real-time observational audit log of automated regulatory decisions, multi-tool AI investigations, and on-chain recall sanctions.
                </p>
              </div>
              <button
                onClick={() => onRoleChange('regulator')}
                className="py-2.5 px-5 bg-white hover:bg-slate-100 text-pharma-deep text-xs font-bold rounded border border-slate-300 transition-colors shrink-0"
              >
                View regulator audit log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
