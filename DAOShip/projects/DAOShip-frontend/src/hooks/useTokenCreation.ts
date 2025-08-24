import { useState, useCallback } from 'react';
import { 
  tokenIntegrationService, 
  TokenCreationParams, 
  TokenCreationResult 
} from '../services/tokenIntegrationService';
import { ProgressStep } from '../components/token-creation-progress';

export interface UseTokenCreationReturn {
  // State
  isCreating: boolean;
  steps: ProgressStep[];
  result: TokenCreationResult | null;
  error: string | null;
  
  // Wallet connection
  isWalletModalOpen: boolean;
  connectedAddress: string | null;
  requiredAddress: string;
  
  // Actions
  createToken: (params: TokenCreationParams) => Promise<void>;
  connectWallet: () => Promise<void>;
  closeWalletModal: () => void;
  reset: () => void;
}

/**
 * React hook for managing token creation workflow
 */
export const useTokenCreation = (): UseTokenCreationReturn => {
  const [isCreating, setIsCreating] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [result, setResult] = useState<TokenCreationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const requiredAddress = tokenIntegrationService.getRequiredCreatorAddress();

  /**
   * Connect wallet and validate it's the correct address
   */
  const connectWallet = useCallback(async () => {
    try {
      const validation = await tokenIntegrationService.validateWalletConnection();
      
      if (validation.isValid && validation.connectedAddress) {
        setConnectedAddress(validation.connectedAddress);
        setIsWalletModalOpen(false);
        setError(null);
      } else {
        setConnectedAddress(validation.connectedAddress || null);
        setError(validation.error || 'Wallet connection failed');
        
        // Show modal if wallet is not connected or wrong address
        setIsWalletModalOpen(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown wallet error';
      setError(errorMessage);
      setIsWalletModalOpen(true);
    }
  }, []);

  /**
   * Create token and distribute to fixed wallets
   */
  const createToken = useCallback(async (params: TokenCreationParams) => {
    try {
      setIsCreating(true);
      setError(null);
      setResult(null);
      
      // Initialize steps
      const initialSteps = tokenIntegrationService.createInitialSteps();
      setSteps([...initialSteps]);

      // Execute the token creation workflow
      const tokenResult = await tokenIntegrationService.createAndDistributeToken(
        params,
        (updatedSteps) => {
          setSteps([...updatedSteps]);
        }
      );

      if (tokenResult.success) {
        setResult(tokenResult);
        setError(null);
      } else {
        setError(tokenResult.error || 'Token creation failed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Update current step to error status
      setSteps(currentSteps => {
        const loadingStep = currentSteps.find(step => step.status === 'loading');
        if (loadingStep) {
          return tokenIntegrationService.updateStep(
            currentSteps, 
            loadingStep.id, 
            { status: 'error', errorMessage }
          );
        }
        return currentSteps;
      });
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Close wallet connection modal
   */
  const closeWalletModal = useCallback(() => {
    setIsWalletModalOpen(false);
  }, []);

  /**
   * Reset all state to initial values
   */
  const reset = useCallback(() => {
    setIsCreating(false);
    setSteps([]);
    setResult(null);
    setError(null);
    setIsWalletModalOpen(false);
    setConnectedAddress(null);
  }, []);

  return {
    // State
    isCreating,
    steps,
    result,
    error,
    
    // Wallet connection
    isWalletModalOpen,
    connectedAddress,
    requiredAddress,
    
    // Actions
    createToken,
    connectWallet,
    closeWalletModal,
    reset
  };
};

/**
 * Hook for token creation status and utilities
 */
export const useTokenCreationStatus = () => {
  const getDistributionSummary = useCallback((totalSupply: number) => {
    return tokenIntegrationService.calculateDistribution(totalSupply);
  }, []);

  const getFixedWallets = useCallback(() => {
    return tokenIntegrationService.getFixedWallets();
  }, []);

  const isRequiredCreatorAddress = useCallback((address: string) => {
    return tokenIntegrationService.isRequiredCreatorAddress(address);
  }, []);

  const getRequiredCreatorAddress = useCallback(() => {
    return tokenIntegrationService.getRequiredCreatorAddress();
  }, []);

  return {
    getDistributionSummary,
    getFixedWallets,
    isRequiredCreatorAddress,
    getRequiredCreatorAddress
  };
};
