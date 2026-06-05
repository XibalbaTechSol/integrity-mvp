import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import React from 'react';

// 1. Get projectId at https://cloud.walletconnect.com
// Using a placeholder for MVP, but normally this comes from .env
const projectId = 'ab3b544b67fa9506660161494541bf4d';

// 2. Set chains
const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com'
};

const sepolia = {
  chainId: 11155111,
  name: 'Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: 'https://rpc.sepolia.org'
};

// 3. Create a metadata object
const metadata = {
  name: 'Xibalba Integrity MVP',
  description: 'Sovereign Intelligence Node Dashboard',
  url: 'https://xibalba.network', 
  icons: ['https://xibalba.network/favicon.png']
};

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
  defaultChainId: 11155111
});

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [mainnet, sepolia],
  projectId,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#c9a84c',
    '--w3m-border-radius-master': '1px'
  }
});

export const Web3ModalProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
