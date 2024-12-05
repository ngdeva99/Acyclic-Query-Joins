const fs = require('fs');
const csv = require('csv-parser');
const { Relation, JoinTree } = require('../src/models/joinTree');
const YannakakisProcessor = require('../src/processors/yannakakis');
const reportPath = 'reports/'

class MovieLensTestSuite {
    constructor() {
        this.relations = {};
        this.stats = {
            startTime: null,
            endTime: null,
            memoryUsage: {},
            intermediateResults: []
        };
        // Define chunk size
        // Use env variable with fallback
        this.CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || 1000);
        this.DATA_DIR = process.env.DATA_DIR || 'data/ml-25m';

    }

    async loadData() {
        console.log('Loading chunked MovieLens dataset...');
        
        // Load limited chunks of data
        this.relations.movies = await this.loadRelationChunk(
            `${this.DATA_DIR}/movies.csv`,
            ['movieId', 'title', 'genres'],
            'movies'
        );

        this.relations.ratings = await this.loadRelationChunk(
            `${this.DATA_DIR}/ratings.csv`,
            ['userId', 'movieId', 'rating', 'timestamp'],
            'ratings'
        );

        this.relations.tags = await this.loadRelationChunk(
           `${this.DATA_DIR}/tags.csv`,
            ['userId', 'movieId', 'tag', 'timestamp'],
            'tags'
        );

        // Create genres relation from chunked movies data
        await this.createGenresRelation();

        console.log('Chunked dataset loading complete.');
    }

    async loadRelationChunk(filePath, attributes, name) {
        return new Promise((resolve, reject) => {
            const tuples = [];
            let count = 0;

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (count < this.CHUNK_SIZE) {
                        const tuple = attributes.map(attr => row[attr]);
                        tuples.push(tuple);
                        count++;
                    }
                })
                .on('end', () => {
                    console.log(`Loaded ${tuples.length} records for ${name} (chunked)`);
                    resolve(new Relation(name, attributes, tuples));
                })
                .on('error', reject);
        });
    }

    async createGenresRelation() {
        const genresTuples = [];
        const seenPairs = new Set();

        // Extract genres from movies relation
        this.relations.movies.tuples.forEach(tuple => {
            const movieId = tuple[0];
            const genres = tuple[2].split('|');
            
            genres.forEach(genre => {
                const pair = `${movieId}-${genre}`;
                if (!seenPairs.has(pair)) {
                    genresTuples.push([movieId, genre]);
                    seenPairs.add(pair);
                }
            });
        });

        this.relations.genres = new Relation(
            'genres',
            ['movieId', 'genre'],
            genresTuples
        );

        console.log(`Created genres relation with ${genresTuples.length} records`);
    }

    async runQueries() {
        console.log('\nRunning queries on chunked dataset...');
        //await this.runQuery1();
        await this.runQuery2();
        await this.runQuery3();
        await this.runQuery4();
        await this.runQuery5();
        await this.runQuery6();
    }

    getAttributes(query, seconds, nanoseconds, result) {
        return {
            query_execution_time: `${seconds}s ${nanoseconds/1000000}ms`,
            result_size: `${result.tuples.length} tuples`,
            sample_results: result.tuples.slice(0, 3),
            memory_usage: this.logMemoryUsage(query)
        };
    }

    async runQuery1() {
        // Find high-rated movies with their genres
        console.log('\nExecuting Query 1: High-rated (>4.0) movies with genres');
        
        const startTime = process.hrtime();
        const joinTree = new JoinTree();
        
        const filteredRatings = new Relation(
            'filtered_ratings',
            ['movieId', 'rating'],
            this.relations.ratings.tuples.filter(t => parseFloat(t[2]) > 4.0)
        );
    
        joinTree.root.relation = filteredRatings;
        joinTree.root.left = { relation: this.relations.movies };
        joinTree.root.right = { relation: this.relations.genres };
    
        const result = YannakakisProcessor.process(joinTree);
        const queryType = 'highrated-movie-with-genres'
        if (result.tuples) {
            fs.writeFileSync(`${reportPath+queryType}.json`, JSON.stringify(result.tuples));
        }
        const [seconds, nanoseconds] = process.hrtime(startTime);
    
        console.log(`Query 1 execution time: ${seconds}s ${nanoseconds/1000000}ms`);
        console.log(`Result size: ${result.tuples.length} tuples`);
        console.log('Sample results:', result.tuples.slice(0, 3)); 

        fs.writeFileSync(`${reportPath+queryType}-attributes.json`, JSON.stringify(this.getAttributes('Query 1', seconds, nanoseconds, result)));
    }
    
    async runQuery2() {
        // Find movies with both high ratings and tags
        console.log('\nExecuting Query 2: Movies with both ratings (>4.5) and tags');
        
        const startTime = process.hrtime();
        const joinTree = new JoinTree();
        
        const highRatings = new Relation(
            'high_ratings',
            ['movieId', 'rating'],
            this.relations.ratings.tuples.filter(t => parseFloat(t[2]) > 4.5)
        );
    
        joinTree.root.relation = this.relations.movies;
        joinTree.root.left = { relation: highRatings };
        joinTree.root.right = { relation: this.relations.tags };
    
        const result = YannakakisProcessor.process(joinTree);
        const [seconds, nanoseconds] = process.hrtime(startTime);
    
        console.log(`Query 2 execution time: ${seconds}s ${nanoseconds/1000000}ms`);
        console.log(`Result size: ${result.tuples.length} tuples`);
        console.log('Sample results:', result.tuples.slice(0, 3));
        const queryType = 'Movies-with-both-ratings-4.5-above-and-tags'

        fs.writeFileSync(`${reportPath+queryType}-attributes.json`, JSON.stringify(this.getAttributes('Query 2',  seconds, nanoseconds, result)));
    }
    
    async runQuery3() {
        // Find action movies with high ratings and tags
        console.log('\nExecuting Query 3: Action movies with high ratings and tags');
        
        const startTime = process.hrtime();
        const joinTree = new JoinTree();
        
        const actionGenres = new Relation(
            'action_genres',
            ['movieId', 'genre'],
            this.relations.genres.tuples.filter(t => t[1].includes('Action'))
        );
    
        joinTree.root.relation = actionGenres;
        joinTree.root.left = { relation: this.relations.movies };
        joinTree.root.right = { 
            relation: new Relation(
                'high_ratings',
                ['movieId', 'rating'],
                this.relations.ratings.tuples.filter(t => parseFloat(t[2]) > 4.0)
            )
        };
    
        const result = YannakakisProcessor.process(joinTree);
        const [seconds, nanoseconds] = process.hrtime(startTime);
    
        console.log(`Query 3 execution time: ${seconds}s ${nanoseconds/1000000}ms`);
        console.log(`Result size: ${result.tuples.length} tuples`);
        console.log('Sample results:', result.tuples.slice(0, 3));
        const queryType = 'Action-movies-with-high-ratings-and-tags'
        fs.writeFileSync(`${reportPath+queryType}-attributes.json`, JSON.stringify(this.getAttributes('Query 3',  seconds, nanoseconds, result)));
    }
    
    async runQuery4() {
        // Find users who rate movies consistently high
        console.log('\nExecuting Query 4: Users with consistently high ratings (>4.0) and their rated movies');
        
        const startTime = process.hrtime();
        const joinTree = new JoinTree();
        
        const highRaterIds = [...new Set(
            this.relations.ratings.tuples
                .filter(t => parseFloat(t[2]) > 4.0)
                .map(t => t[0])
        )];
    
        const highRaters = new Relation(
            'high_raters',
            ['userId', 'movieId', 'rating'],
            this.relations.ratings.tuples.filter(t => highRaterIds.includes(t[0]))
        );
    
        joinTree.root.relation = highRaters;
        joinTree.root.left = { relation: this.relations.movies };
    
        const result = YannakakisProcessor.process(joinTree);
        const [seconds, nanoseconds] = process.hrtime(startTime);
    
        console.log(`Query 4 execution time: ${seconds}s ${nanoseconds/1000000}ms`);
        console.log(`Result size: ${result.tuples.length} tuples`);
        console.log('Sample results:', result.tuples.slice(0, 3));
        const queryType = 'Users-with-consistently-high-ratings-4-above-and-their-rated-movies'
        fs.writeFileSync(`${reportPath+queryType}-attributes.json`, JSON.stringify(this.getAttributes('Query 4',  seconds, nanoseconds, result)));
    }
    
    async runQuery5() {
        // Multi-genre analysis
        console.log('\nExecuting Query 5: Movies with multiple genres, their ratings and tags');
        
        const startTime = process.hrtime();
        const joinTree = new JoinTree();
        
        const multiGenreMovies = new Relation(
            'multi_genre_movies',
            ['movieId', 'title', 'genres'],
            this.relations.movies.tuples.filter(t => t[2].split('|').length > 1)
        );
    
        joinTree.root.relation = multiGenreMovies;
        joinTree.root.left = { relation: this.relations.ratings };
        joinTree.root.right = { relation: this.relations.tags };
    
        const result = YannakakisProcessor.process(joinTree);
        const [seconds, nanoseconds] = process.hrtime(startTime);
    
        console.log(`Query 5 execution time: ${seconds}s ${nanoseconds/1000000}ms`);
        console.log(`Result size: ${result.tuples.length} tuples`);
        console.log('Sample results:', result.tuples.slice(0, 3));
        const queryType = 'Movies-with-multiple-genres-their-ratings-and-tags'
        fs.writeFileSync(`${reportPath+queryType}-attributes.json`, JSON.stringify(this.getAttributes('Query 5', seconds, nanoseconds, result)));
    }
    
    async runQuery6() {
        // Find movies with both user ratings and tags in specific genres
        console.log('\nExecuting Query 6: Drama or Comedy movies with both ratings and tags');
        
        const startTime = process.hrtime();
        const joinTree = new JoinTree();
        
        const dramaComedy = new Relation(
            'drama_comedy',
            ['movieId', 'title', 'genres'],
            this.relations.movies.tuples.filter(t => 
                t[2].includes('Drama') || t[2].includes('Comedy')
            )
        );
    
        joinTree.root.relation = dramaComedy;
        joinTree.root.left = { 
            relation: this.relations.ratings
        };
        joinTree.root.right = {
            relation: this.relations.tags
        };
    
        const result = YannakakisProcessor.process(joinTree);
        const [seconds, nanoseconds] = process.hrtime(startTime);
    
        console.log(`Query 6 execution time: ${seconds}s ${nanoseconds/1000000}ms`);
        console.log(`Result size: ${result.tuples.length} tuples`);
        console.log('Sample results:', result.tuples.slice(0, 3));
        const queryType = 'Drama-or-Comedy-movies-with-both-ratings-and-tags'
        fs.writeFileSync(`${reportPath+queryType}-attributes.json`, JSON.stringify(this.getAttributes('Query 6', seconds, nanoseconds, result)));
    }

    logMemoryUsage(queryName) {
        const used = process.memoryUsage();
        console.log('Memory Usage:');
        const memoryUsage = {
            heap: `  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)} MB`,
            totalHeap: `  Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)} MB`,
            rss: `  RSS: ${Math.round(used.rss / 1024 / 1024)} MB`  
        }

        console.log(`  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
        console.log(`  Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)} MB`);
        console.log(`  RSS: ${Math.round(used.rss / 1024 / 1024)} MB`);

        return memoryUsage;
    }
}

async function runTests() {
    try {
        const testSuite = new MovieLensTestSuite();
        await testSuite.loadData();
        await testSuite.runQueries();
    } catch (error) {
        console.error('Error running tests:', error);
    }
}

runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

module.exports = MovieLensTestSuite;