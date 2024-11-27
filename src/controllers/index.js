// src/controllers/index.js
const RelationController = require('./relation.controller');
const JoinController = require('./join.controller');
const DatasetController = require('./dataset.controller');
const AnalyzeController = require('./analyze.controller');

module.exports = {
    RelationController,
    JoinController,
    DatasetController,
    AnalyzeController
};