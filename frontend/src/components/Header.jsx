import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  Factory,
  Truck,
  Store,
  ShieldCheck,
  ShieldAlert,
  Info,
  X,
  Wallet,
  ExternalLink,
  AlertTriangle,
  PlayCircle,
  Sun,
  Moon,
  ChevronDown,
  Menu,
  Layers
} from 'lucide-react';
import LogoMark from './LogoMark';
import { useWallet } from '../context/WalletContext';

const NAVIGATION_ITEMS = [
  { id: 'home', label: 'Overview', desc: 'System dashboard & live metrics', icon: Home },
  { id: 'manufacturer', label: 'Manufacturer', desc: 'Register batch & link IPFS standards', icon: Factory },
  { id: 'distributor', label: 'Distributor', desc: 'Logistics handoff & defect checks', icon: Truck },
  { id: 'pharmacy', label: 'Pharmacy', desc: 'Inventory receipt & dispensing logs', icon: Store },
  { id: 'regulator', label: 'Regulator audit', desc: 'Autonomous AI audit log & recalls', icon: ShieldAlert },
  { id: 'patient', label: 'Patient verification', desc: 'Camera scan & authenticity certificate', icon: ShieldCheck },
];

export default function Header({ currentRole, onRoleChange, onStartTour, isDarkMode, onToggleDarkMode }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const menuRef = useRef(null);

  const {
    account,
    networkName,
    balance,
    isConnected,
    isConnecting,
    isSepolia,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
  } = useWallet();

  const truncatedAddress = account
    ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
    : '';

  const activeItem = NAVIGATION_ITEMS.find((item) => item.id === currentRole) || NAVIGATION_ITEMS[0];
  const ActiveIcon = activeItem.icon;

  // Close dropdown menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowRoleMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRole = (roleId) => {
    onRoleChange(roleId);
    setShowRoleMenu(false);
  };

  return (
    <>
      <header className="bg-pharma-navy border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* 1. Logo Mark & Title */}
            <div
              onClick={() => handleSelectRole('home')}
              className="flex items-center space-x-3 cursor-pointer group shrink-0"
            >
              <div className="p-1.5 bg-slate-900 border border-slate-700/60 rounded">
                <LogoMark className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2">
                  <h1 className="font-display font-bold text-sm tracking-tight text-white group-hover:text-slate-200">
                    MedChain
                  </h1>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-700">
                    Sepolia
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-normal">
                  Authenticity network
                </p>
              </div>
            </div>

            {/* 2. Top Bar Portal Select Menu (Replaces cramped top-bar tabs) */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-2.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 rounded text-xs font-semibold transition-all text-white shadow-xs focus:ring-2 focus:ring-seal-emerald"
                aria-haspopup="true"
                aria-expanded={showRoleMenu}
              >
                <ActiveIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-display font-bold text-xs truncate max-w-[140px] sm:max-w-none">
                  {activeItem.label}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Portal Selector Dropdown Panel */}
              {showRoleMenu && (
                <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 shadow-2xl rounded p-2 z-50 text-white space-y-1 animate-fadeIn">
                  <div className="px-2 py-1.5 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center justify-between">
                    <span>Select Supply Chain Portal</span>
                    <span className="text-emerald-400">6 Modules</span>
                  </div>

                  <div className="space-y-1 max-h-80 overflow-y-auto py-1">
                    {NAVIGATION_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = currentRole === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectRole(item.id)}
                          className={`w-full text-left p-2.5 rounded transition-colors flex items-start space-x-3 ${
                            isSelected
                              ? 'bg-white/10 text-white border border-slate-600 font-bold'
                              : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className={`p-1.5 rounded shrink-0 ${isSelected ? 'bg-seal-emerald text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-white block">{item.label}</span>
                              {isSelected && (
                                <span className="text-[9px] font-mono bg-seal-emerald text-white px-1.5 py-0.2 rounded">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                              {item.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Right Side Controls */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Web3 Wallet Button */}
              {isConnected ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                    className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-mono bg-slate-900 border border-slate-700 hover:border-slate-500 transition-colors text-white"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSepolia ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isSepolia ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </span>
                    <span className="text-xs">{truncatedAddress}</span>
                  </button>

                  {/* Wallet Dropdown */}
                  {showWalletDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded border border-slate-300 shadow-xl p-3 z-50 text-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-900">Connected Wallet</span>
                        <button
                          type="button"
                          onClick={() => setShowWalletDropdown(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Address:</span>
                          <a
                            href={`https://sepolia.etherscan.io/address/${account}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-pharma-navy hover:underline inline-flex items-center space-x-1"
                          >
                            <span>{truncatedAddress}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Balance:</span>
                          <span className="font-mono font-semibold text-slate-900">{balance ? `${balance} ETH` : 'Loading...'}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Network:</span>
                          <span className={`font-semibold ${isSepolia ? 'text-seal-emerald' : 'text-amber-600'}`}>
                            {networkName}
                          </span>
                        </div>
                      </div>

                      {!isSepolia && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 space-y-1">
                          <div className="flex items-center space-x-1 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Wrong Network</span>
                          </div>
                          <p>Please switch to Ethereum Sepolia Testnet.</p>
                          <button
                            type="button"
                            onClick={switchToSepolia}
                            className="w-full mt-1 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-[11px]"
                          >
                            Switch to Sepolia
                          </button>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200 flex justify-between">
                        <a
                          href={`https://sepolia.etherscan.io/address/${account}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-pharma-navy hover:underline inline-flex items-center space-x-1"
                        >
                          <span>Etherscan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            disconnectWallet();
                            setShowWalletDropdown(false);
                          }}
                          className="text-[11px] text-red-600 hover:text-red-800 font-semibold"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-seal-emerald hover:bg-emerald-800 text-white transition-colors shadow-xs disabled:opacity-50"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{isConnecting ? '...' : 'Connect'}</span>
                </button>
              )}

              {/* Demo Tour Button */}
              {onStartTour && (
                <button
                  type="button"
                  onClick={onStartTour}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-seal-emerald hover:bg-emerald-800 text-white transition-colors"
                  title="Launch guided demo tour"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Tour</span>
                </button>
              )}

              {/* Dark Mode Toggle */}
              {onToggleDarkMode && (
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  aria-label="Toggle Dark Mode"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
                </button>
              )}

              {/* Technical Specifications Modal Trigger */}
              <button
                type="button"
                onClick={() => setShowTechModal(true)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="View Technical Specifications"
              >
                <Info className="w-4 h-4 text-slate-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Technical Specifications Overlay Modal */}
      {showTechModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-pharma-navy" />
                <h3 className="font-display font-bold text-base text-pharma-navy">
                  System Technical Specifications
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTechModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-semibold text-slate-900 block">Smart Contract Infrastructure</span>
                <p>Ethereum Sepolia Smart Contract with Role-Based Access Control (RBAC), on-chain recall mechanism, reference image hashes, and geolocation custody tracking.</p>
                <p className="font-mono text-[11px] text-pharma-navy">
                  Contract: 0x6Df7A20bb095063aA17b6D65796C4D27Ca21B569
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-semibold text-slate-900 block">Visual AI Authentication Model</span>
                <p>Siamese TFLite neural network performing feature vector extraction, reference image distance scoring, and multi-vector tiered authenticity classification.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-semibold text-slate-900 block">Decentralized Storage & Vision AI</span>
                <p>Pinata IPFS Gateway pinning reference packaging photography; Groq Vision & Tool-calling autonomous regulatory agents.</p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowTechModal(false)}
                className="px-4 py-1.5 bg-pharma-navy text-white rounded text-xs font-semibold hover:bg-slate-900"
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
