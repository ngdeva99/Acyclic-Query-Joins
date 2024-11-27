// File: src/index.js
/**
 * @fileoverview Main entry point for the Yannakakis algorithm implementation
 * @module yannakakis-algorithm
 */

const YannakakisProcessor = require('./src/processors/YannakakisProcessor');
const DatasetLoader = require('./data/DatasetLoader');
const JoinOptimizer = require('./src/processors/JoinOptimizer');

/**
 * Process a join query using the Yannakakis algorithm
 * @param {Object} config - Configuration object
 * @param {string} config.dataDir - Directory containing dataset files
 * @param {string[]} config.relations - List of relations to join
 * @param {Object[]} config.joinConditions - Join conditions
 * @returns {Promise<Relation>} The join result
 */
async function processJoinQuery(config) {
  const loader = new DatasetLoader(config.dataDir);
  const relations = await loader.loadJOBDataset(config.relations);
  
  const joinTree = JoinOptimizer.optimizeJoinSequence(
    Object.values(relations),
    config.joinConditions
  );

  const processor = new YannakakisProcessor();
  return processor.process(joinTree);
}

module.exports = {
  processJoinQuery,
  YannakakisProcessor,
  DatasetLoader,
  JoinOptimizer
};