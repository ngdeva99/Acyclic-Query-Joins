const Relation = require('../../src/models/Relation');

describe('Relation', () => {
    let relation;

    beforeEach(() => {
        relation = new Relation('Movies', ['id', 'title', 'year']);
    });

    test('should create a relation with correct properties', () => {
        expect(relation.name).toBe('Movies');
        expect(relation.attributes).toEqual(['id', 'title', 'year']);
        expect(relation.tuples.size).toBe(0);
    });

    test('should add tuples correctly', () => {
        relation.addTuple('1', [1, 'The Matrix', 1999]);
        relation.addTuple('2', [2, 'Inception', 2010]);

        expect(relation.tuples.size).toBe(2);
        expect(relation.tuples.get('1')).toEqual([1, 'The Matrix', 1999]);
    });

    test('should reject tuples with incorrect number of values', () => {
        expect(() => {
            relation.addTuple('1', [1, 'The Matrix']);
        }).toThrow('Tuple values do not match attributes length');
    });
});
