// src/controllers/joinController.js
const { JoinTree } = require('../models/joinTree');
const YannakakisProcessor = require('../processors/yannakakis');

class JoinController {
    static async processJoinTree(request, h) {
        try {
            // Validate input
            if (!request.payload || !request.payload.joinTree) {
                throw new Error('Invalid request: missing join tree');
            }

            // Create join tree from request
            const joinTree = JoinTree.fromJson(request.payload.joinTree);
            
            // Process the join tree
            const result = YannakakisProcessor.process(joinTree);
            
            // Return result
            return h.response({
                success: true,
                result: {
                    name: result.name,
                    attributes: [...result.attributes],
                    tuples: result.tuples,
                    tupleCount: result.tuples.length
                }
            }).code(200);

        } catch (error) {
            console.error('Error processing join tree:', error);
            return h.response({
                success: false,
                error: error.message
            }).code(500);
        }
    }
}

module.exports = JoinController;