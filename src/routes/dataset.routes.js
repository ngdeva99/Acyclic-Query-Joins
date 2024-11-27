// src/routes/dataset.routes.js
const Joi = require('@hapi/joi');
const { DatasetController } = require('../controllers');

const routes = [
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
        }
    }
];

module.exports = routes;