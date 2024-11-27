const relationRoutes = require('./relation.routes');
const joinRoutes = require('./join.routes');
const datasetRoutes = require('./dataset.routes');
const analyzeRoutes = require('./analyse.routes');

module.exports = [
    ...relationRoutes,
    ...joinRoutes,
    ...datasetRoutes,
    ...analyzeRoutes
];