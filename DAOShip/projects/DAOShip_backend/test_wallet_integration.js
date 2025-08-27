// Test script for wallet integration DAO creation

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api/v2';

// Test data
const testDAOData = {
  name: "Test Wallet DAO",
  description: "Testing wallet signature integration",
  manager: "0x1",
  votePrice: 1,
  tokenName: "Test Token",
  tokenSymbol: "TEST",
  tokenSupply: 1000000,
  votingPeriod: 7,
  quorum: 50,
  minTokens: 100,
  githubRepo: "https://github.com/test/repo",
  tokenStrategy: "fixed",
  initialDistribution: { commits: 10, pullRequests: 50 },
  tokenAllocation: { initialDistribution: 60, futureContributors: 30, treasury: 10 },
  contributionRewards: { newPR: 30, acceptedPR: 50 },
  vestingPeriod: 30,
  minContributionForVoting: 100,
  invitedCollaborators: [],
  members: ["0x1"]
};

// Test 1: DAO creation without signature (should fail)
async function testDAOCreationWithoutSignature() {
  console.log('\n=== Test 1: DAO Creation Without Signature ===');
  
  try {
    const response = await fetch(`${API_BASE}/dao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testDAOData)
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (!result.success) {
      console.log('✅ Expected failure - no signature provided');
    } else {
      console.log('❌ Unexpected success - signature validation failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test 2: DAO creation with invalid signature (should fail)
async function testDAOCreationWithInvalidSignature() {
  console.log('\n=== Test 2: DAO Creation With Invalid Signature ===');
  
  const invalidSignatureData = {
    ...testDAOData,
    signature: "invalid_signature",
    signedMessage: JSON.stringify({
      action: 'createDAO',
      daoName: testDAOData.name,
      creator: testDAOData.manager,
      timestamp: Date.now(),
      chainId: 'testnet'
    })
  };
  
  try {
    const response = await fetch(`${API_BASE}/dao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidSignatureData)
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (!result.success) {
      console.log('✅ Expected failure - invalid signature');
    } else {
      console.log('❌ Unexpected success - signature validation failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test 3: DAO creation with valid mock signature (should succeed)
async function testDAOCreationWithValidSignature() {
  console.log('\n=== Test 3: DAO Creation With Valid Mock Signature ===');
  
  const now = Date.now();
  const messageToSign = JSON.stringify({
    action: 'createDAO',
    daoName: testDAOData.name,
    creator: testDAOData.manager,
    timestamp: now,
    chainId: 'testnet'
  });
  
  const validSignatureData = {
    ...testDAOData,
    signature: `SIG${now}mock_valid_signature`,
    signedMessage: messageToSign
  };
  
  try {
    const response = await fetch(`${API_BASE}/dao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSignatureData)
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Expected success - valid signature');
      return result.data;
    } else {
      console.log('❌ Unexpected failure - signature validation too strict');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test 4: DAO creation with expired signature (should fail)
async function testDAOCreationWithExpiredSignature() {
  console.log('\n=== Test 4: DAO Creation With Expired Signature ===');
  
  // Create signature with timestamp 20 minutes ago (past 10-minute expiry)
  const expiredTime = Date.now() - (20 * 60 * 1000);
  const messageToSign = JSON.stringify({
    action: 'createDAO',
    daoName: testDAOData.name,
    creator: testDAOData.manager,
    timestamp: expiredTime,
    chainId: 'testnet'
  });
  
  const expiredSignatureData = {
    ...testDAOData,
    signature: `SIG${expiredTime}mock_expired_signature`,
    signedMessage: messageToSign
  };
  
  try {
    const response = await fetch(`${API_BASE}/dao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expiredSignatureData)
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (!result.success && result.message.includes('expired')) {
      console.log('✅ Expected failure - signature expired');
    } else {
      console.log('❌ Unexpected result - signature expiry validation failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test 5: Check that created DAO includes signature information
async function testDAOSignatureStorage(daoId) {
  if (!daoId) return;
  
  console.log('\n=== Test 5: DAO Signature Storage ===');
  
  try {
    const response = await fetch(`${API_BASE}/dao/${daoId}`);
    const result = await response.json();
    
    console.log('DAO Details:', JSON.stringify(result, null, 2));
    
    if (result.data && result.data.signature) {
      console.log('✅ Signature stored in DAO record');
    } else {
      console.log('❌ Signature not stored in DAO record');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Wallet Integration Tests\n');
  
  await testDAOCreationWithoutSignature();
  await testDAOCreationWithInvalidSignature();
  const dao = await testDAOCreationWithValidSignature();
  await testDAOCreationWithExpiredSignature();
  
  if (dao && dao._id) {
    await testDAOSignatureStorage(dao._id);
  }
  
  console.log('\n🏁 Tests completed!');
}

runAllTests().catch(console.error);
