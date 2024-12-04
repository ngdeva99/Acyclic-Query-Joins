// src/controllers/joinController.js
const { JoinTree } = require('../models/joinTree');
const YannakakisProcessor = require('../processors/yannakakis');
const _ = require('lodash');

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
            const startTime = process.hrtime();
            const result = YannakakisProcessor.process(joinTree);

            const [seconds, nanoseconds] = process.hrtime(startTime);

            console.log(`Query execution time: ${seconds}s ${nanoseconds/1000000}ms`);
            console.log(`Result size: ${result.tuples.length} tuples`);
            console.log('Sample results:', result.tuples.slice(0, 3));

            const performanceAttributes = {
                query_execution_time: `${seconds}s ${nanoseconds/1000000}ms`,
                result_size: `${result.tuples.length} tuples`,
                sample_results: result.tuples.slice(0, 3),
                memory_usage: YannakakisProcessor.logMemoryUsage()
            }
            

            // Return result
            return h.response({
                success: true,
                result: {
                    name: result.name,
                    attributes: [...result.attributes],
                    performance: performanceAttributes,
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