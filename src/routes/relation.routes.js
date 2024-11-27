const Joi = require('@hapi/joi');
const { RelationController } = require('../controllers');

const routes = [
    {
        method: 'POST',
        path: '/api/relations',
        handler: RelationController.createRelation,
        options: {
            validate: {
                payload: Joi.object({
                    name: Joi.string().required(),
                    attributes: Joi.array().items(Joi.string()).required(),
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
                    ).required()
                })
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