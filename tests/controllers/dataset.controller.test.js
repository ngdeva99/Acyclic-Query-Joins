// tests/controllers/dataset.controller.test.js
const DatasetController = require('../../src/controllers/dataset.controller');
const Cache = require('../../src/utils/cache');

describe('DatasetController', () => {
    let mockH;
    let mockCache;

    beforeEach(() => {
        // Mock response object
        mockH = {
            response: jest.fn().mockReturnThis(),
            code: jest.fn().mockReturnThis()
        };

        // Mock cache
        mockCache = {
            storeRelation: jest.fn().mockResolvedValue('test_relation_id')
        };

        // Mock Cache.getInstance
        jest.spyOn(Cache, 'getInstance').mockReturnValue(mockCache);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('loadDataset', () => {
        test('should successfully load JOB dataset', async () => {
            const request = {
                payload: {
                    dataset: 'JOB',
                    tables: ['movie', 'cast']
                }
            };

            await DatasetController.loadDataset(request, mockH);

            expect(mockH.response).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Dataset loaded successfully',
                    relations: expect.any(Array)
                })
            );
            expect(mockH.code).toHaveBeenCalledWith(200);
        });

        test('should return 400 for unsupported dataset', async () => {
            const request = {
                payload: {
                    dataset: 'INVALID',
                    tables: ['table1']
                }
            };

            await DatasetController.loadDataset(request, mockH);

            expect(mockH.response).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Unsupported dataset',
                    details: expect.stringContaining('JOB')
                })
            );
            expect(mockH.code).toHaveBeenCalledWith(400);
        });

        test('should return 404 for non-existent tables', async () => {
            const request = {
                payload: {
                    dataset: 'JOB',
                    tables: ['nonexistent_table']
                }
            };

            await DatasetController.loadDataset(request, mockH);

            expect(mockH.response).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('not found'),
                    details: expect.any(String)
                })
            );
            expect(mockH.code).toHaveBeenCalledWith(404);
        });
    });

    describe('uploadDataset', () => {
        test('should successfully upload dataset', async () => {
            const request = {
                payload: {
                    file: {
                        pipe: jest.fn(),
                        on: jest.fn()
                    },
                    schema: {
                        name: 'test',
                        attributes: ['id', 'name'],
                        key: 'id'
                    }
                }
            };

            await DatasetController.uploadDataset(request, mockH);

            expect(mockH.response).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Dataset uploaded and processed successfully',
                    relationId: expect.any(String)
                })
            );
            expect(mockH.code).toHaveBeenCalledWith(200);
        });

        test('should return 400 for missing file', async () => {
            const request = {
                payload: {
                    schema: {
                        name: 'test',
                        attributes: ['id', 'name'],
                        key: 'id'
                    }
                }
            };

            await DatasetController.uploadDataset(request, mockH);

            expect(mockH.response).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'No file provided',
                    details: expect.any(String)
                })
            );
            expect(mockH.code).toHaveBeenCalledWith(400);
        });

        test('should return 400 for invalid schema', async () => {
            const request = {
                payload: {
                    file: {
                        pipe: jest.fn(),
                        on: jest.fn()
                    },
                    schema: {
                        name: 'test'
                        // missing attributes and key
                    }
                }
            };

            await DatasetController.uploadDataset(request, mockH);

            expect(mockH.response).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('schema'),
                    details: expect.any(String)
                })
            );
            expect(mockH.code).toHaveBeenCalledWith(400);
        });
    });

    describe('getDatasetInfo', () => {
        test('should return available datasets info', async () => {
            const request = {};

            await DatasetController.getDatasetInfo(request, mockH);

            expect(mockH.response).toHaveBeenCalledWith(
                expect.objectContaining({
                    datasets: expect.arrayContaining([
                        expect.objectContaining({
                            name: expect.any(String),
                            tables: expect.any(Array),
                            description: expect.any(String)
                        })
                    ])
                })
            );
            expect(mockH.code).toHaveBeenCalledWith(200);
        });
    });
});