const axios = require('axios');

// Test token creation with DAO creation
async function testDAOWithTokenCreation() {
  try {
    console.log('🚀 Testing DAO creation with Aptos token...');
    
    const timestamp = Date.now();
    const daoData = {
      name: `Test DAO with Token ${timestamp}`,
      description: 'A test DAO created to verify Aptos token integration',
      manager: '0x00fdff5f356036a99e6d57f10481f82969ce3bf56ab4764b9e644ff7f4903ad9', // Test address
      votePrice: 100,
      tokenName: `Test DAO Token ${timestamp}`,
      tokenSymbol: 'TDT' + timestamp.toString().slice(-4),
      tokenSupply: 1000000,
      votingPeriod: 7,
      quorum: 50,
      minTokens: 10,
      githubRepo: 'https://github.com/test/repo',
      tokenStrategy: 'fixed',
      signature: 'test_signature_123',
      signedMessage: JSON.stringify({
        action: 'createDAO',
        daoName: `Test DAO with Token ${timestamp}`,
        creator: '0x00fdff5f356036a99e6d57f10481f82969ce3bf56ab4764b9e644ff7f4903ad9',
        timestamp: Date.now(),
        chainId: 'testnet'
      })
    };

    console.log('📝 Sending DAO creation request...');
    const response = await axios.post('http://localhost:3000/api/dao', daoData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ DAO Creation Response:');
    console.log('Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data) {
      console.log('📊 DAO Details:');
      console.log('ID:', response.data.data._id);
      console.log('Name:', response.data.data.name);
      console.log('Token Name:', response.data.data.tokenName);
      console.log('Token Symbol:', response.data.data.tokenSymbol);
      console.log('Token Address:', response.data.data.tokenAddress);
      console.log('Token Creation Hash:', response.data.data.tokenCreationHash);
    }

    if (response.data.tokenCreation) {
      console.log('🪙 Token Creation Details:');
      console.log('Success:', response.data.tokenCreation.success);
      console.log('Token Address:', response.data.tokenCreation.tokenAddress);
      console.log('Transaction Hash:', response.data.tokenCreation.transactionHash);
      
      if (response.data.tokenCreation.initialMint) {
        console.log('💰 Initial Mint Details:');
        console.log('Amount:', response.data.tokenCreation.initialMint.amount);
        console.log('Recipient:', response.data.tokenCreation.initialMint.recipient);
        console.log('Mint Hash:', response.data.tokenCreation.initialMint.transactionHash);
      }
    }

    return response.data.data;

  } catch (error) {
    console.error('❌ Error testing DAO creation:', error.response?.data || error.message);
    return null;
  }
}

// Test getting token information
async function testGetTokenInfo(daoId) {
  try {
    console.log('\n🔍 Testing token info retrieval...');
    
    const response = await axios.get(`http://localhost:3000/api/dao/${daoId}/token`);
    
    console.log('✅ Token Info Response:');
    console.log('Has Token:', response.data.data.hasToken);
    console.log('Token Name:', response.data.data.tokenName);
    console.log('Token Symbol:', response.data.data.tokenSymbol);
    console.log('Token Address:', response.data.data.tokenAddress);
    console.log('Token Supply:', response.data.data.tokenSupply);
    console.log('Creator Balance:', response.data.data.creatorBalance);
    
  } catch (error) {
    console.error('❌ Error fetching token info:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Starting Aptos Token Integration Tests\n');
  
  const dao = await testDAOWithTokenCreation();
  
  if (dao && dao._id) {
    await testGetTokenInfo(dao._id);
  }
  
  console.log('\n🏁 Tests completed!');
}

runTests();
