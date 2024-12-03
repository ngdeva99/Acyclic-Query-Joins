// test/job-description/enhancedJobTest.js
const EnhancedJobLoader = require('../../src/data/enhancedJobLoader');
const YannakakisProcessor = require('../../src/processors/yannakakis');
const { JoinTree, JoinNode } = require('../../src/models/joinTree');
const { performance } = require('perf_hooks');

class JobBenchmark {
    constructor() {
        this.metrics = {
            loadTime: {},
            queryTimes: {},
            memoryUsage: {},
            joinCardinalities: {}
        };
    }

    async runBenchmark() {
        const chunkSizes = [100, 500, 1000, 5000];
        
        for (const size of chunkSizes) {
            console.log(`\nRunning benchmark with chunk size: ${size}`);
            await this.runTestsForChunkSize(size);
        }

        this.generateReport();
    }

    async runTestsForChunkSize(chunkSize) {
        // Load data and measure performance
        const startLoad = performance.now();
        const data = await EnhancedJobLoader.loadData('./data/job_descriptions.csv', chunkSize);
        this.metrics.loadTime[chunkSize] = performance.now() - startLoad;

        // Record initial memory usage
        this.recordMemoryUsage(chunkSize, 'initial');

        // Run complex join patterns
        await this.runComplexJoinPatterns(data, chunkSize);

        // Record final memory usage
        this.recordMemoryUsage(chunkSize, 'final');
    }

    async runComplexJoinPatterns(data, chunkSize) {
        const queries = {
            // Pattern 1: Jobs with Skills and Experience Levels
            skillsAndExperience: () => {
                const tree = new JoinTree();
                tree.root = new JoinNode(data.jobs);
                tree.root.left = new JoinNode(data.jobSkills);
                tree.root.left.left = new JoinNode(data.skills);
                tree.root.right = new JoinNode(data.experienceLevels);
                return tree;
            },

            // Pattern 2: Company Industry Analysis
            companyIndustry: () => {
                const tree = new JoinTree();
                tree.root = new JoinNode(data.companies);
                tree.root.left = new JoinNode(data.companyIndustries);
                tree.root.right = new JoinNode(data.industries);
                return tree;
            },

            // Pattern 3: Location-based Salary Analysis
            locationSalary: () => {
                const tree = new JoinTree();
                tree.root = new JoinNode(data.jobs);
                tree.root.left = new JoinNode(data.locations);
                tree.root.right = new JoinNode(data.salaryRanges);
                return tree;
            },

            // Pattern 4: Complex Category Analysis
            categoryAnalysis: () => {
                const tree = new JoinTree();
                tree.root = new JoinNode(data.jobs);
                tree.root.left = new JoinNode(data.jobCategories);
                tree.root.left.left = new JoinNode(data.categories);
                tree.root.right = new JoinNode(data.jobSkills);
                tree.root.right.right = new JoinNode(data.skills);
                return tree;
            },

            // Pattern 5: Full Job Analysis
            fullAnalysis: () => {
                const tree = new JoinTree();
                tree.root = new JoinNode(data.jobs);
                
                // Skills branch
                tree.root.left = new JoinNode(data.jobSkills);
                tree.root.left.left = new JoinNode(data.skills);
                
                // Company branch
                tree.root.right = new JoinNode(data.companies);
                tree.root.right.left = new JoinNode(data.companyIndustries);
                tree.root.right.right = new JoinNode(data.industries);
                
                return tree;
            }
        };

        // Execute and measure each query pattern
        for (const [queryName, createTree] of Object.entries(queries)) {
            console.log(`\nExecuting ${queryName}...`);
            
            const start = performance.now();
            const tree = createTree();
            const result = YannakakisProcessor.process(tree);
            const duration = performance.now() - start;

            // Record metrics
            if (!this.metrics.queryTimes[queryName]) {
                this.metrics.queryTimes[queryName] = {};
            }
            this.metrics.queryTimes[queryName][chunkSize] = duration;

            if (!this.metrics.joinCardinalities[queryName]) {
                this.metrics.joinCardinalities[queryName] = {};
            }
            this.metrics.joinCardinalities[queryName][chunkSize] = result.tuples.length;

            // Analyze result
            this.analyzeQueryResult(queryName, result, chunkSize);
        }
    }

    recordMemoryUsage(chunkSize, stage) {
        const usage = process.memoryUsage();
        if (!this.metrics.memoryUsage[chunkSize]) {
            this.metrics.memoryUsage[chunkSize] = {};
        }
        this.metrics.memoryUsage[chunkSize][stage] = {
            heapUsed: usage.heapUsed / 1024 / 1024,
            heapTotal: usage.heapTotal / 1024 / 1024,
            external: usage.external / 1024 / 1024
        };
    }

    analyzeQueryResult(queryName, result, chunkSize) {
        console.log(`\nAnalysis for ${queryName} (chunk size: ${chunkSize})`);
        console.log(`- Result tuples: ${result.tuples.length}`);
        console.log(`- Attributes: ${[...result.attributes].join(', ')}`);
        console.log(`- Execution time: ${this.metrics.queryTimes[queryName][chunkSize].toFixed(2)}ms`);
    }

    generateReport() {
        console.log('\n=== Performance Analysis Report ===\n');

        // Data Loading Performance
        console.log('Data Loading Times:');
        Object.entries(this.metrics.loadTime).forEach(([size, time]) => {
            console.log(`Chunk size ${size}: ${time.toFixed(2)}ms`);
        });

        // Query Performance Analysis
        console.log('\nQuery Performance:');
        Object.entries(this.metrics.queryTimes).forEach(([query, times]) => {
            console.log(`\n${query}:`);
            Object.entries(times).forEach(([size, time]) => {
                console.log(`- Chunk size ${size}: ${time.toFixed(2)}ms`);
            });
        });

        // Memory Usage Analysis
        console.log('\nMemory Usage (MB):');
        Object.entries(this.metrics.memoryUsage).forEach(([size, stages]) => {
            console.log(`\nChunk size ${size}:`);
            Object.entries(stages).forEach(([stage, usage]) => {
                console.log(`- ${stage}:`);
                console.log(`  Heap Used: ${usage.heapUsed.toFixed(2)}`);
                console.log(`  Heap Total: ${usage.heapTotal.toFixed(2)}`);
            });
        });

        // Join Cardinality Analysis
        console.log('\nJoin Cardinalities:');
        Object.entries(this.metrics.joinCardinalities).forEach(([query, sizes]) => {
            console.log(`\n${query}:`);
            Object.entries(sizes).forEach(([size, count]) => {
                console.log(`- Chunk size ${size}: ${count} tuples`);
            });
        });
    }
}

// Run the benchmark
const benchmark = new JobBenchmark();
benchmark.runBenchmark().catch(console.error);