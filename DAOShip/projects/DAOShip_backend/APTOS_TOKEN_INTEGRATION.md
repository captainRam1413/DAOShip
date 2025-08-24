# DAOShip Aptos Token Integration

## Overview

This document describes the implementation of automatic governance token creation and distribution for DAOShip DAOs using the Aptos blockchain. When a DAO is created through the platform, a new fungible asset (token) is automatically created on Aptos devnet and distributed to predefined wallet addresses.

## Features

### 🪙 Token Creation
- **Automatic Token Deployment**: Creates a new fungible asset on Aptos devnet
- **Configurable Parameters**: Name, symbol, decimals, initial supply
- **Metadata Support**: Includes DAO description and GitHub repository link

### 🎯 Automatic Distribution
- **Equal Distribution**: Tokens are distributed equally among 4 hardcoded wallets
- **Transaction Tracking**: All distribution transactions are recorded
- **Status Monitoring**: Real-time status updates during distribution

### 🔗 Seamless Integration
- **Non-breaking**: Existing DAO creation flow remains unchanged
- **Modular Design**: Token functionality can be disabled without affecting core features
- **Error Handling**: DAO creation continues even if token creation fails

## Architecture

### Backend Components

#### 1. Aptos Token Service (`/src/services/aptos.token.service.js`)

Main service handling token operations:

```javascript
// Create and distribute token
const result = await createAndDistributeToken({
  name: "My DAO Token",
  symbol: "MDT",
  decimals: 8,
  initialSupply: 1000000,
  description: "Governance token for My DAO",
  projectUri: "https://github.com/username/repo"
});
```

**Key Functions:**
- `createToken(config)` - Creates fungible asset on Aptos
- `distributeTokens(tokenAddress, amount)` - Distributes to hardcoded wallets  
- `createAndDistributeToken(config)` - Complete workflow
- `verifyTokenDistribution(tokenAddress)` - Verifies distribution success
- `getTokenBalance(tokenAddress, accountAddress)` - Checks token balances

#### 2. Enhanced DAO Model

Added fields to track token information:

```javascript
{
  // Existing fields...
  governanceTokenAddress: String,     // Aptos token address
  tokenCreationHash: String,          // Creation transaction hash
  tokenDistributionHashes: [String],  // Distribution transaction hashes
  tokenDistributionStatus: String,    // 'pending', 'completed', 'failed', 'partial'
  tokenDecimals: Number               // Token decimal places (0-18)
}
```

#### 3. Updated DAO Routes

Enhanced DAO creation endpoint with token integration:

- `POST /api/dao` - Creates DAO with automatic token creation
- `GET /api/dao/:id/token` - Retrieves token information for a DAO
- `POST /api/dao/:id/create-token` - Manually creates token for existing DAO

### Frontend Components

#### 1. Enhanced Create DAO Form

Added token configuration fields:
- Token Name
- Token Symbol  
- Token Decimals (0-18)
- Initial Supply

#### 2. Token Creation Status Display

Real-time status updates during DAO creation:
- Creating token...
- Token created successfully
- Distribution status
- Error handling

## Configuration

### Environment Variables

```bash
# Aptos Configuration
APTOS_NETWORK=devnet
APTOS_TOKEN_SERVICE_PRIVATE_KEY=your_private_key_here

# Optional: Custom faucet for funding
APTOS_FAUCET_URL=https://aptoslabs.com/testnet-faucet
```

### Hardcoded Distribution Wallets

The following wallet addresses receive equal token distributions:

```javascript
const DISTRIBUTION_WALLETS = [
  "0x53146ebe37502a000f54c343cd5ec665d5f118d7cc306c62cf41fd27716341d9",
  "0x695fddb793accf3b65e5e5183d8f136b92fa8963ceeb3fe9a14cb486a668b034", 
  "0xd89d2d8c8c3848dbeeaab302e005e16728363a463f63e7b45cc331c655e6991a",
  "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c"
];
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd projects/DAOShip_backend
npm install @aptos-labs/ts-sdk
```

### 2. Configure Token Service Account

The token service needs a funded Aptos account for operations:

```bash
# Generate new account (for testing)
node -e "
const { Account } = require('@aptos-labs/ts-sdk');
const account = Account.generate();
console.log('Address:', account.accountAddress.toString());
console.log('Private Key:', account.privateKey.toString());
"

# Fund the account at: https://aptoslabs.com/testnet-faucet
```

### 3. Set Environment Variables

```bash
export APTOS_TOKEN_SERVICE_PRIVATE_KEY="your_private_key_here"
export APTOS_NETWORK="devnet"
```

### 4. Run Tests

```bash
# Test token creation and distribution
node test_aptos_token_integration.js
```

## Testing

### Unit Tests

The test suite (`test_aptos_token_integration.js`) verifies:

1. **Token Service Initialization**
2. **Token Creation and Distribution** 
3. **Token Metadata Validation**
4. **Distribution Verification**
5. **Individual Balance Verification**

### Manual Testing

1. **Create a DAO** through the frontend
2. **Check transaction** on Aptos Explorer
3. **Verify balances** in distribution wallets
4. **Test error scenarios** (insufficient funds, network issues)

### Test Results Output

```
🧪 TEST RESULTS SUMMARY
====================================
1. Token Service Initialization: ✅ PASSED
2. Token Creation and Distribution: ✅ PASSED  
3. Token Metadata Validation: ✅ PASSED
4. Distribution Verification: ✅ PASSED
5. Individual Balance Verification: ✅ PASSED

🎉 ALL TESTS PASSED!
✅ Token creation and distribution is working correctly
🪙 Token Address: 0x123...
📄 Transaction Hash: 0xabc...
🎯 Distributed to 4/4 wallets
```

## API Documentation

### Create DAO with Token

**POST** `/api/dao`

```json
{
  "name": "My DAO",
  "description": "A decentralized organization",
  "manager": "0x...",
  "tokenName": "My DAO Token", 
  "tokenSymbol": "MDT",
  "tokenSupply": 1000000,
  "tokenDecimals": 8,
  "votingPeriod": 7,
  "quorum": 50,
  "minTokens": 100
}
```

**Response:**
```json
{
  "_id": "dao_id",
  "name": "My DAO",
  "governanceTokenAddress": "0x...",
  "tokenCreationHash": "0x...",
  "tokenDistributionStatus": "completed",
  "tokenCreation": {
    "success": true,
    "tokenAddress": "0x...",
    "transactionHash": "0x...",
    "distributionSummary": {
      "totalDistributed": 1000000,
      "successfulDistributions": 4,
      "failedDistributions": 0
    }
  }
}
```

### Get DAO Token Info

**GET** `/api/dao/:id/token`

**Response:**
```json
{
  "hasToken": true,
  "tokenAddress": "0x...",
  "metadata": {
    "name": "My DAO Token",
    "symbol": "MDT", 
    "decimals": 8
  },
  "distributionVerification": {
    "totalWallets": 4,
    "walletsWithTokens": 4,
    "allWalletsHaveTokens": true
  },
  "distributionStatus": "completed"
}
```

### Manually Create Token

**POST** `/api/dao/:id/create-token`

Use this endpoint if token creation failed during DAO creation.

## Error Handling

### Common Errors

1. **Insufficient Funds**
   - **Cause**: Token service account has insufficient APT
   - **Solution**: Fund account at Aptos faucet

2. **Account Does Not Exist**
   - **Cause**: Distribution wallet not created on Aptos
   - **Solution**: Distribution skipped, tokens remain in creator account

3. **Network Issues**
   - **Cause**: Aptos devnet unavailable
   - **Solution**: DAO creation continues, token creation can be retried

### Error Recovery

- Failed token creation doesn't prevent DAO creation
- Manual token creation available via API
- All transactions are logged for debugging
- Partial distributions are tracked and can be completed

## Security Considerations

### Private Key Management

⚠️ **Critical**: The token service private key must be stored securely:

```bash
# Production deployment
export APTOS_TOKEN_SERVICE_PRIVATE_KEY="$(cat /secure/path/private_key)"

# Or use key management service
export APTOS_TOKEN_SERVICE_PRIVATE_KEY="$(aws secretsmanager get-secret-value ...)"
```

### Distribution Wallets

- Hardcoded addresses are immutable
- Consider multi-sig for production
- Monitor wallet balances regularly

## Monitoring & Analytics

### Transaction Tracking

All token operations are tracked:

```javascript
// DAO model includes
{
  tokenCreationHash: "0x...",           // Initial creation
  tokenDistributionHashes: ["0x..."],   // All distribution transactions  
  tokenDistributionStatus: "completed"  // Overall status
}
```

### Useful Queries

```javascript
// DAOs with successful token distributions
DAO.find({ tokenDistributionStatus: 'completed' })

// Failed token creations needing attention  
DAO.find({ tokenDistributionStatus: 'failed' })

// Partial distributions to complete
DAO.find({ tokenDistributionStatus: 'partial' })
```

## Future Enhancements

### Planned Features

1. **Dynamic Distribution Lists**
   - Admin configurable wallet addresses
   - Percentage-based distributions
   - Role-based allocations

2. **Token Governance Integration**
   - Voting power calculation
   - Proposal submission requirements
   - Delegation mechanisms

3. **Multi-chain Support** 
   - Ethereum integration
   - Cross-chain bridges
   - Unified token interface

4. **Advanced Token Features**
   - Vesting schedules
   - Token burning
   - Inflationary mechanics

### Technical Improvements

- Batch transaction processing
- Gas optimization
- Retry mechanisms
- Real-time notifications

## Troubleshooting

### Common Issues

**Q: Token creation is slow**
A: Aptos devnet can have variable performance. Transactions typically complete in 5-15 seconds.

**Q: Distribution failed to some wallets**  
A: Check if recipient accounts exist on Aptos. Non-existent accounts are skipped.

**Q: Balance showing as 0 after distribution**
A: Allow up to 30 seconds for transaction confirmation, then refresh.

**Q: Token service account out of funds**
A: Fund the account at https://aptoslabs.com/testnet-faucet

### Debug Commands

```bash
# Check token service account balance
node -e "
const { aptos } = require('./src/services/aptos.token.service');
(async () => {
  const balance = await aptos.getAccountAPTAmount({ 
    accountAddress: 'YOUR_TOKEN_SERVICE_ADDRESS' 
  });
  console.log('Balance:', balance, 'Octas');
})();
"

# Verify specific token distribution  
node -e "
const { verifyTokenDistribution } = require('./src/services/aptos.token.service');
verifyTokenDistribution('TOKEN_ADDRESS').then(console.log);
"
```

## Contributing

When extending token functionality:

1. **Maintain backward compatibility**
2. **Add comprehensive tests**  
3. **Update documentation**
4. **Consider security implications**
5. **Test on devnet first**

### Code Style

- Use descriptive variable names
- Add JSDoc comments for functions
- Handle errors gracefully
- Log important operations
- Follow existing patterns

---

## Contact & Support

For questions about the Aptos token integration:

- **GitHub Issues**: [DAOShip Repository](https://github.com/captainRam1413/DAOShip)
- **Documentation**: This README
- **Test Suite**: `test_aptos_token_integration.js`

---

*This implementation enables DAOShip to automatically create and distribute governance tokens, providing a seamless experience for DAO creators while maintaining the flexibility to handle various scenarios and edge cases.*
