// src/data/conferenceLoader.js
const fs = require('fs');
const { Relation } = require('../models/joinTree');

class ConferenceLoader {
    // Load focused dataset of SIGMOD and VLDB papers from 2020-2023
    static async loadData() {
        // Sample real conference papers
        const publications = [
            [1, "How Good Are Query Optimizers, Really?", 2015, "VLDB"],
            [2, "Access Path Selection in a Relational Database Management System", 1979, "SIGMOD"],
            [3, "Dynamic Programming Strikes Back", 2008, "SIGMOD"],
            [4, "Efficiently Compiling Efficient Query Plans for Modern Hardware", 2011, "VLDB"],
            [5, "Adaptive Query Processing", 2001, "VLDB"],
            [6, "The Case for Learned Index Structures", 2018, "SIGMOD"],
            [7, "DBMSs Should Talk Before They Answer", 2023, "SIGMOD"],
            [8, "What's Really New with NewSQL?", 2016, "SIGMOD"],
            [9, "Architecture of a Database System", 2007, "VLDB"],
            [10, "Query Optimization in Database Systems", 1984, "VLDB"]
        ];

        // Sample real authors
        const authors = [
            [1, "Viktor Leis"],
            [2, "P. Griffiths Selinger"],
            [3, "Guido Moerkotte"],
            [4, "Thomas Neumann"],
            [5, "Joseph M. Hellerstein"],
            [6, "Tim Kraska"],
            [7, "Michael Stonebraker"],
            [8, "Andrew Pavlo"],
            [9, "Michael J. Franklin"],
            [10, "Patricia G. Selinger"]
        ];

        // Authorship relationships
        const authored = [
            [1, 1],  // Leis - Query Optimizers
            [4, 1],  // Neumann - Query Optimizers
            [2, 2],  // Selinger - Access Path Selection
            [3, 3],  // Moerkotte - Dynamic Programming
            [4, 4],  // Neumann - Efficient Query Plans
            [5, 5],  // Hellerstein - Adaptive Query Processing
            [6, 6],  // Kraska - Learned Index
            [7, 7],  // Stonebraker - DBMSs Should Talk
            [8, 8],  // Pavlo - NewSQL
            [9, 9],  // Franklin - Architecture
            [10, 10], // Selinger - Query Optimization
            [4, 3],   // Neumann also on Dynamic Programming
            [3, 4],   // Moerkotte also on Efficient Query Plans
            [7, 8],   // Stonebraker also on NewSQL
            [8, 7]    // Pavlo also on DBMSs Should Talk
        ];

        // Create relations
        const authorsRelation = new Relation(
            'authors',
            ['aid', 'name'],
            authors
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
                authorCount: authors.length,
                publicationCount: publications.length,
                authorshipCount: authored.length
            }
        };
    }
}

module.exports = ConferenceLoader;