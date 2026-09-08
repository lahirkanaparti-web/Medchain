import React, { useState } from 'react';
import { Home, Factory, Truck, Store, ShieldCheck, Info, X } from 'lucide-react';
import LogoMark from './LogoMark';

const NAVIGATION_ITEMS = [
  { id: 'home', label: 'Overview', icon: Home },
  { id: 'manufacturer', label: 'Manufacturer', icon: Factory },
  { id: 'distributor', label: 'Distributor', icon: Truck },
  { id: 'pharmacy', label: 'Pharmacy', icon: Store },
  { id: 'patient', label: 'Patient verification', icon: ShieldCheck },
];

export default function Header({ currentRole, onRoleChange }) {
  const [showTechModal, setShowTechModal] = useState(false);

  return (
    <>
      <header className="bg-clinical-800 border-b border-clinical-900 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Mark & System Title */}
            <div 
              onClick={() => onRoleChange('home')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="p-1.5 bg-clinical-900 border border-slate-700/60 rounded">
                <LogoMark className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-display font-bold text-base tracking-tight text-white group-hover:text-clinical-100">
                    MedChain
                  </h1>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-clinical-900 text-slate-300 border border-slate-700">
                    Ethereum Sepolia
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal">
                  Pharmaceutical authentication & provenance system
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 bg-clinical-900/90 p-1 border border-slate-700/60 rounded">
              {NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentRole === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onRoleChange(item.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-white text-clinical-900 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-clinical-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Technical Specifications Trigger */}
            <button
              onClick={() => setShowTechModal(true)}
              className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded border border-slate-700/60 hover:bg-clinical-900 transition-colors"
              title="View Technical Specifications"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Technical details</span>
            </button>
          </div>
        </div>
      </header>

      {/* Technical Specifications Overlay Modal */}
      {showTechModal && (
        <div className="fixed inset-0 z-50 bg-clinical-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-clinical-800" />
                <h3 className="font-display font-bold text-base text-clinical-900">
                  System Technical Specifications
                </h3>
              </div>
              <button
                onClick={() => setShowTechModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-semibold text-slate-900 block">Smart Contract Infrastructure</span>
                <p>ERC721 standard deployed on Ethereum Sepolia testnet.</p>
                <p className="font-mono text-[11px] text-clinical-800">
                  Contract: 0xE6F12902C5827691c6a98Ea67Ea347c42d7de680
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-semibold text-slate-900 block">Visual AI Authentication Model</span>
                <p>MobileNetV2 / Siamese TFLite neural network performing 224×224 feature vector extraction and cosine distance scoring against Pinata IPFS reference packaging standards.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-semibold text-slate-900 block">Decentralized Asset Storage</span>
                <p>Pinata IPFS Gateway pinning reference packaging photography CIDs.</p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowTechModal(false)}
                className="px-4 py-1.5 bg-clinical-800 text-white rounded text-xs font-semibold hover:bg-clinical-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
