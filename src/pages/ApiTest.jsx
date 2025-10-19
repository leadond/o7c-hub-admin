import { useState } from 'react';

const ApiTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [envResult, setEnvResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [envLoading, setEnvLoading] = useState(false);

  const testEnvironmentVariables = async () => {
    setEnvLoading(true);
    setEnvResult(null);

    try {
      console.log('Testing environment variables...');
      
      const response = await fetch('/api/debug-env');
      const data = await response.json();
      
      console.log('Environment check:', data);

      setEnvResult({
        success: response.ok,
        status: response.status,
        data: data,
        error: response.ok ? null : data.error
      });

    } catch (error) {
      console.error('Environment test error:', error);
      setEnvResult({
        success: false,
        error: error.message,
        status: 'Network Error'
      });
    } finally {
      setEnvLoading(false);
    }
  };

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
          path: '/Player',
          query: { limit: 1 }
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
        <h2 className="text-lg font-medium text-gray-900 mb-4">Environment Variables Test</h2>
        
        <button
          onClick={testEnvironmentVariables}
          disabled={envLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 mr-4"
        >
          {envLoading ? 'Checking...' : 'Check Environment Variables'}
        </button>

        {envResult && (
          <div className="mt-6">
            <div className={`p-4 rounded-md ${envResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className={`font-medium ${envResult.success ? 'text-green-800' : 'text-red-800'}`}>
                Environment Variables {envResult.success ? 'Check Complete' : 'Error'}
              </h3>
              {envResult.data?.environment && (
                <div className="mt-2 text-sm">
                  <p className={envResult.data.environment.BASE44_API_KEY.exists ? 'text-green-700' : 'text-red-700'}>
                    BASE44_API_KEY: {envResult.data.environment.BASE44_API_KEY.exists ? '✓ Set' : '✗ Missing'} 
                    {envResult.data.environment.BASE44_API_KEY.exists && ` (${envResult.data.environment.BASE44_API_KEY.length} chars)`}
                  </p>
                  <p className={envResult.data.environment.BASE44_APP_ID.exists ? 'text-green-700' : 'text-red-700'}>
                    BASE44_APP_ID: {envResult.data.environment.BASE44_APP_ID.exists ? '✓ Set' : '✗ Missing'}
                    {envResult.data.environment.BASE44_APP_ID.exists && ` (${envResult.data.environment.BASE44_APP_ID.length} chars)`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
        <h3 className="font-medium text-blue-800">Troubleshooting Guide</h3>
        <div className="text-sm text-blue-700 mt-2">
          <p className="font-medium">1. Check Environment Variables in Vercel:</p>
          <ul className="list-disc list-inside ml-4 mt-1">
            <li>BASE44_API_KEY - Your Base44 API key</li>
            <li>BASE44_APP_ID - Your Base44 application ID</li>
          </ul>
          
          <p className="font-medium mt-3">2. Verify Base44 API Access:</p>
          <ul className="list-disc list-inside ml-4 mt-1">
            <li>API key has proper permissions</li>
            <li>App ID is correct</li>
            <li>Base44 service is accessible</li>
          </ul>

          <p className="font-medium mt-3">3. Check Vercel Deployment:</p>
          <ul className="list-disc list-inside ml-4 mt-1">
            <li>Environment variables are set for Production</li>
            <li>Latest deployment includes API changes</li>
            <li>No build errors in Vercel logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;