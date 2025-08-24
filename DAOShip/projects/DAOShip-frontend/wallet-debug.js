/**
 * Quick debug script to test wallet connection and signing
 * Run this in browser console to diagnose wallet issues
 */

console.log('🔍 DAOShip Wallet Debug Script');
console.log('==============================');

// Check if wallets are available
console.log('1. Checking wallet availability:');
console.log('   window.aptos (Petra):', !!window.aptos);
console.log('   window.martian:', !!window.martian);
console.log('   window.pontem:', !!window.pontem);

// Check current wallet state
console.log('\n2. Current wallet state:');
const walletState = localStorage.getItem('walletConnected') === 'true';
const walletProvider = localStorage.getItem('walletProvider');
const walletAddress = localStorage.getItem('walletAddress');

console.log('   Connected:', walletState);
console.log('   Provider:', walletProvider);
console.log('   Address:', walletAddress);

// Test wallet functions
async function testWalletFunctions() {
  console.log('\n3. Testing wallet functions:');
  
  try {
    // Import wallet functions
    const { connectWallet, signMessage, getWalletAddress } = await import('/src/lib/wallet.ts');
    
    console.log('   Wallet functions imported successfully');
    
    // Test get current address
    try {
      const currentAddress = await getWalletAddress();
      console.log('   Current address:', currentAddress);
    } catch (error) {
      console.error('   Error getting address:', error.message);
    }
    
    // Test connection (only if not connected)
    if (!walletState) {
      console.log('   Attempting to connect to Petra wallet...');
      try {
        const address = await connectWallet('petra');
        console.log('   Connection successful:', address);
        
        // Test signing
        console.log('   Testing message signing...');
        const testMessage = 'Test message for DAOShip';
        const signature = await signMessage(testMessage);
        console.log('   Signature:', signature);
        
      } catch (error) {
        console.error('   Connection/signing error:', error.message);
      }
    } else {
      console.log('   Wallet already connected, testing signing...');
      try {
        const testMessage = 'Test message for DAOShip';
        const signature = await signMessage(testMessage);
        console.log('   Signature:', signature);
      } catch (error) {
        console.error('   Signing error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('   Error importing wallet functions:', error);
  }
}

// Test API functions
async function testAPIFunctions() {
  console.log('\n4. Testing API functions:');
  
  try {
    const { createDAOWithWallet, createProposalWithWallet } = await import('/src/lib/api.ts');
    console.log('   API functions imported successfully');
    
    // We won't actually create a DAO/proposal, just test the imports
    console.log('   createDAOWithWallet:', typeof createDAOWithWallet);
    console.log('   createProposalWithWallet:', typeof createProposalWithWallet);
    
  } catch (error) {
    console.error('   Error importing API functions:', error);
  }
}

// Run tests
testWalletFunctions();
testAPIFunctions();

console.log('\n🏁 Debug script completed. Check the output above for any issues.');
console.log('   If you see errors, copy them and share for troubleshooting.');
