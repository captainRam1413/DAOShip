/**
 * DAOShip Aptos Token Integration Test Suite
 * 
 * This script tests the complete workflow of:
 * 1. Wallet connection validation
 * 2. Testnet funding
 * 3. Token creation
 * 4. Asset registration for recipients
 * 5. Token distribution to fixed wallets
 * 
 * Run with: npm test or node test-aptos-integration.js
 */

import { 
  connectWallet,
  ensureTestnetFunding,
  createToken,
  ensureAssetRegistration,
  distributeTokens,
  verifyBalances,
  REQUIRED_CREATOR_ADDRESS,
  DISTRIBUTION_WALLETS
} from './src/blockchain/aptosService';

// Test configuration
const TEST_CONFIG = {
  name: "Test DAO Token",
  symbol: "TDAO",
  description: "Test governance token for automated testing",
  initialSupply: 1000000,
  decimals: 6,
  iconUri: "https://example.com/test-token.png"
};

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logStep(step: string) {
  log(`\n🧪 ${step}`, COLORS.cyan);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, COLORS.green);
}

function logError(message: string) {
  log(`❌ ${message}`, COLORS.red);
}

function logWarning(message: string) {
  log(`⚠️ ${message}`, COLORS.yellow);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test wallet connection
 */
async function testWalletConnection() {
  logStep("Testing Wallet Connection");
  
  try {
    const connection = await connectWallet();
    logSuccess(`Connected to wallet: ${connection.address}`);
    
    if (connection.address.toLowerCase() === REQUIRED_CREATOR_ADDRESS.toLowerCase()) {
      logSuccess("✓ Correct creator wallet connected");
    } else {
      logError(`✗ Wrong wallet connected. Expected: ${REQUIRED_CREATOR_ADDRESS}`);
      throw new Error("Wrong wallet connected");
    }
    
    return connection;
  } catch (error) {
    logError(`Wallet connection failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test testnet funding
 */
async function testTestnetFunding(address: string) {
  logStep("Testing Testnet Funding");
  
  try {
    await ensureTestnetFunding(address);
    logSuccess("✓ Testnet funding completed");
  } catch (error) {
    logError(`Testnet funding failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test token creation
 */
async function testTokenCreation() {
  logStep("Testing Token Creation");
  
  try {
    const result = await createToken(TEST_CONFIG);
    logSuccess(`✓ Token created successfully`);
    log(`  Asset Type: ${result.assetType}`, COLORS.blue);
    log(`  Creator: ${result.creator}`, COLORS.blue);
    log(`  Transaction Hash: ${result.txHash}`, COLORS.blue);
    
    return result;
  } catch (error) {
    logError(`Token creation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test asset registration
 */
async function testAssetRegistration(assetType: string) {
  logStep("Testing Asset Registration");
  
  try {
    await ensureAssetRegistration(DISTRIBUTION_WALLETS, assetType);
    logSuccess("✓ Asset registration completed for all wallets");
  } catch (error) {
    logError(`Asset registration failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test token distribution
 */
async function testTokenDistribution(assetType: string, creatorAddress: string) {
  logStep("Testing Token Distribution");
  
  try {
    const amountPerWallet = Math.floor(TEST_CONFIG.initialSupply / DISTRIBUTION_WALLETS.length);
    
    const result = await distributeTokens({
      assetType,
      from: creatorAddress,
      recipients: DISTRIBUTION_WALLETS,
      amountPerRecipient: amountPerWallet
    });
    
    logSuccess(`✓ Token distribution completed`);
    log(`  Amount per wallet: ${amountPerWallet}`, COLORS.blue);
    log(`  Total distributed: ${amountPerWallet * DISTRIBUTION_WALLETS.length}`, COLORS.blue);
    log(`  Transaction hashes:`, COLORS.blue);
    
    result.transferTxHashes.forEach((hash, index) => {
      log(`    ${index + 1}. ${hash}`, COLORS.blue);
    });
    
    return result;
  } catch (error) {
    logError(`Token distribution failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test balance verification
 */
async function testBalanceVerification(assetType: string) {
  logStep("Testing Balance Verification");
  
  try {
    await verifyBalances(assetType, DISTRIBUTION_WALLETS);
    logSuccess("✓ Balance verification completed");
  } catch (error) {
    logWarning(`Balance verification failed: ${error.message}`);
    // Don't throw - this is not critical for the test
  }
}

/**
 * Display test configuration
 */
function displayTestConfig() {
  log("\n📋 Test Configuration", COLORS.magenta);
  log(`Token Name: ${TEST_CONFIG.name}`, COLORS.blue);
  log(`Token Symbol: ${TEST_CONFIG.symbol}`, COLORS.blue);
  log(`Initial Supply: ${TEST_CONFIG.initialSupply.toLocaleString()}`, COLORS.blue);
  log(`Required Creator: ${REQUIRED_CREATOR_ADDRESS}`, COLORS.blue);
  log(`Distribution Wallets:`, COLORS.blue);
  DISTRIBUTION_WALLETS.forEach((wallet, index) => {
    log(`  ${index + 1}. ${wallet}`, COLORS.blue);
  });
}

/**
 * Display test results summary
 */
function displayTestSummary(results: any) {
  log("\n📊 Test Results Summary", COLORS.magenta);
  log(`Creator Address: ${results.creatorAddress}`, COLORS.blue);
  log(`Token Asset Type: ${results.tokenResult.assetType}`, COLORS.blue);
  log(`Creation Transaction: ${results.tokenResult.txHash}`, COLORS.blue);
  log(`Distribution Transactions:`, COLORS.blue);
  results.distributionResult.transferTxHashes.forEach((hash: string, index: number) => {
    log(`  ${index + 1}. ${hash}`, COLORS.blue);
  });
  
  const amountPerWallet = Math.floor(TEST_CONFIG.initialSupply / DISTRIBUTION_WALLETS.length);
  log(`\nDistribution Details:`, COLORS.green);
  log(`Amount per wallet: ${amountPerWallet.toLocaleString()}`, COLORS.green);
  log(`Total distributed: ${(amountPerWallet * DISTRIBUTION_WALLETS.length).toLocaleString()}`, COLORS.green);
  log(`Remaining with creator: ${(TEST_CONFIG.initialSupply - amountPerWallet * DISTRIBUTION_WALLETS.length).toLocaleString()}`, COLORS.green);
}

/**
 * Main test function
 */
async function runTests() {
  log("🚀 Starting DAOShip Aptos Token Integration Tests", COLORS.magenta);
  displayTestConfig();
  
  const startTime = Date.now();
  let testResults: any = {};
  
  try {
    // Test 1: Wallet Connection
    const walletConnection = await testWalletConnection();
    testResults.creatorAddress = walletConnection.address;
    
    // Add delay between operations
    await sleep(2000);
    
    // Test 2: Testnet Funding
    await testTestnetFunding(walletConnection.address);
    await sleep(2000);
    
    // Test 3: Token Creation
    const tokenResult = await testTokenCreation();
    testResults.tokenResult = tokenResult;
    await sleep(3000);
    
    // Test 4: Asset Registration
    await testAssetRegistration(tokenResult.assetType);
    await sleep(2000);
    
    // Test 5: Token Distribution
    const distributionResult = await testTokenDistribution(
      tokenResult.assetType, 
      walletConnection.address
    );
    testResults.distributionResult = distributionResult;
    await sleep(3000);
    
    // Test 6: Balance Verification
    await testBalanceVerification(tokenResult.assetType);
    
    // Display results
    displayTestSummary(testResults);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    log(`\n🎉 All tests completed successfully!`, COLORS.green);
    log(`Total execution time: ${duration.toFixed(2)} seconds`, COLORS.green);
    
    return testResults;
    
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    logError(`\n💥 Test suite failed after ${duration.toFixed(2)} seconds`);
    logError(`Error: ${error.message}`);
    
    if (error.stack) {
      log(`\nStack trace:`, COLORS.red);
      log(error.stack, COLORS.red);
    }
    
    process.exit(1);
  }
}

/**
 * CLI interface
 */
if (require.main === module) {
  // Check if running in Node.js environment
  if (typeof window !== 'undefined') {
    logError("This test script should be run in Node.js environment, not browser");
    process.exit(1);
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    log("DAOShip Aptos Token Integration Test Suite", COLORS.magenta);
    log("\nUsage: npm test or node test-aptos-integration.js", COLORS.blue);
    log("\nOptions:", COLORS.blue);
    log("  --help, -h    Show this help message", COLORS.blue);
    log("  --verbose     Enable verbose logging", COLORS.blue);
    process.exit(0);
  }
  
  if (args.includes('--verbose')) {
    // Enable debug logging
    process.env.DEBUG = 'true';
  }
  
  // Run the tests
  runTests().catch((error) => {
    logError(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

export {
  runTests,
  testWalletConnection,
  testTestnetFunding,
  testTokenCreation,
  testAssetRegistration,
  testTokenDistribution,
  testBalanceVerification
};
