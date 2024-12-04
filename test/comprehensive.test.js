// test/comprehensive.test.js
const { Relation, JoinTree } = require('../src/models/joinTree');
const YannakakisProcessor = require('../src/processors/yannakakis');

class TestSuite {
    static runAllTests() {
        console.log('Starting Comprehensive Test Suite...\n');
        this.testEmptyRelations();
        this.testSingleTupleRelations();
        this.testNoMatchingTuples();
        this.testDuplicateTuples();
        this.testMultiAttributeJoin();
        this.testLargeRelations();
        this.testCyclicJoins();
    }

    static validateResult(testName, actual, expected) {
        const pass = JSON.stringify(actual) === JSON.stringify(expected);
        console.log(`${testName}: ${pass ? 'PASSED' : 'FAILED'}`);
        if (!pass) {
            console.log('Expected:', expected);
            console.log('Actual:', actual);
        }
        console.log('------------------------');
    }

    static testEmptyRelations() {
        console.log('Test Case 1: Empty Relations');
        
        const rel1 = new Relation(
            "R1",
            ["id", "value"],
            []
        );

        const rel2 = new Relation(
            "R2",
            ["id", "data"],
            []
        );

        const joinTree = new JoinTree();
        joinTree.root.relation = rel1;
        joinTree.root.left = { relation: rel2 };

        const result = YannakakisProcessor.process(joinTree);
        
        this.validateResult(
            'Empty Relations Test',
            result.tuples,
            []
        );
    }

    static testSingleTupleRelations() {
        console.log('Test Case 2: Single Tuple Relations');
        
        const rel1 = new Relation(
            "R1",
            ["id", "value"],
            [[1, "A"]]
        );

        const rel2 = new Relation(
            "R2",
            ["id", "data"],
            [[1, "X"]]
        );

        const joinTree = new JoinTree();
        joinTree.root.relation = rel1;
        joinTree.root.left = { relation: rel2 };

        const result = YannakakisProcessor.process(joinTree);
        
        this.validateResult(
            'Single Tuple Test',
            result.tuples,
            [[1, "A", "X"]]
        );
    }

    static testNoMatchingTuples() {
        console.log('Test Case 3: No Matching Tuples');
        
        const rel1 = new Relation(
            "R1",
            ["id", "value"],
            [[1, "A"], [2, "B"]]
        );

        const rel2 = new Relation(
            "R2",
            ["id", "data"],
            [[3, "X"], [4, "Y"]]
        );

        const joinTree = new JoinTree();
        joinTree.root.relation = rel1;
        joinTree.root.left = { relation: rel2 };

        const result = YannakakisProcessor.process(joinTree);
        
        this.validateResult(
            'No Matching Tuples Test',
            result.tuples,
            []
        );
    }

    static testDuplicateTuples() {
        console.log('Test Case 4: Duplicate Tuples');
        
        const rel1 = new Relation(
            "R1",
            ["id", "value"],
            [[1, "A"], [1, "A"]]  // Duplicate tuple
        );

        const rel2 = new Relation(
            "R2",
            ["id", "data"],
            [[1, "X"], [1, "X"]]  // Duplicate tuple
        );

        const joinTree = new JoinTree();
        joinTree.root.relation = rel1;
        joinTree.root.left = { relation: rel2 };

        const result = YannakakisProcessor.process(joinTree);
        
        this.validateResult(
            'Duplicate Tuples Test',
            result.tuples,
            [[1, "A", "X"]]  // Should eliminate duplicates
        );
    }

    static testMultiAttributeJoin() {
        console.log('Test Case 5: Multi-Attribute Join');
        
        const rel1 = new Relation(
            "R1",
            ["id1", "id2", "value"],
            [[1, 2, "A"], [2, 3, "B"]]
        );

        const rel2 = new Relation(
            "R2",
            ["id1", "id2", "data"],
            [[1, 2, "X"], [2, 4, "Y"]]
        );

        const joinTree = new JoinTree();
        joinTree.root.relation = rel1;
        joinTree.root.left = { relation: rel2 };

        const result = YannakakisProcessor.process(joinTree);
        
        this.validateResult(
            'Multi-Attribute Join Test',
            result.tuples,
            [[1, 2, "A", "X"]]
        );
    }

    static testLargeRelations() {
        console.log('Test Case 6: Large Relations Performance Test');
        
        // Create large relations
        const rel1Tuples = Array.from({ length: 1000 }, (_, i) => [i, `value${i}`]);
        const rel2Tuples = Array.from({ length: 1000 }, (_, i) => [i, `data${i}`]);

        const rel1 = new Relation("R1", ["id", "value"], rel1Tuples);
        const rel2 = new Relation("R2", ["id", "data"], rel2Tuples);

        const joinTree = new JoinTree();
        joinTree.root.relation = rel1;
        joinTree.root.left = { relation: rel2 };

        const startTime = process.hrtime();
        const result = YannakakisProcessor.process(joinTree);
        const [seconds, nanoseconds] = process.hrtime(startTime);
        
        console.log(`Large Relations Test: ${seconds}s ${nanoseconds/1000000}ms`);
        console.log(`Result size: ${result.tuples.length} tuples`);
        this.validateResult(
            'Large Relations Size Test',
            result.tuples.length,
            1000
        );
    }

    static testCyclicJoins() {
        console.log('Test Case 7: Cyclic Joins');
        
        // Create relations forming a cycle
        const rel1 = new Relation(
            "R1",
            ["id1", "id2"],
            [[1, 2], [2, 3], [3, 4]]
        );

        const rel2 = new Relation(
            "R2",
            ["id2", "id3"],
            [[2, 3], [3, 4], [4, 1]]
        );

        const rel3 = new Relation(
            "R3",
            ["id3", "id1"],
            [[3, 1], [4, 2], [1, 3]]
        );

        const joinTree = new JoinTree();
        joinTree.root.relation = rel1;
        joinTree.root.left = { relation: rel2 };
        joinTree.root.right = { relation: rel3 };

        const result = YannakakisProcessor.process(joinTree);
        
        this.validateResult(
            'Cyclic Joins Test',
            result.tuples.length > 0,
            true
        );
    }
}

// Run all tests
TestSuite.runAllTests();