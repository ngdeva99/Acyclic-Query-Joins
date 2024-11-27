class JoinTree {
    constructor(node, children = [], joinAttributes = []) {
      this.node = node;
      this.children = children;
      this.joinAttributes = joinAttributes;
      this.statistics = {
        depth: this.calculateDepth(),
        nodeCount: this.calculateNodeCount(),
        maxFanout: this.calculateMaxFanout()
      };
    }
  
    calculateDepth() {
      if (this.children.length === 0) return 0;
      return 1 + Math.max(...this.children.map(child => child.calculateDepth()));
    }
  
    calculateNodeCount() {
      return 1 + this.children.reduce((sum, child) => sum + child.calculateNodeCount(), 0);
    }
  
    calculateMaxFanout() {
      const childFanouts = this.children.map(child => child.calculateMaxFanout());
      return Math.max(this.children.length, ...childFanouts);
    }
  
    optimize() {
      // Create indices for join attributes
      this.createIndices();
      
      // Reorder children based on estimated costs
      this.reorderChildren();
      
      // Recursively optimize children
      this.children.forEach(child => child.optimize());
    }
  
    createIndices() {
      // Create indices for all join attributes in this node
      this.joinAttributes.forEach(attr => {
        if (!this.node.indices.has(attr)) {
          this.node.createIndex(attr);
        }
      });
    }
  
    reorderChildren() {
      this.children.sort((a, b) => {
        const costA = this.estimateJoinCost(a);
        const costB = this.estimateJoinCost(b);
        return costA - costB;
      });
    }
  
    estimateJoinCost(child) {
      const commonAttrs = this.joinAttributes.filter(attr =>
        child.node.attributes.includes(attr)
      );
      
      let selectivity = 1;
      for (const attr of commonAttrs) {
        selectivity *= this.calculateSelectivity(attr, child);
      }
      
      return child.node.tuples.size * selectivity;
    }
  
    calculateSelectivity(attribute, child) {
      const parentStats = this.node.statistics.attributeStats.get(attribute);
      const childStats = child.node.statistics.attributeStats.get(attribute);
      
      if (!parentStats || !childStats) return 1;
      
      const distinctValues = Math.max(parentStats.distinctValues, childStats.distinctValues);
      return 1 / distinctValues;
    }
  }
  
  module.exports = JoinTree;