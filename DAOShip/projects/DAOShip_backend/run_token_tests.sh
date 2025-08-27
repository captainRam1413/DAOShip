#!/bin/bash

# DAOShip Aptos Token Integration Test Runner
# This script runs the token creation and distribution tests

echo "🚀 DAOShip Aptos Token Integration Tests"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "test_aptos_token_integration.js" ]; then
    echo "❌ Error: test_aptos_token_integration.js not found"
    echo "Please run this script from the DAOShip_backend directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for required environment variables
if [ -z "$APTOS_TOKEN_SERVICE_PRIVATE_KEY" ]; then
    echo "⚠️  Warning: APTOS_TOKEN_SERVICE_PRIVATE_KEY not set"
    echo "A new account will be generated for testing"
    echo ""
fi

# Run the tests
echo "🧪 Running token integration tests..."
echo ""

node test_aptos_token_integration.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed! Token integration is working correctly."
    echo ""
    echo "🔗 Next steps:"
    echo "1. Check the Aptos explorer links shown above"
    echo "2. Verify token balances in the distribution wallets"
    echo "3. Test DAO creation through the frontend"
    echo ""
else
    echo ""
    echo "❌ Some tests failed. Please check the error messages above."
    echo ""
    echo "🔧 Common fixes:"
    echo "1. Ensure your token service account is funded"
    echo "2. Check your internet connection"
    echo "3. Verify Aptos devnet is available"
    echo ""
fi
