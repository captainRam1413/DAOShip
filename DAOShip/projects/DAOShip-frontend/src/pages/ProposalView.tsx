import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  CircleDashed,
  Send,
  AlertCircle,
} from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import GlassmorphicCard from "@/components/ui/glassmorphic-card";
import GradientButton from "@/components/ui/gradient-button";
import {
  getProposal,
  voteOnProposal,
  checkUserVote,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const ProposalView = () => {
  const { daoId, proposalId } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [userVote, setUserVote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");
  const [currentUserId] = useState("507f1f77bcf86cd799439011"); // In a real app, this would come from auth
  const { toast } = useToast();

  useEffect(() => {
    if (daoId && proposalId) {
      fetchProposalData();
    }
  }, [daoId, proposalId]);

  useEffect(() => {
    if (proposal && proposal.status === "active") {
      const timer = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [proposal]);

  const fetchProposalData = async () => {
    try {
      const [proposalData, voteStatus] = await Promise.all([
        getProposal(proposalId),
        checkUserVote(proposalId, currentUserId),
        // getProposalComments(daoId, proposalId),
      ]);
      setProposal(proposalData);
      // setComments(commentsData);

      // Set user vote status if they have already voted
      if (voteStatus.hasVoted && voteStatus.vote) {
        setUserVote(voteStatus.vote.vote);
      }

      updateTimeLeft();
    } catch (error) {
      console.error("Error fetching proposal data:", error);
      toast({
        title: "Error",
        description: "Failed to load proposal data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimeLeft = () => {
    if (!proposal || proposal.status !== "active") {
      setTimeLeft("");
      return;
    }

    const endTime = new Date(proposal.endTime);
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeLeft("Voting ended");
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
  };

  const handleVote = async (voteType) => {
    if (userVote) {
      toast({
        title: "Already voted",
        description: "You have already cast your vote on this proposal.",
        variant: "default",
      });
      return;
    }

    try {
      await voteOnProposal(proposalId, { 
        vote: voteType as 'yes' | 'no' | 'abstain', 
        voter: currentUserId, 
        votingPower: 1 
      });
      setUserVote(voteType);

      // Update proposal data to reflect new vote
      const updatedProposal = { ...proposal };
      if (voteType === "yes") updatedProposal.yesVotes++;
      else if (voteType === "no") updatedProposal.noVotes++;
      else if (voteType === "abstain") updatedProposal.abstainVotes++;

      setProposal(updatedProposal);

      toast({
        title: "Vote cast",
        description: `You have successfully voted ${voteType} on this proposal.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error casting vote:", error);
      
      // Handle duplicate vote error specifically
      if (error.message.includes("already voted")) {
        toast({
          title: "Already voted",
          description: "You have already cast your vote on this proposal.",
          variant: "default",
        });
        // Refresh the vote status
        try {
          const voteStatus = await checkUserVote(proposalId, currentUserId);
          if (voteStatus.hasVoted && voteStatus.vote) {
            setUserVote(voteStatus.vote.vote);
          }
        } catch (refreshError) {
          console.error("Error refreshing vote status:", refreshError);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to cast your vote. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      // const comment = await addProposalComment(daoId, proposalId, newComment);
      // setComments((prev) => [...prev, comment]);
      // setNewComment("");

      toast({
        title: "Comment added",
        description: "Your comment has been added to the discussion.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add your comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculatePercentage = (voteCount) => {
    const total = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
    if (total === 0) return 0;
    return (voteCount / total) * 100;
  };

  // Dynamic vote configuration
  const voteTypes = [
    {
      key: 'yes',
      label: 'Yes',
      icon: CheckCircle,
      color: 'green',
      count: proposal?.yesVotes || 0,
      bgColor: 'bg-green-500',
      textColor: 'text-green-400',
      hoverColor: 'hover:bg-green-500/20 hover:text-green-400'
    },
    {
      key: 'no',
      label: 'No', 
      icon: XCircle,
      color: 'red',
      count: proposal?.noVotes || 0,
      bgColor: 'bg-red-500',
      textColor: 'text-red-400',
      hoverColor: 'hover:bg-red-500/20 hover:text-red-400'
    },
    {
      key: 'abstain',
      label: 'Abstain',
      icon: CircleDashed,
      color: 'gray',
      count: proposal?.abstainVotes || 0,
      bgColor: 'bg-gray-500',
      textColor: 'text-gray-400',
      hoverColor: 'hover:bg-gray-500/20 hover:text-gray-400'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <p className="text-white">Loading proposal data...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <GlassmorphicCard className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Proposal Not Found
          </h2>
          <p className="text-daoship-text-gray mb-6">
            We couldn't find the proposal you're looking for.
          </p>
          <Link to={`/dao/${daoId}`}>
            <GradientButton>Return to DAO</GradientButton>
          </Link>
        </GlassmorphicCard>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <Navigation />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate(`/dao/${daoId}`)}
              className="flex items-center text-white hover:text-daoship-primary transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to DAO
            </button>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8"
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                    {proposal.title}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      proposal.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : proposal.status === "passed"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {proposal.status.charAt(0).toUpperCase() +
                      proposal.status.slice(1)}
                  </span>
                </div>
                <div className="mt-2 text-daoship-text-gray">
                  <span>
                    Created by:{" "}
                    {proposal.creator?.username ||
                      proposal.creator?.walletAddress ||
                      "Anonymous"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <GlassmorphicCard className="p-6 mb-6">
                  <h2 className="text-xl font-bold text-white mb-4">
                    Description
                  </h2>
                  <div className="text-daoship-text-gray prose prose-invert max-w-none">
                    <ReactMarkdown>{proposal.description}</ReactMarkdown>
                  </div>
                </GlassmorphicCard>

                {/* Comments Section */}
                <motion.div variants={itemVariants} className="mt-6">
                  <GlassmorphicCard className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4">
                      Discussion
                    </h2>

                    <div className="mb-6">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Share your thoughts on this proposal..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-daoship-primary min-h-24"
                          />
                        </div>
                        <div>
                          <button
                            onClick={handleAddComment}
                            className="bg-gradient-primary hover:opacity-90 transition-opacity rounded-lg p-3 h-full flex items-center justify-center"
                          >
                            <Send className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {comments.length > 0 ? (
                        comments.map((comment) => (
                          <motion.div
                            key={comment._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border-t border-white/10 pt-4"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                  {comment.user?.username
                                    ?.charAt(0)
                                    .toUpperCase() || "?"}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-white font-medium">
                                  {comment.user?.username || "Anonymous"}
                                </h4>
                                <p className="text-daoship-text-gray text-xs">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <p className="text-daoship-text-gray ml-11">
                              {comment.content}
                            </p>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center text-daoship-text-gray py-6">
                          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                          <p>
                            No comments yet. Be the first to share your
                            thoughts!
                          </p>
                        </div>
                      )}
                    </div>
                  </GlassmorphicCard>
                </motion.div>
              </motion.div>

              {/* Sidebar */}
              <motion.div variants={itemVariants} className="space-y-6">
                {/* Voting Status */}
                <GlassmorphicCard className="p-6">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Voting Status
                  </h3>

                  <div className="space-y-6">
                    {/* Timeframe */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-daoship-text-gray">
                          Start Date
                        </span>
                        <span className="text-white">
                          {new Date(proposal.startTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-daoship-text-gray">End Date</span>
                        <span className="text-white">
                          {new Date(proposal.endTime).toLocaleDateString()}
                        </span>
                      </div>

                      {proposal.status === "active" && (
                        <div className="mt-4 bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-daoship-text-gray flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              Time Remaining
                            </span>
                            <motion.span
                              className="text-white font-medium"
                              key={timeLeft}
                              initial={{ opacity: 0.8 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              {timeLeft}
                            </motion.span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dynamic Progress Bars */}
                    <div className="space-y-4">
                      <h4 className="text-white font-medium">Votes</h4>

                      {voteTypes.map((voteType, index) => {
                        const percentage = calculatePercentage(voteType.count);
                        const IconComponent = voteType.icon;
                        
                        return (
                          <div key={voteType.key} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className={`flex items-center ${voteType.textColor}`}>
                                <IconComponent className="h-4 w-4 mr-2" />
                                {voteType.label}
                              </span>
                              <span className="text-white">
                                {voteType.count} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <motion.div
                              className="h-2 bg-white/10 rounded-full overflow-hidden"
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 0.5, delay: 0.3 }}
                            >
                              <motion.div
                                className={`h-full ${voteType.bgColor} rounded-full`}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.8, delay: 0.6 + (index * 0.1) }}
                              />
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quorum Status */}
                    {proposal.quorumRequired && (
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-daoship-text-gray">
                            Quorum Required
                          </span>
                          <span className="text-white">
                            {proposal.quorumRequired}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-daoship-text-gray">
                            Total Votes
                          </span>
                          <span className="text-white">
                            {proposal.yesVotes +
                              proposal.noVotes +
                              proposal.abstainVotes}{" "}
                            / {proposal.totalPossibleVotes || "?"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassmorphicCard>

                {/* Voting Actions */}
                {proposal.status === "active" && (
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <GlassmorphicCard className="p-6">
                      <h3 className="text-lg font-medium text-white mb-4">
                        Cast Your Vote
                      </h3>

                      <div className="space-y-3">
                        {voteTypes.map((voteType) => {
                          const IconComponent = voteType.icon;
                          return (
                            <button
                              key={voteType.key}
                              onClick={() => handleVote(voteType.key)}
                              disabled={userVote !== null}
                              className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                                userVote === voteType.key
                                  ? `${voteType.bgColor} text-white`
                                  : userVote !== null
                                  ? "bg-white/5 text-white/50 cursor-not-allowed"
                                  : `bg-white/10 text-white ${voteType.hoverColor}`
                              }`}
                            >
                              <IconComponent className="h-5 w-5" />
                              Vote {voteType.label}
                            </button>
                          );
                        })}
                      </div>

                      {userVote && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-3 bg-daoship-primary/10 border border-daoship-primary/20 rounded-lg"
                        >
                          <div className="text-center text-sm">
                            <span className="text-daoship-text-gray">
                              You voted: 
                            </span>
                            <span className="text-white font-medium ml-1 capitalize">
                              {userVote}
                            </span>
                          </div>
                          <div className="text-center text-daoship-text-gray text-xs mt-1">
                            Each member can only vote once per proposal.
                          </div>
                        </motion.div>
                      )}
                    </GlassmorphicCard>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProposalView;
