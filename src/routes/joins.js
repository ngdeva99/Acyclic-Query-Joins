const JoinController = require('../controllers/joinController');
const Joi = require('@hapi/joi');

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
                            performance: Joi.object().optional()
                        }).required(),
                        left: Joi.object().optional(),
                        right: Joi.object().optional()
                    }).required()
                })
            }
        },
        handler: JoinController.processJoinTree
    }
];