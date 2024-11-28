// src/routes/dataset.routes.js
const Joi = require('@hapi/joi');
const { DatasetController } = require('../controllers');

const routes = [
    // src/routes/dataset.routes.js
    {
        method: 'POST',
        path: '/api/datasets/load',
        handler: DatasetController.loadDataset,
        options: {
            validate: {
                payload: Joi.object({
                    dataset: Joi.string().valid('JOB').required(),
                    tables: Joi.array().items(Joi.string()).required()
                })
            },
            response: {
                status: {
                    200: Joi.object({
                        message: Joi.string(),
                        relations: Joi.array().items(
                            Joi.object({
                                name: Joi.string(),
                                id: Joi.string(),
                                tupleCount: Joi.number(),
                                attributes: Joi.array().items(Joi.string())
                            })
                        )
                    }),
                    400: Joi.object({
                        error: Joi.string(),
                        details: Joi.string()
                    }),
                    404: Joi.object({
                        error: Joi.string(),
                        details: Joi.string()
                    })
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/datasets/upload',
        handler: DatasetController.uploadDataset,
        options: {
            payload: {
                output: 'stream',
                parse: true,
                multipart: true,
                maxBytes: 1000 * 1000 * 5 // 5MB limit
            },
            validate: {
                payload: Joi.object({
                    file: Joi.any().required(),
                    schema: Joi.object({
                        name: Joi.string().required(),
                        attributes: Joi.array().items(Joi.string()).required(),
                        key: Joi.string().required()
                    }).required()
                })
            }
        },
        validate: {
            payload: Joi.object({
                file: Joi.any().required(),
                schema: Joi.object({
                    name: Joi.string().min(1).max(100).required(),
                    attributes: Joi.array().items(
                        Joi.string().min(1).max(100)
                    ).min(1).required(),
                    key: Joi.string().min(1).max(100).required()
                }).required()
            })
}
    }
];

module.exports = routes;