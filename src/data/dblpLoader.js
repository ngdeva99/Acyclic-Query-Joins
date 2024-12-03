// src/data/dblpLoader.js
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');
const { Relation } = require('../models/joinTree');

class DblpLoader {
    static async loadData(filePath, maxEntries = 1000) {
        const authors = new Set();
        const publications = [];
        const authored = [];
        let authorIdCounter = 1;
        const authorMap = new Map(); // name to id mapping



        // Create XML parser
        const parser = new XMLParser({
            ignoreAttributes: false,
            parseTagValue: true,
            trimValues: true
        });

        try {
            // Read file in chunks
            const chunkSize = 64 * 1024; // 64KB chunks
            const fileHandle = await fs.promises.open(filePath, 'r');
            const buffer = Buffer.alloc(chunkSize);
            let currentXML = '';
            let pubCount = 0;

            let bytesRead;
            do {
                bytesRead = (await fileHandle.read(buffer, 0, chunkSize)).bytesRead;
                currentXML += buffer.toString('utf8', 0, bytesRead);

                // Process complete article tags
                while (currentXML.includes('<article>')) {
                    const articleStart = currentXML.indexOf('<article>');
                    const articleEnd = currentXML.indexOf('</article>');

                    if (articleEnd === -1) break;

                    const articleXML = currentXML.slice(articleStart, articleEnd + 10);
                    currentXML = currentXML.slice(articleEnd + 10);

                    try {
                        const article = parser.parse(articleXML);
                        
                        // Process article
                        if (pubCount < maxEntries) {
                            const pubId = pubCount + 1;
                            const title = article.article.title || 'Unknown';
                            const year = parseInt(article.article.year) || 0;
                            const venue = article.article.journal || 'Unknown';

                            publications.push([pubId, title, year, venue]);

                            // Process authors
                            const articleAuthors = Array.isArray(article.article.author) 
                                ? article.article.author 
                                : [article.article.author];

                            for (const authorName of articleAuthors) {
                                if (authorName && typeof authorName === 'string') {
                                    if (!authorMap.has(authorName)) {
                                        authorMap.set(authorName, authorIdCounter++);
                                        authors.add([authorMap.get(authorName), authorName]);
                                    }
                                    authored.push([authorMap.get(authorName), pubId]);
                                }
                            }

                            pubCount++;
                        } else {
                            break;
                        }
                    } catch (error) {
                        console.warn('Error parsing article:', error);
                        continue;
                    }
                }

                if (pubCount >= maxEntries) break;

            } while (bytesRead === chunkSize);

        } catch(err) {
            console.log(err);
        } finally {
            await fileHandle.close();
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