const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");

// Initialize Aptos client
const aptosConfig = new AptosConfig({ 
  network: process.env.APTOS_NETWORK || Network.DEVNET 
});
const aptos = new Aptos(aptosConfig);

// DAO Contract Module Address (to be deployed)
const DAO_MODULE_ADDRESS = process.env.DAO_CONTRACT_ADDRESS || "0x42";
const CONTRACT_ADDRESS = DAO_MODULE_ADDRESS;

// Deploy DAO contract
async function deployDAOContract({ name, votingPeriod, quorum, creator }) {
  try {
    // TODO: Implement DAO contract deployment
    // For now, return a mock contract address
    // In production, this would deploy a Move smart contract
    console.log(`Deploying DAO contract for: ${name}`);
    console.log(`Creator: ${creator}`);
    console.log(`Voting Period: ${votingPeriod} days`);
    console.log(`Quorum: ${quorum}%`);
    
    // Mock contract address - in production this would be the actual deployed contract
    const contractAddress = `${DAO_MODULE_ADDRESS}::dao::${name.replace(/\s+/g, '_').toLowerCase()}`;
    
    return contractAddress;
  } catch (error) {
    console.error("Error deploying DAO contract:", error);
    throw error;
  }
}

// Create a new proposal
async function createProposal({ 
  contractAddress, 
  creator, 
  title, 
  description, 
  votingStartTime, 
  votingEndTime,
  proposalType = "general"
}) {
  try {
    console.log(`Creating proposal: ${title}`);
    console.log(`Contract: ${contractAddress}`);
    console.log(`Creator: ${creator}`);
    console.log(`Type: ${proposalType}`);
    
    // TODO: Implement actual Move contract call
    // This would call the contract's create_proposal function
    /*
    const transaction = await aptos.transaction.build.simple({
      sender: creator,
      data: {
        function: `${contractAddress}::create_proposal`,
        functionArguments: [title, description, votingStartTime, votingEndTime],
      },
    });
    */
    
    // Mock proposal ID - in production this would come from the transaction result
    const proposalId = Date.now().toString();
    
    return proposalId;
  } catch (error) {
    console.error("Error creating proposal:", error);
    throw error;
  }
}

// Vote on a proposal
async function voteOnProposal({ 
  contractAddress, 
  proposalId, 
  voter, 
  vote, 
  votingPower = 1 
}) {
  try {
    console.log(`Voting on proposal ${proposalId}`);
    console.log(`Voter: ${voter}`);
    console.log(`Vote: ${vote}`);
    console.log(`Voting Power: ${votingPower}`);
    
    // TODO: Implement actual Move contract call
    // This would call the contract's vote function
    /*
    const transaction = await aptos.transaction.build.simple({
      sender: voter,
      data: {
        function: `${contractAddress}::vote`,
        functionArguments: [proposalId, vote, votingPower],
      },
    });
    
    const response = await aptos.signAndSubmitTransaction({
      signer: signerAccount,
      transaction
    });
    */
    
    return {
      success: true,
      transactionHash: `mock_tx_${Date.now()}`,
      vote,
      votingPower
    };
  } catch (error) {
    console.error("Error voting on proposal:", error);
    throw error;
  }
}

// Get proposal status
async function getProposalStatus(contractAddress, proposalId) {
  try {
    console.log(`Getting status for proposal ${proposalId}`);
    
    // TODO: Implement actual contract state reading
    // This would read the proposal state from the contract
    /*
    const proposalResource = await aptos.getAccountResource({
      accountAddress: contractAddress,
      resourceType: `${contractAddress}::Proposal`
    });
    */
    
    // Mock status - in production this would come from contract state
    return {
      id: proposalId,
      status: "active",
      yesVotes: 0,
      noVotes: 0,
      totalVotes: 0,
      startTime: Date.now(),
      endTime: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
      executed: false
    };
  } catch (error) {
    console.error("Error getting proposal status:", error);
    throw error;
  }
}

// Get DAO information
async function getDAOInfo(contractAddress) {
  try {
    console.log(`Getting DAO info for contract: ${contractAddress}`);
    
    // TODO: Implement actual contract state reading
    /*
    const daoResource = await aptos.getAccountResource({
      accountAddress: contractAddress,
      resourceType: `${contractAddress}::DAO`
    });
    */
    
    // Mock DAO info - in production this would come from contract state
    return {
      contractAddress,
      totalMembers: 1,
      totalProposals: 0,
      treasury: "0",
      isActive: true
    };
  } catch (error) {
    console.error("Error getting DAO info:", error);
    throw error;
  }
}

// Join DAO
async function joinDAO({ contractAddress, memberAddress, stakingAmount = 0 }) {
  try {
    console.log(`Member ${memberAddress} joining DAO at ${contractAddress}`);
    console.log(`Staking amount: ${stakingAmount}`);
    
    // TODO: Implement actual Move contract call
    /*
    const transaction = await aptos.transaction.build.simple({
      sender: memberAddress,
      data: {
        function: `${contractAddress}::join_dao`,
        functionArguments: [stakingAmount],
      },
    });
    */
    
    return {
      success: true,
      transactionHash: `mock_join_tx_${Date.now()}`,
      memberAddress,
      stakingAmount
    };
  } catch (error) {
    console.error("Error joining DAO:", error);
    throw error;
  }
}

// Get member info
async function getMemberInfo(contractAddress, memberAddress) {
  try {
    console.log(`Getting member info for ${memberAddress} in DAO ${contractAddress}`);
    
    // TODO: Implement actual contract state reading
    /*
    const memberResource = await aptos.getAccountResource({
      accountAddress: memberAddress,
      resourceType: `${contractAddress}::Member`
    });
    */
    
    // Mock member info
    return {
      address: memberAddress,
      joinedAt: Date.now(),
      votingPower: 1,
      stakedAmount: "0",
      proposalsCreated: 0,
      proposalsVoted: 0
    };
  } catch (error) {
    console.error("Error getting member info:", error);
    throw error;
  }
}

// Validate Aptos address
function isValidAptosAddress(address) {
  try {
    // Aptos addresses are 32-byte hex strings, usually starting with 0x
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
    return /^[0-9a-fA-F]{1,64}$/.test(cleanAddress) && cleanAddress.length <= 64;
  } catch (error) {
    return false;
  }
}

// Get account balance
async function getAccountBalance(address) {
  try {
    const resources = await aptos.getAccountResources({ accountAddress: address });
    const aptCoin = resources.find(r => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
    
    if (aptCoin) {
      return aptCoin.data.coin.value;
    }
    return "0";
  } catch (error) {
    console.error("Error getting account balance:", error);
    return "0";
  }
}

// Get account info (verify account exists)
async function getAccount(address) {
  try {
    const account = await aptos.getAccountInfo({ accountAddress: address });
    return account;
  } catch (error) {
    console.error("Error getting account info:", error);
    throw error;
  }
}

// Create DAO
// Generate transaction for token creation (to be signed by frontend wallet)
async function generateTokenCreationTransaction(creator, tokenConfig) {
  try {
    console.log(`Generating APT distribution transaction for wallet: ${creator}`);
    console.log('Token config:', tokenConfig);
    
    // Since custom token creation requires module deployment, we'll use APT distribution
    // This simulates token distribution by sending APT to the specified addresses
    const totalSupply = tokenConfig.totalSupply || 1000000;
    const distributionAddresses = [
      "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c",
      "0xd89d2d8c8c3848dbeeaab302e005e16728363a463f63e7b45cc331c655e6991a",
      "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c"
    ];
    
    // Calculate APT amounts (using smaller amounts for demonstration)
    const baseAmount = 10000; // 0.0001 APT per "token share"
    const distributionAmount = Math.floor(baseAmount / distributionAddresses.length);
    
    console.log(`Distributing ${distributionAmount} octas to each address`);
    
    // Create the first distribution transaction (others will be handled separately)
    const transactionPayload = {
      function: "0x1::coin::transfer",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [
        distributionAddresses[0], // First recipient
        distributionAmount.toString()
      ]
    };
    
    console.log('Generated APT distribution payload for Petra:', JSON.stringify(transactionPayload, null, 2));
    
    return {
      success: true,
      transactionPayload: transactionPayload,
      tokenType: `APT_DISTRIBUTION_${tokenConfig.symbol || 'DAO'}`,
      distributionAddresses: distributionAddresses,
      distributionAmount: distributionAmount,
      note: `DAO Token Distribution - Sending ${distributionAmount} octas to governance participants`
    };
  } catch (error) {
    console.error("Error generating token distribution transaction:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Process signed token creation transaction
async function processSignedTokenTransaction(signedTransaction) {
  try {
    console.log('Processing signed token creation transaction...');
    
    // Submit the signed transaction to Aptos network
    const result = await aptos.transaction.submit.simple(signedTransaction);
    
    // Wait for transaction confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: result.hash,
    });
    
    return {
      success: true,
      transactionHash: result.hash,
      executedTransaction: executedTransaction
    };
  } catch (error) {
    console.error("Error processing signed token transaction:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Generate APT distribution transactions for specific addresses
async function generateTokenDistributionTransactions(creator, tokenType, distributionConfig) {
  try {
    console.log('Generating APT distribution transactions...');
    
    // Use the addresses from the initial transaction
    const distributionAddresses = distributionConfig.addresses || [
      "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c",
      "0xd89d2d8c8c3848dbeeaab302e005e16728363a463f63e7b45cc331c655e6991a",
      "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c"
    ];
    
    const baseAmount = 10000; // 0.0001 APT total
    const distributionAmount = Math.floor(baseAmount / distributionAddresses.length);
    
    console.log(`Creating APT distribution: ${distributionAmount} octas to each of ${distributionAddresses.length} addresses`);
    
    const distributionTransactions = [];
    
    // Skip the first address since it's already handled in the main transaction
    for (let i = 1; i < distributionAddresses.length; i++) {
      const recipient = distributionAddresses[i];
      const amount = (i === distributionAddresses.length - 1) 
        ? baseAmount - (distributionAmount * (distributionAddresses.length - 1)) // Give remainder to last address
        : distributionAmount;
      
      // Create APT transfer transaction
      const transferPayload = {
        function: "0x1::coin::transfer",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [
          recipient,
          amount.toString()
        ]
      };
      
      distributionTransactions.push({
        type: 'transfer',
        recipient: recipient,
        amount: amount,
        payload: transferPayload,
        note: `Send ${amount} octas to ${recipient}`
      });
    }
    
    return {
      success: true,
      transactions: distributionTransactions,
      totalDistributed: baseAmount,
      recipientCount: distributionAddresses.length
    };
    
  } catch (error) {
    console.error("Error generating distribution transactions:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Create Aptos governance token (mock version for testing)
async function createGovernanceToken(creator, tokenConfig) {
  try {
    console.log(`Creating governance token for creator: ${creator}`);
    console.log(`Token config:`, tokenConfig);
    
    const {
      name,
      symbol,
      description,
      decimals = 8,
      totalSupply,
      iconUri = '',
      projectUri = ''
    } = tokenConfig;
    
    // For now, return mock data since we need frontend wallet integration
    // In production, this would use generateTokenCreationTransaction() 
    // and processSignedTokenTransaction()
    
    // Mock token creation response
    const tokenAddress = `${creator}::${symbol.toLowerCase()}::${symbol.toUpperCase()}`;
    return {
      success: true,
      tokenAddress,
      name,
      symbol,
      decimals,
      totalSupply,
      creator,
      transactionHash: `mock_token_tx_${Date.now()}`,
      createdAt: new Date().toISOString(),
      // Include transaction data for frontend wallet signing
      needsWalletSigning: true,
      transactionPayload: {
        function: "0x1::managed_coin::initialize",
        typeArguments: [`${creator}::${symbol}`],
        functionArguments: [name, symbol, decimals, false]
      }
    };
  } catch (error) {
    console.error("Error creating governance token:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Mint governance tokens
async function mintGovernanceTokens(creator, tokenAddress, recipient, amount) {
  try {
    console.log(`Minting ${amount} tokens to ${recipient}`);
    console.log(`Token address: ${tokenAddress}`);
    
    // TODO: Implement actual Move contract call to mint tokens
    /*
    const transaction = await aptos.transaction.build.simple({
      sender: creator,
      data: {
        function: "0x1::managed_coin::mint",
        typeArguments: [tokenAddress],
        functionArguments: [recipient, amount],
      },
    });
    */
    
    // Mock mint response
    return {
      success: true,
      recipient,
      amount,
      tokenAddress,
      transactionHash: `mock_mint_tx_${Date.now()}`,
      mintedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error minting governance tokens:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get token balance
async function getTokenBalance(ownerAddress, tokenAddress) {
  try {
    // TODO: Implement actual token balance query
    /*
    const resource = await aptos.getAccountResource({
      accountAddress: ownerAddress,
      resourceType: `0x1::coin::CoinStore<${tokenAddress}>`,
    });
    return resource.coin.value;
    */
    
    // Mock balance
    return Math.floor(Math.random() * 10000);
  } catch (error) {
    console.error("Error getting token balance:", error);
    return 0;
  }
}

async function createDAO(creator, daoConfig) {
  try {
    console.log(`Creating DAO for creator: ${creator}`);
    console.log(`DAO config:`, daoConfig);
    
    // TODO: Implement actual Move contract call to create DAO
    // This would deploy or initialize a DAO contract instance
    /*
    const transaction = await aptos.transaction.build.simple({
      sender: creator,
      data: {
        function: `${DAO_MODULE_ADDRESS}::create_dao`,
        functionArguments: [
          daoConfig.name,
          daoConfig.description,
          daoConfig.governanceToken,
          daoConfig.minStakeAmount,
          daoConfig.votingPeriod,
          daoConfig.quorumPercentage
        ],
      },
    });
    */
    
    // Mock DAO creation response
    return {
      daoId: Date.now().toString(),
      contractAddress: `${DAO_MODULE_ADDRESS}::dao::${daoConfig.name.replace(/\s+/g, '_').toLowerCase()}`,
      creator,
      transactionHash: `mock_create_tx_${Date.now()}`,
      ...daoConfig
    };
  } catch (error) {
    console.error("Error creating DAO:", error);
    throw error;
  }
}

// Verify transaction
async function verifyTransaction(transactionHash) {
  try {
    const transaction = await aptos.getTransactionByHash({ transactionHash });
    return {
      success: transaction.success,
      transaction
    };
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  deployDAOContract,
  createDAO,
  createProposal,
  voteOnProposal,
  getProposalStatus,
  getDAOInfo,
  joinDAO,
  getMemberInfo,
  isValidAptosAddress,
  getAccountBalance,
  getAccount,
  verifyTransaction,
  createGovernanceToken,
  generateTokenCreationTransaction,
  generateTokenDistributionTransactions,
  processSignedTokenTransaction,
  mintGovernanceTokens,
  getTokenBalance,
  CONTRACT_ADDRESS,
  aptos
};