function runPerformanceTest() {
    const datasets = [
        { authors: 100, publications: 200, authorship: 300 },
        { authors: 1000, publications: 2000, authorship: 3000 },
        { authors: 10000, publications: 20000, authorship: 30000 }
    ];

    for (const size of datasets) {
        console.log(`\nTesting with dataset size:
            Authors: ${size.authors}
            Publications: ${size.publications}
            Authorship records: ${size.authorship}`);

        const data = generateDblpData(size.authors, size.publications, size.authorship);
        
        // Test original implementation
        console.time('Original Yannakakis');
        const resultOriginal = YannakakisProcessor.process(createJoinTree(data));
        console.timeEnd('Original Yannakakis');
        
        // Test optimized implementation
        console.time('Optimized Yannakakis');
        const resultOptimized = OptimizedYannakakisProcessor.process(createJoinTree(data));
        console.timeEnd('Optimized Yannakakis');

        // Compare results
        console.log(`
            Original implementation:
            - Tuple count: ${resultOriginal.tuples.length}
            - Memory used: ${process.memoryUsage().heapUsed / 1024 / 1024} MB
            
            Optimized implementation:
            - Tuple count: ${resultOptimized.tuples.length}
            - Memory used: ${process.memoryUsage().heapUsed / 1024 / 1024} MB
        `);
    }
}