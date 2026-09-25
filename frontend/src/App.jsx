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
import GuidedTour from './components/GuidedTour';

export default function App() {
  const [currentRole, setCurrentRole] = useState('home');
  const [showTour, setShowTour] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return (
    <WalletProvider>
      <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${isDarkMode ? 'dark bg-[#090F1B] text-slate-100' : 'bg-canvas text-pharma-navy'}`}>
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
              border: isDarkMode ? '1px solid #334155' : '1px solid #cbd5e1',
              background: isDarkMode ? '#0F172A' : '#ffffff',
              color: isDarkMode ? '#f8fafc' : '#0d192b',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            },
            success: {
              style: {
                background: isDarkMode ? '#064e3b' : '#f0fdf4',
                color: isDarkMode ? '#ecfdf5' : '#05603a',
                border: '1px solid #059669',
              },
            },
            error: {
              style: {
                background: isDarkMode ? '#881337' : '#fef2f2',
                color: isDarkMode ? '#fff1f2' : '#991b1b',
                border: '1px solid #f43f5e',
              },
            },
          }}
        />

        {/* Top Navigation Header */}
        <Header
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          onStartTour={() => setShowTour(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Guided Demo Walkthrough Modal */}
        <GuidedTour
          isOpen={showTour}
          onClose={() => setShowTour(false)}
          onRoleChange={setCurrentRole}
        />

        {/* Main Role View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentRole === 'home' && (
            <HomeView
              onRoleChange={setCurrentRole}
              onStartTour={() => setShowTour(true)}
            />
          )}
          {currentRole === 'manufacturer' && <ManufacturerView />}
          {currentRole === 'distributor' && <DistributorView />}
          {currentRole === 'pharmacy' && <PharmacyView />}
          {currentRole === 'regulator' && <RegulatorView />}
          {currentRole === 'patient' && <PatientView />}
        </main>

        {/* Persistent Clinical Footer */}
        <footer className={`border-t py-4 text-xs mt-auto transition-colors ${isDarkMode ? 'bg-[#0B132B] border-slate-800 text-slate-400' : 'bg-white border-slate-300 text-slate-500'}`}>
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className={`font-bold font-display ${isDarkMode ? 'text-white' : 'text-pharma-navy'}`}>
                MedChain Platform
              </span>
              <span>— Pharmaceutical Supply Chain Verification Network</span>
            </div>
            <span className={isDarkMode ? 'text-slate-400 text-xs' : 'text-slate-500 text-xs'}>
              Official Regulatory Audit & Authenticity System
            </span>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}
