const fs = require('fs').promises;
const { parse } = require('csv-parse');
const Relation = require('../src/models/Relation');
const schemas = require('../data/job/schemas');

class DatasetLoader {
  constructor(dataDir) {
    this.dataDir = dataDir;
  }

  async loadRelation(filename, schema) {
    try {
      const data = await fs.readFile(`${this.dataDir}/${filename}`, 'utf-8');
      const relation = new Relation(schema.name, schema.attributes);

      return new Promise((resolve, reject) => {
        parse(data, {
          columns: true,
          skip_empty_lines: true,
          cast: (value, context) => {
            // Type casting based on column name
            if (context.column === 'id' || 
                context.column === 'movie_id' || 
                context.column === 'actor_id' || 
                context.column === 'year' || 
                context.column === 'birth_year' || 
                context.column === 'position') {
              return parseInt(value);
            }
            if (context.column === 'budget' || 
                context.column === 'rating') {
              return parseFloat(value);
            }
            return value;
          }
        })
        .on('data', (row) => {
          const values = schema.attributes.map(attr => row[attr]);
          relation.addTuple(row[schema.key].toString(), values);
        })
        .on('end', () => {
          console.log(`Loaded ${relation.tuples.size} tuples for ${schema.name}`);
          resolve(relation);
        })
        .on('error', reject);
      });
    } catch (error) {
      console.error(`Error loading relation ${filename}:`, error);
      throw error;
    }
  }

  async loadJOBDataset(subset = ['movie', 'cast', 'actor']) {
    try {
      const relations = {};
      for (const table of subset) {
        if (!schemas[table]) {
          throw new Error(`Unknown table: ${table}`);
        }
        console.log(`Loading ${table} data...`);
        relations[table] = await this.loadRelation(
          `${table}.csv`,
          schemas[table]
        );
      }
      return relations;
    } catch (error) {
      console.error('Error loading JOB dataset:', error);
      throw error;
    }
  }

  async loadRelationFromStream(fileStream, schema) {
    return new Promise((resolve, reject) => {
      const relation = new Relation(schema.name, schema.attributes);
      
      fileStream
        .pipe(parse({
          columns: true,
          skip_empty_lines: true
        }))
        .on('data', (row) => {
          const values = schema.attributes.map(attr => row[attr]);
          relation.addTuple(row[schema.key].toString(), values);
        })
        .on('end', () => resolve(relation))
        .on('error', reject);
    });
  }

  // Helper method to generate test data
  static generateTestData() {
    return {
      movie: [
        [1, 'Inception', 2010, 160000000, 8.8],
        [2, 'The Matrix', 1999, 63000000, 8.7],
        [3, 'Interstellar', 2014, 165000000, 8.6]
      ],
      actor: [
        [1, 'Leonardo DiCaprio', 'M', 1974],
        [2, 'Keanu Reeves', 'M', 1964],
        [3, 'Matthew McConaughey', 'M', 1969]
      ],
      cast: [
        [1, 1, 1, 'Cobb', 1],
        [2, 2, 2, 'Neo', 1],
        [3, 3, 3, 'Cooper', 1]
      ]
    };
  }
}

module.exports = DatasetLoader;