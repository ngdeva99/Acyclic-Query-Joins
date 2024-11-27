const JoinController = require('../../src/controllers/join.controller');
const Cache = require('../../src/utils/cache');
const Relation = require('../../src/models/Relation');

describe('JoinController', () => {
    const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn().mockReturnThis()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup test data in cache
        const cache = Cache.getInstance();
        
        const movieRelation = new Relation('movie', ['id', 'title']);
        movieRelation.addTuple('1', [1, 'Test Movie']);
        
        const castRelation = new Relation('cast', ['movie_id', 'actor_id']);
        castRelation.addTuple('1', [1, 1]);
        
        // Store test relations in cache
        cache.storeRelation(movieRelation).then(id => {
            global.testRelId1 = id;
        });
        cache.storeRelation(castRelation).then(id => {
            global.testRelId2 = id;
        });
    });

    test('should perform join operation', async () => {
        const request = {
            payload: {
                relations: [global.testRelId1, global.testRelId2],
                joinConditions: [{
                    relations: ['movie', 'cast'],
                    attributes: {
                        movie: 'id',
                        cast: 'movie_id'
                    }
                }]
            }
        };

        await JoinController.performJoin(request, mockH);
        expect(mockH.response).toHaveBeenCalled();
        expect(mockH.code).toHaveBeenCalledWith(200);
    });
});