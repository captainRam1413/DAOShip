const express = require("express");
const router = express.Router();
const Proposal = require("../models/Proposal");
const aptosService = require("../services/aptos.service");

// Create a new proposal with wallet signature validation
router.post("/", async (req, res) => {
  try {
    const { 
      title, 
      description, 
      daoId, 
      creator, 
      startTime, 
      endTime, 
      signature, 
      signedMessage 
    } = req.body;

    // Validate required fields
    if (!title || !description || !daoId || !creator) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, description, daoId, or creator"
      });
    }

    // If signature and signedMessage are provided, validate them
    if (signature && signedMessage) {
      try {
        // Parse the signed message
        const messageData = JSON.parse(signedMessage);
        
        // Validate message structure
        if (
          messageData.action !== 'createProposal' ||
          messageData.proposalTitle !== title ||
          messageData.daoId !== daoId ||
          messageData.creator !== creator
        ) {
          return res.status(400).json({
            success: false,
            message: "Signature validation failed: message data doesn't match request"
          });
        }

        // Check if signature is not expired (10 minutes)
        const signatureAge = Date.now() - messageData.timestamp;
        const maxAge = 10 * 60 * 1000; // 10 minutes in milliseconds
        
        if (signatureAge > maxAge) {
          return res.status(400).json({
            success: false,
            message: "Signature has expired. Please try again."
          });
        }

        console.log('✅ Proposal signature validation passed');
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid signature format or message structure"
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Wallet signature is required to create a proposal"
      });
    }

    // Validate creator address format (basic Aptos address validation)
    if (!creator.startsWith('0x') || creator.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Invalid creator address format"
      });
    }

    // Create proposal using Aptos service
    console.log('Creating proposal on Aptos network...');
    const proposalResult = await aptosService.createProposal({
      daoId,
      title,
      description,
      creator,
      startTime,
      endTime,
    });

    // Save proposal to database
    const proposal = new Proposal({
      title,
      description,
      dao: daoId,
      creator,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      proposalId: proposalResult.proposalId,
      transactionHash: proposalResult.transactionHash,
      status: 'active',
      signature, // Store the signature
      signedMessage, // Store the signed message
    });

    await proposal.save();

    console.log('✅ Proposal created successfully:', proposal._id);

    res.status(201).json({
      success: true,
      message: "Proposal created successfully",
      data: proposal
    });

  } catch (error) {
    console.error("❌ Error creating proposal:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create proposal",
      error: error.message
    });
  }
});

// Get all proposals for a DAO
router.get("/dao/:daoId", async (req, res) => {
  try {
    const proposals = await Proposal.find({ dao: req.params.daoId }).sort({
      createdAt: -1,
    });

    // Return proposals with creator as address string
    const processedProposals = proposals.map(proposal => proposal.toObject());

    res.json({
      success: true,
      data: processedProposals
    });
  } catch (error) {
    console.error("Error getting proposals:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get a specific proposal
router.get("/:id", async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate("dao", "name contractAddress");
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found"
      });
    }

    res.json({
      success: true,
      data: proposal
    });
  } catch (error) {
    console.error("Error getting proposal:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Check if a user has voted on a proposal
router.get("/:id/vote/:voterId", async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found"
      });
    }

    const existingVote = proposal.votes.find(v => v.voter.toString() === req.params.voterId.toString());
    
    res.json({
      success: true,
      data: {
        hasVoted: !!existingVote,
        vote: existingVote ? {
          vote: existingVote.vote,
          votingPower: existingVote.votingPower,
          timestamp: existingVote._id ? existingVote._id.getTimestamp() : null
        } : null
      }
    });
  } catch (error) {
    console.error("Error checking vote:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get proposal votes
router.get("/:id/votes", async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found"
      });
    }

    const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
    
    res.json({
      success: true,
      data: {
        proposalId: proposal._id,
        totalVotes,
        votesFor: proposal.yesVotes,
        votesAgainst: proposal.noVotes,
        quorumReached: false, // Calculate based on DAO quorum
        votes: proposal.votes
      }
    });
  } catch (error) {
    console.error("Error getting proposal votes:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Vote on a proposal with signature validation
router.post("/:id/vote", async (req, res) => {
  try {
    const { voter, vote, votingPower, signature, signedMessage } = req.body;
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found"
      });
    }

    if (proposal.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Proposal is not active"
      });
    }

    // Validate signature for voting (optional for now, but recommended)
    if (signature && signedMessage) {
      try {
        const messageData = JSON.parse(signedMessage);
        
        if (
          messageData.action !== 'voteOnProposal' ||
          messageData.proposalId !== req.params.id ||
          messageData.voter !== voter ||
          messageData.vote !== vote
        ) {
          return res.status(400).json({
            success: false,
            message: "Vote signature validation failed"
          });
        }

        // Check signature expiry
        const signatureAge = Date.now() - messageData.timestamp;
        const maxAge = 10 * 60 * 1000; // 10 minutes
        
        if (signatureAge > maxAge) {
          return res.status(400).json({
            success: false,
            message: "Vote signature has expired"
          });
        }
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid vote signature format"
        });
      }
    }

    // Check if the voter has already voted
    const existingVote = proposal.votes.find(v => v.voter.toString() === voter.toString());
    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: "You have already voted on this proposal",
        data: {
          existingVote: {
            vote: existingVote.vote,
            votingPower: existingVote.votingPower
          }
        }
      });
    }

    // Record vote using Aptos service
    const voteResult = await aptosService.voteOnProposal({
      proposalId: proposal.proposalId,
      voter,
      vote,
      votingPower,
    });

    // Update vote counts
    proposal.votes.push({ 
      voter, 
      vote, 
      votingPower,
      signature,
      signedMessage,
      transactionHash: voteResult.transactionHash
    });
    
    proposal[`${vote}Votes`] += votingPower;

    // Check if proposal has ended
    if (new Date() > proposal.endTime) {
      const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
      const dao = await require("../models/DAO").findById(proposal.dao);
      
      if (dao && totalVotes >= (dao.quorum || 0)) {
        proposal.status = proposal.yesVotes > proposal.noVotes ? "passed" : "failed";
      }
    }

    await proposal.save();

    res.json({
      success: true,
      message: "Vote recorded successfully",
      data: proposal
    });
  } catch (error) {
    console.error("Error voting on proposal:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Execute proposal
router.put("/:id/execute", async (req, res) => {
  try {
    const { executor, transactionHash } = req.body;
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found"
      });
    }

    if (proposal.status !== "passed") {
      return res.status(400).json({
        success: false,
        message: "Only passed proposals can be executed"
      });
    }

    // Execute proposal using Aptos service
    const executionResult = await aptosService.executeProposal({
      proposalId: proposal.proposalId,
      executor,
    });

    // Update proposal status
    proposal.executed = true;
    proposal.executedAt = new Date();
    proposal.executor = executor;
    proposal.executionTransactionHash = transactionHash || executionResult.transactionHash;
    
    await proposal.save();

    res.json({
      success: true,
      message: "Proposal executed successfully",
      data: proposal
    });
  } catch (error) {
    console.error("Error executing proposal:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
