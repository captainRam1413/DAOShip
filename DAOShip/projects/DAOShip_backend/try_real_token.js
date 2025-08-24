const { createAndDistributeToken, initializeTokenService } = require('./src/services/aptos.token.service.js');

async function tryRealTokenCreation() {
  try {
    console.log("🔥 Attempting REAL token creation on Aptos Devnet...");
    console.log("⚠️  This may fail due to module limitations");
    console.log("");

    // Initialize the service
    await initializeTokenService();

    // Token configuration
    const tokenConfig = {
      name: 'DAOShip Real Token',
      symbol: 'DSRT',
      decimals: 8,
      initialSupply: 1000000,
      description: 'Real governance token attempt for DAOShip',
    };

    console.log("🚀 Attempting real token creation...");
    const result = await createAndDistributeToken(tokenConfig);

    if (!result.isSimulated) {
      console.log("");
      console.log("🎉 SUCCESS! Real token created!");
      console.log("📄 Real Transaction Hashes:");
      console.log("   Token Creation:", result.transactionHash);
      console.log("   Distribution Hashes:");
      result.distribution.distributionResults.forEach((dist, index) => {
        console.log(`   Wallet ${index + 1}: ${dist.transactionHash}`);
        console.log(`   🔗 Check: https://explorer.aptoslabs.com/txn/${dist.transactionHash}?network=devnet`);
      });
    } else {
      console.log("");
      console.log("⚠️  Only simulation possible - no real hashes available");
      console.log("📄 Mock Transaction Hashes (NOT on blockchain):");
      console.log("   Token Creation:", result.transactionHash);
      console.log("   Distribution Hashes:");
      result.distribution.distributionResults.forEach((dist, index) => {
        console.log(`   Wallet ${index + 1}: ${dist.transactionHash}`);
      });
      console.log("");
      console.log("❌ These hashes won't exist on Aptos Explorer");
      console.log("💡 Real tokens require custom Move contracts on Aptos");
    }

  } catch (error) {
    console.error("❌ Real token creation failed:", error.message);
    console.log("");
    console.log("💡 Solution: Deploy custom Move contract for token creation");
    console.log("🔗 Guide: https://aptos.dev/tutorials/your-first-coin/");
  }
}

tryRealTokenCreation();
