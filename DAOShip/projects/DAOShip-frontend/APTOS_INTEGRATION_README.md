# DAOShip Aptos Testnet Integration Guide

## Overview

This integration enables DAOShip to automatically create and distribute governance tokens on Aptos Testnet when a new DAO is created. The system uses a fixed creator wallet and distributes tokens equally among 4 predefined testnet wallets.

## Architecture

```
┌─────────────────────┐
│   DAO Creation UI   │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Token Integration   │
│     Service         │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Aptos Service      │
│  (aptosService.ts)  │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Aptos Testnet      │
│   Blockchain        │
└─────────────────────┘
```

## Key Components

### 1. Aptos Service (`src/blockchain/aptosService.ts`)
- **Purpose**: Core blockchain interaction layer
- **Functions**:
  - `connectWallet()`: Connect to required creator wallet
  - `ensureTestnetFunding()`: Fund wallet with APT for gas fees
  - `createToken()`: Create fungible token on Aptos
  - `ensureAssetRegistration()`: Register token with recipient wallets
  - `distributeTokens()`: Send equal amounts to fixed wallets

### 2. Token Integration Service (`src/services/tokenIntegrationService.ts`)
- **Purpose**: Orchestrates the complete token creation workflow
- **Features**:
  - Progress tracking with step-by-step updates
  - Error handling and validation
  - Fixed wallet distribution logic
  - Creator wallet address validation

### 3. UI Components (`src/components/token-creation-progress.tsx`)
- **TokenCreationProgress**: Real-time progress display
- **WalletConnectionModal**: Wallet connection interface
- **Features**:
  - Step-by-step progress visualization
  - Transaction hash links to Aptos Explorer
  - Error state handling

### 4. React Hook (`src/hooks/useTokenCreation.ts`)
- **Purpose**: React state management for token creation
- **Provides**: 
  - `useTokenCreation()`: Main workflow hook
  - `useTokenCreationStatus()`: Utilities and status helpers

## Configuration

### Fixed Addresses

```typescript
// Required creator wallet (must be connected)
const REQUIRED_CREATOR_ADDRESS = "0x00fdff5f356036a99e6d57f10481f82969ce3bf56ab4764b9e644ff7f4903ad9";

// Fixed distribution wallets (tokens sent here)
const DISTRIBUTION_WALLETS = [
  "0x53146ebe37502a000f54c343cd5ec665d5f118d7cc306c62cf41fd27716341d9",
  "0x695fddb793accf3b65e5e5183d8f136b92fa8963ceeb3fe9a14cb486a668b034",
  "0xd89d2d8c8c3848dbeeaab302e005e16728363a463f63e7b45cc331c655e6991a",
  "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c"
];
```

### Network Configuration
- **Network**: Aptos Testnet
- **Explorer**: https://explorer.aptoslabs.com/?network=testnet
- **Faucet**: https://faucet.testnet.aptoslabs.com/

## Workflow

### 1. DAO Creation Process

```typescript
// When user creates a DAO, trigger token creation
const tokenParams = {
  daoName: "My DAO",
  tokenName: "My DAO Token",
  tokenSymbol: "MDT", 
  tokenDescription: "Governance token for My DAO",
  initialSupply: 1000000
};

// Execute complete workflow
const result = await tokenIntegrationService.createAndDistributeToken(
  tokenParams,
  (steps) => console.log('Progress:', steps)
);
```

### 2. Step-by-Step Process

1. **Connect Wallet** → Validate creator address
2. **Fund Wallet** → Ensure sufficient APT for gas
3. **Create Token** → Mint fungible asset on Aptos
4. **Register Assets** → Register token with recipients  
5. **Distribute Tokens** → Send equal amounts to 4 wallets

### 3. Token Distribution Logic

```typescript
const totalSupply = 1000000;
const numberOfWallets = 4;
const amountPerWallet = Math.floor(totalSupply / numberOfWallets); // 250,000
const remaining = totalSupply % numberOfWallets; // Stays with creator
```

## Usage Examples

### Basic Integration

```tsx
import { useTokenCreation } from '../hooks/useTokenCreation';
import { TokenCreationProgress, WalletConnectionModal } from '../components/token-creation-progress';

function CreateDAOForm() {
  const {
    isCreating,
    steps,
    result,
    error,
    isWalletModalOpen,
    connectedAddress,
    requiredAddress,
    createToken,
    connectWallet,
    closeWalletModal
  } = useTokenCreation();

  const handleCreateDAO = async (daoData) => {
    // First ensure wallet is connected
    if (!connectedAddress) {
      await connectWallet();
      return;
    }

    // Create token and distribute
    await createToken({
      daoName: daoData.name,
      tokenName: `${daoData.name} Token`,
      tokenSymbol: daoData.symbol,
      tokenDescription: `Governance token for ${daoData.name}`,
      initialSupply: daoData.tokenSupply
    });
  };

  return (
    <div>
      {/* DAO Creation Form */}
      <form onSubmit={handleCreateDAO}>
        {/* Form fields... */}
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create DAO'}
        </button>
      </form>

      {/* Progress Display */}
      {isCreating && (
        <TokenCreationProgress 
          steps={steps}
          onComplete={() => console.log('Token created!', result)}
          onError={(error) => console.error('Failed:', error)}
        />
      )}

      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={isWalletModalOpen}
        onClose={closeWalletModal}
        requiredAddress={requiredAddress}
        connectedAddress={connectedAddress}
        onConnect={connectWallet}
      />
    </div>
  );
}
```

### Programmatic Usage

```typescript
import { tokenIntegrationService } from '../services/tokenIntegrationService';

// Check wallet status
const validation = await tokenIntegrationService.validateWalletConnection();
if (!validation.isValid) {
  console.error('Wallet issue:', validation.error);
}

// Get distribution info
const distribution = tokenIntegrationService.calculateDistribution(1000000);
console.log('Per wallet:', distribution.amountPerWallet);
console.log('Remaining:', distribution.remaining);
```

## Testing

### Automated Test Suite

Run comprehensive integration tests:

```bash
# Install dependencies
npm install

# Run test suite
npm test

# Or run directly
npx ts-node test-aptos-integration.ts
```

### Test Coverage

- ✅ Wallet connection validation
- ✅ Testnet funding process
- ✅ Token creation on Aptos
- ✅ Asset registration for recipients
- ✅ Token distribution to fixed wallets
- ✅ Balance verification
- ✅ Error handling and recovery

### Manual Testing

1. **Setup**:
   - Install Petra or Martian wallet
   - Switch to Aptos Testnet
   - Import the required creator private key
   - Get testnet APT from faucet

2. **Test Token Creation**:
   ```typescript
   const result = await createToken({
     name: "Test Token",
     symbol: "TEST",
     description: "Test governance token",
     initialSupply: 100000,
     decimals: 6
   });
   ```

3. **Verify Results**:
   - Check Aptos Explorer for transactions
   - Verify token balances in recipient wallets
   - Confirm equal distribution

## Troubleshooting

### Common Issues

1. **Wrong Wallet Connected**
   ```
   Error: Wrong wallet connected. Please switch to required creator wallet.
   ```
   **Solution**: Switch to the exact required address in your wallet

2. **Insufficient APT Balance**
   ```
   Error: Insufficient APT balance for gas fees
   ```
   **Solution**: Visit https://faucet.testnet.aptoslabs.com/ to get test APT

3. **Network Mismatch**
   ```
   Error: Please switch to Aptos Testnet
   ```
   **Solution**: Change network in wallet to Testnet

4. **Token Creation Failed**
   ```
   Error: Token creation transaction failed
   ```
   **Solution**: Check gas fees, network connection, and try again

### Debug Mode

Enable verbose logging:

```typescript
// Set environment variable
process.env.DEBUG = 'true';

// Or pass flag to test script
npx ts-node test-aptos-integration.ts --verbose
```

### Explorer Links

- **Transactions**: `https://explorer.aptoslabs.com/txn/{txHash}?network=testnet`
- **Accounts**: `https://explorer.aptoslabs.com/account/{address}?network=testnet`
- **Tokens**: Search by token name/symbol in explorer

## Security Considerations

### Testnet Only
- ⚠️ This implementation is for **Testnet only**
- ⚠️ Private keys and addresses are for testing
- ⚠️ Never use these addresses on Mainnet

### Fixed Addresses
- Creator wallet is hardcoded for consistency
- Distribution wallets are predetermined
- No dynamic wallet selection for security

### Error Handling
- All functions include comprehensive error handling
- Failed transactions don't leave incomplete state
- User-friendly error messages guide resolution

## API Reference

### Core Functions

```typescript
// Connect to required creator wallet
connectWallet(): Promise<WalletConnection>

// Ensure wallet has sufficient APT
ensureTestnetFunding(address: string): Promise<void>

// Create fungible token
createToken(config: TokenConfig): Promise<TokenCreationResult>

// Register token with recipient wallets
ensureAssetRegistration(addresses: string[], assetType: string): Promise<void>

// Distribute tokens to recipients
distributeTokens(params: DistributionParams): Promise<DistributionResult>
```

### Types

```typescript
interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: string | number;
  iconUri?: string;
  description?: string;
}

interface TokenCreationResult {
  assetType: string;    // Unique token identifier
  creator: string;      // Creator wallet address
  txHash: string;       // Transaction hash
}

interface DistributionResult {
  transferTxHashes: string[];  // Array of transfer transaction hashes
}
```

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Wallet addresses verified on Testnet
- [ ] Sufficient APT in creator wallet
- [ ] Network configuration confirmed
- [ ] Error handling tested

### Post-deployment
- [ ] Integration test successful
- [ ] UI components working
- [ ] Progress tracking functional
- [ ] Error states handled properly
- [ ] Documentation updated

## Support

For issues or questions:
1. Check transaction hashes on Aptos Explorer
2. Verify wallet connection and network
3. Review console logs for detailed errors
4. Test with manual token creation first
5. Contact development team with error details

---

*This integration was designed specifically for DAOShip's Aptos Testnet requirements with fixed wallet distribution and creator validation.*
