// test/conference/conferenceTest.js
const ConferenceLoader = require('../../src/data/conferenceLoader');
const YannakakisProcessor = require('../../src/processors/yannakakis');
const { JoinTree, JoinNode } = require('../../src/models/joinTree');

async function testConferenceData() {
    console.log('\nTesting with Conference dataset...');

    // Load data
    console.time('Data loading time');
    const { authors, publications, authored, stats } = await ConferenceLoader.loadData();
    console.timeEnd('Data loading time');

    // Print input data for verification
    console.log('\nInput Data:');
    console.log('\nAuthors:');
    authors.tuples.forEach(a => console.log(`ID: ${a[0]}, Name: ${a[1]}`));
    
    console.log('\nPublications:');
    publications.tuples.forEach(p => 
        console.log(`ID: ${p[0]}, Title: ${p[1]}, Year: ${p[2]}, Venue: ${p[3]}`));
    
    console.log('\nAuthored relationships:');
    authored.tuples.forEach(a => console.log(`Author ID: ${a[0]}, Paper ID: ${a[1]}`));

    // Create join tree
    const joinTree = new JoinTree();
    joinTree.root = new JoinNode(authors);
    joinTree.root.left = new JoinNode(authored);
    joinTree.root.right = new JoinNode(publications);

    // Execute Yannakakis algorithm
    console.time('Yannakakis execution time');
    const result = YannakakisProcessor.process(joinTree);
    console.timeEnd('Yannakakis execution time');

    // Print results
    console.log('\nResults:');
    console.log('Attributes:', [...result.attributes]);
    console.log('Total result tuples:', result.tuples.length);
    
    console.log('\nDetailed Results:');
    result.tuples.forEach(tuple => {
        console.log('-'.repeat(50));
        console.log({
            authorId: tuple[0],
            authorName: tuple[1],
            paperId: tuple[2],
            paperTitle: tuple[3],
            year: tuple[4],
            venue: tuple[5]
        });
    });

    // Verify results
    verifyJoinResults(result, authors, publications, authored);
}

function verifyJoinResults(result, authors, publications, authored) {
    console.log('\nVerifying Results:');

    // 1. Check cardinality
    const expectedJoinCount = authored.tuples.length; // Should match authorship count
    console.log(`Join cardinality check: ${result.tuples.length === expectedJoinCount ? 'PASS' : 'FAIL'}`);
    console.log(`Expected: ${expectedJoinCount}, Got: ${result.tuples.length}`);

    // 2. Verify each join tuple
    let correctTuples = 0;
    for (const tuple of result.tuples) {
        const [authorId, authorName, paperId, paperTitle, year, venue] = tuple;
        
        // Check author exists
        const authorValid = authors.tuples.some(a => 
            a[0] === authorId && a[1] === authorName);
        
        // Check paper exists
        const paperValid = publications.tuples.some(p => 
            p[0] === paperId && p[1] === paperTitle && 
            p[2] === year && p[3] === venue);
        
        // Check relationship exists
        const relationshipValid = authored.tuples.some(a => 
            a[0] === authorId && a[1] === paperId);

        if (authorValid && paperValid && relationshipValid) {
            correctTuples++;
        }
    }

    console.log(`\nCorrect tuples: ${correctTuples}/${result.tuples.length}`);
    
    // 3. Check specific known relationships
    const knownRelationships = [
        {
            authorName: "Viktor Leis",
            paperTitle: "How Good Are Query Optimizers, Really?",
            venue: "VLDB"
        },
        {
            authorName: "Thomas Neumann",
            paperTitle: "Dynamic Programming Strikes Back",
            venue: "SIGMOD"
        },
        {
            authorName: "Michael Stonebraker",
            paperTitle: "DBMSs Should Talk Before They Answer",
            venue: "SIGMOD"
        }
    ];

    console.log('\nChecking known relationships:');
    knownRelationships.forEach(rel => {
        const found = result.tuples.some(tuple => 
            tuple[1] === rel.authorName && 
            tuple[3] === rel.paperTitle && 
            tuple[5] === rel.venue
        );
        console.log(`${rel.authorName} -> ${rel.paperTitle}: ${found ? 'FOUND' : 'MISSING'}`);
    });
}

// Run test
testConferenceData().catch(console.error);