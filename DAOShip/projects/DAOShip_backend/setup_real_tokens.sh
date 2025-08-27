#!/bin/bash

echo "🚀 DAOShip Real Blockchain Token Setup"
echo "======================================"
echo ""

# Check if we have Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "📋 Step 1: Generate account for real transactions"
echo "⏳ Running account generation..."
echo ""

# Run the real blockchain script
node create_real_blockchain_tokens.js

echo ""
echo "📋 Next Steps:"
echo "1. 💰 Fund the account shown above using Aptos testnet faucet"
echo "2. 🔑 Save the private key securely"
echo "3. 🔄 Run the script again to create real transactions"
echo ""
echo "🔗 Aptos Testnet Faucet: https://aptoslabs.com/testnet-faucet"
echo "👛 Petra Wallet: Install from https://petra.app/"
echo ""
echo "🎯 Goal: Real tokens visible in Petra wallet with transaction hashes!"
