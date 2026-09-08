import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import ManufacturerView from './views/ManufacturerView';
import DistributorView from './views/DistributorView';
import PharmacyView from './views/PharmacyView';
import PatientView from './views/PatientView';

export default function App() {
  const [currentRole, setCurrentRole] = useState('manufacturer');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'Manrope, sans-serif',
            fontSize: '13px',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(15, 76, 92, 0.1)',
          },
          success: {
            style: {
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
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
        {currentRole === 'manufacturer' && <ManufacturerView />}
        {currentRole === 'distributor' && <DistributorView />}
        {currentRole === 'pharmacy' && <PharmacyView />}
        {currentRole === 'patient' && <PatientView />}
      </main>

      {/* Persistent Clinical Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-trust-500">MedChain Capstone</span>
            <span>— Dual Verification Supply Chain System</span>
          </div>
          <span className="font-mono text-slate-400 text-[11px]">
            Ethereum Sepolia Testnet • ERC721 Token • MobileNetV2 / Siamese TFLite
          </span>
        </div>
      </footer>
    </div>
  );
}
