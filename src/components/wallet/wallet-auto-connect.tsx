'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { isMobile, isInWalletBrowser, openInPhantom } from '@/lib/wallet/mobile-wallet-detect';
import { MobileWalletModal } from './mobile-wallet-modal';

/**
 * Component that handles auto-detection and prompting for wallet connection
 * Especially useful on mobile to redirect to wallet app
 */
export function WalletAutoConnect() {
  const { connected, connecting, select, wallets, connect } = useWallet();
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isWalletBrowser, setIsWalletBrowser] = useState(false);

  useEffect(() => {
    // Detect device type on client side
    setIsMobileDevice(isMobile());
    setIsWalletBrowser(isInWalletBrowser());
  }, []);

  useEffect(() => {
    // If we're in a wallet browser and not connected, try to auto-connect
    if (isWalletBrowser && !connected && !connecting && wallets.length > 0) {
      // Find the wallet adapter that matches the in-app browser
      const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
      const solflareWallet = wallets.find(w => w.adapter.name === 'Solflare');
      
      // Try to detect which wallet browser we're in and select it
      if ((window as any).phantom?.solana?.isPhantom && phantomWallet) {
        select(phantomWallet.adapter.name);
      } else if ((window as any).solflare?.isSolflare && solflareWallet) {
        select(solflareWallet.adapter.name);
      }
    }
  }, [isWalletBrowser, connected, connecting, wallets, select]);

  useEffect(() => {
    // On mobile (not in wallet browser), show prompt after a short delay
    // Only show once per session
    if (isMobileDevice && !isWalletBrowser && !connected && !hasPrompted) {
      const timer = setTimeout(() => {
        // Check localStorage to see if user dismissed before
        const dismissed = localStorage.getItem('provelt_wallet_prompt_dismissed');
        if (!dismissed) {
          setShowPrompt(true);
          setHasPrompted(true);
        }
      }, 2000); // 2 second delay
      
      return () => clearTimeout(timer);
    }
  }, [isMobileDevice, isWalletBrowser, connected, hasPrompted]);

  const handleClose = () => {
    setShowPrompt(false);
    // Remember that user dismissed
    localStorage.setItem('provelt_wallet_prompt_dismissed', 'true');
  };

  // Don't render anything on desktop or if already connected
  if (!isMobileDevice || isWalletBrowser || connected) {
    return null;
  }

  return <MobileWalletModal isOpen={showPrompt} onClose={handleClose} />;
}
