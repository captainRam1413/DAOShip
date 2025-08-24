const { createAndDistributeToken, initializeTokenService } = require('./src/services/aptos.token.service.js');

async function testRealTokenOnTestnet() {
  try {
    console.log("🌐 Testing REAL Token Creation on Aptos TESTNET");
    console.log("============================================");
    console.log("🎯 Target: Real transactions on Aptos Testnet");
    console.log("💰 Your wallets should be funded on testnet");
    console.log("");

    // Initialize the service
    console.log("🔐 Initializing token service for testnet...");
    await initializeTokenService();

    // Token configuration
    const tokenConfig = {
      name: 'DAOShip Testnet Token',
      symbol: 'DSTT',
      decimals: 8,
      initialSupply: 1000000,
      description: 'Real governance token for DAOShip on Aptos Testnet',
    };

    console.log("🚀 Token Configuration:");
    console.log("   Name:", tokenConfig.name);
    console.log("   Symbol:", tokenConfig.symbol);
    console.log("   Supply:", tokenConfig.initialSupply.toLocaleString());
    console.log("   Network: Aptos Testnet");
    console.log("");

    console.log("🔥 Attempting REAL token creation on Aptos Testnet...");
    const result = await createAndDistributeToken(tokenConfig);

    console.log("");
    console.log("============================================");
    console.log("🎉 RESULTS");
    console.log("============================================");

    if (result.isRealTransaction) {
      console.log("✅ SUCCESS! Real token created on Aptos Testnet!");
      console.log("");
      console.log("📄 REAL Transaction Hashes (Check on Explorer):");
      console.log("   🏗️  Token Creation:", result.transactionHash);
      console.log("   🔗 Explorer:", `https://explorer.aptoslabs.com/txn/${result.transactionHash}?network=testnet`);
      console.log("");
      
      if (result.distribution && result.distribution.distributionResults) {
        console.log("💸 Distribution Transaction Hashes:");
        result.distribution.distributionResults.forEach((dist, index) => {
          console.log(`   Wallet ${index + 1}: ${dist.transactionHash}`);
          console.log(`   🔗 Check: https://explorer.aptoslabs.com/txn/${dist.transactionHash}?network=testnet`);
        });
      }
      
      console.log("");
      console.log("🎯 Your 4 Testnet Wallets (should have received tokens):");
      const wallets = [
        "0x53146ebe37502a000f54c343cd5ec665d5f118d7cc306c62cf41fd27716341d9",
        "0x695fddb793accf3b65e5e5183d8f136b92fa8963ceeb3fe9a14cb486a668b034",
        "0xd89d2d8c8c3848dbeeaab302e005e16728363a463f63e7b45cc331c655e6991a",
        "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c"
      ];
      
      wallets.forEach((wallet, index) => {
        console.log(`   ${index + 1}. https://explorer.aptoslabs.com/account/${wallet}?network=testnet`);
      });

    } else if (result.creationMethod === "simple_transfer_test") {
      console.log("⚠️  Token creation not supported, but testnet connectivity confirmed!");
      console.log("✅ Successfully executed transaction on Aptos Testnet");
      console.log("📄 Test Transaction Hash:", result.transactionHash);
      console.log("🔗 Explorer:", `https://explorer.aptoslabs.com/txn/${result.transactionHash}?network=testnet`);
      console.log("");
      console.log("💡 To create real tokens, you need:");
      console.log("   1. Deploy a custom Move contract for token creation");
      console.log("   2. Use that contract address for token operations");
      console.log("   3. Guide: https://aptos.dev/tutorials/your-first-coin/");
      
    } else {
      console.log("⚠️  Running in simulation mode");
      console.log("📄 Mock Transaction Hashes (NOT on blockchain):");
      console.log("   Token Creation:", result.transactionHash);
      if (result.distribution && result.distribution.distributionResults) {
        result.distribution.distributionResults.forEach((dist, index) => {
          console.log(`   Wallet ${index + 1}: ${dist.transactionHash}`);
        });
      }
      console.log("");
      console.log("❌ These hashes won't exist on Aptos Explorer");
    }

    console.log("");
    console.log("============================================");
    console.log("📊 SUMMARY");
    console.log("============================================");
    console.log("🌐 Network: Aptos Testnet");
    console.log("🎯 Creation Method:", result.creationMethod || "simulation");
    console.log("✅ Success:", result.success);
    console.log("🔗 Real Blockchain Transaction:", result.isRealTransaction || false);

  } catch (error) {
    console.error("❌ FAILED:", error.message);
    console.log("");
    console.log("💡 This could mean:");
    console.log("   1. Your account needs funding on Aptos testnet");
    console.log("   2. Token creation requires custom Move contracts");
    console.log("   3. Network connectivity issues");
    console.log("");
    console.log("🔗 Fund your account: https://aptoslabs.com/testnet-faucet");
  }
}

testRealTokenOnTestnet();
