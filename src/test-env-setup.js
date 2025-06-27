// This file runs BEFORE any test files are imported
// It ensures environment variables are set properly

// Check if we're in production test mode
if (process.env.APM_TEST_PROD === 'true') {
  console.log('[test-env-setup.js] APM_TEST_PROD is true - configuring for production tests');
} else {
  console.log('[test-env-setup.js] APM_TEST_PROD is not true:', process.env.APM_TEST_PROD);
}

// Ensure the environment variable is available globally
global.APM_TEST_PROD = process.env.APM_TEST_PROD;