'use client';

import React, { ReactNode, useState } from 'react';
import { 
  connectorsForWallets,
  RainbowKitProvider, 
  darkTheme 
} from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, http, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { defineChain } from 'viem';
import '@rainbow-me/rainbowkit/styles.css';

// 1. Define X Layer Testnet with corrected Chain ID 195
export const xLayerTestnet = defineChain({
  id: 1952,
  name: 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testrpc.xlayer.tech/terigon'] },
  },
  blockExplorers: {
    default: { name: 'OKX Explorer', url: 'https://www.okx.com/explorer/xlayer/testnet' },
  },
  testnet: true,
});

const projectId = '5f698552d0b018a74f7b4e02980d3cc7';

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [queryClient] = useState(() => new QueryClient());

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use useMemo to ensure stable config reference across re-renders
  const config = React.useMemo(() => {
    // Return a minimal config on the server to prevent evaluation of heavy connectors
    if (typeof window === 'undefined') {
      return createConfig({
        chains: [xLayerTestnet],
        ssr: true,
        transports: {
          [xLayerTestnet.id]: http(),
        },
      });
    }

    const connectors = connectorsForWallets(
      [
        {
          groupName: 'Recommended',
          wallets: [injectedWallet, rainbowWallet, walletConnectWallet],
        },
      ],
      {
        appName: 'Aetherial Protocol',
        projectId,
      }
    );

    return createConfig({
      connectors,
      chains: [xLayerTestnet],
      ssr: true,
      transports: {
        [xLayerTestnet.id]: http(),
      },
    });
  }, []);

  // Hydration Guard: Only render providers and children on the client
  if (!mounted) return null;

  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#A3E635', // Primary lime color
            accentColorForeground: 'black',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
