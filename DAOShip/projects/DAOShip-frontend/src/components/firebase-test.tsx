import React, { useState } from 'react';
import { testFirebaseConnectivity, checkNetworkConnectivity, testAuthFlow } from '@/utils/test-firebase';
import GradientButton from '@/components/ui/gradient-button';
import GlassmorphicCard from '@/components/ui/glassmorphic-card';

const FirebaseTestComponent = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    const results = [];
    
    // Test 1: Network connectivity
    const networkTest = await checkNetworkConnectivity();
    results.push({ test: 'Network Connectivity', ...networkTest });
    
    // Test 2: Firebase connectivity
    const firebaseTest = await testFirebaseConnectivity();
    results.push({ test: 'Firebase Connectivity', ...firebaseTest });
    
    // Test 3: Auth flow
    const authTest = await testAuthFlow();
    results.push({ test: 'Auth State', success: true, message: authTest.user ? `User: ${authTest.user}` : 'No user signed in' });
    
    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <GlassmorphicCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Firebase Connectivity Test</h2>
        
        <GradientButton 
          onClick={runAllTests} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Running Tests...' : 'Run Firebase Tests'}
        </GradientButton>
        
        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className={`p-3 rounded ${result.success ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <h3 className="font-medium text-white">{result.test}</h3>
                <p className={`text-sm ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                  {result.success ? '✅ ' : '❌ '}{result.message || result.error}
                </p>
                {result.code && (
                  <p className="text-xs text-gray-400">Error code: {result.code}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassmorphicCard>
    </div>
  );
};

export default FirebaseTestComponent;
