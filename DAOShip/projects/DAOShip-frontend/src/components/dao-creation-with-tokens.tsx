import React, { useState } from 'react';
import { useTokenCreation } from '../hooks/useTokenCreation';
import { TokenCreationProgress, WalletConnectionModal } from '../components/token-creation-progress';
import { AlertCircle, CheckCircle, ExternalLink, Coins } from 'lucide-react';

interface DAOFormData {
  name: string;
  description: string;
  tokenSymbol: string;
  tokenSupply: number;
  category: string;
}

export const DAOCreationWithTokens: React.FC = () => {
  const [formData, setFormData] = useState<DAOFormData>({
    name: '',
    description: '',
    tokenSymbol: '',
    tokenSupply: 1000000,
    category: 'Technology'
  });

  const [showTokenCreation, setShowTokenCreation] = useState(false);

  const {
    isCreating,
    steps,
    result,
    error,
    isWalletModalOpen,
    connectedAddress,
    requiredAddress,
    createToken,
    connectWallet,
    closeWalletModal,
    reset
  } = useTokenCreation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connectedAddress) {
      await connectWallet();
      return;
    }

    setShowTokenCreation(true);
    
    try {
      await createToken({
        daoName: formData.name,
        tokenName: `${formData.name} Token`,
        tokenSymbol: formData.tokenSymbol,
        tokenDescription: `Governance token for ${formData.name} DAO`,
        initialSupply: formData.tokenSupply
      });
    } catch (error) {
      console.error('Token creation failed:', error);
    }
  };

  const handleNewDAO = () => {
    setFormData({
      name: '',
      description: '',
      tokenSymbol: '',
      tokenSupply: 1000000,
      category: 'Technology'
    });
    setShowTokenCreation(false);
    reset();
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`;
  };

  // Success state - show results
  if (result && result.success) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            DAO Created Successfully! 🎉
          </h1>
          <p className="text-gray-600">
            Your DAO "{formData.name}" has been created with governance tokens distributed on Aptos Testnet
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* DAO Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Coins className="w-5 h-5 mr-2" />
              DAO Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-blue-800">Name:</span>
                <span className="ml-2 text-blue-900">{formData.name}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Token Symbol:</span>
                <span className="ml-2 text-blue-900">{formData.tokenSymbol}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Total Supply:</span>
                <span className="ml-2 text-blue-900">{formData.tokenSupply.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Token Information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">
              Token Details
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-green-800">Asset Type:</span>
                <div className="mt-1 font-mono text-xs text-green-900 bg-green-100 p-2 rounded break-all">
                  {result.tokenAddress}
                </div>
              </div>
              
              {result.distributionTxHashes && (
                <div>
                  <span className="font-medium text-green-800">Distribution Transactions:</span>
                  <div className="mt-2 space-y-1">
                    {result.distributionTxHashes.map((hash, index) => (
                      <a
                        key={hash}
                        href={getExplorerUrl(hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-green-700 hover:text-green-900 transition-colors"
                      >
                        <span className="font-mono">
                          {hash.slice(0, 8)}...{hash.slice(-8)}
                        </span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Distribution Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Token Distribution Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4</div>
              <div className="text-sm text-gray-600">Fixed Wallets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.floor(formData.tokenSupply / 4).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Per Wallet</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(formData.tokenSupply - Math.floor(formData.tokenSupply / 4) * 4).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">Testnet</div>
              <div className="text-sm text-gray-600">Network</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleNewDAO}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Another DAO
          </button>
        </div>
      </div>
    );
  }

  // Token creation in progress
  if (showTokenCreation) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Creating Your DAO
          </h1>
          <p className="text-gray-600">
            Setting up "{formData.name}" with governance tokens on Aptos Testnet
          </p>
        </div>

        <TokenCreationProgress 
          steps={steps}
          onComplete={() => {
            console.log('Token creation completed!', result);
          }}
          onError={(errorMessage) => {
            console.error('Token creation failed:', errorMessage);
          }}
        />

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-red-900">
                  Creation Failed
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {error}
                </p>
                <button
                  onClick={() => setShowTokenCreation(false)}
                  className="mt-3 text-sm text-red-700 hover:text-red-900 underline"
                >
                  Back to Form
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main form
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New DAO
        </h1>
        <p className="text-gray-600">
          Set up your DAO with automatic governance token creation and distribution
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                DAO Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="My Awesome DAO"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your DAO's purpose and goals..."
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Gaming">Gaming</option>
                <option value="Art">Art & Creativity</option>
                <option value="Social">Social Impact</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label htmlFor="tokenSymbol" className="block text-sm font-medium text-gray-700 mb-2">
                Token Symbol *
              </label>
              <input
                id="tokenSymbol"
                type="text"
                required
                maxLength={10}
                value={formData.tokenSymbol}
                onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="TOKEN"
              />
            </div>

            <div>
              <label htmlFor="tokenSupply" className="block text-sm font-medium text-gray-700 mb-2">
                Initial Token Supply *
              </label>
              <input
                id="tokenSupply"
                type="number"
                required
                min={1000}
                max={1000000000}
                value={formData.tokenSupply}
                onChange={(e) => setFormData({ ...formData, tokenSupply: parseInt(e.target.value) || 1000000 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tokens will be distributed equally among 4 fixed wallets
              </p>
            </div>

            {/* Wallet Connection Status */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Required Creator Wallet
              </h4>
              {connectedAddress ? (
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Wallet Connected
                  </div>
                  <div className="text-xs font-mono text-gray-600 bg-gray-100 p-2 rounded break-all">
                    {connectedAddress}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center text-sm text-orange-600 mb-2">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Wallet Not Connected
                  </div>
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Connect Required Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center pt-6">
          <button
            type="submit"
            disabled={isCreating}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
          >
            {isCreating 
              ? 'Creating DAO...' 
              : connectedAddress 
                ? 'Create DAO & Deploy Tokens'
                : 'Connect Wallet to Continue'
            }
          </button>
        </div>
      </form>

      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={isWalletModalOpen}
        onClose={closeWalletModal}
        requiredAddress={requiredAddress}
        connectedAddress={connectedAddress}
        onConnect={connectWallet}
      />
    </div>
  );
};

export default DAOCreationWithTokens;
