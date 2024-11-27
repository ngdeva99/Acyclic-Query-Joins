// src/controllers/dataset.controller.js
const path = require('path');
const fs = require('fs').promises;
const DatasetLoader = require('../../data/DatasetLoader');
const Cache = require('../utils/cache');

class DatasetController {
    /**
     * Load a predefined dataset (e.g., JOB dataset)
     */
    static async loadDataset(request, h) {
        try {
            console.log('Loading dataset:', request.payload);
            const { dataset, tables } = request.payload;
            
            // First check if it's a supported dataset
            if (dataset !== 'JOB') {
                return h.response({
                    error: 'Unsupported dataset',
                    details: 'Currently only supporting JOB dataset'
                }).code(400);
            }

            // Resolve path relative to project root
            const dataPath = path.join(__dirname, '../../data');
            
            // Verify dataset directory exists
            try {
                await fs.access(path.join(dataPath, dataset.toLowerCase()));
            } catch (error) {
                return h.response({
                    error: `Dataset directory ${dataset} not found`,
                    details: 'Available datasets: JOB'
                }).code(404);
            }

            const loader = new DatasetLoader(path.join(dataPath, dataset.toLowerCase()));
            let relations;
            const cache = Cache.getInstance();

            try {
                // Verify requested tables exist
                for (const table of tables) {
                    const filePath = path.join(dataPath, dataset.toLowerCase(), `${table}.csv`);
                    try {
                        await fs.access(filePath);
                    } catch (error) {
                        return h.response({
                            error: `Table file not found: ${table}.csv`,
                            details: 'Please check the table name and try again'
                        }).code(404);
                    }
                }

                relations = await loader.loadJOBDataset(tables);
            } catch (error) {
                console.error('Error loading JOB dataset:', error);
                return h.response({
                    error: 'Failed to load JOB dataset',
                    details: error.message
                }).code(500);
            }

            // Store relations in cache
            const relationIds = await Promise.all(
                Object.entries(relations).map(async ([name, relation]) => {
                    const id = await cache.storeRelation(relation);
                    return {
                        name,
                        id,
                        tupleCount: relation.tuples.size,
                        attributes: relation.attributes
                    };
                })
            );

            console.log('Successfully loaded relations:', relationIds);

            return h.response({
                message: 'Dataset loaded successfully',
                relations: relationIds
            }).code(200);
        } catch (error) {
            console.error('Dataset loading error:', error);
            return h.response({
                error: 'Failed to load dataset',
                details: error.message
            }).code(500);
        }
    }

    /**
     * Upload and process a custom dataset file
     */
    static async uploadDataset(request, h) {
        try {
            console.log('Processing dataset upload');
            const { file, schema } = request.payload;
            
            if (!file) {
                return h.response({
                    error: 'No file provided',
                    details: 'Please provide a CSV file'
                }).code(400);
            }

            // Validate schema
            if (!schema || !schema.name || !schema.attributes || !schema.key) {
                return h.response({
                    error: 'Invalid schema',
                    details: 'Schema must include name, attributes, and key'
                }).code(400);
            }

            // Create uploads directory if it doesn't exist
            const uploadPath = path.join(__dirname, '../../data/uploads');
            try {
                await fs.mkdir(uploadPath, { recursive: true });
            } catch (error) {
                console.error('Error creating upload directory:', error);
                return h.response({
                    error: 'Failed to process upload',
                    details: 'Internal server error'
                }).code(500);
            }

            const loader = new DatasetLoader(uploadPath);
            
            try {
                const relation = await loader.loadRelationFromStream(file, schema);
                
                // Store in cache
                const cache = Cache.getInstance();
                const relationId = await cache.storeRelation(relation);

                console.log('Successfully processed uploaded dataset:', {
                    name: schema.name,
                    tupleCount: relation.tuples.size
                });

                return h.response({
                    message: 'Dataset uploaded and processed successfully',
                    relationId,
                    name: schema.name,
                    tupleCount: relation.tuples.size,
                    attributes: relation.attributes
                }).code(200);

            } catch (error) {
                console.error('Error processing uploaded file:', error);
                return h.response({
                    error: 'Failed to process dataset file',
                    details: error.message
                }).code(400);
            }
        } catch (error) {
            console.error('Dataset upload error:', error);
            return h.response({
                error: 'Failed to upload dataset',
                details: error.message
            }).code(500);
        }
    }

    /**
     * Get information about available datasets
     */
    static async getDatasetInfo(request, h) {
        try {
            const dataPath = path.join(__dirname, '../../data');
            
            // Read available datasets
            const datasets = await fs.readdir(dataPath, { withFileTypes: true });
            const availableDatasets = datasets
                .filter(dirent => dirent.isDirectory() && dirent.name !== 'uploads')
                .map(dirent => dirent.name);

            // Get detailed info for each dataset
            const datasetInfo = await Promise.all(
                availableDatasets.map(async dataset => {
                    const datasetPath = path.join(dataPath, dataset);
                    const files = await fs.readdir(datasetPath);
                    const tables = files
                        .filter(file => file.endsWith('.csv'))
                        .map(file => file.replace('.csv', ''));

                    return {
                        name: dataset.toUpperCase(),
                        tables,
                        description: dataset === 'job' ? 
                            'Join Order Benchmark dataset' : 'Custom dataset',
                        tableCount: tables.length,
                        path: datasetPath
                    };
                })
            );

            return h.response({
                datasets: datasetInfo
            }).code(200);

        } catch (error) {
            console.error('Error getting dataset info:', error);
            return h.response({
                error: 'Failed to get dataset information',
                details: error.message
            }).code(500);
        }
    }

    /**
     * Delete a dataset from cache
     */
    static async deleteDataset(request, h) {
        try {
            const { relationId } = request.params;
            const cache = Cache.getInstance();

            const deleted = await cache.deleteRelation(relationId);
            if (!deleted) {
                return h.response({
                    error: 'Dataset not found',
                    details: `No dataset found with ID: ${relationId}`
                }).code(404);
            }

            return h.response({
                message: 'Dataset deleted successfully',
                relationId
            }).code(200);

        } catch (error) {
            console.error('Error deleting dataset:', error);
            return h.response({
                error: 'Failed to delete dataset',
                details: error.message
            }).code(500);
        }
    }
}

module.exports = DatasetController;