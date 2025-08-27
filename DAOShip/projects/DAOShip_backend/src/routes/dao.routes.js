const express = require("express");
const router = express.Router();
const DAO = require("../models/DAO");
const Proposal = require("../models/Proposal");
const { deployDAOContract } = require("../services/algorand.service");
const { createAndDistributeToken } = require("../services/aptos.token.service");

// Create a new DAO
// router.post("/", async (req, res) => {
//   try {
//     const { name, description, creator, votingPeriod, quorum } = req.body;

//     // Deploy DAO contract using AlgoKit
//     const contractAddress = await deployDAOContract({
//       name,
//       votingPeriod,
//       quorum,
//     });
//     // const contractAddress = "dummy-algo-address";

//     console.log("Received DAO create request with:", req.body);


//     const dao = new DAO({
//       name,
//       description,
//       creator,
//       contractAddress,
//       votingPeriod,
//       quorum,
//       members: [creator],
//     });

//     await dao.save();
//     res.status(201).json(dao);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });


router.post("/", async (req, res) => {
  try {
    const { 
      name, 
      description, 
      manager, // Changed from 'creator' to 'manager'
      votePrice,
      tokenName,
      tokenSymbol,
      tokenSupply,
      tokenDecimals = 8,
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
      invitedCollaborators
    } = req.body;

    console.log("Creating DAO with Aptos token integration...", {
      name,
      description,
      manager,
      tokenName,
      tokenSymbol,
      tokenSupply,
      tokenDecimals
    });

    // Step 1: Deploy DAO contract (keeping existing logic for now)
    const contractAddress = await deployDAOContract({
      name,
      votingPeriod,
      quorum,
      votePrice,
      tokenName,
      tokenSymbol,
      tokenSupply,
      minTokens
    });

    console.log("✅ DAO contract deployed:", contractAddress);

    // Step 2: Create and distribute governance token on Aptos
    let tokenResult = null;
    let tokenCreationError = null;

    try {
      console.log("🪙 Creating governance token on Aptos...");
      
      const tokenConfig = {
        name: tokenName,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        initialSupply: tokenSupply,
        description: `Governance token for ${name} DAO`,
        iconUri: "", // Could be enhanced with logo upload
        projectUri: githubRepo || ""
      };

      tokenResult = await createAndDistributeToken(tokenConfig);
      console.log("✅ Token created and distributed successfully:", tokenResult);

    } catch (error) {
      console.error("❌ Token creation failed:", error);
      tokenCreationError = error.message;
      
      // Don't fail the entire DAO creation if token creation fails
      // This allows for manual token creation later
      console.log("⚠️  Continuing DAO creation without token...");
    }

    // Step 3: Create DAO record in database
    const dao = new DAO({
      name,
      description,
      creator: manager, // Map manager to creator if your DAO model uses 'creator'
      manager, // Add manager field if your model supports it
      contractAddress,
      votePrice,
      tokenName,
      tokenSymbol,
      tokenSupply,
      tokenDecimals,
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
      members: [manager], // Initialize with manager as first member
      
      // Aptos token fields
      governanceTokenAddress: tokenResult?.tokenAddress || null,
      tokenCreationHash: tokenResult?.transactionHash || null,
      tokenDistributionHashes: tokenResult?.distribution?.distributionResults?.map(r => r.transactionHash) || [],
      tokenDistributionStatus: tokenResult ? 
        (tokenResult.distribution?.successfulDistributions === 4 ? 'completed' : 'partial') : 
        'failed'
    });

    await dao.save();

    // Prepare response
    const response = {
      ...dao.toObject(),
      tokenCreation: tokenResult ? {
        success: true,
        tokenAddress: tokenResult.tokenAddress,
        transactionHash: tokenResult.transactionHash,
        distributionSummary: {
          totalDistributed: tokenResult.distribution.totalDistributed,
          successfulDistributions: tokenResult.distribution.successfulDistributions,
          failedDistributions: tokenResult.distribution.failedDistributions.length
        }
      } : {
        success: false,
        error: tokenCreationError,
        message: "DAO created successfully, but token creation failed. You can create tokens manually later."
      }
    };

    console.log("🎉 DAO creation completed!");
    res.status(201).json(response);

  } catch (error) {
    console.error("❌ Error creating DAO:", error);
    res.status(500).json({ 
      message: error.message,
      details: "DAO creation failed"
    });
  }
});

// Get all DAOs
router.get("/", async (req, res) => {
  try {
    const daos = await DAO.find().populate("creator", "username walletAddress");
    res.json(daos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific DAO
router.get("/:id", async (req, res) => {
  console.log("Fetching DAO with ID:", req.params.id);
  try {
    const dao = await DAO.findById(req.params.id)
      .populate("creator", "username walletAddress")
      .populate("members", "username walletAddress");
    if (!dao) {
      return res.status(404).json({ message: "DAO not found" });
    }
    res.json(dao);
    console.log("Fetched DAO:", dao);
  } catch (error) {
    console.error("Error fetching DAO:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add the new route that matches the frontend API call pattern
router.post("/:daoId/proposals", async (req, res) => {
  try {
    const { daoId } = req.params;
    const { title, description, creator, startTime, endTime } = req.body;

    // Create proposal on Algorand
    // const proposalId = await createProposal({
    //   dao: daoId,
    //   title,
    //   description,
    //   startTime,
    //   endTime,
    // });

    // Option 1: Generate a temporary proposalId (until Algorand implementation is ready)
    const proposalId = `proposal-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    const proposal = new Proposal({
      title,
      description,
      dao: daoId,
      creator,
      startTime,
      endTime,
      proposalId,
    });

    await proposal.save();
    res.status(201).json(proposal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// In your dao.routes.js

// Get all proposals for a specific DAO
router.get("/:id/proposals", async (req, res) => {
  console.log("Fetching proposals for DAO ID:", req.params.id);
  try {
    const daoId = req.params.id;
    console.log(`Fetching proposals for DAO ID: ${daoId}`); 
    const proposals = await Proposal.find({ dao: daoId })
      .populate("creator", "username walletAddress")
      .sort({ createdAt: -1 });

    if (!proposals) {
      return res.status(404).json({ message: "No proposals found for this DAO" });
    }

    res.json(proposals);
  } catch (error) {
    console.error("Error fetching proposals:", error);
    res.status(500).json({ message: error.message });
  }
});


// Join a DAO
router.post("/:id/join", async (req, res) => {
  try {
    const { userId } = req.body;
    const dao = await DAO.findById(req.params.id);

    if (!dao) {
      return res.status(404).json({ message: "DAO not found" });
    }

    if (dao.members.includes(userId)) {
      return res.status(400).json({ message: "Already a member" });
    }

    dao.members.push(userId);
    await dao.save();
    res.json(dao);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get token information for a DAO
router.get("/:id/token", async (req, res) => {
  try {
    const dao = await DAO.findById(req.params.id);
    if (!dao) {
      return res.status(404).json({ message: "DAO not found" });
    }

    if (!dao.governanceTokenAddress) {
      return res.status(404).json({ 
        message: "No governance token found for this DAO",
        hasToken: false
      });
    }

    const { getTokenMetadata, verifyTokenDistribution } = require("../services/aptos.token.service");

    try {
      const [metadata, distributionVerification] = await Promise.all([
        getTokenMetadata(dao.governanceTokenAddress),
        verifyTokenDistribution(dao.governanceTokenAddress)
      ]);

      res.json({
        hasToken: true,
        tokenAddress: dao.governanceTokenAddress,
        metadata,
        distributionVerification,
        creationHash: dao.tokenCreationHash,
        distributionHashes: dao.tokenDistributionHashes,
        distributionStatus: dao.tokenDistributionStatus
      });

    } catch (error) {
      res.json({
        hasToken: true,
        tokenAddress: dao.governanceTokenAddress,
        error: "Could not fetch token details",
        creationHash: dao.tokenCreationHash,
        distributionHashes: dao.tokenDistributionHashes,
        distributionStatus: dao.tokenDistributionStatus
      });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manually create token for existing DAO (if token creation failed during DAO creation)
router.post("/:id/create-token", async (req, res) => {
  try {
    const dao = await DAO.findById(req.params.id);
    if (!dao) {
      return res.status(404).json({ message: "DAO not found" });
    }

    if (dao.governanceTokenAddress) {
      return res.status(400).json({ 
        message: "DAO already has a governance token",
        tokenAddress: dao.governanceTokenAddress
      });
    }

    const { createAndDistributeToken } = require("../services/aptos.token.service");

    const tokenConfig = {
      name: dao.tokenName,
      symbol: dao.tokenSymbol,
      decimals: dao.tokenDecimals || 8,
      initialSupply: dao.tokenSupply,
      description: `Governance token for ${dao.name} DAO`,
      iconUri: "",
      projectUri: dao.githubRepo || ""
    };

    const tokenResult = await createAndDistributeToken(tokenConfig);

    // Update DAO with token information
    dao.governanceTokenAddress = tokenResult.tokenAddress;
    dao.tokenCreationHash = tokenResult.transactionHash;
    dao.tokenDistributionHashes = tokenResult.distribution.distributionResults.map(r => r.transactionHash);
    dao.tokenDistributionStatus = tokenResult.distribution.successfulDistributions === 4 ? 'completed' : 'partial';
    
    await dao.save();

    res.json({
      success: true,
      tokenAddress: tokenResult.tokenAddress,
      transactionHash: tokenResult.transactionHash,
      distributionSummary: {
        totalDistributed: tokenResult.distribution.totalDistributed,
        successfulDistributions: tokenResult.distribution.successfulDistributions,
        failedDistributions: tokenResult.distribution.failedDistributions.length
      }
    });

  } catch (error) {
    console.error("Error creating token manually:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
