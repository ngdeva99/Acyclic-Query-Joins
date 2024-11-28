class Relation {
  /**
   * Create a new relation
   * @param {string} name - Name of the relation
   * @param {string[]} attributes - Array of attribute names
   */
  constructor(name, attributes) {
      if (!name || typeof name !== 'string') {
          throw new Error('Relation name must be a non-empty string');
      }
      if (!Array.isArray(attributes) || attributes.length === 0) {
          throw new Error('Attributes must be a non-empty array');
      }

      this.name = name;
      this.attributes = attributes;
      this.tuples = new Map();
      this.indices = new Map();
      this.statistics = {
          tupleCount: 0,
          attributeStats: new Map()
      };
  }

  /**
   * Add a tuple to the relation
   * @param {string} key - Unique identifier for the tuple
   * @param {Array} values - Array of values matching attributes
   */
  addTuple(key, values) {
      this.validateTupleValues(values);
      
      if (this.tuples.has(key)) {
          throw new Error(`Duplicate key: ${key}`);
      }

      this.tuples.set(key, values);
      this.statistics.tupleCount++;

      // Update existing indices
      for (const [attribute, index] of this.indices) {
          const attrValue = this.getAttributeValue(values, attribute);
          if (!index.has(attrValue)) {
              index.set(attrValue, new Set());
          }
          index.get(attrValue).add(key);
      }
  }

  /**
   * Create an index for an attribute
   * @param {string} attribute - Attribute to index
   * @returns {Map} The created index
   */
  createIndex(attribute) {
      if (!this.hasAttribute(attribute)) {
          throw new Error(`Attribute ${attribute} not found in relation ${this.name}`);
      }

      const index = new Map();
      const attrIndex = this.getAttributeIndex(attribute);

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

  /**
   * Update statistics for an attribute
   * @param {string} attribute - Attribute to update statistics for
   */
  updateStatistics(attribute) {
      const attrIndex = this.getAttributeIndex(attribute);
      const stats = {
          distinctValues: 0,
          nullCount: 0,
          minValue: Infinity,
          maxValue: -Infinity
      };

      const index = this.indices.get(attribute);
      if (!index) return;

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

  /**
   * Get join attributes based on join conditions
   * @param {Relation} otherRelation - Relation to join with
   * @param {Array} joinConditions - Array of join conditions
   * @returns {Array} Array of join attributes
   */
  getJoinAttributes(otherRelation, joinConditions) {
      if (!joinConditions || !Array.isArray(joinConditions)) {
          return [];
      }

      const relevantConditions = joinConditions.filter(condition => {
          return condition.relations && 
                 Array.isArray(condition.relations) && 
                 condition.relations.includes(this.name) && 
                 condition.relations.includes(otherRelation.name);
      });

      if (relevantConditions.length === 0) {
          return [];
      }

      return relevantConditions.map(condition => {
          const thisIndex = condition.relations.indexOf(this.name);
          const relationName = condition.relations[thisIndex];
          return condition.attributes[relationName];
      }).filter(attr => this.hasAttribute(attr));
  }

  /**
   * Get value for a specific attribute from a tuple
   * @param {Array} tuple - The tuple to get value from
   * @param {string} attribute - The attribute name
   * @returns {*} The attribute value
   */
  getAttributeValue(tuple, attribute) {
      const index = this.getAttributeIndex(attribute);
      return tuple[index];
  }

  /**
   * Get matching tuples for an attribute value
   * @param {string} attribute - The attribute to match on
   * @param {*} value - The value to match
   * @returns {Set} Set of matching tuple keys
   */
  getMatchingTuples(attribute, value) {
      const index = this.indices.get(attribute);
      if (!index) {
          throw new Error(`No index found for attribute: ${attribute}`);
      }
      return index.get(value) || new Set();
  }

  /**
   * Check if relation has a specific attribute
   * @param {string} attribute - Attribute to check
   * @returns {boolean} True if attribute exists
   */
  hasAttribute(attribute) {
      return this.attributes.includes(attribute);
  }

  /**
   * Get the index of an attribute
   * @param {string} attribute - Attribute to get index for
   * @returns {number} Index of the attribute
   */
  getAttributeIndex(attribute) {
      const index = this.attributes.indexOf(attribute);
      if (index === -1) {
          throw new Error(`Attribute ${attribute} not found in relation ${this.name}`);
      }
      return index;
  }

  /**
   * Validate tuple values
   * @param {Array} values - Values to validate
   */
  validateTupleValues(values) {
      if (!Array.isArray(values)) {
          throw new Error('Tuple values must be an array');
      }
      if (values.length !== this.attributes.length) {
          throw new Error(
              `Expected ${this.attributes.length} values but got ${values.length}`
          );
      }
  }

  /**
   * Create a new relation with the same schema
   * @returns {Relation} New relation with same schema
   */
  cloneSchema() {
      return new Relation(this.name, [...this.attributes]);
  }

  /**
   * Get number of tuples in relation
   * @returns {number} Number of tuples
   */
  size() {
      return this.tuples.size;
  }

  /**
   * Get string representation of relation
   * @returns {string} String representation
   */
  toString() {
      let result = `Relation: ${this.name}\n`;
      result += `Attributes: ${this.attributes.join(', ')}\n`;
      result += `Tuples (${this.tuples.size}):\n`;
      
      for (const [key, values] of this.tuples) {
          result += `  ${key}: ${values.join(', ')}\n`;
      }
      
      return result;
  }

  /**
   * Get debug information about the relation
   * @returns {Object} Debug information
   */
  getDebugInfo() {
      return {
          name: this.name,
          attributes: this.attributes,
          tupleCount: this.tuples.size,
          indices: Array.from(this.indices.keys()),
          statistics: {
              ...this.statistics,
              attributeStats: Object.fromEntries(this.statistics.attributeStats)
          }
      };
  }
}

module.exports = Relation;