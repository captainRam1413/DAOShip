import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  txHash?: string;
  errorMessage?: string;
}

interface TokenCreationProgressProps {
  steps: ProgressStep[];
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const TokenCreationProgress: React.FC<TokenCreationProgressProps> = ({
  steps,
  onComplete,
  onError
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const completedSteps = steps.filter(step => step.status === 'success').length;
    const errorSteps = steps.filter(step => step.status === 'error').length;
    
    if (completedSteps === steps.length) {
      onComplete?.();
    } else if (errorSteps > 0) {
      const errorStep = steps.find(step => step.status === 'error');
      onError?.(errorStep?.errorMessage || 'An error occurred during token creation');
    }
  }, [steps, onComplete, onError]);

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Creating Token & Distributing to Wallets
        </h3>
        <p className="text-sm text-gray-600">
          Creating your governance token on Aptos Testnet and distributing to 4 fixed wallets
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all duration-200 ${
              step.status === 'success'
                ? 'border-green-200 bg-green-50'
                : step.status === 'loading'
                ? 'border-blue-200 bg-blue-50'
                : step.status === 'error'
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStepIcon(step)}
            </div>
            
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  {step.title}
                </h4>
                {step.status === 'loading' && (
                  <span className="text-xs text-blue-600 font-medium">
                    Processing...
                  </span>
                )}
              </div>
              
              {step.description && (
                <p className="text-xs text-gray-600 mt-1">
                  {step.description}
                </p>
              )}
              
              {step.status === 'error' && step.errorMessage && (
                <p className="text-xs text-red-600 mt-1">
                  Error: {step.errorMessage}
                </p>
              )}
              
              {step.txHash && (
                <div className="mt-2">
                  <a
                    href={getExplorerUrl(step.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span className="font-mono">
                      {step.txHash.slice(0, 8)}...{step.txHash.slice(-8)}
                    </span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Fixed Distribution Wallets
        </h4>
        <div className="space-y-1">
          {[
            "0x53146ebe37502a000f54c343cd5ec665d5f118d7cc306c62cf41fd27716341d9",
            "0x695fddb793accf3b65e5e5183d8f136b92fa8963ceeb3fe9a14cb486a668b034",
            "0xd89d2d8c8c3848dbeeaab302e005e16728363a463f63e7b45cc331c655e6991a",
            "0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c"
          ].map((wallet, index) => (
            <div key={wallet} className="text-xs font-mono text-gray-600">
              {index + 1}. {wallet.slice(0, 8)}...{wallet.slice(-8)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Wallet connection modal component
interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAddress: string;
  connectedAddress?: string;
  onConnect: () => Promise<void>;
}

export const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  isOpen,
  onClose,
  requiredAddress,
  connectedAddress,
  onConnect
}) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  const isWrongWallet = connectedAddress && 
    connectedAddress.toLowerCase() !== requiredAddress.toLowerCase();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isWrongWallet ? 'Wrong Wallet Connected' : 'Connect Wallet'}
        </h3>
        
        {isWrongWallet ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 mb-2">
                Please switch to the required creator wallet:
              </p>
              <p className="text-xs font-mono text-red-900 bg-red-100 p-2 rounded break-all">
                {requiredAddress}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Currently connected:
              </p>
              <p className="text-xs font-mono text-gray-900 bg-gray-100 p-2 rounded break-all">
                {connectedAddress}
              </p>
            </div>
            
            <div className="text-sm text-gray-600">
              <p className="mb-2">To switch wallets:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Open your Aptos wallet (Petra/Martian)</li>
                <li>Switch to the required address</li>
                <li>Ensure you're on Testnet network</li>
                <li>Click "Retry Connection" below</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please connect your Aptos wallet with the required creator address:
            </p>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-mono text-blue-900 bg-blue-100 p-2 rounded break-all">
                {requiredAddress}
              </p>
            </div>
            
            <div className="text-sm text-gray-600">
              <p className="mb-2">Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Must use the exact address above</li>
                <li>Wallet must be on Aptos Testnet</li>
                <li>Install Petra or Martian wallet if needed</li>
              </ul>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isWrongWallet ? 'Retry Connection' : 'Connect Wallet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenCreationProgress;
