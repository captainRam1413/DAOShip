const express = require("express");
const { body, validationResult } = require("express-validator");
const DAO = require("../models/DAO");
const Proposal = require("../models/Proposal");
const aptosService = require("../services/aptos.service");

const router = express.Router();

// Validation middleware
const validateDAO = [
  body("name").notEmpty().withMessage("DAO name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("manager").notEmpty().withMessage("Manager address is required"),
  body("votePrice").isNumeric().withMessage("Vote price must be a number"),
  body("votingPeriod").isNumeric().withMessage("Voting period must be a number"),
  body("quorum").isNumeric().withMessage("Quorum must be a number"),
];

// POST /api/dao - Create new DAO (Updated for Aptos integration)
router.post("/", validateDAO, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array()
      });
    }

    const { 
      name, 
      description, 
      manager,
      votePrice,
      tokenName,
      tokenSymbol,
      tokenSupply,
      votingPeriod, 
      quorum,
      minTokens,
      githubRepo,
      tokenStrategy,
      initialDistribution,
      tokenAllocation,
      contributionRewards,
      vestingPeriod,
      minContributionForVoting,
      invitedCollaborators,
      transactionHash, // Aptos transaction hash
      signature, // Wallet signature
      signedMessage, // Message that was signed
      skipTokenCreation // Flag to skip automatic token creation for wallet-signed tokens
    } = req.body;

    console.log("Creating DAO with parameters:", {
      name,
      description,
      manager,
      votePrice,
      hasSignature: !!signature,
      hasSignedMessage: !!signedMessage
    });

    // If signature is provided, validate it
    if (signature && signedMessage) {
      console.log("Validating wallet signature for DAO creation...");
      
      try {
        // Parse the signed message to verify it's for DAO creation
        const messageData = JSON.parse(signedMessage);
        
        // Verify the message structure
        if (messageData.action !== 'createDAO' || 
            messageData.creator !== manager || 
            messageData.daoName !== name) {
          return res.status(400).json({
            success: false,
            message: "Invalid signed message: message data doesn't match request"
          });
        }

        // Check if signature is recent (within 10 minutes)
        const signatureAge = Date.now() - messageData.timestamp;
        if (signatureAge > 10 * 60 * 1000) {
          return res.status(400).json({
            success: false,
            message: "Signature has expired. Please try again."
          });
        }

        console.log("Wallet signature validated successfully");
        
      } catch (error) {
        console.error("Error validating signature:", error);
        return res.status(400).json({
          success: false,
          message: "Invalid signature or signed message format"
        });
      }
    } else {
      console.log("No signature provided - proceeding without wallet verification");
    }

    // Verify manager account exists on Aptos
    try {
      await aptosService.getAccount(manager);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid manager address or account not found on Aptos network"
      });
    }

    // If transaction hash is provided, verify the transaction
    if (transactionHash) {
      try {
        const txResult = await aptosService.verifyTransaction(transactionHash);
        if (!txResult.success) {
          return res.status(400).json({
            success: false,
            message: "Transaction verification failed"
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Could not verify transaction"
        });
      }
    }

    // Create DAO in Aptos service
    const aptosDAO = await aptosService.createDAO(manager, {
      name,
      description,
      governanceToken: tokenSymbol || `${name.replace(/\s+/g, '').toUpperCase()}_TOKEN`,
      minStakeAmount: votePrice || 100,
      votingPeriod: votingPeriod || 7,
      quorumPercentage: quorum || 20
    });

    // Create governance token on Aptos (skip if wallet signing is planned)
    let tokenCreationResult = null;
    if (tokenName && tokenSymbol && !skipTokenCreation) {
      console.log('Creating governance token on Aptos...');
      
      try {
        tokenCreationResult = await aptosService.createGovernanceToken(manager, {
          name: tokenName,
          symbol: tokenSymbol,
          description: `Governance token for ${name} DAO`,
          decimals: 8,
          totalSupply: tokenSupply || 1000000,
          iconUri: '',
          projectUri: githubRepo || ''
        });

        if (tokenCreationResult.success) {
          console.log('Token created successfully:', tokenCreationResult.tokenAddress);
          
          // Mint initial tokens to creator
          const initialMintAmount = Math.floor((tokenSupply || 1000000) * 0.1); // 10% to creator
          const mintResult = await aptosService.mintGovernanceTokens(
            manager,
            tokenCreationResult.tokenAddress,
            manager,
            initialMintAmount
          );
          
          if (mintResult.success) {
            console.log(`Minted ${initialMintAmount} tokens to creator`);
            tokenCreationResult.initialMint = mintResult;
          }
        }
      } catch (error) {
        console.error('Error creating governance token:', error);
        tokenCreationResult = {
          success: false,
          error: error.message
        };
      }
    }

    // Create DAO in MongoDB
    const dao = new DAO({
      name,
      description,
      creator: manager,
      manager,
      contractAddress: aptosDAO.contractAddress || aptosService.CONTRACT_ADDRESS,
      votePrice,
      tokenName,
      tokenSymbol,
      tokenSupply,
      votingPeriod,
      quorum,
      minTokens,
      githubRepo,
      tokenStrategy,
      initialDistribution,
      tokenAllocation,
      contributionRewards,
      vestingPeriod,
      minContributionForVoting,
      invitedCollaborators: invitedCollaborators || [],
      members: [manager],
      transactionHash: transactionHash || aptosDAO.transactionHash,
      // Store signature info if provided
      signature: signature || null,
      signedMessage: signedMessage || null,
      // Aptos specific fields
      governanceToken: tokenSymbol || `${name.replace(/\s+/g, '').toUpperCase()}_TOKEN`,
      tokenAddress: tokenCreationResult?.tokenAddress || null,
      tokenCreationHash: tokenCreationResult?.transactionHash || null,
      minStakeAmount: votePrice || 100,
      quorumPercentage: quorum || 20,
      treasury: 0,
      totalMembers: 1,
      totalProposals: 0,
      status: 'active'
    });

    await dao.save();
    
    // Prepare response with token creation info
    const response = {
      success: true,
      message: "DAO created successfully",
      data: dao.toObject()
    };

    // Add token creation results if token was created
    if (tokenCreationResult) {
      response.tokenCreation = tokenCreationResult;
      response.message += tokenCreationResult.success 
        ? " with governance token" 
        : " (token creation failed)";
    }
    
    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating DAO:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create DAO",
      error: error.message
    });
  }
});

// GET /api/dao - Get all DAOs
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status } = req.query;
    
    let filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

        const daos = await DAO.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await DAO.countDocuments(filter);

    // Enhance DAOs with Aptos data
    const enhancedDAOs = await Promise.all(daos.map(async (dao) => {
      const daoObj = dao.toObject();
      
      try {
        // Get treasury balance from Aptos
        if (dao.contractAddress) {
          const balance = await aptosService.getAccountBalance(dao.contractAddress);
          daoObj.treasuryBalance = balance.apt;
        }
        
        // Get governance token balance for creator
        if (dao.creator && dao.governanceToken) {
          const tokenBalance = await aptosService.getGovernanceTokenBalance(
            dao.creator, 
            dao.contractAddress
          );
          daoObj.creatorTokenBalance = tokenBalance;
        }
      } catch (error) {
        console.log(`Could not fetch Aptos data for DAO ${dao._id}:`, error.message);
      }
      
      return daoObj;
    }));

    res.json({
      success: true,
      data: {
        daos: enhancedDAOs,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Error fetching DAOs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch DAOs",
      error: error.message
    });
  }
});

// GET /api/dao/:id - Get specific DAO
router.get("/:id", async (req, res) => {
  console.log("Fetching DAO with ID:", req.params.id);
  try {
    const dao = await DAO.findById(req.params.id);
      
    if (!dao) {
      return res.status(404).json({
        success: false,
        message: "DAO not found"
      });
    }

    const daoObj = dao.toObject();

    // Get additional data from Aptos
    try {
      if (dao.creator) {
        const accountInfo = await aptosService.getAccount(dao.creator);
        daoObj.creatorAccountInfo = accountInfo;
      }

      if (dao.contractAddress) {
        const balance = await aptosService.getAccountBalance(dao.contractAddress);
        daoObj.treasuryBalance = balance.apt;
      }

      // Get governance token info
      if (dao.creator && dao.governanceToken) {
        const tokenBalance = await aptosService.getGovernanceTokenBalance(
          dao.creator, 
          dao.contractAddress
        );
        daoObj.creatorTokenBalance = tokenBalance;
      }
    } catch (error) {
      console.log("Could not fetch additional Aptos data:", error.message);
    }

    res.json({
      success: true,
      data: daoObj
    });
    console.log("Fetched DAO:", daoObj);
  } catch (error) {
    console.error("Error fetching DAO:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch DAO",
      error: error.message
    });
  }
});

// POST /api/dao/:daoId/proposals - Create proposal
router.post("/:daoId/proposals", async (req, res) => {
  try {
    const { daoId } = req.params;
    const { title, description, creator, startTime, endTime, type, requestedAmount, recipient, transactionHash } = req.body;

    // Verify DAO exists
    const dao = await DAO.findById(daoId);
    if (!dao) {
      return res.status(404).json({
        success: false,
        message: "DAO not found"
      });
    }

    // Verify creator account
    try {
      await aptosService.getAccount(creator);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid creator address"
      });
    }

    // Verify transaction if provided
    if (transactionHash) {
      try {
        const txResult = await aptosService.verifyTransaction(transactionHash);
        if (!txResult.success) {
          return res.status(400).json({
            success: false,
            message: "Transaction verification failed"
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Could not verify transaction"
        });
      }
    }

    // Create proposal in Aptos service
    const aptosProposal = await aptosService.createProposal(creator, {
      daoId,
      title,
      description,
      type: type || 'governance',
      deadline: endTime,
      requestedAmount,
      recipient
    });

    // Create proposal in MongoDB
    const proposal = new Proposal({
      title,
      description,
      dao: daoId,
      creator,
      startTime,
      endTime,
      type: type || 'governance',
      requestedAmount,
      recipient,
      proposalId: aptosProposal.id,
      transactionHash,
      votesFor: 0,
      votesAgainst: 0,
      totalVotes: 0,
      status: 'active',
      quorumReached: false
    });

    await proposal.save();

    // Update DAO proposal count
    dao.totalProposals = (dao.totalProposals || 0) + 1;
    await dao.save();

    res.status(201).json({
      success: true,
      message: "Proposal created successfully",
      data: proposal
    });
  } catch (error) {
    console.error("Error creating proposal:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create proposal",
      error: error.message
    });
  }
});

// GET /api/dao/:id/proposals - Get all proposals for a DAO
router.get("/:id/proposals", async (req, res) => {
  console.log("Fetching proposals for DAO ID:", req.params.id);
  try {
    const daoId = req.params.id;
    const proposals = await Proposal.find({ dao: daoId })
      .sort({ createdAt: -1 });

    // Enhance proposals with Aptos data
    const enhancedProposals = await Promise.all(proposals.map(async (proposal) => {
      const proposalObj = proposal.toObject();
      
      try {
        if (proposal.proposalId) {
          const aptosProposal = await aptosService.getProposal(proposal.proposalId);
          if (aptosProposal) {
            proposalObj.votesFor = aptosProposal.votesFor;
            proposalObj.votesAgainst = aptosProposal.votesAgainst;
            proposalObj.totalVotes = aptosProposal.totalVotes;
            proposalObj.status = aptosProposal.status;
            proposalObj.quorumReached = aptosProposal.quorumReached;
          }
        }
      } catch (error) {
        console.log(`Could not fetch Aptos data for proposal ${proposal._id}:`, error.message);
      }
      
      return proposalObj;
    }));

    res.json({
      success: true,
      data: enhancedProposals
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch proposals",
      error: error.message
    });
  }
});

// POST /api/dao/:id/join - Join a DAO
router.post("/:id/join", async (req, res) => {
  try {
    const { userAddress, transactionHash, stakingAmount } = req.body;
    const dao = await DAO.findById(req.params.id);

    if (!dao) {
      return res.status(404).json({
        success: false,
        message: "DAO not found"
      });
    }

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        message: "User address is required"
      });
    }

    // Verify user account exists on Aptos
    try {
      await aptosService.getAccount(userAddress);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid user address"
      });
    }

    // Check if user already joined
    if (dao.members && dao.members.includes(userAddress)) {
      return res.status(400).json({
        success: false,
        message: "User already member of this DAO"
      });
    }

    // Verify transaction if provided
    if (transactionHash) {
      try {
        const txResult = await aptosService.verifyTransaction(transactionHash);
        if (!txResult.success) {
          return res.status(400).json({
            success: false,
            message: "Transaction verification failed"
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Could not verify transaction"
        });
      }
    }

    // Add user to DAO
    dao.members = dao.members || [];
    dao.members.push(userAddress);
    dao.totalMembers = dao.members.length;
    
    await dao.save();

    res.json({
      success: true,
      message: "Successfully joined DAO",
      data: {
        daoId: dao._id,
        totalMembers: dao.totalMembers
      }
    });
  } catch (error) {
    console.error("Error joining DAO:", error);
    res.status(500).json({
      success: false,
      message: "Failed to join DAO",
      error: error.message
    });
  }
});

// GET /api/dao/:id/members - Get DAO members
router.get("/:id/members", async (req, res) => {
  try {
    const dao = await DAO.findById(req.params.id);

    if (!dao) {
      return res.status(404).json({
        success: false,
        message: "DAO not found"
      });
    }

    // Get member details from Aptos
    const members = [];
    if (dao.members) {
      for (const memberAddress of dao.members) {
        try {
          const accountInfo = await aptosService.getAccount(memberAddress);
          const balance = await aptosService.getAccountBalance(memberAddress);
          const tokenBalance = await aptosService.getGovernanceTokenBalance(
            memberAddress, 
            dao.contractAddress
          );
          
          members.push({
            address: memberAddress,
            accountInfo,
            aptBalance: balance.apt,
            tokenBalance,
            joinedAt: dao.createdAt
          });
        } catch (error) {
          console.log(`Could not fetch info for member ${memberAddress}:`, error.message);
        }
      }
    }

    res.json({
      success: true,
      data: {
        totalMembers: dao.totalMembers,
        members
      }
    });
  } catch (error) {
    console.error("Error fetching DAO members:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch DAO members",
      error: error.message
    });
  }
});

// GET /api/dao/:id/treasury - Get DAO treasury info
router.get("/:id/treasury", async (req, res) => {
  try {
    const dao = await DAO.findById(req.params.id);

    if (!dao) {
      return res.status(404).json({
        success: false,
        message: "DAO not found"
      });
    }

    // Get treasury balance from Aptos
    let treasuryBalance = dao.treasury || 0;
    if (dao.contractAddress) {
      try {
        const balance = await aptosService.getAccountBalance(dao.contractAddress);
        treasuryBalance = balance.apt;
      } catch (error) {
        console.log("Could not fetch treasury balance from contract:", error.message);
      }
    }

    res.json({
      success: true,
      data: {
        treasury: treasuryBalance,
        contractAddress: dao.contractAddress,
        governanceToken: dao.governanceToken || dao.tokenSymbol
      }
    });
  } catch (error) {
    console.error("Error fetching DAO treasury:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch DAO treasury",
      error: error.message
    });
  }
});

// GET /api/dao/:id/token - Get DAO token information
router.get("/:id/token", async (req, res) => {
  try {
    const dao = await DAO.findById(req.params.id);

    if (!dao) {
      return res.status(404).json({
        success: false,
        message: "DAO not found"
      });
    }

    const tokenInfo = {
      hasToken: !!dao.tokenAddress,
      tokenName: dao.tokenName,
      tokenSymbol: dao.tokenSymbol,
      tokenAddress: dao.tokenAddress,
      tokenSupply: dao.tokenSupply,
      creationHash: dao.tokenCreationHash
    };

    // Get token balance for creator if token exists
    if (dao.tokenAddress && dao.creator) {
      try {
        const creatorBalance = await aptosService.getTokenBalance(dao.creator, dao.tokenAddress);
        tokenInfo.creatorBalance = creatorBalance;
      } catch (error) {
        console.log("Could not fetch creator token balance:", error.message);
      }
    }

    res.json({
      success: true,
      data: tokenInfo
    });
  } catch (error) {
    console.error("Error fetching DAO token info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch DAO token info",
      error: error.message
    });
  }
});

// POST /api/dao/:id/create-token-with-wallet - Create token with wallet signing
router.post("/:id/create-token-with-wallet", async (req, res) => {
  try {
    const dao = await DAO.findById(req.params.id);

    if (!dao) {
      return res.status(404).json({
        success: false,
        message: "DAO not found"
      });
    }

    if (dao.tokenAddress) {
      return res.status(400).json({
        success: false,
        message: "DAO already has a governance token"
      });
    }

    const { signedTransaction, transactionHash } = req.body;

    if (signedTransaction && transactionHash) {
      // Process the signed transaction
      console.log('Processing wallet-signed token creation...');
      
      try {
        const result = await aptosService.processSignedTokenTransaction(signedTransaction);
        
        if (result.success) {
          // Update DAO with token information
          const tokenAddress = `${dao.creator}::${dao.tokenSymbol?.toLowerCase()}::${dao.tokenSymbol?.toUpperCase()}`;
          dao.tokenAddress = tokenAddress;
          dao.tokenCreationHash = result.transactionHash;
          await dao.save();

          res.json({
            success: true,
            message: "Governance token created successfully with wallet",
            data: {
              tokenAddress,
              transactionHash: result.transactionHash,
              executedTransaction: result.executedTransaction
            }
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Failed to process signed transaction",
            error: result.error
          });
        }
      } catch (error) {
        console.error('Error processing signed transaction:', error);
        res.status(500).json({
          success: false,
          message: "Failed to process signed transaction",
          error: error.message
        });
      }
    } else {
      // Generate transaction for wallet to sign
      console.log('Generating token creation transaction for wallet signing...');
      
      try {
        const transactionResult = await aptosService.generateTokenCreationTransaction(dao.creator, {
          name: dao.tokenName,
          symbol: dao.tokenSymbol,
          description: `Governance token for ${dao.name} DAO`,
          decimals: 8,
          totalSupply: dao.tokenSupply || 1000000,
          projectUri: dao.githubRepo || ''
        });

        if (transactionResult.success) {
          // Also generate distribution transactions
          const distributionResult = await aptosService.generateTokenDistributionTransactions(
            dao.creator, 
            transactionResult.tokenType, 
            {
              totalSupply: dao.tokenSupply || 1000000,
              addresses: [
                "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c",
                "0xd89d2d8c8c3848dbeeaab302e005e16728363a463f63e7b45cc331c655e6991a",
                "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c"
              ]
            }
          );

          res.json({
            success: true,
            message: "Token creation and distribution transactions generated for wallet signing",
            data: {
              tokenCreation: {
                transaction: transactionResult.transaction,
                transactionPayload: transactionResult.transactionPayload,
                tokenType: transactionResult.tokenType,
                note: transactionResult.note
              },
              distribution: distributionResult,
              requiresWalletSigning: true,
              totalSteps: distributionResult.success ? distributionResult.transactions.length + 1 : 1
            }
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Failed to generate transaction",
            error: transactionResult.error
          });
        }
      } catch (error) {
        console.error('Error generating transaction:', error);
        res.status(500).json({
          success: false,
          message: "Failed to generate transaction",
          error: error.message
        });
      }
    }
  } catch (error) {
    console.error("Error in create-token-with-wallet endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create governance token",
      error: error.message
    });
  }
});

// POST /api/dao/:id/create-token - Create token for existing DAO
router.post("/:id/create-token", async (req, res) => {
  try {
    const dao = await DAO.findById(req.params.id);

    if (!dao) {
      return res.status(404).json({
        success: false,
        message: "DAO not found"
      });
    }

    if (dao.tokenAddress) {
      return res.status(400).json({
        success: false,
        message: "DAO already has a governance token"
      });
    }

    if (!dao.tokenName || !dao.tokenSymbol) {
      return res.status(400).json({
        success: false,
        message: "Token name and symbol are required"
      });
    }

    console.log('Creating governance token for existing DAO...');
    
    try {
      const tokenCreationResult = await aptosService.createGovernanceToken(dao.creator, {
        name: dao.tokenName,
        symbol: dao.tokenSymbol,
        description: `Governance token for ${dao.name} DAO`,
        decimals: 8,
        totalSupply: dao.tokenSupply || 1000000,
        iconUri: '',
        projectUri: dao.githubRepo || ''
      });

      if (tokenCreationResult.success) {
        // Update DAO with token information
        dao.tokenAddress = tokenCreationResult.tokenAddress;
        dao.tokenCreationHash = tokenCreationResult.transactionHash;
        await dao.save();

        // Mint initial tokens to creator
        const initialMintAmount = Math.floor((dao.tokenSupply || 1000000) * 0.1); // 10% to creator
        const mintResult = await aptosService.mintGovernanceTokens(
          dao.creator,
          tokenCreationResult.tokenAddress,
          dao.creator,
          initialMintAmount
        );

        res.json({
          success: true,
          message: "Governance token created successfully",
          data: {
            ...tokenCreationResult,
            initialMint: mintResult
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to create governance token",
          error: tokenCreationResult.error
        });
      }
    } catch (error) {
      console.error('Error creating governance token:', error);
      res.status(500).json({
        success: false,
        message: "Failed to create governance token",
        error: error.message
      });
    }
  } catch (error) {
    console.error("Error in create-token endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create governance token",
      error: error.message
    });
  }
});

// GET /api/dao/network/info - Get Aptos network info
router.get("/network/info", async (req, res) => {
  try {
    const networkInfo = await aptosService.getNetworkInfo();
    res.json({
      success: true,
      data: networkInfo
    });
  } catch (error) {
    console.error("Error fetching network info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch network info",
      error: error.message
    });
  }
});

module.exports = router;
