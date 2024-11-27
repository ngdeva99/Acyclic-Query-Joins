const YannakakisProcessor = require('../../src/processors/YannakakisProcessor');
const Relation = require('../../src/models/Relation');
const JoinTree = require('../../src/models/JoinTree');

describe('YannakakisProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new YannakakisProcessor();
  });

  test('performSemiJoin should work correctly', async () => {
    const r1 = new Relation('R1', ['id', 'value']);
    const r2 = new Relation('R2', ['id', 'data']);

    r1.addTuple('1', [1, 'a']);
    r1.addTuple('2', [2, 'b']);
    r1.addTuple('3', [3, 'c']);

    r2.addTuple('1', [1, 'x']);
    r2.addTuple('2', [2, 'y']);
    r2.addTuple('4', [4, 'z']);

    const result = await processor.performSemiJoin(r1, r2);
    expect(result.tuples.size).toBe(2);
  });

  test('process should handle complete join tree', async () => {
    const r1 = new Relation('R1', ['id', 'value']);
    const r2 = new Relation('R2', ['id', 'data']);
    const r3 = new Relation('R3', ['id', 'info']);

    r1.addTuple('1', [1, 'a']);
    r2.addTuple('1', [1, 'x']);
    r3.addTuple('1', [1, 'm']);

    const joinTree = new JoinTree(
      r1,
      [
        new JoinTree(r2),
        new JoinTree(r3)
      ],
      ['id']
    );

    const result = await processor.process(joinTree);
    expect(result.tuples.size).toBe(1);
  });
});