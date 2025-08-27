const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema({
  title: {
    type: String,
    // required: true,
  },
  description: {
    type: String,
    // required: true,
  },
  proposalId: {
    type: String,
    // required: true,
  },
  dao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DAO",
    // required: true,
  },
  creator: {
    type: String,
    ref: "User",
    // required: true,
  },
  status: {
    type: String,
    enum: ["active", "passed", "failed", "executed"],
    default: "active",
  },
  startTime: {
    type: Date,
    // required: true,
  },
  endTime: {
    type: Date,
    // required: true,
  },
  votes: [
    {
      voter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      vote: {
        type: String,
        enum: ["yes", "no", "abstain"],
      },
      votingPower: Number,
      signature: String, // Wallet signature for the vote
      signedMessage: String, // The signed message content
      transactionHash: String, // Blockchain transaction hash
    },
  ],
  yesVotes: {
    type: Number,
    default: 0,
  },
  noVotes: {
    type: Number,
    default: 0,
  },
  abstainVotes: {
    type: Number,
    default: 0,
  },
  // Wallet signature fields for proposal creation
  signature: {
    type: String,
    // Wallet signature from proposal creator
  },
  signedMessage: {
    type: String,
    // The message that was signed by the wallet
  },
  transactionHash: {
    type: String,
    // Blockchain transaction hash for proposal creation
  },
  // Execution fields
  executed: {
    type: Boolean,
    default: false,
  },
  executedAt: {
    type: Date,
  },
  executor: {
    type: String,
  },
  executionTransactionHash: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Proposal", proposalSchema);
