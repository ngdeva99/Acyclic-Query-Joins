class JoinTree {
  constructor(node, children = [], joinAttributes = [], joinConditions = []) {
      if (!node) {
          throw new Error('JoinTree node cannot be null');
      }
      this.node = node;
      this.children = children;
      this.joinAttributes = joinAttributes;
      this.joinConditions = joinConditions;
      this.statistics = {
          depth: this.calculateDepth(),
          nodeCount: this.calculateNodeCount(),
          maxFanout: this.calculateMaxFanout()
      };
      this.validate();
  }

  validate() {
      if (!Array.isArray(this.children)) {
          throw new Error('Children must be an array');
      }
      if (!Array.isArray(this.joinAttributes)) {
          throw new Error('Join attributes must be an array');
      }
      if (!Array.isArray(this.joinConditions)) {
          throw new Error('Join conditions must be an array');
      }
  }

  calculateDepth() {
      if (this.children.length === 0) return 0;
      return 1 + Math.max(...this.children.map(child => child.calculateDepth()));
  }

  calculateNodeCount() {
      return 1 + this.children.reduce((sum, child) => sum + child.calculateNodeCount(), 0);
  }

  calculateMaxFanout() {
      if (this.children.length === 0) return 0;
      const childFanouts = this.children.map(child => child.calculateMaxFanout());
      return Math.max(this.children.length, ...childFanouts);
  }

  optimize() {
      try {
          // Create indices for join attributes
          this.createIndices();
          
          // Reorder children based on estimated costs
          this.reorderChildren();
          
          // Recursively optimize children
          this.children.forEach(child => child.optimize());
      } catch (error) {
          console.error('Error during join tree optimization:', error);
          throw error;
      }
  }

  createIndices() {
      try {
          // Create indices for all join attributes in this node
          const attributes = this.getJoinAttributesForNode();
          attributes.forEach(attr => {
              if (!this.node.indices.has(attr)) {
                  this.node.createIndex(attr);
              }
          });
      } catch (error) {
          console.error('Error creating indices:', error);
          throw error;
      }
  }

  getJoinAttributesForNode() {
      // Get all join attributes for this node from join conditions
      const attributes = new Set();
      this.joinConditions.forEach(condition => {
          if (condition.relations.includes(this.node.name)) {
              attributes.add(condition.attributes[this.node.name]);
          }
      });
      return Array.from(attributes);
  }

  reorderChildren() {
      try {
          if (this.children.length <= 1) return;

          this.children.sort((a, b) => {
              const costA = this.estimateJoinCost(a);
              const costB = this.estimateJoinCost(b);
              return costA - costB;
          });
      } catch (error) {
          console.error('Error reordering children:', error);
          throw error;
      }
  }

  estimateJoinCost(child) {
      try {
          // Get relevant join attributes from conditions
          const joinAttrs = this.node.getJoinAttributes(child.node, this.joinConditions);
          
          if (joinAttrs.length === 0) {
              throw new Error(`No join attributes found between ${this.node.name} and ${child.node.name}`);
          }

          let selectivity = 1;
          for (const attr of joinAttrs) {
              selectivity *= this.calculateSelectivity(attr, child);
          }
          
          const cost = child.node.tuples.size * selectivity;
          return Number.isFinite(cost) ? cost : Infinity;
      } catch (error) {
          console.error('Error estimating join cost:', error);
          throw error;
      }
  }

  calculateSelectivity(attribute, child) {
      try {
          const parentStats = this.node.statistics.attributeStats.get(attribute);
          const childStats = child.node.statistics.attributeStats.get(attribute);
          
          if (!parentStats || !childStats) {
              return 1;
          }
          
          const distinctValues = Math.max(
              parentStats.distinctValues,
              childStats.distinctValues
          );

          return distinctValues > 0 ? 1 / distinctValues : 1;
      } catch (error) {
          console.error('Error calculating selectivity:', error);
          return 1;
      }
  }

  // Helper methods
  getNodeName() {
      return this.node.name;
  }

  getChildrenNames() {
      return this.children.map(child => child.getNodeName());
  }

  toString() {
      return JSON.stringify({
          node: this.node.name,
          children: this.getChildrenNames(),
          joinAttributes: this.joinAttributes,
          statistics: this.statistics
      }, null, 2);
  }

  // Debug helper
  printTree(level = 0) {
      const indent = '  '.repeat(level);
      let result = `${indent}Node: ${this.node.name}\n`;
      result += `${indent}Join Attributes: ${this.joinAttributes.join(', ')}\n`;
      result += `${indent}Children:\n`;
      this.children.forEach(child => {
          result += child.printTree(level + 1);
      });
      return result;
  }
}

module.exports = JoinTree;