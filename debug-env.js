console.log('APM_TEST_PROD:', process.env.APM_TEST_PROD);
console.log('USE_REAL_GITHUB:', process.env.APM_TEST_PROD === 'true');
console.log('shouldUseMocks:', !(process.env.APM_TEST_PROD === 'true'));

// Import the actual test setup
const testSetup = require('./dist/src/test-setup.js');
console.log('Exported USE_REAL_GITHUB:', testSetup.USE_REAL_GITHUB);
console.log('Exported shouldUseMocks:', testSetup.shouldUseMocks);