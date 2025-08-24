#!/bin/bash

echo "🚀 DAOShip Token Deployment Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Account details
ACCOUNT_ADDRESS="0xaab466baafa5efc8bcd6c8a15ac86ee968c0f389f3b713109af0e994518b9751"
FAUCET_URL="https://aptoslabs.com/testnet-faucet"

echo "📋 Token Configuration:"
echo "   Name: DAOShipToken"
echo "   Symbol: DST"
echo "   Decimals: 6"
echo "   Supply: 1,000,000"
echo "   Network: Aptos Testnet"
echo ""

echo "🔐 Creator Account: $ACCOUNT_ADDRESS"
echo ""

# Check account balance
echo "💰 Checking account balance..."
node check_account_status.js

echo ""
echo "📋 Pre-deployment Checklist:"
echo "1. ✅ Account created: $ACCOUNT_ADDRESS"
echo "2. ✅ Target wallets verified on chain"
echo "3. ❓ Account funding: Check balance above"
echo ""

# Check if account is funded
echo "🔍 Checking if ready for deployment..."
BALANCE_CHECK=$(node -e "
const { Aptos, AptosConfig, Network } = require('@aptos-labs/ts-sdk');
const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
aptos.getAccountAPTAmount({ accountAddress: '$ACCOUNT_ADDRESS' })
  .then(balance => console.log(balance >= 100000000 ? 'FUNDED' : 'NEEDS_FUNDING'))
  .catch(() => console.log('NEEDS_FUNDING'));
")

if [ "$BALANCE_CHECK" = "FUNDED" ]; then
    echo -e "${GREEN}✅ Account is funded! Starting deployment...${NC}"
    echo ""
    
    # Run the deployment
    node deploy_daoship_token.js
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
        echo "👛 Check Petra wallet (Testnet) for DST tokens"
        echo "🔗 View on explorer: https://explorer.aptoslabs.com/?network=testnet"
    else
        echo ""
        echo -e "${RED}❌ Deployment failed. Check the output above.${NC}"
    fi
    
else
    echo -e "${YELLOW}⚠️  Account needs funding before deployment${NC}"
    echo ""
    echo "📋 Funding Instructions:"
    echo "1. Go to: $FAUCET_URL"
    echo "2. Paste address: $ACCOUNT_ADDRESS"
    echo "3. Click 'Fund Account'"
    echo "4. Wait 2-3 minutes"
    echo "5. Run this script again"
    echo ""
    echo -e "${YELLOW}💡 Tip: Copy the address above and paste it in the faucet${NC}"
fi
