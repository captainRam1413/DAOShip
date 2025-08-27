const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
const accountAddress = "0xaab466baafa5efc8bcd6c8a15ac86ee968c0f389f3b713109af0e994518b9751";

async function checkAccountStatus() {
  try {
    console.log("🔍 Checking Account Status on Aptos Testnet");
    console.log("===========================================");
    console.log("📍 Account:", accountAddress);
    console.log("");

    // Check if account exists and get balance
    try {
      const balance = await aptos.getAccountAPTAmount({ accountAddress });
      console.log("✅ Account exists on chain");
      console.log("💰 Balance:", balance / 100000000, "APT");
      
      if (balance >= 100000000) { // 1 APT or more
        console.log("✅ Account is sufficiently funded for deployment!");
        console.log("🚀 Run: node deploy_daoship_token.js");
      } else {
        console.log("⚠️  Account needs more funding for deployment");
        console.log("🔗 Fund at: https://aptoslabs.com/testnet-faucet");
      }
      
    } catch (error) {
      console.log("❌ Account not found on chain");
      console.log("💡 This is normal for new accounts");
      console.log("🔗 Fund at: https://aptoslabs.com/testnet-faucet");
      console.log("📍 Address:", accountAddress);
    }

    // Check if any of the target wallets exist
    const targetWallets = [
      "0x53146ebe37502a000f54c343cd5ec665d5f118d7cc306c62cf41fd27716341d9",
      "0x695fddb793accf3b65e5e5183d8f136b92fa8963ceeb3fe9a14cb486a668b034",
      "0xd89d2d8c8c3848dbeeaab302e005e16728363a463f63e7b45cc331c655e6991a",
      "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c"
    ];

    console.log("\n🎯 Checking Target Wallets:");
    for (let i = 0; i < targetWallets.length; i++) {
      try {
        await aptos.getAccountInfo({ accountAddress: targetWallets[i] });
        console.log(`✅ Wallet ${i + 1}: Exists on chain`);
      } catch (error) {
        console.log(`⚠️  Wallet ${i + 1}: Not found (will be created during transfer)`);
      }
    }

  } catch (error) {
    console.error("❌ Error checking account:", error.message);
  }
}

checkAccountStatus();
