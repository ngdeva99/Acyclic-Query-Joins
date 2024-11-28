const { performance } = require('perf_hooks');
const Relation = require('../models/Relation');

class YannakakisProcessor {
    constructor() {
        this.relations = new Map();
        this.performanceMetrics = {
            semiJoinTime: 0,
            indexBuildTime: 0,
            memoryUsage: []
        };
    }

    async process(joinTree) {
        try {
            console.log('Starting process with join tree:', {
                root: joinTree.node.name,
                childCount: joinTree.children.length
            });

            // Bottom-up phase
            await this.reducePhase(joinTree);
            
            // Top-down phase
            return this.joinPhase(joinTree);
        } catch (error) {
            console.error('Error in process:', error);
            throw error;
        }
    }

    async reducePhase(tree) {
        try {
            console.log('Starting reduce phase for:', tree.node.name);
            
            // Process children first
            for (const child of tree.children) {
                await this.reducePhase(child);
            }

            // Perform semi-joins with children
            for (const child of tree.children) {
                console.log(`Performing semi-join between ${tree.node.name} and ${child.node.name}`);
                const reduced = await this.performSemiJoin(tree.node, child.node);
                tree.node = reduced;
            }
        } catch (error) {
            console.error('Error in reducePhase:', error);
            throw error;
        }
    }

    async joinPhase(tree) {
        try {
            console.log('Starting join phase for:', tree.node.name);
            let result = tree.node;

            // Join with each child's result
            for (const child of tree.children) {
                const childResult = await this.joinPhase(child);
                result = await this.performNaturalJoin(result, childResult);
            }

            return result;
        } catch (error) {
            console.error('Error in joinPhase:', error);
            throw error;
        }
    }

    async performSemiJoin(r1, r2) {
        const startTime = performance.now();
        
        try {
            console.log('Starting semi-join operation between:', {
                r1: { name: r1.name, tupleCount: r1.tuples.size },
                r2: { name: r2.name, tupleCount: r2.tuples.size }
            });

            const result = new Relation(r1.name, r1.attributes);
            
            // Find common attributes
            const commonAttributes = r1.getJoinAttributes(r2);
            console.log('Common attributes:', commonAttributes);

            if (commonAttributes.length === 0) {
                console.log('No common attributes found between relations');
                return result;
            }

            // Create indices if needed
            for (const attr of commonAttributes) {
                if (!r2.indices.has(attr)) {
                    console.log(`Creating index for attribute: ${attr}`);
                    const indexStartTime = performance.now();
                    r2.createIndex(attr);
                    this.performanceMetrics.indexBuildTime += performance.now() - indexStartTime;
                }
            }

            // Perform semi-join
            for (const [key, tuple] of r1.tuples) {
                if (await this.hasMatchingTuple(tuple, r1, r2, commonAttributes)) {
                    result.addTuple(key, tuple);
                }
            }

            console.log('Semi-join result:', {
                originalSize: r1.tuples.size,
                resultSize: result.tuples.size
            });

            this.performanceMetrics.semiJoinTime += performance.now() - startTime;
            this.performanceMetrics.memoryUsage.push(process.memoryUsage().heapUsed);
            
            return result;
            
        } catch (error) {
            console.error('Error in performSemiJoin:', error);
            throw error;
        }
    }

    async hasMatchingTuple(tuple, r1, r2, commonAttributes) {
        try {
            for (const attr of commonAttributes) {
                const attrIndex = r1.attributes.indexOf(attr);
                if (attrIndex === -1) {
                    console.error(`Attribute ${attr} not found in relation ${r1.name}`);
                    return false;
                }

                const value = tuple[attrIndex];
                const index = r2.indices.get(attr);
                
                if (!index) {
                    console.error(`No index found for attribute ${attr} in relation ${r2.name}`);
                    return false;
                }

                if (!index.has(value)) {
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('Error in hasMatchingTuple:', error);
            return false;
        }
    }

    async performNaturalJoin(r1, r2) {
        try {
            console.log('Performing natural join between:', {
                r1: { name: r1.name, tupleCount: r1.tuples.size },
                r2: { name: r2.name, tupleCount: r2.tuples.size }
            });

            const commonAttributes = r1.getJoinAttributes(r2);
            const resultAttributes = [...r1.attributes];
            
            // Add non-common attributes from r2
            r2.attributes.forEach(attr => {
                if (!commonAttributes.includes(attr)) {
                    resultAttributes.push(attr);
                }
            });

            const result = new Relation(`${r1.name}_${r2.name}`, resultAttributes);

            // Create indices for join if needed
            for (const attr of commonAttributes) {
                if (!r2.indices.has(attr)) {
                    r2.createIndex(attr);
                }
            }

            // Perform join
            for (const [key1, tuple1] of r1.tuples) {
                const matches = await this.findMatches(tuple1, r1, r2, commonAttributes);
                for (const tuple2 of matches) {
                    const newTuple = [...tuple1];
                    r2.attributes.forEach((attr, i) => {
                        if (!commonAttributes.includes(attr)) {
                            newTuple.push(tuple2[i]);
                        }
                    });
                    result.addTuple(`${key1}_${tuple2[0]}`, newTuple);
                }
            }

            console.log('Natural join result:', {
                resultSize: result.tuples.size,
                attributes: result.attributes
            });

            return result;

        } catch (error) {
            console.error('Error in performNaturalJoin:', error);
            throw error;
        }
    }

    async findMatches(tuple1, r1, r2, commonAttributes) {
        try {
            const matches = [];
            const matchingSets = commonAttributes.map(attr => {
                const attrIndex = r1.attributes.indexOf(attr);
                const value = tuple1[attrIndex];
                return r2.indices.get(attr)?.get(value) || new Set();
            });

            if (matchingSets.length === 0) return matches;

            // Find intersection of all matching tuple sets
            const intersection = [...matchingSets[0]].filter(key => {
                return matchingSets.every(set => set.has(key));
            });

            // Get actual tuples
            for (const key of intersection) {
                const matchingTuple = r2.tuples.get(key);
                if (matchingTuple) {
                    matches.push(matchingTuple);
                }
            }

            return matches;
        } catch (error) {
            console.error('Error in findMatches:', error);
            return [];
        }
    }
}

module.exports = YannakakisProcessor;