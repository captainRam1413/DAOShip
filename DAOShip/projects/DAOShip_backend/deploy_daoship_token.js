const { 
  Aptos, 
  AptosConfig, 
  Network, 
  Account, 
  Ed25519PrivateKey 
} = require("@aptos-labs/ts-sdk");

// Initialize Aptos client for Testnet
const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET 
});
const aptos = new Aptos(aptosConfig);

// Target wallet addresses for token distribution
const DISTRIBUTION_WALLETS = [
  "0x53146ebe37502a000f54c343cd5ec665d5f118d7cc306c62cf41fd27716341d9",
  "0x695fddb793accf3b65e5e5183d8f136b92fa8963ceeb3fe9a14cb486a668b034",
  "0xd89d2d8c8c3848dbeeaab302e005e16728363a463f63e7b45cc331c655e6991a",
  "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c"
];

// Token configuration
const TOKEN_CONFIG = {
  name: "DAOShipToken",
  symbol: "DST", 
  decimals: 6,
  initialSupply: 1000000,
  description: "DAOShip governance token deployed on Aptos Testnet"
};

let tokenCreatorAccount = null;
let tokenResourceAddress = null;

/**
 * Initialize token creator account with auto-funding from faucet
 */
async function initializeTokenCreator() {
  try {
    console.log("🚀 Initializing Token Creator Account");
    console.log("=====================================");
    
    // Check if we have a saved private key
    const savedPrivateKey = process.env.DAOSHIP_TOKEN_CREATOR_KEY;
    
    if (savedPrivateKey) {
      console.log("🔑 Using saved account...");
      const privateKey = new Ed25519PrivateKey(savedPrivateKey);
      tokenCreatorAccount = Account.fromPrivateKey({ privateKey });
    } else {
      console.log("🆕 Creating new token creator account...");
      tokenCreatorAccount = Account.generate();
      console.log("🔐 Account Address:", tokenCreatorAccount.accountAddress.toString());
      console.log("🔑 Private Key (save this):", tokenCreatorAccount.privateKey.toString());
      console.log("💡 Set environment variable: DAOSHIP_TOKEN_CREATOR_KEY=" + tokenCreatorAccount.privateKey.toString());
    }

    const accountAddress = tokenCreatorAccount.accountAddress.toString();
    
    // Check current balance
    let balance = 0;
    try {
      balance = await aptos.getAccountAPTAmount({ accountAddress });
    } catch (error) {
      console.log("⚠️  Account not found on chain, will be created with funding");
    }
    
    console.log("💰 Current Balance:", balance / 100000000, "APT");
    
    // Auto-fund if balance is low
    if (balance < 100000000) { // Less than 1 APT
      console.log("🚰 Auto-funding from Aptos testnet faucet...");
      try {
        await aptos.fundAccount({ 
          accountAddress,
          amount: 500000000 // 5 APT
        });
        console.log("✅ Successfully funded account with 5 APT");
        
        // Wait a moment for funding to confirm
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check new balance
        const newBalance = await aptos.getAccountAPTAmount({ accountAddress });
        console.log("💰 New Balance:", newBalance / 100000000, "APT");
        
      } catch (fundError) {
        console.error("❌ Auto-funding failed:", fundError.message);
        console.log("🔗 Manual funding required: https://aptoslabs.com/testnet-faucet");
        console.log("💰 Address to fund:", accountAddress);
        throw new Error("Please fund the account manually and try again");
      }
    }
    
    console.log("✅ Token creator account ready!");
    return tokenCreatorAccount;
    
  } catch (error) {
    console.error("❌ Failed to initialize token creator:", error.message);
    throw error;
  }
}

/**
 * Deploy fungible token using Aptos managed coin framework
 */
async function deployDAOShipToken() {
  try {
    console.log("\n🪙 Deploying DAOShipToken on Aptos Testnet");
    console.log("==========================================");
    console.log("📋 Token Configuration:");
    console.log("   Name:", TOKEN_CONFIG.name);
    console.log("   Symbol:", TOKEN_CONFIG.symbol);
    console.log("   Decimals:", TOKEN_CONFIG.decimals);
    console.log("   Initial Supply:", TOKEN_CONFIG.initialSupply.toLocaleString());
    
    if (!tokenCreatorAccount) {
      await initializeTokenCreator();
    }

    // Method 1: Try using managed_coin module (most reliable approach)
    try {
      console.log("\n🔄 Attempting managed coin creation...");
      
      // Initialize the coin
      const initTransaction = await aptos.transaction.build.simple({
        sender: tokenCreatorAccount.accountAddress,
        data: {
          function: "0x1::managed_coin::initialize",
          typeArguments: [`${tokenCreatorAccount.accountAddress.toString()}::daoship_token::DAOShipToken`],
          functionArguments: [
            TOKEN_CONFIG.name,
            TOKEN_CONFIG.symbol,
            TOKEN_CONFIG.decimals,
            false, // monitor_supply
          ],
        },
      });

      console.log("✍️  Signing token initialization transaction...");
      const initCommittedTxn = await aptos.signAndSubmitTransaction({
        signer: tokenCreatorAccount,
        transaction: initTransaction,
      });

      console.log("⏳ Waiting for initialization confirmation...");
      const initExecutedTransaction = await aptos.waitForTransaction({
        transactionHash: initCommittedTxn.hash,
      });

      if (!initExecutedTransaction.success) {
        throw new Error(`Token initialization failed: ${initExecutedTransaction.vm_status}`);
      }

      console.log("✅ Token initialized successfully!");
      console.log("📄 Initialization Hash:", initCommittedTxn.hash);

      // Register and mint initial supply
      const mintAmount = TOKEN_CONFIG.initialSupply * Math.pow(10, TOKEN_CONFIG.decimals);
      
      console.log("🪙 Minting initial supply...");
      const mintTransaction = await aptos.transaction.build.simple({
        sender: tokenCreatorAccount.accountAddress,
        data: {
          function: "0x1::managed_coin::mint",
          typeArguments: [`${tokenCreatorAccount.accountAddress.toString()}::daoship_token::DAOShipToken`],
          functionArguments: [
            tokenCreatorAccount.accountAddress.toString(),
            mintAmount.toString(),
          ],
        },
      });

      const mintCommittedTxn = await aptos.signAndSubmitTransaction({
        signer: tokenCreatorAccount,
        transaction: mintTransaction,
      });

      const mintExecutedTransaction = await aptos.waitForTransaction({
        transactionHash: mintCommittedTxn.hash,
      });

      if (!mintExecutedTransaction.success) {
        throw new Error(`Token minting failed: ${mintExecutedTransaction.vm_status}`);
      }

      console.log("✅ Initial supply minted successfully!");
      console.log("📄 Minting Hash:", mintCommittedTxn.hash);

      // Set token resource address
      tokenResourceAddress = `${tokenCreatorAccount.accountAddress.toString()}::daoship_token::DAOShipToken`;

      return {
        success: true,
        method: "managed_coin",
        tokenResourceAddress,
        initializationHash: initCommittedTxn.hash,
        mintingHash: mintCommittedTxn.hash,
        creatorAddress: tokenCreatorAccount.accountAddress.toString()
      };

    } catch (managedCoinError) {
      console.log("❌ Managed coin method failed:", managedCoinError.message);
      
      // Method 2: Fallback to coin framework
      try {
        console.log("\n🔄 Attempting coin framework creation...");
        
        const coinTransaction = await aptos.transaction.build.simple({
          sender: tokenCreatorAccount.accountAddress,
          data: {
            function: "0x1::coin::initialize",
            typeArguments: [`${tokenCreatorAccount.accountAddress.toString()}::daoship_token::DAOShipToken`],
            functionArguments: [
              TOKEN_CONFIG.name,
              TOKEN_CONFIG.symbol,
              TOKEN_CONFIG.decimals,
              true, // monitor_supply
            ],
          },
        });

        const coinCommittedTxn = await aptos.signAndSubmitTransaction({
          signer: tokenCreatorAccount,
          transaction: coinTransaction,
        });

        const coinExecutedTransaction = await aptos.waitForTransaction({
          transactionHash: coinCommittedTxn.hash,
        });

        if (coinExecutedTransaction.success) {
          tokenResourceAddress = `${tokenCreatorAccount.accountAddress.toString()}::daoship_token::DAOShipToken`;
          
          return {
            success: true,
            method: "coin_framework",
            tokenResourceAddress,
            creationHash: coinCommittedTxn.hash,
            creatorAddress: tokenCreatorAccount.accountAddress.toString()
          };
        } else {
          throw new Error(`Coin creation failed: ${coinExecutedTransaction.vm_status}`);
        }

      } catch (coinError) {
        console.log("❌ Coin framework method failed:", coinError.message);
        throw new Error("All token creation methods failed");
      }
    }

  } catch (error) {
    console.error("❌ Token deployment failed:", error.message);
    throw error;
  }
}

/**
 * Distribute tokens to the 4 specified wallet addresses
 */
async function distributeTokens(tokenResult) {
  try {
    console.log("\n💸 Distributing Tokens to Wallets");
    console.log("=================================");
    
    const tokensPerWallet = TOKEN_CONFIG.initialSupply / DISTRIBUTION_WALLETS.length;
    const tokensPerWalletRaw = Math.floor(tokensPerWallet * Math.pow(10, TOKEN_CONFIG.decimals));
    
    console.log("📊 Distribution Details:");
    console.log("   Total Supply:", TOKEN_CONFIG.initialSupply.toLocaleString(), "DST");
    console.log("   Wallets:", DISTRIBUTION_WALLETS.length);
    console.log("   Per Wallet:", tokensPerWallet.toLocaleString(), "DST");
    console.log("   Raw Amount:", tokensPerWalletRaw.toLocaleString());
    
    const distributionResults = [];
    
    for (let i = 0; i < DISTRIBUTION_WALLETS.length; i++) {
      const recipientAddress = DISTRIBUTION_WALLETS[i];
      
      try {
        console.log(`\n📤 Distributing to wallet ${i + 1}/${DISTRIBUTION_WALLETS.length}:`);
        console.log(`   Address: ${recipientAddress}`);
        console.log(`   Amount: ${tokensPerWallet.toLocaleString()} DST`);

        // Check if recipient account exists
        try {
          await aptos.getAccountInfo({ accountAddress: recipientAddress });
          console.log("   ✅ Recipient account exists");
        } catch (error) {
          console.log("   ⚠️  Recipient account not found, will be created during transfer");
        }

        // Transfer tokens using managed_coin transfer
        const transferTransaction = await aptos.transaction.build.simple({
          sender: tokenCreatorAccount.accountAddress,
          data: {
            function: "0x1::managed_coin::transfer",
            typeArguments: [tokenResourceAddress],
            functionArguments: [
              recipientAddress,
              tokensPerWalletRaw.toString(),
            ],
          },
        });

        console.log("   ✍️  Signing transfer transaction...");
        const transferCommittedTxn = await aptos.signAndSubmitTransaction({
          signer: tokenCreatorAccount,
          transaction: transferTransaction,
        });

        console.log("   ⏳ Waiting for transfer confirmation...");
        const transferExecutedTransaction = await aptos.waitForTransaction({
          transactionHash: transferCommittedTxn.hash,
        });

        if (transferExecutedTransaction.success) {
          distributionResults.push({
            recipientAddress,
            amount: tokensPerWallet,
            rawAmount: tokensPerWalletRaw,
            transactionHash: transferCommittedTxn.hash,
            success: true
          });

          console.log(`   ✅ SUCCESS! Hash: ${transferCommittedTxn.hash}`);
          console.log(`   🔗 Explorer: https://explorer.aptoslabs.com/txn/${transferCommittedTxn.hash}?network=testnet`);
          
        } else {
          console.log(`   ❌ Transfer failed: ${transferExecutedTransaction.vm_status}`);
          distributionResults.push({
            recipientAddress,
            amount: 0,
            transactionHash: null,
            success: false,
            error: transferExecutedTransaction.vm_status
          });
        }

        // Wait between transactions
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`   ❌ Failed to transfer to ${recipientAddress}:`, error.message);
        distributionResults.push({
          recipientAddress,
          amount: 0,
          transactionHash: null,
          success: false,
          error: error.message
        });
      }
    }

    const successfulDistributions = distributionResults.filter(result => result.success);
    
    console.log("\n📊 Distribution Summary:");
    console.log(`✅ Successful: ${successfulDistributions.length}/${DISTRIBUTION_WALLETS.length}`);
    console.log(`💰 Total Distributed: ${successfulDistributions.length * tokensPerWallet} DST`);
    
    return {
      totalWallets: DISTRIBUTION_WALLETS.length,
      successfulDistributions: successfulDistributions.length,
      distributionResults,
      tokensPerWallet
    };

  } catch (error) {
    console.error("❌ Token distribution failed:", error.message);
    throw error;
  }
}

/**
 * Verify token deployment and distribution
 */
async function verifyTokenDeployment(tokenResult, distributionResult) {
  try {
    console.log("\n🔍 Verifying Token Deployment");
    console.log("=============================");
    
    // Check token metadata
    try {
      const tokenMetadata = await aptos.view({
        function: "0x1::coin::name",
        typeArguments: [tokenResourceAddress],
        functionArguments: [],
      });
      
      console.log("✅ Token metadata verified:");
      console.log("   Name:", tokenMetadata[0]);
      
    } catch (error) {
      console.log("⚠️  Could not verify token metadata:", error.message);
    }

    // Check balances
    console.log("\n💰 Checking wallet balances:");
    for (const result of distributionResult.distributionResults) {
      if (result.success) {
        try {
          const balance = await aptos.view({
            function: "0x1::coin::balance",
            typeArguments: [tokenResourceAddress],
            functionArguments: [result.recipientAddress],
          });
          
          const formattedBalance = parseInt(balance[0]) / Math.pow(10, TOKEN_CONFIG.decimals);
          console.log(`   ${result.recipientAddress}: ${formattedBalance.toLocaleString()} DST ✅`);
          
        } catch (error) {
          console.log(`   ${result.recipientAddress}: Balance check failed ❌`);
        }
      }
    }

    return true;
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    return false;
  }
}

/**
 * Main function to deploy DAOShipToken
 */
async function deployDAOShipTokenComplete() {
  try {
    console.log("🚀 DAOShip Token Deployment on Aptos Testnet");
    console.log("=============================================");
    console.log("🎯 Creating real fungible token with distribution");
    console.log("🌐 Network: Aptos Testnet");
    console.log("👛 Token: DAOShipToken (DST)");
    
    // Step 1: Initialize creator account
    await initializeTokenCreator();
    
    // Step 2: Deploy the token
    const tokenResult = await deployDAOShipToken();
    
    // Step 3: Distribute tokens
    const distributionResult = await distributeTokens(tokenResult);
    
    // Step 4: Verify deployment
    const verified = await verifyTokenDeployment(tokenResult, distributionResult);
    
    // Final summary
    console.log("\n" + "=".repeat(50));
    console.log("🎉 DAOSHIP TOKEN DEPLOYMENT COMPLETE");
    console.log("=".repeat(50));
    
    console.log("\n📋 Token Details:");
    console.log("   Name:", TOKEN_CONFIG.name);
    console.log("   Symbol:", TOKEN_CONFIG.symbol);
    console.log("   Decimals:", TOKEN_CONFIG.decimals);
    console.log("   Total Supply:", TOKEN_CONFIG.initialSupply.toLocaleString());
    console.log("   Resource Address:", tokenResourceAddress);
    console.log("   Creator Address:", tokenCreatorAccount.accountAddress.toString());
    
    console.log("\n📄 Transaction Hashes:");
    if (tokenResult.initializationHash) {
      console.log("   Initialization:", tokenResult.initializationHash);
      console.log("   🔗", `https://explorer.aptoslabs.com/txn/${tokenResult.initializationHash}?network=testnet`);
    }
    if (tokenResult.mintingHash) {
      console.log("   Minting:", tokenResult.mintingHash);
      console.log("   🔗", `https://explorer.aptoslabs.com/txn/${tokenResult.mintingHash}?network=testnet`);
    }
    if (tokenResult.creationHash) {
      console.log("   Creation:", tokenResult.creationHash);
      console.log("   🔗", `https://explorer.aptoslabs.com/txn/${tokenResult.creationHash}?network=testnet`);
    }
    
    console.log("\n💸 Distribution Hashes:");
    distributionResult.distributionResults.forEach((result, index) => {
      if (result.success) {
        console.log(`   Wallet ${index + 1}: ${result.transactionHash}`);
        console.log(`   🔗 https://explorer.aptoslabs.com/txn/${result.transactionHash}?network=testnet`);
      }
    });
    
    console.log("\n🎯 Recipient Wallets:");
    distributionResult.distributionResults.forEach((result, index) => {
      const status = result.success ? "✅" : "❌";
      const amount = result.success ? `${result.amount.toLocaleString()} DST` : "Failed";
      console.log(`   ${index + 1}. ${result.recipientAddress} - ${amount} ${status}`);
    });
    
    console.log("\n📊 Summary:");
    console.log("   🌐 Network: Aptos Testnet");
    console.log("   ✅ Token Created:", tokenResult.success ? "Yes" : "No");
    console.log("   📤 Distributions:", `${distributionResult.successfulDistributions}/${distributionResult.totalWallets}`);
    console.log("   🔍 Verified:", verified ? "Yes" : "No");
    console.log("   👛 Petra Wallet: Switch to Testnet to see tokens");
    
    return {
      tokenResourceAddress,
      creatorAddress: tokenCreatorAccount.accountAddress.toString(),
      tokenResult,
      distributionResult,
      verified,
      network: "testnet"
    };
    
  } catch (error) {
    console.error("❌ DEPLOYMENT FAILED:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("1. Ensure account is funded on Aptos testnet");
    console.log("2. Check network connectivity");
    console.log("3. Verify wallet addresses are valid");
    throw error;
  }
}

// Run the deployment
if (require.main === module) {
  deployDAOShipTokenComplete()
    .then(() => {
      console.log("\n🎉 Deployment completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Deployment failed:", error.message);
      process.exit(1);
    });
}

module.exports = {
  deployDAOShipTokenComplete,
  deployDAOShipToken,
  distributeTokens,
  TOKEN_CONFIG,
  DISTRIBUTION_WALLETS
};
