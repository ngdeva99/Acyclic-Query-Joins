// File: src/swagger.js
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');

const swaggerOptions = {
    info: {
        title: 'Yannakakis Algorithm API Documentation',
        version: '1.0.0',
        description: 'API documentation for the Yannakakis algorithm implementation',
        contact: {
            name: 'API Support',
            email: 'support@example.com'
        }
    },
    grouping: 'tags',
    sortEndpoints: 'ordered'
};

module.exports = {
    name: 'swagger-plugin',
    register: async function(server) {
        await server.register([
            Inert,
            Vision,
            {
                plugin: HapiSwagger,
                options: swaggerOptions
            }
        ]);
    }
};