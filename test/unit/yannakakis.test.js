// test/unit/yannakakis.test.js
const { Relation, JoinTree, JoinNode } = require('../../src/models/joinTree');
const YannakakisProcessor = require('../../src/processors/yannakakis');

describe('Yannakakis Algorithm', () => {
    test('should process a simple two-way join correctly', () => {
        // Create test relations
        const r1 = new Relation(
            'R1',
            ['id', 'value'],
            [[1, 'a']]
        );
        
        const r2 = new Relation(
            'R2',
            ['id', 'other'],
            [[1, 'x']]
        );

        // Create and test join tree
        const tree = new JoinTree();
        tree.root = new JoinNode(r1);
        tree.root.left = new JoinNode(r2);

        const result = YannakakisProcessor.process(tree);

        expect([...result.attributes]).toEqual(['id', 'value', 'other']);
        expect(result.tuples).toEqual([[1, 'a', 'x']]);
    });

    test('should process a complex join tree correctly', () => {
        // Create test relations
        const r1 = new Relation(
            'R1',
            ['id', 'value'],
            [[1, 'a'], [2, 'b']]
        );
        
        const r2 = new Relation(
            'R2',
            ['id', 'other'],
            [[1, 'x'], [2, 'y']]
        );

        const r3 = new Relation(
            'R3',
            ['id', 'data'],
            [[1, 'p'], [2, 'q']]
        );

        // Create join tree
        const tree = new JoinTree();
        tree.root = new JoinNode(r1);
        tree.root.left = new JoinNode(r2);
        tree.root.right = new JoinNode(r3);

        const result = YannakakisProcessor.process(tree);

        // Verify result
        expect([...result.attributes].sort()).toEqual(['id', 'value', 'other', 'data'].sort());
        
        // Sort tuples for consistent comparison
        const sortedResult = result.tuples.sort((a, b) => a[0] - b[0]);
        const expectedTuples = [
            [1, 'a', 'x', 'p'],
            [2, 'b', 'y', 'q']
        ];
        
        expect(sortedResult).toEqual(expectedTuples);
    });
});