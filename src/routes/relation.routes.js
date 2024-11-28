const Joi = require('@hapi/joi');
const { RelationController } = require('../controllers');

const routes = [
    {
        method: 'POST',
        path: '/api/relations',
        handler: RelationController.createRelation,
        options: {
            tags: ['api', 'relations'],
            description: 'Create a new relation',
            notes: 'Creates a new relation with specified attributes and tuples',
            validate: {
                payload: Joi.object({
                    name: Joi.string().required().description('Name of the relation'),
                    attributes: Joi.array().items(Joi.string()).required().description('List of attribute names'),
                    tuples: Joi.array().items(
                        Joi.object({
                            key: Joi.string().required(),
                            values: Joi.array().items(
                                Joi.alternatives().try(
                                    Joi.string(),
                                    Joi.number(),
                                    Joi.allow(null)
                                )
                            ).required()
                        })
                    ).required().description('Array of tuples')
                })
            },
            response: {
                status: {
                    201: Joi.object({
                        id: Joi.string(),
                        name: Joi.string(),
                        attributes: Joi.array().items(Joi.string()),
                        tupleCount: Joi.number()
                    }).description('Successfully created relation'),
                    400: Joi.object({
                        error: Joi.string(),
                        details: Joi.string()
                    }).description('Bad Request'),
                    500: Joi.object({
                        error: Joi.string(),
                        details: Joi.string()
                    }).description('Internal server error')
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/relations/{id}',
        handler: RelationController.getRelation,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().required()
                })
            }
        }
    }
];

module.exports = routes;