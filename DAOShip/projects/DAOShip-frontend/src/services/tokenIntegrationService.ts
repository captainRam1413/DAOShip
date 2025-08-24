import { 
  connectWallet,
  ensureTestnetFunding,
  createToken,
  ensureAssetRegistration,
  distributeTokens,
  REQUIRED_CREATOR_ADDRESS,
  DISTRIBUTION_WALLETS
} from '../blockchain/aptosService';
import { ProgressStep } from '../components/token-creation-progress';

export interface TokenCreationParams {
  daoName: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDescription: string;
  initialSupply: number;
  iconUrl?: string;
  projectUrl?: string;
}

export interface TokenCreationResult {
  success: boolean;
  tokenAddress?: string;
  distributionTxHashes?: string[];
  error?: string;
}

class TokenIntegrationService {
  private readonly FIXED_WALLETS = DISTRIBUTION_WALLETS;

  private readonly REQUIRED_CREATOR_ADDRESS_VAL = REQUIRED_CREATOR_ADDRESS;

  /**
   * Create initial progress steps for the token creation process
   */
  createInitialSteps(): ProgressStep[] {
    return [
      {
        id: 'connect-wallet',
        title: 'Connect Creator Wallet',
        description: 'Connecting to the required creator wallet address',
        status: 'pending'
      },
      {
        id: 'check-funding',
        title: 'Check/Fund Wallet',
        description: 'Ensuring wallet has sufficient APT for transactions',
        status: 'pending'
      },
      {
        id: 'create-token',
        title: 'Create Governance Token',
        description: 'Minting the fungible token on Aptos Testnet',
        status: 'pending'
      },
      {
        id: 'register-assets',
        title: 'Register Assets',
        description: 'Registering token with all recipient wallets',
        status: 'pending'
      },
      {
        id: 'distribute-tokens',
        title: 'Distribute Tokens',
        description: 'Sending equal amounts to 4 fixed wallets',
        status: 'pending'
      }
    ];
  }

  /**
   * Update a specific step's status
   */
  updateStep(
    steps: ProgressStep[], 
    stepId: string, 
    update: Partial<ProgressStep>
  ): ProgressStep[] {
    return steps.map(step => 
      step.id === stepId ? { ...step, ...update } : step
    );
  }

  /**
   * Validate wallet connection
   */
  async validateWalletConnection(): Promise<{
    isValid: boolean;
    connectedAddress?: string;
    error?: string;
  }> {
    try {
      const connected = await connectWallet();
      
      return {
        isValid: true,
        connectedAddress: connected.address
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown wallet connection error'
      };
    }
  }

  /**
   * Execute the complete token creation and distribution process
   */
  async createAndDistributeToken(
    params: TokenCreationParams,
    onStepUpdate: (steps: ProgressStep[]) => void
  ): Promise<TokenCreationResult> {
    let steps = this.createInitialSteps();
    
    try {
      // Step 1: Connect Wallet
      steps = this.updateStep(steps, 'connect-wallet', { status: 'loading' });
      onStepUpdate([...steps]);

      const walletValidation = await this.validateWalletConnection();
      if (!walletValidation.isValid) {
        steps = this.updateStep(steps, 'connect-wallet', { 
          status: 'error', 
          errorMessage: walletValidation.error 
        });
        onStepUpdate([...steps]);
        return { success: false, error: walletValidation.error };
      }

      steps = this.updateStep(steps, 'connect-wallet', { status: 'success' });
      onStepUpdate([...steps]);

      // Step 2: Check/Fund Wallet
      steps = this.updateStep(steps, 'check-funding', { status: 'loading' });
      onStepUpdate([...steps]);

      await ensureTestnetFunding(walletValidation.connectedAddress!);

      steps = this.updateStep(steps, 'check-funding', { status: 'success' });
      onStepUpdate([...steps]);

      // Step 3: Create Token
      steps = this.updateStep(steps, 'create-token', { status: 'loading' });
      onStepUpdate([...steps]);

      const tokenCreation = await createToken({
        name: params.tokenName,
        symbol: params.tokenSymbol,
        description: params.tokenDescription,
        initialSupply: params.initialSupply,
        decimals: 6,
        iconUri: params.iconUrl
      });

      steps = this.updateStep(steps, 'create-token', { 
        status: 'success',
        txHash: tokenCreation.txHash
      });
      onStepUpdate([...steps]);

      // Step 4: Register Assets
      steps = this.updateStep(steps, 'register-assets', { status: 'loading' });
      onStepUpdate([...steps]);

      try {
        await ensureAssetRegistration(this.FIXED_WALLETS, tokenCreation.assetType);
        steps = this.updateStep(steps, 'register-assets', { status: 'success' });
      } catch (error) {
        steps = this.updateStep(steps, 'register-assets', { 
          status: 'error', 
          errorMessage: error instanceof Error ? error.message : 'Asset registration failed'
        });
        onStepUpdate([...steps]);
        return { success: false, error: error instanceof Error ? error.message : 'Asset registration failed' };
      }
      onStepUpdate([...steps]);

      // Step 5: Distribute Tokens
      steps = this.updateStep(steps, 'distribute-tokens', { status: 'loading' });
      onStepUpdate([...steps]);

      const amountPerWallet = Math.floor(params.initialSupply / this.FIXED_WALLETS.length);
      const distribution = await distributeTokens({
        assetType: tokenCreation.assetType,
        from: walletValidation.connectedAddress!,
        recipients: this.FIXED_WALLETS,
        amountPerRecipient: amountPerWallet
      });

      steps = this.updateStep(steps, 'distribute-tokens', { 
        status: 'success',
        txHash: distribution.transferTxHashes?.[0] // Show first transaction hash
      });
      onStepUpdate([...steps]);

      return {
        success: true,
        tokenAddress: tokenCreation.assetType,
        distributionTxHashes: distribution.transferTxHashes
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Update the current loading step to error status
      const loadingStep = steps.find(step => step.status === 'loading');
      if (loadingStep) {
        steps = this.updateStep(steps, loadingStep.id, { 
          status: 'error', 
          errorMessage 
        });
        onStepUpdate([...steps]);
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get the required creator wallet address
   */
  getRequiredCreatorAddress(): string {
    return this.REQUIRED_CREATOR_ADDRESS_VAL;
  }

  /**
   * Get the list of fixed distribution wallets
   */
  getFixedWallets(): string[] {
    return [...this.FIXED_WALLETS];
  }

  /**
   * Check if a wallet address is the required creator address
   */
  isRequiredCreatorAddress(address: string): boolean {
    return address.toLowerCase() === this.REQUIRED_CREATOR_ADDRESS_VAL.toLowerCase();
  }

  /**
   * Calculate token distribution amounts
   */
  calculateDistribution(totalSupply: number): {
    amountPerWallet: number;
    totalDistributed: number;
    remaining: number;
  } {
    const amountPerWallet = Math.floor(totalSupply / this.FIXED_WALLETS.length);
    const totalDistributed = amountPerWallet * this.FIXED_WALLETS.length;
    const remaining = totalSupply - totalDistributed;

    return {
      amountPerWallet,
      totalDistributed,
      remaining
    };
  }
}

export const tokenIntegrationService = new TokenIntegrationService();
