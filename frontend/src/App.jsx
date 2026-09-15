import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './context/WalletContext';
import Header from './components/Header';
import HomeView from './views/HomeView';
import ManufacturerView from './views/ManufacturerView';
import DistributorView from './views/DistributorView';
import PharmacyView from './views/PharmacyView';
import RegulatorView from './views/RegulatorView';
import PatientView from './views/PatientView';

export default function App() {
  const [currentRole, setCurrentRole] = useState('home');

  return (
    <WalletProvider>
      <div className="min-h-screen flex flex-col bg-canvas text-clinical-800 font-sans antialiased">
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '13px',
              borderRadius: '4px',
              padding: '10px 14px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 12px rgba(15, 30, 54, 0.08)',
            },
            success: {
              style: {
                background: '#f0fdf4',
                color: '#05603a',
                border: '1px solid #bbf7d0',
              },
            },
            error: {
              style: {
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
              },
            },
          }}
        />

        {/* Top Navigation Header */}
        <Header currentRole={currentRole} onRoleChange={setCurrentRole} />

        {/* Main Role View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentRole === 'home' && <HomeView onRoleChange={setCurrentRole} />}
          {currentRole === 'manufacturer' && <ManufacturerView />}
          {currentRole === 'distributor' && <DistributorView />}
          {currentRole === 'pharmacy' && <PharmacyView />}
          {currentRole === 'regulator' && <RegulatorView />}
          {currentRole === 'patient' && <PatientView />}
        </main>

        {/* Persistent Clinical Footer */}
        <footer className="bg-white border-t border-slate-300 py-4 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-slate-700">
              <span className="font-bold text-clinical-900 font-display">MedChain Platform</span>
              <span>— Pharmaceutical Supply Chain Verification Network</span>
            </div>
            <span className="text-slate-500 text-xs">
              Official Regulatory Audit & Authenticity System
            </span>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}
