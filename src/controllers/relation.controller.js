// src/controllers/relation.controller.js
const { Relation } = require('../models');
const Cache = require('../utils/cache');

class RelationController {
    static async createRelation(request, h) {
        try {
            const { name, attributes, tuples } = request.payload;
            const relation = new Relation(name, attributes);
            
            tuples.forEach(({ key, values }) => {
                relation.addTuple(key, values);
            });

            // Use Cache directly instead of calling RelationController
            const cache = Cache.getInstance();
            const relationId = await cache.storeRelation(relation);

            return h.response({
                id: relationId,
                name: relation.name,
                attributes: relation.attributes,
                tupleCount: relation.tuples.size
            }).code(201);
        } catch (error) {
            return h.response({
                error: 'Failed to create relation',
                details: error.message
            }).code(500);
        }
    }

    static async getRelation(request, h) {
        try {
            const { id } = request.params;
            const cache = Cache.getInstance();
            const relation = await cache.retrieveRelation(id);
            
            if (!relation) {
                return h.response({
                    error: 'Relation not found'
                }).code(404);
            }

            return h.response(relation).code(200);
        } catch (error) {
            return h.response({
                error: 'Failed to retrieve relation',
                details: error.message
            }).code(500);
        }
    }

    // Add any additional methods here
}

module.exports = RelationController;