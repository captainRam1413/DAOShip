const express = require("express");
const router = express.Router();
const Proposal = require("../models/Proposal");
const {
  createProposal,
  voteOnProposal,
} = require("../services/algorand.service");

// Create a new proposal
router.post("/", async (req, res) => {
  try {
    const { title, description, dao, creator, startTime, endTime } = req.body;

    // Create proposal on Algorand
    const proposalId = await createProposal({
      dao,
      title,
      description,
      startTime,
      endTime,
    });

    const proposal = new Proposal({
      title,
      description,
      dao,
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



// Get all proposals for a DAO
router.get("/dao/:daoId", async (req, res) => {
  try {
    // First, find the proposals without population
    const proposals = await Proposal.find({ dao: req.params.daoId }).sort({
      createdAt: -1,
    });

    // Since we're using Aptos addresses as creators (not ObjectIds), we don't populate creator
    // Just return the proposals with creator as address string
    const processedProposals = proposals.map(proposal => proposal.toObject());

    res.json(processedProposals);
  } catch (error) {
    console.log("error in getProposals", error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific proposal
router.get("/:id", async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate("dao", "name contractAddress");
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if a user has voted on a proposal
router.get("/:id/vote/:voterId", async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    const existingVote = proposal.votes.find(v => v.voter.toString() === req.params.voterId.toString());
    
    res.json({
      hasVoted: !!existingVote,
      vote: existingVote ? {
        vote: existingVote.vote,
        votingPower: existingVote.votingPower,
        timestamp: existingVote._id ? existingVote._id.getTimestamp() : null
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Vote on a proposal
router.post("/:id/vote", async (req, res) => {
  try {
    const { voter, vote, votingPower } = req.body;
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    if (proposal.status !== "active") {
      return res.status(400).json({ message: "Proposal is not active" });
    }

    // Check if the voter has already voted
    const existingVote = proposal.votes.find(v => v.voter.toString() === voter.toString());
    if (existingVote) {
      return res.status(400).json({ 
        message: "You have already voted on this proposal",
        existingVote: {
          vote: existingVote.vote,
          votingPower: existingVote.votingPower
        }
      });
    }

    // Record vote on Algorand
    await voteOnProposal({
      proposalId: proposal.proposalId,
      voter,
      vote,
      votingPower,
    });

    // Update vote counts
    proposal.votes.push({ voter, vote, votingPower });
    proposal[`${vote}Votes`] += votingPower;

    // Check if proposal has ended
    if (new Date() > proposal.endTime) {
      const totalVotes =
        proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
      if (totalVotes >= proposal.dao.quorum) {
        proposal.status =
          proposal.yesVotes > proposal.noVotes ? "passed" : "failed";
      }
    }

    await proposal.save();
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
