const JoinOptimizer = require('../../src/processors/JoinOptimizer');
const Relation = require('../../src/models/Relation');
const JoinTree = require('../../src/models/JoinTree');

describe('JoinOptimizer', () => {
    let relations;
    let joinConditions;

    beforeEach(() => {
        // Create test relations
        const movieRelation = new Relation('movie', ['id', 'title']);
        movieRelation.addTuple('1', [1, 'Movie 1']);
        movieRelation.addTuple('2', [2, 'Movie 2']);

        const castRelation = new Relation('cast', ['movie_id', 'actor_id']);
        castRelation.addTuple('1', [1, 1]);
        castRelation.addTuple('2', [2, 2]);

        const actorRelation = new Relation('actor', ['id', 'name']);
        actorRelation.addTuple('1', [1, 'Actor 1']);
        actorRelation.addTuple('2', [2, 'Actor 2']);

        relations = [movieRelation, castRelation, actorRelation];
        
        // Create join conditions
        joinConditions = [
            {
                relations: ['movie', 'cast'],
                attributes: {
                    movie: 'id',
                    cast: 'movie_id'
                }
            },
            {
                relations: ['cast', 'actor'],
                attributes: {
                    cast: 'actor_id',
                    actor: 'id'
                }
            }
        ];
    });

    test('should create valid join tree', () => {
        const joinTree = JoinOptimizer.optimizeJoinSequence(relations, joinConditions);
        
        expect(joinTree).toBeInstanceOf(JoinTree);
        expect(joinTree.children.length).toBeGreaterThan(0);
        expect(joinTree.joinAttributes.length).toBeGreaterThan(0);
    });

    test('should detect cyclic joins', () => {
        // Create a cyclic join condition
        const cyclicJoinConditions = [
            ...joinConditions,
            {
                relations: ['movie', 'actor'],
                attributes: {
                    movie: 'id',
                    actor: 'id'
                }
            }
        ];

        expect(() => {
            JoinOptimizer.optimizeJoinSequence(relations, cyclicJoinConditions);
        }).toThrow('Only acyclic joins are supported');
    });

    test('should optimize join order based on selectivity', () => {
        const joinTree = JoinOptimizer.optimizeJoinSequence(relations, joinConditions);
        const cost = JoinOptimizer.estimateJoinTreeCost(joinTree);
        
        expect(cost).toBeGreaterThan(0);
        expect(typeof cost).toBe('number');
    });
});