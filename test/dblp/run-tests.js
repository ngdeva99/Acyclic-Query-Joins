// test/dblp/run-tests.js
const { runTest } = require('./test-runner');

async function runAllTests() {
    try {
        // Start with small dataset to verify functionality
        console.log('Running small dataset test...');
        await runTest('small');

        // Then try medium dataset
        // console.log('\nRunning medium dataset test...');
        // await runTest('medium');

        // Uncomment for large dataset test
        // console.log('\nRunning large dataset test...');
        // await runTest('large');
    } catch (error) {
        console.error('Test failed:', error);
        console.error(error.stack);
    }
}

runAllTests();