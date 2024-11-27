const Joi = require('@hapi/joi');
const {JoinController} = require('../controllers');
module.exports = [
    {
        method: 'POST',
        path: '/api/join',
        handler: JoinController.performJoin,
        options: {
            tags: ['api', 'joins'],
            description: 'Perform a join operation using the Yannakakis algorithm',
            notes: `
                Executes a join operation between two or more relations using the Yannakakis algorithm.
                The algorithm processes acyclic joins efficiently in two phases:
                1. Bottom-up semi-join reduction
                2. Top-down join computation
            `,
            validate: {
                payload: Joi.object({
                    relations: Joi.array()
                        .items(Joi.string())
                        .min(2)
                        .required()
                        .description('Array of relation IDs to join'),
                    joinConditions: Joi.array()
                        .items(
                            Joi.object({
                                relations: Joi.array()
                                    .items(Joi.string())
                                    .length(2)
                                    .required()
                                    .description('Pair of relation names to join'),
                                attributes: Joi.object()
                                    .pattern(
                                        /.*/,
                                        Joi.string()
                                    )
                                    .required()
                                    .description('Mapping of relation names to join attributes')
                            })
                        )
                        .required()
                        .description('Array of join conditions')
                }),
                failAction: 'error'
            },
            response: {
                status: {
                    200: Joi.object({
                        joinId: Joi.string().description('Join result ID'),
                        tupleCount: Joi.number().description('Number of resulting tuples'),
                        attributes: Joi.array().items(Joi.string()).description('Result attributes')
                    }).description('Successfully performed join'),
                    500: Joi.object({
                        error: Joi.string(),
                        details: Joi.string()
                    }).description('Internal server error')
                }
            }
        }
    }
];