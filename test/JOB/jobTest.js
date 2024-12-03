// test/job/jobTest.js
const { Relation, JoinTree, JoinNode } = require('../../src/models/joinTree');
const YannakakisProcessor = require('../../src/processors/yannakakis');

// Sample data based on JOB Query 13d from the paper
function createJobSampleData() {
    // Company Names
    const company_name = new Relation(
        "company_name",
        ["id", "name", "country_code"],
        [
            [1, "Warner Bros.", "us"],
            [2, "Paramount", "us"],
            [3, "Universal", "us"]
        ]
    );

    // Company Types
    const company_type = new Relation(
        "company_type",
        ["id", "kind"],
        [
            [1, "production companies"]
        ]
    );

    // Movies (Title)
    const title = new Relation(
        "title",
        ["id", "title", "kind_id"],
        [
            [1, "The Dark Knight", 1],
            [2, "Inception", 1],
            [3, "Interstellar", 1]
        ]
    );

    // Movie Companies (joins movies with companies)
    const movie_companies = new Relation(
        "movie_companies",
        ["movie_id", "company_id", "company_type_id"],
        [
            [1, 1, 1],  // Dark Knight - Warner Bros
            [2, 1, 1],  // Inception - Warner Bros
            [3, 1, 1]   // Interstellar - Warner Bros
        ]
    );

    // Movie Info
    const movie_info = new Relation(
        "movie_info",
        ["movie_id", "info_type_id", "info"],
        [
            [1, 1, "Action"],
            [2, 1, "Sci-Fi"],
            [3, 1, "Sci-Fi"]
        ]
    );

    // Info Type
    const info_type = new Relation(
        "info_type",
        ["id", "info"],
        [
            [1, "genres"],
            [2, "rating"]
        ]
    );

    return {
        company_name,
        company_type,
        title,
        movie_companies,
        movie_info,
        info_type
    };
}

async function testJOBQuery() {
    console.log('Testing JOB Query 13d...');
    const data = createJobSampleData();

    // Create join tree based on the paper's example
    const joinTree = new JoinTree();
    joinTree.root = new JoinNode(data.company_name);
    
    // Left subtree
    joinTree.root.left = new JoinNode(data.company_type);
    
    // Right subtree
    const movieNode = new JoinNode(data.title);
    const movieCompaniesNode = new JoinNode(data.movie_companies);
    
    joinTree.root.right = movieNode;
    movieNode.left = movieCompaniesNode;

    // Execute Yannakakis algorithm
    console.log('\nExecuting Yannakakis algorithm...');
    const result = YannakakisProcessor.process(joinTree);

    // Print results
    console.log('\nResults:');
    console.log('Attributes:', [...result.attributes]);
    console.log('Number of tuples:', result.tuples.length);

    // Verify results
    verifyResults(result, data);
}

function verifyResults(result, data) {
    console.log('\nVerifying results...');

    // Check if all Warner Bros. movies are present
    const warnerBrosMovies = result.tuples.filter(tuple => 
        tuple.includes("Warner Bros."));
    
    console.log('Warner Bros. movies found:', warnerBrosMovies.length);

    // Check join conditions
    const validJoins = result.tuples.every(tuple => {
        // Check company type is production companies
        const hasCorrectType = tuple.some(val => 
            val === "production companies");
        
        // Check country code is us
        const hasCorrectCountry = tuple.some(val => 
            val === "us");

        return hasCorrectType && hasCorrectCountry;
    });

    console.log('All joins are valid:', validJoins);
}

// Run the test
testJOBQuery().catch(console.error);