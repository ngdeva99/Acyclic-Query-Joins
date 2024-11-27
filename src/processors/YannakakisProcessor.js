const { performance } = require('perf_hooks');
const Relation = require('../models/Relation');

class YannakakisProcessor {
  constructor() {
    this.relations = new Map();
    this.performanceMetrics = {
      semiJoinTime: 0,
      indexBuildTime: 0,
      memoryUsage: []
    };
  }

  async process(joinTree) {
    // Bottom-up phase
    await this.reducePhase(joinTree);
    
    // Top-down phase
    return this.joinPhase(joinTree);
  }

  async reducePhase(tree) {
    // Process children first
    for (const child of tree.children) {
      await this.reducePhase(child);
    }

    // Perform semi-joins with children
    for (const child of tree.children) {
      const reduced = await this.performSemiJoin(tree.node, child.node);
      tree.node = reduced;
    }
  }

  async joinPhase(tree) {
    let result = tree.node;

    // Join with each child's result
    for (const child of tree.children) {
      const childResult = await this.joinPhase(child);
      result = await this.performNaturalJoin(result, childResult);
    }

    return result;
  }

  async performSemiJoin(r1, r2) {
    const startTime = performance.now();
    const result = new Relation(r1.name, r1.attributes);
    
    // Find common attributes
    const commonAttributes = r1.getJoinAttributes(r2);
    
    // Create indices if needed
    for (const attr of commonAttributes) {
      if (!r2.indices.has(attr)) {
        const indexStartTime = performance.now();
        r2.createIndex(attr);
        this.performanceMetrics.indexBuildTime += performance.now() - indexStartTime;
      }
    }

    // Perform semi-join using indices
    for (const [key, tuple] of r1.tuples) {
      if (await this.hasMatchingTuple(tuple, r1, r2, commonAttributes)) {
        result.addTuple(key, tuple);
      }
    }

    // Update metrics
    this.performanceMetrics.semiJoinTime += performance.now() - startTime;
    this.performanceMetrics.memoryUsage.push(process.memoryUsage().heapUsed);
    
    return result;
  }

  async hasMatchingTuple(tuple, r1, r2, commonAttributes) {
    for (const attr of commonAttributes) {
      const attrIndex = r1.attributes.indexOf(attr);
      const value = tuple[attrIndex];
      const index = r2.indices.get(attr);
      
      if (!index.has(value)) {
        return false;
      }
    }
    return true;
  }

  async performNaturalJoin(r1, r2) {
    const commonAttributes = r1.getJoinAttributes(r2);
    const resultAttributes = [...r1.attributes];
    
    // Add non-common attributes from r2
    r2.attributes.forEach(attr => {
      if (!commonAttributes.includes(attr)) {
        resultAttributes.push(attr);
      }
    });

    const result = new Relation(`${r1.name}_${r2.name}`, resultAttributes);

    // Create indices for join if needed
    for (const attr of commonAttributes) {
      if (!r2.indices.has(attr)) {
        r2.createIndex(attr);
      }
    }

    // Perform join
    for (const [key1, tuple1] of r1.tuples) {
      const matches = await this.findMatches(tuple1, r1, r2, commonAttributes);
      for (const tuple2 of matches) {
        const newTuple = [...tuple1];
        r2.attributes.forEach((attr, i) => {
          if (!commonAttributes.includes(attr)) {
            newTuple.push(tuple2[i]);
          }
        });
        result.addTuple(`${key1}_${tuple2[0]}`, newTuple);
      }
    }

    return result;
  }

  async findMatches(tuple1, r1, r2, commonAttributes) {
    const matches = [];
    const matchingSets = commonAttributes.map(attr => {
      const value = tuple1[r1.attributes.indexOf(attr)];
      return r2.indices.get(attr).get(value) || new Set();
    });

    if (matchingSets.length === 0) return matches;

    // Find intersection of all matching tuple sets
    const intersection = [...matchingSets[0]].filter(key => {
      return matchingSets.every(set => set.has(key));
    });

    // Get actual tuples
    for (const key of intersection) {
      matches.push(r2.tuples.get(key));
    }

    return matches;
  }
}

module.exports = YannakakisProcessor;