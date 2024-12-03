// test/dblp/test-runner.js
const YannakakisProcessor = require('../../src/processors/yannakakis');
const { Relation, JoinTree, JoinNode } = require('../../src/models/joinTree');

// Test data generation
function generateTestData(scale = 'small') {
    const sizes = {
        small: { authors: 100, pubs: 200, authored: 300 },
        medium: { authors: 1000, pubs: 2000, authored: 3000 },
        large: { authors: 10000, pubs: 20000, authored: 30000 }
    };

    const size = sizes[scale];
    
    // Generate Authors
    const authors = new Relation(
        "authors",
        ["aid", "name", "department"],
        Array.from({ length: size.authors }, (_, i) => [
            i + 1,
            `Author${i + 1}`,
            Math.floor(Math.random() * 5)
        ])
    );

    // Generate Publications
    const publications = new Relation(
        "publications",
        ["pid", "title", "year", "venue"],
        Array.from({ length: size.pubs }, (_, i) => [
            i + 1,
            `Publication${i + 1}`,
            1990 + Math.floor(Math.random() * 34),
            Math.floor(Math.random() * 10)
        ])
    );

    // Generate Authored relationships
    const authoredRelations = [];
    const usedAuthors = new Set();
    const usedPubs = new Set();

    for (let i = 0; i < size.authored; i++) {
        const aid = Math.floor(Math.random() * size.authors) + 1;
        const pid = Math.floor(Math.random() * size.pubs) + 1;
        authoredRelations.push([aid, pid]);
        usedAuthors.add(aid);
        usedPubs.add(pid);
    }

    const authored = new Relation(
        "authored",
        ["aid", "pid"],
        authoredRelations
    );

    return {
        relations: { authors, publications, authored },
        stats: {
            totalAuthors: size.authors,
            totalPubs: size.pubs,
            authorsWithPubs: usedAuthors.size,
            pubsWithAuthors: usedPubs.size,
            authorships: size.authored
        }
    };
}

// Create join tree
function createJoinTree(relations) {
    const tree = new JoinTree();
    tree.root = new JoinNode(relations.authors);
    tree.root.left = new JoinNode(relations.authored);
    tree.root.right = new JoinNode(relations.publications);
    return tree;
}

// Run test
async function runTest(scale = 'small') {
    console.log(`\nRunning DBLP test with ${scale} dataset...`);
    
    // Generate test data
    const { relations, stats } = generateTestData(scale);
    console.log('Dataset statistics:', stats);

    // Create join tree
    const joinTree = createJoinTree(relations);

    // Measure execution time
    console.time('Execution time');
    const result = YannakakisProcessor.process(joinTree);
    console.timeEnd('Execution time');

    // Print results
    console.log('\nResults:');
    console.log('- Result tuples:', result.tuples.length);
    console.log('- Attributes:', [...result.attributes]);
    console.log('- Sample tuples (first 3):');
    console.log(result.tuples.slice(0, 3));

    // Verify results
    verifyResults(result, relations);
}

// Verify result correctness
function verifyResults(result, relations) {
    console.log('\nVerifying results...');
    
    // Check if dangling tuples were properly eliminated
    const resultAuthors = new Set(result.tuples.map(t => t[0]));
    const resultPubs = new Set(result.tuples.map(t => t[3])); // assuming pid is at index 3

    console.log('Verification results:');
    console.log('- Distinct authors in result:', resultAuthors.size);
    console.log('- Distinct publications in result:', resultPubs.size);
    
    // Check for expected join properties
    const hasCorrectJoins = result.tuples.every(tuple => {
        const authorId = tuple[0];
        const pubId = tuple[3];
        
        // Verify each tuple represents a valid author-publication relationship
        const authorExists = relations.authors.tuples.some(t => t[0] === authorId);
        const pubExists = relations.publications.tuples.some(t => t[0] === pubId);
        const authorshipExists = relations.authored.tuples.some(t => 
            t[0] === authorId && t[1] === pubId
        );
        
        return authorExists && pubExists && authorshipExists;
    });

    console.log('- All joins are correct:', hasCorrectJoins);
}

module.exports = { runTest };