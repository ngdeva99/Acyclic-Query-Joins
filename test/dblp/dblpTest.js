// test/dblp/dblpTest.js
const DblpLoader = require('../../src/data/dblpLoader');
const YannakakisProcessor = require('../../src/processors/yannakakis');
const { JoinTree, JoinNode } = require('../../src/models/joinTree');

async function testDblpData(sampleSize = 100) {
    console.log(`\nTesting with DBLP dataset (sample size: ${sampleSize})...`);

    // Load data
    console.time('Data loading time');
    const { authors, publications, authored, stats } = 
        await DblpLoader.loadData('./src/data/dblp.xml', sampleSize);
    console.timeEnd('Data loading time');

    console.log('\nDataset statistics:', stats);

    // Create join tree
    const joinTree = new JoinTree();
    joinTree.root = new JoinNode(authors);
    joinTree.root.left = new JoinNode(authored);
    joinTree.root.right = new JoinNode(publications);

    // Execute Yannakakis algorithm
    console.time('Yannakakis execution time');
    const result = YannakakisProcessor.process(joinTree);
    console.timeEnd('Yannakakis execution time');

    // Print memory usage
    const memUsage = process.memoryUsage();
    console.log('\nMemory Usage:');
    console.log(`- Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    console.log(`- Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);

    // Analyze results
    console.log('\nResults:');
    console.log(`Total result tuples: ${result.tuples.length}`);
    console.log('Attributes:', [...result.attributes]);
    
    // Sample results
    console.log('\nSample results (first 3 entries):');
    for (const tuple of result.tuples.slice(0, 3)) {
        console.log(tuple);
    }

    // Verify results
    verifyResults(result, authors, publications, authored);
    
    return result;
}

function verifyResults(result, authors, publications, authored) {
    console.log('\nVerifying results...');

    // Count distinct authors and publications in result
    const resultAuthors = new Set(result.tuples.map(t => t[0]));
    const resultPubs = new Set(result.tuples.map(t => t[3])); // assuming pid at index 3

    console.log('Result statistics:');
    console.log(`- Distinct authors: ${resultAuthors.size}`);
    console.log(`- Distinct publications: ${resultPubs.size}`);

    // Verify join correctness
    let correctJoins = 0;
    let totalJoins = Math.min(100, result.tuples.length); // Check first 100 for performance

    for (let i = 0; i < totalJoins; i++) {
        const tuple = result.tuples[i];
        const authorId = tuple[0];
        const pubId = tuple[3];

        const isValidJoin = 
            authors.tuples.some(a => a[0] === authorId) &&
            publications.tuples.some(p => p[0] === pubId) &&
            authored.tuples.some(a => a[0] === authorId && a[1] === pubId);

        if (isValidJoin) correctJoins++;
    }

    console.log(`Join correctness (sample of ${totalJoins}): ${(correctJoins/totalJoins*100).toFixed(2)}%`);
}

// Run tests with different sample sizes
// Run tests with increasing sample sizes
async function runTests() {
    try {
        // Start with small samples
        await testDblpData(100);   // Very small sample
        // await testDblpData(500);   // Small sample
        // await testDblpData(1000);  // Medium sample
        // Uncomment for larger tests once small ones work
        // await testDblpData(5000);  // Large sample
        // await testDblpData(10000); // Very large sample
    } catch (error) {
        console.error('Test failed:', error);
        console.error(error.stack);
    }
}

runTests();