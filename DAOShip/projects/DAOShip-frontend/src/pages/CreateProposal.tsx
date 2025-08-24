import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import GlassmorphicCard from "@/components/ui/glassmorphic-card";
import GlassmorphicInput from "@/components/ui/glassmorphic-input";
import GlassmorphicTextarea from "@/components/ui/glassmorphic-textarea";
import GlassmorphicSlider from "@/components/ui/glassmorphic-slider";
import GradientButton from "@/components/ui/gradient-button";
import { useToast } from "@/hooks/use-toast";
import { get } from "http";
import { getDAO } from "@/lib/api";
import { createProposal, createProposalWithWallet } from "@/lib/api";
import { useWallet } from "@/hooks/use-wallet";

const CreateProposal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected, walletAddress, connect } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dao, setDao] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    votingPeriod: 7,
  });

  // Fetch DAO data from the API
  useEffect(() => {
    const fetchDAO = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        console.log("Fetching DAO with ID:", id);

        // Use the exact endpoint from the backend router
        const daoData = await Promise.all([
          getDAO(id)
        ])

        setDao(daoData);
        setFormData((prevState) => ({
          ...prevState,
          votingPeriod: 7,
        }));
      } catch (error) {
        console.error("Error fetching DAO:", error);
        toast({
          title: "Error",
          description: "Could not load DAO information. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDAO();
  }, [id, toast]);

  // Handle changes into text input here
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Calculate proposal start and end times based on voting period
  const calculateProposalTimes = (votingPeriodDays) => {
    const startTime = new Date();
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + votingPeriodDays);
    return { startTime, endTime };
  };

  // Handle form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!dao) {
    toast({
      title: "Error",
      description: "DAO information not loaded. Please try again.",
      variant: "destructive",
    });
    return;
  }

  // Check if wallet is connected
  if (!isConnected) {
    toast({
      title: "Wallet Not Connected",
      description: "Please connect your wallet to create a proposal",
      variant: "destructive",
    });
    return;
  }

  // Check if we have a valid wallet address
  if (!walletAddress || walletAddress.trim() === "") {
    toast({
      title: "Invalid Wallet Address",
      description: "Please reconnect your wallet and try again",
      variant: "destructive",
    });
    return;
  }

  setIsSubmitting(true);

  try {
    console.log("Creating proposal for DAO:", id);
    console.log("Wallet address:", walletAddress);
    console.log("Is connected:", isConnected);

    const { startTime, endTime } = calculateProposalTimes(
      formData.votingPeriod
    );

    // Prepare proposal data according to backend requirements
    const proposalData = {
      title: formData.title,
      description: formData.description,
      daoId: id, // DAO ID from URL param
      creator: walletAddress, // Use actual wallet address
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };

    console.log("Submitting proposal data:", proposalData);

    // Show toast for wallet signing request
    toast({
      title: "Wallet Signature Required",
      description: "Please sign the transaction in your wallet to create the proposal",
    });

    // Use wallet-integrated proposal creation
    const createdProposal = await createProposalWithWallet(proposalData, walletAddress);

    console.log("Proposal has been created successfully!!", createdProposal);

    toast({
      title: "Success",
      description: "Your proposal has been submitted to the DAO. Transaction signed and submitted.",
    });

    // Navigate back to the DAO dashboard
    navigate(`/dao/${id}`);
  } catch (error: any) {
    console.error("Error creating proposal:", error);
    
    let errorMessage = error.message || "Failed to create proposal. Please try again.";
    let errorTitle = "Error";
    
    if (error.message?.includes('cancelled') || error.message?.includes('rejected')) {
      errorTitle = "Transaction Cancelled";
      errorMessage = "Proposal creation was cancelled. You can try again anytime.";
    } else if (error.message?.includes('Wallet not connected')) {
      errorTitle = "Wallet Error";
      errorMessage = "Please reconnect your wallet and try again.";
    }
    
    toast({
      title: errorTitle,
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <GlassmorphicCard className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Loading DAO...</h2>
          <p className="text-daoship-text-gray mb-6">
            Please wait while we fetch the DAO information.
          </p>
        </GlassmorphicCard>
      </div>
    );
  }

  if (!dao) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <GlassmorphicCard className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">DAO Not Found</h2>
          <p className="text-daoship-text-gray mb-6">
            We couldn't find the DAO you're looking for.
          </p>
          <GradientButton onClick={() => navigate("/")}>
            Return Home
          </GradientButton>
        </GlassmorphicCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <Navigation />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            Create Proposal
          </h1>
          <p className="text-daoship-text-gray mb-10">
            For {dao.name} {dao.tokenSymbol ? `(${dao.tokenSymbol})` : ""}
          </p>

          <GlassmorphicCard className="p-8" glowEffect>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <GlassmorphicInput
                  label="Proposal Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Give your proposal a clear, descriptive title"
                  required
                />

                <GlassmorphicTextarea
                  label="Proposal Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your proposal in detail, including its purpose, implementation plan, and expected outcomes..."
                  className="min-h-[200px]"
                  required
                />

                <GlassmorphicSlider
                  label="Voting Period"
                  min={1}
                  max={dao.votingPeriod || 30}
                  value={formData.votingPeriod}
                  onChange={(value) =>
                    setFormData({ ...formData, votingPeriod: value })
                  }
                  unit=" days"
                />

                <div className="p-4 glass-card rounded-lg mt-2">
                  <p className="text-sm text-daoship-text-gray">
                    <span className="text-daoship-blue font-medium">Note:</span>{" "}
                    Proposals require a minimum quorum of {dao.quorum || 0}% to
                    be valid. The maximum voting period for this DAO is{" "}
                    {dao.votingPeriod || 30} days.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <GradientButton
                    type="submit"
                    disabled={isSubmitting}
                    variant="primary"
                    glowEffect
                  >
                    {isSubmitting ? "Submitting..." : "Submit Proposal"}
                  </GradientButton>
                </div>
              </div>
            </form>
          </GlassmorphicCard>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateProposal;
