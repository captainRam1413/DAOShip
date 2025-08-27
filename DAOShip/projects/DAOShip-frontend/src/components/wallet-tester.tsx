import React, { useState } from 'react';
import { useWallet } from '../hooks/use-wallet';
import { connectWallet, signMessage } from '../lib/wallet';

export const WalletTester: React.FC = () => {
  const { isConnected, walletAddress } = useWallet();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string, isError: boolean = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${isError ? '❌' : '✅'} ${message}`;
    setTestResults(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const testWalletConnection = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      addResult('Starting wallet connection test...');
      
      // Test Petra wallet connection
      addResult('Checking if Petra wallet is available...');
      if ((window as any).aptos) {
        addResult('Petra wallet detected in window.aptos');
      } else {
        addResult('Petra wallet NOT detected', true);
        return;
      }

      addResult('Attempting to connect to Petra wallet...');
      const address = await connectWallet('petra');
      addResult(`Connected successfully: ${address}`);

      // Test message signing
      addResult('Testing message signing...');
      const testMessage = JSON.stringify({
        action: 'test',
        timestamp: Date.now(),
        wallet: address
      });

      addResult(`Message to sign: ${testMessage}`);
      const signature = await signMessage(testMessage);
      addResult(`Signature generated: ${signature}`);

      // Test DAO creation workflow (simulation)
      addResult('Simulating DAO creation workflow...');
      const daoMessage = JSON.stringify({
        action: 'createDAO',
        daoName: 'Test DAO',
        creator: address,
        timestamp: Date.now(),
        chainId: 'testnet'
      });

      const daoSignature = await signMessage(daoMessage);
      addResult(`DAO creation signature: ${daoSignature}`);

      addResult('🎉 All tests passed successfully!');

    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testProposalSigning = async () => {
    if (!isConnected || !walletAddress) {
      addResult('Please connect wallet first', true);
      return;
    }

    setIsLoading(true);

    try {
      addResult('Testing proposal creation signing...');
      
      const proposalMessage = JSON.stringify({
        action: 'createProposal',
        proposalTitle: 'Test Proposal',
        daoId: 'test-dao-id',
        creator: walletAddress,
        timestamp: Date.now(),
        chainId: 'testnet'
      });

      addResult(`Proposal message: ${proposalMessage}`);
      const signature = await signMessage(proposalMessage);
      addResult(`Proposal signature: ${signature}`);
      addResult('✅ Proposal signing test passed!');

    } catch (error: any) {
      addResult(`Proposal signing error: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🧪 Wallet Connection & Signing Tester
      </h2>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Current Status */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Current Status
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Connected:</span>
              <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-mono text-xs text-gray-900">
                {walletAddress || 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Petra Available:</span>
              <span className={`font-medium ${(window as any).aptos ? 'text-green-600' : 'text-red-600'}`}>
                {(window as any).aptos ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Test Controls
          </h3>
          <div className="space-y-3">
            <button
              onClick={testWalletConnection}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test Wallet Connection & Signing'}
            </button>
            
            <button
              onClick={testProposalSigning}
              disabled={isLoading || !isConnected}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test Proposal Signing'}
            </button>

            <button
              onClick={clearResults}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Results
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <h3 className="text-white font-bold mb-3">Test Results:</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={result.includes('❌') ? 'text-red-400' : 'text-green-400'}
              >
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          Instructions
        </h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>1. Make sure Petra wallet is installed and set to Aptos Testnet</li>
          <li>2. Click "Test Wallet Connection & Signing" to test basic functionality</li>
          <li>3. If connected, test proposal signing with the second button</li>
          <li>4. Check the console (F12 → Console) for additional debug information</li>
          <li>5. Report any errors you see in the test results</li>
        </ul>
      </div>
    </div>
  );
};

export default WalletTester;
