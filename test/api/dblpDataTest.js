// Generate larger test dataset
function generateDblpData(authorCount = 1000, publicationCount = 2000, authorshipCount = 3000) {
    const authors = [];
    const publications = [];
    const authored = [];

    // Generate authors
    for (let i = 1; i <= authorCount; i++) {
        authors.push([
            i,                              // aid
            `Author${i}`,                   // name
            Math.floor(Math.random() * 5)   // department (0-4)
        ]);
    }

    // Generate publications
    for (let i = 1; i <= publicationCount; i++) {
        publications.push([
            i,                              // pid
            `Publication${i}`,              // title
            1990 + Math.floor(Math.random() * 34), // year (1990-2023)
            Math.floor(Math.random() * 10)  // venue (0-9)
        ]);
    }

    // Generate authored relationships with some dangling tuples
    const usedAuthors = new Set();
    const usedPublications = new Set();

    // Ensure some authors have no publications and some publications have no authors
    for (let i = 1; i <= authorshipCount; i++) {
        const aid = Math.floor(Math.random() * authorCount) + 1;
        const pid = Math.floor(Math.random() * publicationCount) + 1;
        
        authored.push([aid, pid]);
        usedAuthors.add(aid);
        usedPublications.add(pid);
    }

    console.log(`Generated dataset statistics:
        - Authors: ${authorCount} (${usedAuthors.size} with publications)
        - Publications: ${publicationCount} (${usedPublications.size} with authors)
        - Authorship records: ${authorshipCount}`);

    return { authors, publications, authored };
}

// Create test case
const dblpTestCase = {
    "joinTree": {
        "relation": {
            "name": "authors",
            "attributes": ["aid", "name", "department"],
            "tuples": []  // Will be filled with generated data
        },
        "left": {
            "relation": {
                "name": "authored",
                "attributes": ["author_id", "publication_id"],
                "tuples": []
            }
        },
        "right": {
            "relation": {
                "name": "publications",
                "attributes": ["pid", "title", "year", "venue"],
                "tuples": []
            }
        }
    }
};

// Modified YannakakisProcessor that combines phases 2 and 3 when no projections
class OptimizedYannakakisProcessor extends YannakakisProcessor {
    static process(joinTree) {
        if (!joinTree || !joinTree.root || !joinTree.root.relation) {
            throw new Error('Invalid join tree structure');
        }

        console.log('\nStarting optimized Yannakakis processing...');
        
        // Phase 1: Bottom-up semi-joins
        console.log('Performing bottom-up phase...');
        this.bottomUpPhase(joinTree.root);
        
        // Phase 1b: Top-down semi-joins
        console.log('Performing top-down phase...');
        this.topDownPhase(joinTree.root);
        
        // Combined Phases 2 & 3: Join while maintaining reduced relations
        console.log('Performing combined join phase...');
        const result = this.combinedJoinPhase(joinTree.root);
        
        console.log('\nJoin Results:');
        console.log('Attributes:', [...result.attributes]);
        console.log('Tuple Count:', result.tuples.length);
        
        return result;
    }

    static combinedJoinPhase(node) {
        if (!node || !node.relation) return null;

        // Start with current node's relation
        let result = node.relation;

        try {
            // Process and join with children immediately after semi-joins
            if (node.left && node.left.relation) {
                const leftResult = this.combinedJoinPhase(node.left);
                if (leftResult) {
                    result = this.joinRelations(result, leftResult);
                }
            }
            
            if (node.right && node.right.relation) {
                const rightResult = this.combinedJoinPhase(node.right);
                if (rightResult) {
                    result = this.joinRelations(result, rightResult);
                }
            }

            return result;
        } catch (error) {
            console.error('Error in combined join phase:', error);
            return null;
        }
    }
}