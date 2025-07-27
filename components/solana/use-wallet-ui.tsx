import { useApp } from '@/src/context/AppContext';

export function useWalletUi() {
  const { walletInfo, connectWallet, disconnectWallet, loading } = useApp();

  return {
    account: walletInfo ? {
      address: walletInfo.publicKey.toString(),
      publicKey: walletInfo.publicKey,
      label: walletInfo.publicKey.toString().substring(0, 8) + '...' + walletInfo.publicKey.toString().substring(walletInfo.publicKey.toString().length - 8),
    } : null,
    connect: connectWallet,
    disconnect: disconnectWallet,
    signAndSendTransaction: async (transaction: any) => {
      // Placeholder for demo
      console.log('Sign and send transaction:', transaction);
      return 'mock_signature_' + Date.now();
    },
    signIn: connectWallet,
    signMessage: async (message: any) => {
      // Placeholder for demo
      console.log('Sign message:', message);
      return new Uint8Array();
    },
    isLoading: loading,
  };
}
