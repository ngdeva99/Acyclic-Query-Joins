const DatasetLoader = require('../../data/DatasetLoader');
const YannakakisProcessor = require('../../src/processors/YannakakisProcessor');
const JoinOptimizer = require('../../src/processors/JoinOptimizer');
const Relation = require('../../src/models/Relation');

describe('Movie Join Integration', () => {
    let relations;

    beforeAll(async () => {
        // Create test relations manually instead of loading from files
        const movieRelation = new Relation('movie', ['id', 'title', 'year']);
        movieRelation.addTuple('1', [1, 'The Matrix', 1999]);
        movieRelation.addTuple('2', [2, 'Inception', 2010]);

        const castRelation = new Relation('cast', ['movie_id', 'actor_id', 'role']);
        castRelation.addTuple('1', [1, 1, 'Neo']);
        castRelation.addTuple('2', [2, 2, 'Cobb']);

        relations = {
            movie: movieRelation,
            cast: castRelation
        };
    });

    test('should join movies with their actors', async () => {
        const joinConditions = [{
            relations: ['movie', 'cast'],
            attributes: {
                movie: 'id',
                cast: 'movie_id'
            }
        }];

        const relationsArray = Object.values(relations);
        const joinTree = JoinOptimizer.optimizeJoinSequence(
            relationsArray,
            joinConditions
        );

        const processor = new YannakakisProcessor();
        const result = await processor.process(joinTree);

        expect(result).toBeDefined();
        expect(result.tuples.size).toBe(2);
        
        // Verify join results
        for (const [_, tuple] of result.tuples) {
            const movieId = tuple[result.attributes.indexOf('id')];
            const movieIdInCast = tuple[result.attributes.indexOf('movie_id')];
            expect(movieId).toBe(movieIdInCast);
        }
    });
});