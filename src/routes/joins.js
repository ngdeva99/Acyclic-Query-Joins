const { orderBy } = require('lodash');
const JoinController = require('../controllers/joinController');
const Joi = require('@hapi/joi');
const selectionOperators = ['=', '>', '<', '>=', '<=', 'IN', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL'];

module.exports = [
    {
        method: 'POST',
        path: '/api/join',
        options: {
            validate: {
                payload: Joi.object({
                    joinTree: Joi.object({
                        relation: Joi.object({
                            name: Joi.string().required(),
                            attributes: Joi.array().items(Joi.string()).required(),
                            tuples: Joi.array().items(Joi.array()).required(),
                            selections: Joi.array().items(
                                Joi.object({
                                    attribute: Joi.string().required(),
                                    operator: Joi.string().valid(...selectionOperators).required(),
                                    value: Joi.alternatives().conditional('operator', {
                                        switch: [
                                            {
                                                is: 'BETWEEN',
                                                then: Joi.array().length(2).required()
                                            },
                                            {
                                                is: 'IN',
                                                then: Joi.array().min(1).required()
                                            },
                                            {
                                                is: Joi.valid('IS NULL', 'IS NOT NULL'),
                                                then: Joi.forbidden()
                                            },
                                            {
                                                is: 'LIKE',
                                                then: Joi.string().required()
                                            },
                                            {
                                                is: Joi.valid('=', '>', '<', '>=', '<='),
                                                then: Joi.alternatives().try(
                                                    Joi.string(),
                                                    Joi.number(),
                                                    Joi.date()
                                                ).required()
                                            }
                                        ]
                                    })
                                })
                            ).optional(),
                            performance: Joi.object().optional()
                        }).required(),
                        left: Joi.object().optional(),
                        right: Joi.object().optional(),
                        projections: Joi.array().items(Joi.string()).optional(),
                        orderBy: Joi.array().items().optional()
                    }).required()
                })
            }
        },
        handler: JoinController.processJoinTree
    }
];