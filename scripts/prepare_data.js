const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function prepareData() {
    // Process movies
    const movieWriter = createCsvWriter({
        path: 'data/movies.csv',
        header: ['movieId', 'title', 'year']
    });

    // Process ratings in chunks
    const ratingWriter = createCsvWriter({
        path: 'data/ratings.csv',
        header: ['userId', 'movieId', 'rating', 'timestamp']
    });

    // Create indexes for faster joins
    const indexes = new Map();
    
    console.log('Processing data...');
    
    // Read and transform data
    await processFile('ml-25m/movies.csv', movieWriter, transformMovie);
    await processFile('ml-25m/ratings.csv', ratingWriter, transformRating);
    
    console.log('Data preparation complete');
}

async function processFile(input, writer, transformer) {
    return new Promise((resolve, reject) => {
        const records = [];
        fs.createReadStream(input)
            .pipe(csv())
            .on('data', (row) => {
                const transformed = transformer(row);
                if (transformed) {
                    records.push(transformed);
                }
                
                // Write in chunks of 10000
                if (records.length >= 10000) {
                    writer.writeRecords(records);
                    records.length = 0;
                }
            })
            .on('end', async () => {
                if (records.length > 0) {
                    await writer.writeRecords(records);
                }
                resolve();
            })
            .on('error', reject);
    });
}

function transformMovie(row) {
    return {
        movieId: row.movieId,
        title: row.title,
        year: extractYear(row.title)
    };
}

function transformRating(row) {
    return {
        userId: row.userId,
        movieId: row.movieId,
        rating: parseFloat(row.rating),
        timestamp: parseInt(row.timestamp)
    };
}

function extractYear(title) {
    const match = title.match(/\((\d{4})\)/);
    return match ? match[1] : null;
}

prepareData().catch(console.error);