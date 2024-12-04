# Yannakakis Join Algorithm Implementation

An implementation of the Yannakakis algorithm for efficient join processing, with a test suite using the MovieLens 25M dataset.

## Overview

This project implements the Yannakakis algorithm, focusing on efficient join query processing and testing using real-world movie data. The implementation includes comprehensive testing with the MovieLens dataset, demonstrating various join patterns and query complexities.

## Project Structure

```
yannakakis-impl/
├── data/
│   └── ml-25m/          # MovieLens dataset files
├── src/
│   ├── models/
│   │   └── joinTree.js  # Join tree and relation models
│   └── processors/
│       └── yannakakis.js # Algorithm implementation
└── test/
    └── movieLensTest.js  # Test suite
```

## Prerequisites

- Node.js (v14 or higher recommended)
- 4GB+ RAM for processing sample data
- MovieLens 25M dataset

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd yannakakis-impl
```

2. Install dependencies:
```bash
npm install
```

3. Set up MovieLens data:
- Download [MovieLens 25M dataset](https://files.grouplens.org/datasets/movielens/ml-25m.zip)
- Create data directory: `mkdir -p data`
- Extract to `data/ml-25m/`

## Dataset Preparation

Required files in `data/ml-25m/`:
- movies.csv: Movie information (movieId, title, genres)
- ratings.csv: User ratings (userId, movieId, rating, timestamp)
- tags.csv: User-generated tags (userId, movieId, tag, timestamp)

## Running Tests

Execute the test suite:
```bash
node test/movieLensTest.js
```

The test suite includes:
- Data loading with configurable chunk sizes
- Multiple join pattern tests
- Performance measurements
- Memory usage monitoring

## Test Queries

1. High-rated Movies (Query 1)
   - Joins movies with ratings > 4.0
   - Includes genre information
   - Demonstrates basic filtering and joins

2. Movies with Tags (Query 2)
   - Combines movies, ratings, and tags
   - Shows multi-way join processing
   - Includes sample result output

3. Genre Analysis (Query 3)
   - Focuses on specific genres (e.g., Action)
   - Combines with rating information
   - Shows selective join processing

4. User Rating Patterns (Query 4)
   - Analyzes consistent user rating patterns
   - Demonstrates user-centric analysis
   - Shows aggregation capabilities

5. Multi-genre Analysis (Query 5)
   - Processes movies with multiple genres
   - Combines with ratings and tags
   - Shows complex filtering conditions

6. Combined Analysis (Query 6)
   - Processes specific genres with ratings and tags
   - Shows complex join tree handling
   - Demonstrates multiple condition processing

## Performance Monitoring

Each query reports:
```
Query X execution time: Ys Zms
Result size: N tuples
Memory Usage:
  Heap Used: ... MB
  Heap Total: ... MB
  RSS: ... MB
```

## Configuration

Adjust `CHUNK_SIZE` in MovieLensTestSuite constructor to control memory usage:
```javascript
constructor() {
    this.CHUNK_SIZE = 1000; // Modify based on your system
}
```

## Troubleshooting

Common issues and solutions:

1. Module not found
   - Check file paths in requires
   - Verify project structure

2. Memory issues
   - Reduce CHUNK_SIZE
   - Monitor with `node --max-old-space-size=4096`

3. Data loading errors
   - Verify ml-25m directory location
   - Check CSV file formats
   - Ensure correct file permissions

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- MovieLens dataset from GroupLens Research
- Based on the paper "How Good Are Query Optimizers, Really?" by Viktor Leis et al.

## Contact

For questions or support, please open an issue in the repository.