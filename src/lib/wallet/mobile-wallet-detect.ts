/**
 * Mobile Wallet Detection & Deep Linking
 * Handles auto-detection and connection for mobile wallet apps
 */

export interface MobileWallet {
  name: string;
  icon: string;
  deepLink: string;
  universalLink: string;
  appStoreUrl: string;
  playStoreUrl: string;
  isInstalled?: boolean;
}

// Popular Solana mobile wallets
export const MOBILE_WALLETS: MobileWallet[] = [
  {
    name: 'Phantom',
    icon: '/wallets/phantom.svg',
    deepLink: 'phantom://',
    universalLink: 'https://phantom.app/ul/browse/',
    appStoreUrl: 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=app.phantom',
  },
  {
    name: 'Solflare',
    icon: '/wallets/solflare.svg',
    deepLink: 'solflare://',
    universalLink: 'https://solflare.com/ul/browse/',
    appStoreUrl: 'https://apps.apple.com/app/solflare/id1580902717',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.solflare.mobile',
  },
  {
    name: 'Glow',
    icon: '/wallets/glow.svg',
    deepLink: 'glow://',
    universalLink: 'https://glow.app/ul/browse/',
    appStoreUrl: 'https://apps.apple.com/app/glow-solana-wallet/id1599584512',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.luma.wallet.prod',
  },
];

/**
 * Check if running on mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Check if Phantom is available (either extension or in-app browser)
 */
export function isPhantomInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).phantom?.solana?.isPhantom;
}

/**
 * Check if Solflare is available
 */
export function isSolflareInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).solflare?.isSolflare;
}

/**
 * Check if running inside a wallet's in-app browser
 */
export function isInWalletBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isPhantom = !!(window as any).phantom?.solana?.isPhantom;
  const isSolflare = !!(window as any).solflare?.isSolflare;
  const isGlow = !!(window as any).glow;
  
  return isPhantom || isSolflare || isGlow;
}

/**
 * Get the current URL for deep linking
 */
export function getCurrentUrl(): string {
  if (typeof window === 'undefined') return '';
  return encodeURIComponent(window.location.href);
}

/**
 * Open app in Phantom's in-app browser
 */
export function openInPhantom(url?: string): void {
  const targetUrl = url || window.location.href;
  const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(targetUrl)}?ref=${encodeURIComponent(window.location.origin)}`;
  window.location.href = phantomUrl;
}

/**
 * Open app in Solflare's in-app browser  
 */
export function openInSolflare(url?: string): void {
  const targetUrl = url || window.location.href;
  const solflareUrl = `https://solflare.com/ul/v1/browse/${encodeURIComponent(targetUrl)}?ref=${encodeURIComponent(window.location.origin)}`;
  window.location.href = solflareUrl;
}

/**
 * Get store URL based on platform
 */
export function getStoreUrl(wallet: MobileWallet): string {
  if (isIOS()) return wallet.appStoreUrl;
  if (isAndroid()) return wallet.playStoreUrl;
  return wallet.playStoreUrl; // Default to Play Store
}

/**
 * Try to open wallet app, fallback to store
 */
export function openWalletApp(wallet: MobileWallet, fallbackToStore = true): void {
  const currentUrl = getCurrentUrl();
  
  // Try universal link first (works better on iOS)
  const universalUrl = `${wallet.universalLink}${currentUrl}`;
  
  // Create a hidden iframe to try opening the app
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = wallet.deepLink;
  document.body.appendChild(iframe);
  
  // Set timeout to redirect to universal link or store
  setTimeout(() => {
    document.body.removeChild(iframe);
    
    if (fallbackToStore) {
      // Try universal link, then store
      window.location.href = universalUrl;
    }
  }, 500);
}

/**
 * Detect which wallets are available
 */
export function detectAvailableWallets(): MobileWallet[] {
  return MOBILE_WALLETS.map(wallet => ({
    ...wallet,
    isInstalled: 
      (wallet.name === 'Phantom' && isPhantomInstalled()) ||
      (wallet.name === 'Solflare' && isSolflareInstalled()) ||
      false
  }));
}
