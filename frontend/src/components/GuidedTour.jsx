import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, PlayCircle, HelpCircle } from 'lucide-react';

const TOUR_STEPS = [
  {
    step: 1,
    role: 'home',
    title: '1. Real-time metrics & system overview',
    target: '#tour-metrics',
    badge: 'Examiner Overview',
    content:
      'Welcome to MedChain. This live dashboard tracks verifiable medicine authenticity from manufacturing to patient dispensing. The animated counters pull real-time data from the Sepolia blockchain ledger and AI audit logs.',
    actionLabel: 'Next: Batch creation →',
  },
  {
    step: 2,
    role: 'manufacturer',
    title: '2. Manufacturer batch registration & IPFS baseline',
    target: '#tour-manufacturer',
    badge: 'Origin Facility',
    content:
      'Manufacturers register new pharmaceutical batches on-chain, attaching 1 to 3 reference packaging photos. These photos are pinned to IPFS, creating an unalterable visual authenticity standard.',
    actionLabel: 'Next: Custody route map →',
  },
  {
    step: 3,
    role: 'distributor',
    title: '3. Chain of custody & spatial route map',
    target: '#tour-custody',
    badge: 'Logistics & GPS Tracking',
    content:
      'Every shipment transfer across logistics and wholesale distributors is signed and GPS-tagged. The spatial Leaflet map connects registered checkpoints into a visual shipping route.',
    actionLabel: 'Next: Patient AI verification →',
  },
  {
    step: 4,
    role: 'patient',
    title: '4. Patient verification & forensic certificate',
    target: '#tour-patient',
    badge: 'Public Verification',
    content:
      'Patients scan the QR code and capture a live photo using their mobile camera. A Siamese MobileNetV2 neural network compares visual embeddings against IPFS standards to issue a 3-way tiered certificate of authenticity.',
    actionLabel: 'Next: Physical defect check →',
  },
  {
    step: 5,
    role: 'distributor',
    title: '5. AI physical defect inspector (Groq Vision)',
    target: '#tour-defect',
    badge: 'Pre-Receipt Inspection',
    content:
      'Distributors and pharmacies run Groq Vision AI to inspect physical packaging condition (cracked bottles, torn seals, leaks) before confirming receipt into inventory.',
    actionLabel: 'Next: Autonomous regulator →',
  },
  {
    step: 6,
    role: 'regulator',
    title: '6. Autonomous AI regulator & audit log',
    target: '#tour-regulator',
    badge: 'Automated Enforcement',
    content:
      'When major defect or counterfeit anomalies occur, the autonomous AI regulator automatically triggers multi-tool investigations and executes on-chain batch recall sanctions without human delay.',
    actionLabel: 'Finish tour',
  },
];

export default function GuidedTour({ isOpen, onClose, onRoleChange }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      if (onRoleChange && TOUR_STEPS[nextIndex].role) {
        onRoleChange(TOUR_STEPS[nextIndex].role);
      }
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      if (onRoleChange && TOUR_STEPS[prevIndex].role) {
        onRoleChange(TOUR_STEPS[prevIndex].role);
      }
    }
  };

  const handleGoToStep = (index) => {
    setCurrentStepIndex(index);
    if (onRoleChange && TOUR_STEPS[index].role) {
      onRoleChange(TOUR_STEPS[index].role);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pharma-navy/70 backdrop-blur-xs animate-fadeIn">
      <div className="doc-panel bg-[#FAF9F6] border-2 border-pharma-navy max-w-lg w-full shadow-2xl space-y-4 p-6 rounded-none relative">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-300 pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-pharma-navy text-white font-mono font-bold text-xs">
              DEMO TOUR
            </span>
            <span className="text-xs font-mono text-slate-500 font-semibold">
              Step {currentStep.step} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-pharma-navy transition-colors"
            title="Close demo tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Badge & Title */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-pharma-cream text-pharma-navy border border-slate-300 font-mono text-[10px] font-bold uppercase">
              {currentStep.badge}
            </span>
          </div>
          <h3 className="font-display font-bold text-base text-pharma-navy leading-snug">
            {currentStep.title}
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 border border-slate-200">
            {currentStep.content}
          </p>
        </div>

        {/* Step Indicator Dots */}
        <div className="flex items-center justify-center space-x-1.5 py-1">
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={s.step}
              type="button"
              onClick={() => handleGoToStep(idx)}
              className={`w-2.5 h-2.5 transition-all ${
                idx === currentStepIndex
                  ? 'bg-seal-emerald w-6'
                  : idx < currentStepIndex
                  ? 'bg-pharma-navy'
                  : 'bg-slate-300'
              }`}
              title={`Go to step ${s.step}: ${s.badge}`}
            />
          ))}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between border-t border-slate-300 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-pharma-navy transition-colors font-mono"
          >
            Skip tour
          </button>

          <div className="flex items-center space-x-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-pharma-navy text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 bg-seal-emerald hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center space-x-1 shadow-xs"
            >
              <span>{currentStep.actionLabel}</span>
              {currentStepIndex < TOUR_STEPS.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
