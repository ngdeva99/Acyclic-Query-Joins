// src/controllers/join.controller.js
const { YannakakisProcessor } = require('../processors');
const { JoinOptimizer } = require('../processors');
const Cache = require('../utils/cache');

class JoinController {
    static async performJoin(request, h) {
        try {
            const { relations: relationIds, joinConditions } = request.payload;
            const cache = Cache.getInstance();
            
            // Retrieve relations from cache
            const relations = await Promise.all(
                relationIds.map(async (id) => {
                    const relation = await cache.retrieveRelation(id);
                    if (!relation) {
                        throw new Error(`Relation not found with id: ${id}`);
                    }
                    return relation;
                })
            );

            // Build and optimize join tree
            const joinTree = JoinOptimizer.optimizeJoinSequence(
                relations,
                joinConditions
            );

            // Process join
            const processor = new YannakakisProcessor();
            const result = await processor.process(joinTree);

            // Store result
            const joinId = await cache.storeJoinResult(result);

            return h.response({
                joinId,
                tupleCount: result.tuples.size,
                attributes: result.attributes
            }).code(200);
        } catch (error) {
            console.error('Join error:', error);
            return h.response({
                error: 'Failed to perform join',
                details: error.message
            }).code(500);
        }
    }
}

module.exports = JoinController;