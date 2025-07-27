import { useApp } from '@/src/context/AppContext';
import { useMobileWallet } from './use-mobile-wallet';

export function useWalletUi() {
  const { walletInfo, connectWallet, disconnectWallet, loading } = useApp();
  const mobileWallet = useMobileWallet();

  return {
    account: walletInfo ? {
      address: walletInfo.publicKey.toString(),
      publicKey: walletInfo.publicKey,
      label: walletInfo.publicKey.toString().substring(0, 8) + '...' + walletInfo.publicKey.toString().substring(walletInfo.publicKey.toString().length - 8),
    } : null,
    connect: connectWallet,
    disconnect: disconnectWallet,
    signAndSendTransaction: mobileWallet.signAndSendTransaction,
    signIn: mobileWallet.signIn,
    signMessage: mobileWallet.signMessage,
    isLoading: loading,
  };
}
