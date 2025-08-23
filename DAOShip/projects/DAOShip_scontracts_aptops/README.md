# DAOShip Aptos Smart Contracts

This project contains the DAOShip DAO system implemented in Move language for the Aptos blockchain.

## Project Structure

```
├── Move.toml                    # Project configuration
├── sources/
│   ├── dao.move                # Main DAO contract
│   └── governance_token.move   # Governance token contract
├── scripts/
│   └── deploy.move            # Deployment script
├── tests/
│   └── dao_tests.move         # Comprehensive tests
└── README.md                  # This file
```

## Features

### DAO Contract (`dao.move`)
- **Proposal Creation**: Anyone can create proposals (configurable)
- **Voting System**: Token-based voting with rewards
- **Time-based Governance**: Configurable voting periods
- **Proposal Execution**: Automatic execution after voting period
- **Reward Distribution**: Equal distribution of voting fees among participants
- **Admin Controls**: Configuration updates and admin transfer

### Governance Token (`governance_token.move`)
- **ERC-20 Compatible**: Standard token functionality
- **Voting Power**: Configurable voting power per token
- **Minting/Burning**: Admin-controlled token supply management
- **Voting Rights**: Minimum token threshold for voting eligibility

## Key Functions

### DAO Functions
- `initialize_dao()`: Set up the DAO with initial parameters
- `create_proposal()`: Create a new proposal for voting
- `vote_on_proposal()`: Vote on an active proposal
- `execute_proposal()`: Execute a proposal after voting ends
- `claim_voting_reward()`: Claim rewards for participating in voting

### Token Functions
- `initialize_token()`: Deploy and configure the governance token
- `mint_tokens()`: Mint new tokens (admin only)
- `burn_tokens()`: Burn tokens from supply
- `transfer_tokens()`: Transfer tokens between accounts
- `calculate_voting_power()`: Calculate voting power for an address

## Installation and Setup

### Prerequisites
- [Aptos CLI](https://aptos.dev/tools/aptos-cli-tool/install-aptos-cli)
- [Move language support](https://marketplace.visualstudio.com/items?itemName=move.move-analyzer)

### Installation
```bash
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Verify installation
aptos --version
```

### Initialize Aptos Account
```bash
# Create a new account
aptos init

# Fund your account (testnet)
aptos account fund-with-faucet --account default
```

## Deployment

### 1. Compile the Contracts
```bash
aptos move compile
```

### 2. Run Tests
```bash
aptos move test
```

### 3. Deploy to Testnet
```bash
# Deploy the contracts
aptos move publish --profile default

# Run the deployment script
aptos move run-script \
  --script-function default::deploy::main \
  --profile default
```

## Usage Examples

### 1. Initialize the DAO System
```bash
# The deployment script automatically initializes both contracts
# But you can also call them individually:

# Initialize governance token
aptos move run \
  --function-id 'YOUR_ADDRESS::governance_token::initialize_token' \
  --args 'string:DAOShip Token' 'string:SHIP' 'u8:8' 'u64:1000000000000000' 'u64:100000000000000' 'u64:1' 'u64:1000000'

# Initialize DAO
aptos move run \
  --function-id 'YOUR_ADDRESS::dao::initialize_dao' \
  --args 'u64:86400' 'u64:604800' 'u64:100' 'u64:1000000' 'bool:true'
```

### 2. Create a Proposal
```bash
aptos move run \
  --function-id 'YOUR_ADDRESS::dao::create_proposal' \
  --args 'address:DAO_ADMIN_ADDRESS' 'string:Proposal Title' 'string:Proposal Description' 'u64:172800' 'u64:100' 'u64:1000000' 'u64:5000000'
```

### 3. Vote on a Proposal
```bash
aptos move run \
  --function-id 'YOUR_ADDRESS::dao::vote_on_proposal' \
  --args 'address:DAO_ADMIN_ADDRESS' 'u64:1' 'u8:1'
```

### 4. Execute a Proposal
```bash
aptos move run \
  --function-id 'YOUR_ADDRESS::dao::execute_proposal' \
  --args 'address:DAO_ADMIN_ADDRESS' 'u64:1'
```

## Configuration Parameters

### DAO Configuration
- `min_voting_period`: Minimum voting duration (seconds)
- `max_voting_period`: Maximum voting duration (seconds)
- `min_votes_required`: Minimum votes needed for proposal validity
- `vote_price`: Cost to vote (in smallest token units)
- `anyone_can_create`: Whether anyone can create proposals

### Token Configuration
- `name`: Token name (e.g., "DAOShip Token")
- `symbol`: Token symbol (e.g., "SHIP")
- `decimals`: Number of decimal places
- `max_supply`: Maximum token supply
- `initial_supply`: Initial minted supply
- `power_per_token`: Voting power per token
- `minimum_tokens_for_voting`: Minimum tokens required to vote

## Security Features

1. **Access Control**: Admin-only functions protected
2. **Vote Validation**: Prevents double voting and invalid votes
3. **Time Locks**: Enforces voting periods
4. **Balance Checks**: Validates sufficient funds before operations
5. **State Validation**: Ensures proper contract state transitions

## Gas Optimization

- Efficient data structures using Aptos `Table` and `SimpleMap`
- Minimal storage usage with packed structs
- Optimized voting mechanics to reduce transaction costs

## Testing

Run the comprehensive test suite:
```bash
aptos move test
```

Tests cover:
- Contract initialization
- Proposal creation and voting
- Token minting and transfers
- Access control validation
- Edge cases and error conditions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Join the DAOShip Discord community
- Check the Aptos documentation: https://aptos.dev/

## Roadmap

- [ ] Delegation system for voting power
- [ ] Multi-signature proposal execution
- [ ] Proposal categories and templates
- [ ] Advanced reward mechanisms
- [ ] Integration with other DeFi protocols
- [ ] Mobile SDK for easier integration
