const JoinTree = require('../../src/models/JoinTree');
const Relation = require('../../src/models/Relation');

describe('JoinTree', () => {
    let movieRelation, castRelation;
    let joinTree;

    beforeEach(() => {
        movieRelation = new Relation('movie', ['id', 'title']);
        castRelation = new Relation('cast', ['movie_id', 'actor_id']);
        
        movieRelation.addTuple('1', [1, 'The Matrix']);
        castRelation.addTuple('1', [1, 101]);

        joinTree = new JoinTree(
            movieRelation,
            [new JoinTree(castRelation)],
            ['id']
        );
    });

    test('should calculate tree statistics correctly', () => {
        expect(joinTree.statistics.depth).toBe(1);
        expect(joinTree.statistics.nodeCount).toBe(2);
        expect(joinTree.statistics.maxFanout).toBe(1);
    });

    test('should optimize join order', () => {
        joinTree.optimize();
        expect(joinTree.node).toBe(movieRelation);
        expect(joinTree.children[0].node).toBe(castRelation);
    });
});