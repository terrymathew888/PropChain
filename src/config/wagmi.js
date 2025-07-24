import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { hardhat, mainnet, sepolia } from 'wagmi/chains'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'Millow',
  projectId: 'e6228b55176bb6062f06af0ab9d4ad09', // Get from WalletConnect Cloud
  chains: [hardhat, sepolia, mainnet],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
})