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
      transactionHash // Aptos transaction hash
    } = req.body;

    console.log("Creating DAO with parameters:", {
      name,
      description,
      manager,
      votePrice
    });

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

    // Create DAO in MongoDB
    const dao = new DAO({
      name,
      description,
      creator: manager,
      manager,
      contractAddress: aptosService.CONTRACT_ADDRESS,
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
      transactionHash,
      // Aptos specific fields
      governanceToken: tokenSymbol || `${name.replace(/\s+/g, '').toUpperCase()}_TOKEN`,
      minStakeAmount: votePrice || 100,
      quorumPercentage: quorum || 20,
      treasury: 0,
      totalMembers: 1,
      totalProposals: 0,
      status: 'active'
    });

    await dao.save();
    
    res.status(201).json({
      success: true,
      message: "DAO created successfully",
      data: dao
    });
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
