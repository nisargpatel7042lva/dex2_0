// Global type declarations for missing modules
declare module '@solana/web3.js' {
  export * from '@solana/web3.js';
}

declare module 'react' {
  export * from 'react';
}

declare module 'react-native' {
  export * from 'react-native';
}

declare module '@/components/app-text' {
  export const AppText: any;
}

declare module '@/components/app-theme' {
  export const useAppTheme: any;
}

declare module '@/constants/devnet-config' {
  export const DevnetConfig: any;
}

declare module '@/src/context/AppContext' {
  export const useApp: any;
}
