// test/job/complexJobTest.js
const { Relation, JoinTree, JoinNode } = require('../../src/models/joinTree');
const YannakakisProcessor = require('../../src/processors/yannakakis');

function createComplexJobData() {
    // Cast Info
    const cast_info = new Relation(
        "cast_info",
        ["movie_id", "person_id", "role_id"],
        [
            [1, 1, 1],  // Actor 1 in Movie 1
            [1, 2, 2],  // Actor 2 in Movie 1
            [2, 1, 1],  // Actor 1 in Movie 2
            [2, 3, 1]   // Actor 3 in Movie 2
        ]
    );

    // Person (Name)
    const name = new Relation(
        "name",
        ["id", "name", "gender"],
        [
            [1, "Christian Bale", "M"],
            [2, "Michael Caine", "M"],
            [3, "Leonardo DiCaprio", "M"]
        ]
    );

    // Role Type
    const role_type = new Relation(
        "role_type",
        ["id", "role"],
        [
            [1, "actor"],
            [2, "supporting actor"]
        ]
    );

    // Movie Keyword
    const movie_keyword = new Relation(
        "movie_keyword",
        ["movie_id", "keyword_id"],
        [
            [1, 1],
            [1, 2],
            [2, 1]
        ]
    );

    // Keyword
    const keyword = new Relation(
        "keyword",
        ["id", "keyword"],
        [
            [1, "action"],
            [2, "superhero"]
        ]
    );

    return {
        cast_info,
        name,
        role_type,
        movie_keyword,
        keyword,
        ...createJobSampleData() // Include base relations
    };
}

async function testComplexJOBQuery() {
    console.log('Testing Complex JOB Query...');
    const data = createComplexJobData();

    // Create a more complex join tree
    const joinTree = new JoinTree();
    
    // Start with movie title as root
    joinTree.root = new JoinNode(data.title);
    
    // Left subtree: Cast information
    const castNode = new JoinNode(data.cast_info);
    const nameNode = new JoinNode(data.name);
    const roleNode = new JoinNode(data.role_type);
    
    joinTree.root.left = castNode;
    castNode.left = nameNode;
    castNode.right = roleNode;
    
    // Right subtree: Movie keywords
    const keywordJoinNode = new JoinNode(data.movie_keyword);
    const keywordNode = new JoinNode(data.keyword);
    
    joinTree.root.right = keywordJoinNode;
    keywordJoinNode.right = keywordNode;

    // Execute algorithm
    console.time('Query execution');
    const result = YannakakisProcessor.process(joinTree);
    console.timeEnd('Query execution');

    // Print results
    console.log('\nResults:');
    console.log('Attributes:', [...result.attributes]);
    console.log('Number of tuples:', result.tuples.length);
    
    // Sample results
    console.log('\nSample results (first 2 tuples):');
    result.tuples.slice(0, 2).forEach(tuple => {
        console.log('-'.repeat(50));
        const attributeArray = [...result.attributes];
        const tupleObj = {};
        attributeArray.forEach((attr, index) => {
            tupleObj[attr] = tuple[index];
        });
        console.log(tupleObj);
    });

    // Verify results
    verifyComplexResults(result, data);
}

function verifyComplexResults(result, data) {
    console.log('\nVerifying complex query results...');

    // Check if all actors are present
    const actorNames = new Set(result.tuples.map(tuple => 
        tuple[result.attributes.indexOf('name')]
    ));
    console.log('Distinct actors found:', actorNames.size);

    // Check keyword connections
    const movieKeywords = new Set(result.tuples.map(tuple => 
        tuple[result.attributes.indexOf('keyword')]
    ));
    console.log('Keywords found:', [...movieKeywords]);

    // Verify each tuple has all required attributes
    const requiredAttributes = ['title', 'name', 'role', 'keyword'];
    const hasAllAttributes = requiredAttributes.every(attr => 
        result.attributes.has(attr)
    );
    console.log('Has all required attributes:', hasAllAttributes);
}

// Run both tests
async function runAllTests() {
    try {
        await testJOBQuery();
        console.log('\n' + '='.repeat(50) + '\n');
        await testComplexJOBQuery();
    } catch (error) {
        console.error('Test failed:', error);
    }
}

runAllTests();