import { useState } from 'react';

const ApiTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testBase44Connection = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      console.log('Testing Base44 API connection...');
      
      const response = await fetch('/api/base44', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GET',
          path: '/Player'
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      setTestResult({
        success: response.ok,
        status: response.status,
        data: data,
        error: response.ok ? null : data.error
      });

    } catch (error) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        error: error.message,
        status: 'Network Error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">API Connection Test</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Base44 API Test</h2>
        
        <button
          onClick={testBase44Connection}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Base44 Connection'}
        </button>

        {testResult && (
          <div className="mt-6">
            <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.success ? 'Success!' : 'Error'}
              </h3>
              <p className={`text-sm mt-1 ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                Status: {testResult.status}
              </p>
              {testResult.error && (
                <p className="text-sm text-red-700 mt-1">
                  Error: {testResult.error}
                </p>
              )}
            </div>

            <div className="mt-4 bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Raw Response:</h4>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="font-medium text-blue-800">Environment Check</h3>
        <p className="text-sm text-blue-700 mt-1">
          Make sure these environment variables are set in Vercel:
        </p>
        <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
          <li>BASE44_API_KEY</li>
          <li>BASE44_APP_ID</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTest;