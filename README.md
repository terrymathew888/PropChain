# PropChain - Real Estate NFT DApp

A modern decentralized real estate marketplace built with React, Solidity, and Ethereum. Buy, sell, and trade properties as NFTs with built-in escrow functionality.

![PropChain Banner](./src/assets/banner.png)

## 🚀 Features

- **NFT Property Listings**: Each property is represented as a unique NFT
- **Smart Escrow System**: Secure transactions with multi-party approval
- **Modern UI/UX**: Built with React 18 and TailwindCSS
- **Multi-Wallet Support**: Connect with MetaMask, WalletConnect, and more via RainbowKit
- **Real-time Updates**: Live transaction status and notifications
- **Gas Optimized**: Efficient smart contracts using latest Solidity patterns
- **Mobile Responsive**: Works seamlessly on all devices

## 🛠 Technology Stack

- **Frontend**:
  - React 18.3
  - Vite 5.4 (Build tool)
  - TailwindCSS 3.4
  - RainbowKit 2.1 (Wallet connection)
  - Wagmi 2.12 (Ethereum interactions)
  - Ethers.js 6.13

- **Smart Contracts**:
  - Solidity 0.8.26
  - OpenZeppelin 5.0.2
  - Hardhat 2.22

- **Development Tools**:
  - TypeScript support
  - ESLint & Prettier
  - Hardhat Testing Framework
  - Gas Reporter

## 📋 Prerequisites

- Node.js v18+ 
- npm or yarn
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/PropChain.git
   cd PropChain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your:
   - Private key (for deployment)
   - Infura/Alchemy RPC URLs
   - Etherscan API key
   - WalletConnect Project ID

## 🏃‍♂️ Running the Application

### Local Development

1. **Start local blockchain**
   ```bash
   npm run node
   ```

2. **Deploy contracts** (in a new terminal)
   ```bash
   npm run deploy
   ```

3. **Start the frontend**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

### Testing

Run the test suite:
```bash
npm test
```

Run with gas reporting:
```bash
REPORT_GAS=true npm test
```

### Production Build

```bash
npm run build
```

## 📝 Smart Contract Architecture

### RealEstate.sol
- ERC721 NFT contract for property tokens
- Minting functionality for new properties
- Enhanced with OpenZeppelin's security features

### Escrow.sol
- Handles property transactions
- Multi-party approval system (buyer, seller, lender, inspector)
- Secure fund management
- Automatic NFT and fund transfers

## 🎯 Usage Guide

### For Buyers
1. Connect your wallet
2. Browse available properties
3. Click "Buy Property" on your chosen home
4. Deposit earnest money
5. Wait for inspection and lender approval
6. Property transfers automatically upon completion

### For Sellers
1. List your property through the smart contract
2. Set purchase price and escrow amount
3. Approve the sale when ready
4. Receive funds automatically upon completion

### For Inspectors
- Review property details
- Approve inspection through the DApp

### For Lenders
- Review transaction details
- Approve and send remaining funds

## 🔐 Security Features

- ReentrancyGuard protection
- Custom error handling for gas optimization
- Comprehensive test coverage
- Audited OpenZeppelin contracts
- Input validation and sanitization

## 🌐 Deployment

### Deploy to Sepolia Testnet
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Deploy to Mainnet
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

### Verify Contracts
```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
