const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");

// Initialize Aptos client for testnet (real blockchain)
const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET 
});
const aptos = new Aptos(aptosConfig);

// Your 4 hardcoded wallet addresses (these will receive tokens in Petra)
const DISTRIBUTION_WALLETS = [
  "0x53146ebe37502a000f54c343cd5ec665d5f118d7cc306c62cf41fd27716341d9",
  "0x695fddb793accf3b65e5e5183d8f136b92fa8963ceeb3fe9a14cb486a668b034", 
  "0xd89d2d8c8c3848dbeeaab302e005e16728363a463f63e7b45cc331c655e6991a",
  "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c"
];

let tokenServiceAccount = null;

/**
 * Initialize with a funded account for REAL transactions
 */
async function initializeRealTokenService() {
  try {
    console.log("🚀 Initializing REAL Token Service for Aptos Testnet");
    console.log("🎯 Goal: Create real tokens visible in Petra wallet");
    console.log("");

    // You can either:
    // 1. Use environment variable with your funded private key
    // 2. Create new account and fund it manually
    
    const privateKeyHex = process.env.APTOS_FUNDED_PRIVATE_KEY;
    
    if (privateKeyHex) {
      console.log("🔑 Using provided funded account...");
      const privateKey = new Ed25519PrivateKey(privateKeyHex);
      tokenServiceAccount = Account.fromPrivateKey({ privateKey });
    } else {
      console.log("🆕 Creating new account (needs manual funding)...");
      tokenServiceAccount = Account.generate();
    }

    const accountAddress = tokenServiceAccount.accountAddress.toString();
    console.log("🔐 Account Address:", accountAddress);
    
    // Check balance
    const balance = await aptos.getAccountAPTAmount({ accountAddress });
    console.log("💰 Current Balance:", balance / 100000000, "APT");
    
    if (balance < 100000000) { // Less than 1 APT
      console.log("");
      console.log("⚠️  ACCOUNT NEEDS FUNDING!");
      console.log("🔗 Fund this account: https://aptoslabs.com/testnet-faucet");
      console.log("💰 Address to fund:", accountAddress);
      console.log("🎯 Need at least 1 APT for transactions");
      console.log("");
      
      if (!privateKeyHex) {
        console.log("🔑 SAVE THIS PRIVATE KEY:");
        console.log("   ", tokenServiceAccount.privateKey.toString());
        console.log("💡 Set environment variable: APTOS_FUNDED_PRIVATE_KEY=" + tokenServiceAccount.privateKey.toString());
        console.log("");
      }
      
      throw new Error("Account needs funding. Fund the account and run again.");
    }

    console.log("✅ Account is funded and ready!");
    return tokenServiceAccount;
    
  } catch (error) {
    console.error("❌ Initialization failed:", error.message);
    throw error;
  }
}

/**
 * Create real APT transfers to simulate token distribution
 * This will create REAL transactions visible in Petra wallet
 */
async function distributeRealAPT() {
  try {
    console.log("🎯 Starting REAL APT Distribution to Petra Wallets");
    console.log("💡 This creates real transactions visible in Petra wallet");
    console.log("");

    if (!tokenServiceAccount) {
      await initializeRealTokenService();
    }

    // Amount to send to each wallet (in octas: 1 APT = 100,000,000 octas)
    const amountPerWallet = 5000000; // 0.05 APT per wallet
    const totalAmount = amountPerWallet * DISTRIBUTION_WALLETS.length;
    
    console.log("📊 Distribution Details:");
    console.log("   Amount per wallet:", amountPerWallet / 100000000, "APT");
    console.log("   Total amount:", totalAmount / 100000000, "APT");
    console.log("   Number of wallets:", DISTRIBUTION_WALLETS.length);
    console.log("");

    const realTransactionHashes = [];
    
    for (let i = 0; i < DISTRIBUTION_WALLETS.length; i++) {
      const recipientAddress = DISTRIBUTION_WALLETS[i];
      
      try {
        console.log(`📤 Sending to wallet ${i + 1}/${DISTRIBUTION_WALLETS.length}:`);
        console.log(`   Address: ${recipientAddress}`);
        console.log(`   Amount: ${amountPerWallet / 100000000} APT`);

        // Create real APT transfer transaction
        const transaction = await aptos.transaction.build.simple({
          sender: tokenServiceAccount.accountAddress,
          data: {
            function: "0x1::aptos_account::transfer",
            functionArguments: [
              recipientAddress,
              amountPerWallet.toString(),
            ],
          },
        });

        console.log("   ✍️  Signing transaction...");
        const committedTxn = await aptos.signAndSubmitTransaction({
          signer: tokenServiceAccount,
          transaction,
        });

        console.log("   ⏳ Waiting for confirmation...");
        const executedTransaction = await aptos.waitForTransaction({
          transactionHash: committedTxn.hash,
        });

        if (executedTransaction.success) {
          const realHash = committedTxn.hash;
          realTransactionHashes.push({
            wallet: recipientAddress,
            hash: realHash,
            amount: amountPerWallet / 100000000,
            success: true
          });

          console.log(`   ✅ SUCCESS! Transaction Hash: ${realHash}`);
          console.log(`   🔗 Explorer: https://explorer.aptoslabs.com/txn/${realHash}?network=testnet`);
          console.log(`   👛 Petra Wallet: Check ${recipientAddress} for +${amountPerWallet / 100000000} APT`);
          console.log("");
          
        } else {
          console.log(`   ❌ Transaction failed: ${executedTransaction.vm_status}`);
          realTransactionHashes.push({
            wallet: recipientAddress,
            hash: null,
            amount: 0,
            success: false,
            error: executedTransaction.vm_status
          });
        }

        // Wait between transactions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`   ❌ Failed to send to ${recipientAddress}:`, error.message);
        realTransactionHashes.push({
          wallet: recipientAddress,
          hash: null,
          amount: 0,
          success: false,
          error: error.message
        });
      }
    }

    // Print summary of all real transaction hashes
    console.log("============================================");
    console.log("🎉 REAL TRANSACTION HASHES SUMMARY");
    console.log("============================================");
    console.log("🌐 Network: Aptos Testnet");
    console.log("👛 Visible in: Petra Wallet");
    console.log("");
    
    const successfulTxns = realTransactionHashes.filter(tx => tx.success);
    console.log(`✅ Successful: ${successfulTxns.length}/${DISTRIBUTION_WALLETS.length}`);
    console.log("");

    successfulTxns.forEach((tx, index) => {
      console.log(`🔗 Transaction ${index + 1}:`);
      console.log(`   Hash: ${tx.hash}`);
      console.log(`   To: ${tx.wallet}`);
      console.log(`   Amount: ${tx.amount} APT`);
      console.log(`   Explorer: https://explorer.aptoslabs.com/txn/${tx.hash}?network=testnet`);
      console.log("");
    });

    if (successfulTxns.length > 0) {
      console.log("👛 PETRA WALLET INSTRUCTIONS:");
      console.log("1. Open Petra wallet");
      console.log("2. Make sure you're on Testnet network");
      console.log("3. Check these addresses for received APT:");
      successfulTxns.forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.wallet} (+${tx.amount} APT)`);
      });
      console.log("");
      console.log("🎉 These are REAL transactions on Aptos blockchain!");
    }

    return {
      totalTransactions: DISTRIBUTION_WALLETS.length,
      successfulTransactions: successfulTxns.length,
      transactionHashes: realTransactionHashes,
      network: "testnet",
      realBlockchain: true
    };

  } catch (error) {
    console.error("❌ Real distribution failed:", error.message);
    throw error;
  }
}

/**
 * Main function to demonstrate real blockchain transactions
 */
async function createRealBlockchainTokens() {
  try {
    console.log("🚀 DAOShip REAL Blockchain Token Distribution");
    console.log("==============================================");
    console.log("🎯 Creating REAL transactions visible in Petra wallet");
    console.log("🌐 Network: Aptos Testnet");
    console.log("👛 Wallet: Petra (will show real transactions)");
    console.log("");

    // Initialize service with real funding check
    await initializeRealTokenService();

    // Create real APT distributions (acts as token distribution)
    const result = await distributeRealAPT();

    console.log("==============================================");
    console.log("🏁 FINAL SUMMARY");
    console.log("==============================================");
    console.log("✅ Real blockchain transactions created!");
    console.log("📱 Visible in Petra wallet on Testnet");
    console.log("🔗 Verifiable on Aptos Explorer");
    console.log(`🎯 ${result.successfulTransactions}/${result.totalTransactions} wallets received tokens`);
    console.log("");
    
    if (result.successfulTransactions > 0) {
      console.log("🎉 SUCCESS! Your tokens are now on the real Aptos blockchain!");
      console.log("👀 Check Petra wallet to see the received APT");
      console.log("🔍 Use the explorer links above to verify transactions");
    }

  } catch (error) {
    console.error("❌ FAILED:", error.message);
    console.log("");
    console.log("💡 Next steps:");
    console.log("1. Fund the account using the provided address");
    console.log("2. Set APTOS_FUNDED_PRIVATE_KEY environment variable");
    console.log("3. Run this script again");
  }
}

// Run the real blockchain token creation
if (require.main === module) {
  createRealBlockchainTokens();
}

module.exports = {
  createRealBlockchainTokens,
  distributeRealAPT,
  initializeRealTokenService
};
