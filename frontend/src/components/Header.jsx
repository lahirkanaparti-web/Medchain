import React from 'react';
import { Factory, Truck, Store, UserCheck } from 'lucide-react';
import LogoMark from './LogoMark';

const ROLES = [
  { id: 'manufacturer', label: 'Manufacturer', icon: Factory },
  { id: 'distributor', label: 'Distributor', icon: Truck },
  { id: 'pharmacy', label: 'Pharmacy', icon: Store },
  { id: 'patient', label: 'Patient Verification', icon: UserCheck },
];

export default function Header({ currentRole, onRoleChange }) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Mark & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-slate-800 rounded-xl border border-slate-700/80 shadow-inner">
              <LogoMark className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-lg leading-none bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  MedChain
                </h1>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-trust-500/30 text-trust-100 border border-trust-500/40">
                  Ethereum Sepolia
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Pharmaceutical Traceability & Vision Verification
              </p>
            </div>
          </div>

          {/* Role Navigation Switcher */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80 shadow-inner">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isActive = currentRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => onRoleChange(role.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-trust-500 text-white shadow-md scale-[1.02]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
