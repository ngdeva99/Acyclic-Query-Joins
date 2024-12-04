// src/routes/test.js
const Joi = require('@hapi/joi');
const MovieLensTestSuite = require('../../test/largeScaleTest');

const routes = [
    {
        method: 'POST',
        path: '/api/test/movielens',
        options: {
            description: 'Run MovieLens test suite',
            tags: ['api', 'test'],
            validate: {
                payload: Joi.object({
                    queryNumbers: Joi.array().items(Joi.number().min(1).max(6)).default([1,2,3,4,5,6])
                })
            },
            handler: async (request, h) => {
                try {
                    const testSuite = new MovieLensTestSuite();
                    const results = {
                        dataLoading: {},
                        queries: {},
                        memoryUsage: {}
                    };

                    // Load data and capture timing
                    const loadStart = process.hrtime();
                    await testSuite.loadData();
                    const [loadSeconds, loadNanos] = process.hrtime(loadStart);
                    results.dataLoading = {
                        time: `${loadSeconds}s ${loadNanos/1000000}ms`,
                        relations: Object.keys(testSuite.relations).map(key => ({
                            name: key,
                            recordCount: testSuite.relations[key].tuples.length
                        }))
                    };

                    // Run selected queries
                    for (const queryNum of request.payload.queryNumbers) {
                        const queryMethod = `runQuery${queryNum}`;
                        if (typeof testSuite[queryMethod] === 'function') {
                            const queryStart = process.hrtime();
                            const queryResult = await testSuite[queryMethod]();
                            const [querySeconds, queryNanos] = process.hrtime(queryStart);
                            
                            results.queries[`query${queryNum}`] = {
                                executionTime: `${querySeconds}s ${queryNanos/1000000}ms`,
                                resultSize: queryResult?.tuples?.length || 0,
                                sampleResults: queryResult?.tuples?.slice(0, 3) || []
                            };
                        }
                    }

                    // Capture final memory usage
                    const used = process.memoryUsage();
                    results.memoryUsage = {
                        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
                        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
                        rss: `${Math.round(used.rss / 1024 / 1024)} MB`
                    };

                    return h.response(results).code(200);
                } catch (error) {
                    console.error('Test execution error:', error);
                    return h.response({
                        error: 'Test execution failed',
                        message: error.message,
                        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                    }).code(500);
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/test/status',
        handler: (request, h) => {
            return {
                status: 'available',
                environment: process.env.NODE_ENV,
                chunkSize: process.env.CHUNK_SIZE,
                dataDir: process.env.DATA_DIR
            };
        }
    }
];

module.exports = routes;