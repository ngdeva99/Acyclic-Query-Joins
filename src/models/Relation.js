class Relation {
    constructor(name, attributes) {
      this.name = name;
      this.attributes = attributes;
      this.tuples = new Map();
      this.indices = new Map();
      this.statistics = {
        tupleCount: 0,
        attributeStats: new Map()
      };
    }
  
    addTuple(key, values) {
      if (values.length !== this.attributes.length) {
        throw new Error('Tuple values do not match attributes length');
      }
      this.tuples.set(key, values);
      this.statistics.tupleCount++;
    }
  
    createIndex(attribute) {
      if (!this.attributes.includes(attribute)) {
        throw new Error('Attribute not found in relation');
      }
  
      const index = new Map();
      const attrIndex = this.attributes.indexOf(attribute);
  
      for (const [key, tuple] of this.tuples) {
        const attrValue = tuple[attrIndex];
        if (!index.has(attrValue)) {
          index.set(attrValue, new Set());
        }
        index.get(attrValue).add(key);
      }
  
      this.indices.set(attribute, index);
      this.updateStatistics(attribute);
      return index;
    }
  
    updateStatistics(attribute) {
      const attrIndex = this.attributes.indexOf(attribute);
      const stats = {
        distinctValues: 0,
        nullCount: 0,
        minValue: Infinity,
        maxValue: -Infinity
      };
  
      const index = this.indices.get(attribute);
      stats.distinctValues = index.size;
  
      for (const [value, tuples] of index) {
        if (value === null) {
          stats.nullCount += tuples.size;
        } else if (typeof value === 'number') {
          stats.minValue = Math.min(stats.minValue, value);
          stats.maxValue = Math.max(stats.maxValue, value);
        }
      }
  
      this.statistics.attributeStats.set(attribute, stats);
    }
  
    getJoinAttributes(other) {
      return this.attributes.filter(attr => other.attributes.includes(attr));
    }
  }
  
  module.exports = Relation;