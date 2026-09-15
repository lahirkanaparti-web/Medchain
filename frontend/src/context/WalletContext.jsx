import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WalletContext = createContext(null);

const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'; // 11155111 in decimal

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const getNetworkName = (id) => {
    if (!id) return 'Not Connected';
    if (id === '0xaa36a7' || id === '11155111' || id === 11155111) return 'Sepolia';
    if (id === '0x1' || id === '1' || id === 1) return 'Ethereum Mainnet';
    if (id === '0x5' || id === '5' || id === 5) return 'Goerli';
    if (id === '0x13881' || id === '80001') return 'Mumbai';
    return `Chain (${id})`;
  };

  const fetchBalance = useCallback(async (addr) => {
    if (!window.ethereum || !addr) return;
    try {
      const balHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [addr, 'latest'],
      });
      const wei = parseInt(balHex, 16);
      const eth = (wei / 1e18).toFixed(4);
      setBalance(eth);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  }, []);

  const updateWalletState = useCallback(async (accounts) => {
    if (accounts && accounts.length > 0) {
      const currentAccount = accounts[0];
      setAccount(currentAccount);
      setError(null);
      await fetchBalance(currentAccount);

      try {
        const currentChain = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(currentChain);
      } catch (e) {
        console.error('Error getting chainId:', e);
      }
    } else {
      setAccount(null);
      setBalance(null);
    }
  }, [fetchBalance]);

  // Check if wallet is already connected on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts) => updateWalletState(accounts))
        .catch((err) => console.error('Error fetching connected accounts:', err));

      const handleAccountsChanged = (accs) => {
        updateWalletState(accs);
      };

      const handleChainChanged = (newChainId) => {
        setChainId(newChainId);
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [updateWalletState]);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      const msg = 'No Web3 wallet extension (e.g. MetaMask) detected in browser.';
      setError(msg);
      alert(msg + '\nPlease install MetaMask to connect your wallet.');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      await updateWalletState(accounts);
      setIsConnecting(false);
      return true;
    } catch (err) {
      console.error('User rejected or error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet.');
      setIsConnecting(false);
      return false;
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance(null);
    setError(null);
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (switchError) {
      // Unrecognized chain (4902), prompt to add Sepolia network
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID_HEX,
                chainName: 'Sepolia Test Network',
                rpcUrls: ['https://rpc.sepolia.org'],
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  };

  const isConnected = Boolean(account);
  const isSepolia = chainId === SEPOLIA_CHAIN_ID_HEX || chainId === '11155111' || chainId === 11155111;

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        networkName: getNetworkName(chainId),
        balance,
        isConnected,
        isConnecting,
        isSepolia,
        error,
        connectWallet,
        disconnectWallet,
        switchToSepolia,
        hasWalletExtension: typeof window !== 'undefined' && Boolean(window.ethereum),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
