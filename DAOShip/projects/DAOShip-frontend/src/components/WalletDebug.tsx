import React, { useState } from 'react';

export default function WalletDebug() {
  const [status, setStatus] = useState('');
  const [account, setAccount] = useState('');

  const connectWallet = async () => {
    try {
      setStatus('Connecting...');
      
      if (!(window as any).aptos) {
        setStatus('❌ Petra wallet not found');
        return;
      }

      await (window as any).aptos.connect();
      const acc = await (window as any).aptos.account();
      setAccount(acc.address);
      setStatus('✅ Connected successfully');
      
    } catch (error: any) {
      setStatus(`❌ Connection failed: ${error.message}`);
    }
  };

  const testTransaction = async () => {
    try {
      setStatus('Testing transaction...');
      
      if (!account) {
        setStatus('❌ Please connect wallet first');
        return;
      }

      const payload = {
        function: "0x1::coin::transfer",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [account, "1"]
      };

      console.log('Testing with payload:', payload);
      setStatus('🔄 Check your wallet for transaction approval...');

      const result = await (window as any).aptos.signAndSubmitTransaction(payload);
      setStatus(`✅ Transaction successful! Hash: ${result.hash.slice(0, 10)}...`);
      
    } catch (error: any) {
      console.error('Transaction error:', error);
      setStatus(`❌ Transaction failed: ${error.message} (Code: ${error.code || 'unknown'})`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Wallet Debug Tool</h1>
        
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 space-y-4">
          <div>
            <button 
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg mr-4"
            >
              Connect Wallet
            </button>
            
            <button 
              onClick={testTransaction}
              disabled={!account}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white px-6 py-2 rounded-lg"
            >
              Test Transaction
            </button>
          </div>
          
          {account && (
            <div className="text-white">
              <p><strong>Connected Account:</strong></p>
              <p className="font-mono text-sm break-all">{account}</p>
            </div>
          )}
          
          <div className="text-white">
            <p><strong>Status:</strong></p>
            <p className="text-sm">{status}</p>
          </div>
          
          <div className="text-white text-sm">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Connect Wallet" to connect Petra</li>
              <li>Click "Test Transaction" to trigger a simple transaction</li>
              <li>Check browser console for detailed logs</li>
              <li>If you see a black screen, check the console for error details</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
