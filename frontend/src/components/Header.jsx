import React, { useState } from 'react';
import { Home, Factory, Truck, Store, ShieldCheck, ShieldAlert, Info, X, Wallet, ExternalLink, AlertTriangle } from 'lucide-react';
import LogoMark from './LogoMark';
import { useWallet } from '../context/WalletContext';

const NAVIGATION_ITEMS = [
  { id: 'home', label: 'Overview', icon: Home },
  { id: 'manufacturer', label: 'Manufacturer', icon: Factory },
  { id: 'distributor', label: 'Distributor', icon: Truck },
  { id: 'pharmacy', label: 'Pharmacy', icon: Store },
  { id: 'regulator', label: 'Regulator audit', icon: ShieldAlert },
  { id: 'patient', label: 'Patient verification', icon: ShieldCheck },
];

export default function Header({ currentRole, onRoleChange }) {
  const [showTechModal, setShowTechModal] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);

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

  return (
    <>
      <header className="bg-pharma-deep border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Mark & System Title */}
            <div 
              onClick={() => onRoleChange('home')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="p-1.5 bg-slate-900 border border-slate-700/60 rounded">
                <LogoMark className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-display font-bold text-base tracking-tight text-white group-hover:text-slate-200">
                    MedChain
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                    Sepolia Ledger
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal">
                  Pharmaceutical authentication & provenance system
                </p>
              </div>
            </div>

            {/* Navigation Role Tabs */}
            <nav aria-label="Role Navigation" className="flex items-center space-x-1 bg-slate-900/90 p-1 border border-slate-700/60 rounded">
              {NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentRole === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onRoleChange(item.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-white ${
                      isActive
                        ? 'bg-white text-pharma-deep shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Side: Wallet Connection & Spec Info */}
            <div className="flex items-center space-x-3 relative">
              {/* Web3 Wallet Connect Button */}
              {isConnected ? (
                <div className="relative">
                  <button
                    onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium bg-slate-900 border border-slate-700 hover:border-slate-500 transition-colors text-white"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSepolia ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isSepolia ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    </span>
                    <span className="font-mono text-xs">{truncatedAddress}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 rounded text-slate-300 border border-slate-700">
                      {networkName}
                    </span>
                  </button>

                  {/* Wallet Dropdown */}
                  {showWalletDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded border border-slate-300 shadow-xl p-3 z-50 text-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-900">Connected Wallet</span>
                        <button
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
                            className="font-mono text-pharma-deep hover:underline inline-flex items-center space-x-1"
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
                          className="text-[11px] text-pharma-deep hover:underline inline-flex items-center space-x-1"
                        >
                          <span>Etherscan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
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
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-seal-emerald hover:bg-emerald-800 text-white transition-colors shadow-sm disabled:opacity-50"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                </button>
              )}

              {/* Technical Specifications Trigger */}
              <button
                onClick={() => setShowTechModal(true)}
                className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded border border-slate-700/60 hover:bg-slate-900 transition-colors"
                title="View Technical Specifications"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Technical details</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Technical Specifications Overlay Modal */}
      {showTechModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-pharma-deep" />
                <h3 className="font-display font-bold text-base text-pharma-deep">
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
                <p>Ethereum Sepolia Smart Contract with Role-Based Access Control (RBAC), on-chain recall mechanism, reference image hashes, and geolocation custody tracking.</p>
                <p className="font-mono text-[11px] text-pharma-deep">
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
                onClick={() => setShowTechModal(false)}
                className="px-4 py-1.5 bg-pharma-deep text-white rounded text-xs font-semibold hover:bg-slate-900"
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
