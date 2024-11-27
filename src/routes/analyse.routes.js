const Joi = require('@hapi/joi');
const {AnalyzeController} = require('../controllers');

module.exports = [
    {
        method: 'POST',
        path: '/api/analyze/performance',
        handler: AnalyzeController.analyzePerformance,
        options: {
            tags: ['api', 'analysis'],
            description: 'Analyze join performance',
            notes: 'Generates performance metrics for a completed join operation',
            validate: {
                payload: Joi.object({
                    joinId: Joi.string()
                        .required()
                        .description('ID of the join operation to analyze')
                })
            },
            response: {
                status: {
                    200: Joi.object({
                        executionTime: Joi.number().description('Total execution time in ms'),
                        memoryUsage: Joi.number().description('Peak memory usage in bytes'),
                        intermediateResults: Joi.object({
                            count: Joi.number(),
                            sizes: Joi.array().items(Joi.number())
                        }).description('Statistics about intermediate results')
                    }).description('Performance analysis report')
                }
            }
        }
    }
];