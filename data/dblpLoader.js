// src/data/dblpLoader.js
const fs = require('fs');
const xml2js = require('xml2js');
const { Relation } = require('../src/models/joinTree');

class DblpLoader {
    static async loadData(filePath, maxEntries = 10000) {
        const parser = new xml2js.Parser();
        const data = await fs.promises.readFile(filePath);
        const result = await parser.parseStringPromise(data);

        // Initialize relations
        const authors = new Set();
        const publications = [];
        const authored = [];
        let authorIdCounter = 1;
        const authorMap = new Map(); // name to id mapping

        // Process publications and authors
        for (const publication of result.dblp.article || []) {
            if (publications.length >= maxEntries) break;

            const pubId = publications.length + 1;
            const title = publication.title?.[0] || 'Unknown';
            const year = parseInt(publication.year?.[0]) || 0;
            const venue = publication.journal?.[0] || 'Unknown';

            publications.push([pubId, title, year, venue]);

            // Process authors
            const authorNames = publication.author || [];
            for (const authorName of authorNames) {
                if (!authorMap.has(authorName)) {
                    authorMap.set(authorName, authorIdCounter++);
                    authors.add([authorMap.get(authorName), authorName]);
                }
                authored.push([authorMap.get(authorName), pubId]);
            }
        }

        // Create relations
        const authorsRelation = new Relation(
            'authors',
            ['aid', 'name'],
            Array.from(authors)
        );

        const publicationsRelation = new Relation(
            'publications',
            ['pid', 'title', 'year', 'venue'],
            publications
        );

        const authoredRelation = new Relation(
            'authored',
            ['aid', 'pid'],
            authored
        );

        return {
            authors: authorsRelation,
            publications: publicationsRelation,
            authored: authoredRelation,
            stats: {
                authorCount: authors.size,
                publicationCount: publications.length,
                authorshipCount: authored.length
            }
        };
    }
}

module.exports = DblpLoader;