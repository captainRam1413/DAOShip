import React, { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { signMessage } from '@/lib/wallet';
import { createDAOWithWallet } from '@/lib/api';
import { createTokenWithWallet, checkTransactionInWallet, getAptosAccountFromWallet } from '@/lib/aptos-wallet';
import { useToast } from '@/hooks/use-toast';

const WalletDebug = () => {
  const { isConnected, walletAddress, connect } = useWallet();
  const { toast } = useToast();
  const [isTestingSignature, setIsTestingSignature] = useState(false);
  const [isTestingDAO, setIsTestingDAO] = useState(false);
  const [isTestingRealToken, setIsTestingRealToken] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [lastCreatedDAO, setLastCreatedDAO] = useState<any>(null);

  const addLog = (message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testWalletConnection = async () => {
    try {
      addLog('Testing wallet connection...');
      if (!isConnected) {
        addLog('Wallet not connected, attempting to connect...');
        await connect('petra');
        addLog('Wallet connection successful');
      } else {
        addLog(`Wallet already connected: ${walletAddress}`);
      }
    } catch (error: any) {
      addLog(`Wallet connection failed: ${error.message}`);
    }
  };

  const testMessageSigning = async () => {
    if (!isConnected || !walletAddress) {
      addLog('Please connect wallet first');
      return;
    }

    setIsTestingSignature(true);
    try {
      addLog('Testing message signing...');
      const testMessage = 'Test message for DAOShip - ' + Date.now();
      addLog(`Message to sign: ${testMessage}`);
      
      const signature = await signMessage(testMessage);
      addLog(`Signature successful: ${signature}`);
      
      toast({
        title: "Signature Success",
        description: "Message signed successfully!",
      });
    } catch (error: any) {
      addLog(`Signature failed: ${error.message}`);
      toast({
        title: "Signature Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTestingSignature(false);
    }
  };

  const testDAOCreation = async () => {
    if (!isConnected || !walletAddress) {
      addLog('Please connect wallet first');
      return;
    }

    setIsTestingDAO(true);
    try {
      addLog('Testing DAO creation workflow...');
      
      const testDAO = {
        name: 'Test DAO - ' + Date.now(),
        description: 'This is a test DAO created for debugging wallet signing',
        manager: walletAddress,
        tokenName: 'Test Token',
        tokenSymbol: 'TEST',
        tokenSupply: 1000,
        votingPeriod: 7,
        quorum: 50,
        minTokens: 10,
        githubRepo: 'https://github.com/test/repo'
      };

      addLog(`Creating DAO: ${testDAO.name}`);
      addLog('This should trigger wallet signing...');
      
      const result = await createDAOWithWallet(testDAO, walletAddress);
      addLog(`DAO creation successful: ${JSON.stringify(result, null, 2)}`);
      
      // Store the created DAO for token testing
      setLastCreatedDAO(result);
      
      toast({
        title: "DAO Creation Success",
        description: "Test DAO created successfully!",
      });
    } catch (error: any) {
      addLog(`DAO creation failed: ${error.message}`);
      toast({
        title: "DAO Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTestingDAO(false);
    }
  };

  const testRealTokenCreation = async () => {
    if (!isConnected || !walletAddress) {
      addLog('Please connect wallet first');
      return;
    }

    if (!lastCreatedDAO) {
      addLog('Please create a DAO first to test token creation');
      return;
    }

    setIsTestingRealToken(true);
    try {
      addLog('Testing REAL token creation with wallet signing...');
      addLog(`DAO ID: ${lastCreatedDAO._id || lastCreatedDAO.id}`);
      
      // Check wallet account first
      const accountInfo = await getAptosAccountFromWallet();
      if (accountInfo.success) {
        addLog(`Wallet account verified: ${accountInfo.account?.address}`);
      } else {
        addLog(`Wallet account check failed: ${accountInfo.error}`);
      }
      
      addLog('This will create a REAL token on Aptos and prompt for wallet signature...');
      
      const result = await createTokenWithWallet(lastCreatedDAO._id || lastCreatedDAO.id, walletAddress);
      
      if (result.success) {
        addLog(`🎉 REAL TOKEN CREATED! Address: ${result.tokenAddress}`);
        addLog(`Transaction Hash: ${result.transactionHash}`);
        addLog('✅ This transaction should now be visible in your Petra wallet!');
        
        // Check if transaction is visible in wallet
        if (result.transactionHash) {
          setTimeout(async () => {
            const txCheck = await checkTransactionInWallet(result.transactionHash!);
            if (txCheck.visible) {
              addLog('✅ Transaction confirmed visible in wallet');
            } else {
              addLog('⚠️ Transaction not yet visible in wallet (may take a moment)');
            }
          }, 3000);
        }
        
        toast({
          title: "Real Token Created!",
          description: `Token created on Aptos! Check your wallet for transaction ${result.transactionHash}`,
        });
      } else {
        addLog(`❌ Real token creation failed: ${result.error}`);
        toast({
          title: "Token Creation Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      addLog(`❌ Real token creation error: ${error.message}`);
      toast({
        title: "Token Creation Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTestingRealToken(false);
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Wallet Debug Tool</h2>
      
      {/* Wallet Status */}
      <div className="mb-6 p-4 glass-card rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">Wallet Status</h3>
        <div className="space-y-2">
          <p className="text-white">
            <span className="text-white/70">Connected: </span>
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Yes' : 'No'}
            </span>
          </p>
          <p className="text-white">
            <span className="text-white/70">Address: </span>
            <span className="font-mono text-sm">{walletAddress || 'Not connected'}</span>
          </p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6 space-y-4">
        <button
          onClick={testWalletConnection}
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
        >
          Test Wallet Connection
        </button>
        
        <button
          onClick={testMessageSigning}
          disabled={!isConnected || isTestingSignature}
          className="w-full p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium"
        >
          {isTestingSignature ? 'Testing Signature...' : 'Test Message Signing'}
        </button>
        
        <button
          onClick={testDAOCreation}
          disabled={!isConnected || isTestingDAO}
          className="w-full p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium"
        >
          {isTestingDAO ? 'Testing DAO Creation...' : 'Test DAO Creation (Full Workflow)'}
        </button>
        
        <button
          onClick={testRealTokenCreation}
          disabled={!isConnected || isTestingRealToken || !lastCreatedDAO}
          className="w-full p-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium"
        >
          {isTestingRealToken ? 'Creating Real Token...' : 'Test REAL Token Creation (Wallet Signing)'}
        </button>
        
        {!lastCreatedDAO && (
          <p className="text-sm text-yellow-400 text-center">
            ⚠️ Create a DAO first to test real token creation
          </p>
        )}
      </div>

      {/* Debug Logs */}
      <div className="p-4 glass-card rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Debug Logs</h3>
          <button
            onClick={clearLogs}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Clear
          </button>
        </div>
        
        <div className="bg-black/30 rounded-lg p-4 h-64 overflow-y-auto">
          {debugLogs.length === 0 ? (
            <p className="text-white/50">No logs yet. Run tests to see debug information.</p>
          ) : (
            debugLogs.map((log, index) => (
              <p key={index} className="text-white/80 text-sm font-mono mb-1">
                {log}
              </p>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 glass-card rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">Instructions</h3>
        <div className="text-white/70 text-sm space-y-2">
          <p>1. First test wallet connection to ensure Petra wallet is properly connected</p>
          <p>2. Test message signing to verify the signing functionality works</p>
          <p>3. Test the full DAO creation workflow to identify where the process fails</p>
          <p>4. <strong>Test REAL token creation</strong> - This will create an actual token on Aptos!</p>
          <p>5. Check the debug logs for detailed error information</p>
          <p>6. Make sure you have Petra wallet installed and connected to devnet/testnet</p>
          <p className="text-orange-400 font-medium">
            ⚠️ Real token creation will prompt for wallet signature and create actual blockchain transactions!
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletDebug;
