// src/processors/JoinOptimizer.js
const JoinTree = require('../models/JoinTree');

class JoinOptimizer {
    /**
     * Optimizes the sequence of joins based on relation sizes and selectivity
     * @param {Array<Relation>} relations - Array of relations to join
     * @param {Array<Object>} joinConditions - Array of join conditions
     * @returns {JoinTree} Optimized join tree
     */
    static optimizeJoinSequence(relations, joinConditions) {
        try {
            // Input validation
            this.validateInput(relations, joinConditions);

            // Build adjacency graph for join conditions
            const joinGraph = this.buildJoinGraph(relations, joinConditions);
            
            // Check if joins are acyclic
            if (!this.isAcyclic(joinGraph)) {
                throw new Error('Only acyclic joins are supported');
            }

            // Sort relations by selectivity and size
            const sortedRelations = this.sortRelationsBySelectivity(relations, joinConditions);

            // Build optimal join tree
            return this.buildJoinTree(
                sortedRelations[0], 
                joinGraph, 
                joinConditions, 
                relations
            );
        } catch (error) {
            console.error('Error in optimizeJoinSequence:', error);
            throw error;
        }
    }

    /**
     * Validates input parameters
     * @private
     */
    static validateInput(relations, joinConditions) {
        if (!Array.isArray(relations) || relations.length < 2) {
            throw new Error('At least two relations are required for join');
        }
        if (!Array.isArray(joinConditions) || joinConditions.length === 0) {
            throw new Error('Join conditions are required');
        }

        // Validate relations
        relations.forEach((relation, index) => {
            if (!relation || !relation.name || !relation.attributes) {
                throw new Error(`Invalid relation at index ${index}`);
            }
        });

        // Validate join conditions
        joinConditions.forEach((condition, index) => {
            if (!condition.relations || !Array.isArray(condition.relations) || 
                condition.relations.length !== 2 || !condition.attributes) {
                throw new Error(`Invalid join condition at index ${index}`);
            }
        });
    }

    /**
     * Builds a graph representation of join relationships
     * @private
     */
    static buildJoinGraph(relations, joinConditions) {
        const graph = new Map();

        // Initialize graph
        relations.forEach(relation => {
            graph.set(relation.name, new Set());
        });

        // Add edges
        joinConditions.forEach(condition => {
            const [rel1, rel2] = condition.relations;
            if (!graph.has(rel1) || !graph.has(rel2)) {
                throw new Error(`Unknown relation in join condition: ${rel1} or ${rel2}`);
            }
            graph.get(rel1).add(rel2);
            graph.get(rel2).add(rel1);
        });

        return graph;
    }

    /**
     * Checks if the join graph is acyclic
     * @private
     */
    static isAcyclic(graph) {
        const visited = new Set();
        const recursionStack = new Set();

        const hasCycle = (node, parent) => {
            visited.add(node);
            recursionStack.add(node);

            const neighbors = graph.get(node);
            if (neighbors) {
                for (const neighbor of neighbors) {
                    if (neighbor === parent) continue;
                    
                    if (!visited.has(neighbor)) {
                        if (hasCycle(neighbor, node)) {
                            return true;
                        }
                    } else if (recursionStack.has(neighbor)) {
                        return true;
                    }
                }
            }

            recursionStack.delete(node);
            return false;
        };

        for (const node of graph.keys()) {
            if (!visited.has(node)) {
                if (hasCycle(node, null)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Sorts relations based on selectivity and size
     * @private
     */
    static sortRelationsBySelectivity(relations, joinConditions) {
        return [...relations].sort((a, b) => {
            const costA = this.calculateJoinCost(a, joinConditions);
            const costB = this.calculateJoinCost(b, joinConditions);
            return costA - costB;
        });
    }

    /**
     * Calculates join cost for a relation
     * @private
     */
    static calculateJoinCost(relation, joinConditions) {
        const relevantJoins = joinConditions.filter(jc =>
            jc.relations.includes(relation.name)
        );

        let selectivity = 1;
        for (const join of relevantJoins) {
            const attr = join.attributes[relation.name];
            if (relation.statistics?.attributeStats) {
                const stats = relation.statistics.attributeStats.get(attr);
                if (stats) {
                    selectivity *= 1 / Math.max(1, stats.distinctValues);
                }
            }
        }

        // Cost = size * selectivity
        return relation.tuples.size * selectivity;
    }

    /**
     * Builds an optimal join tree
     * @private
     */
    static buildJoinTree(rootRelation, joinGraph, joinConditions, allRelations) {
        const visited = new Set([rootRelation.name]);
        const children = [];
        const joinAttrs = new Set();

        const neighbors = joinGraph.get(rootRelation.name);
        if (neighbors) {
            for (const neighborName of neighbors) {
                if (visited.has(neighborName)) continue;

                const joinCond = joinConditions.find(jc =>
                    jc.relations.includes(rootRelation.name) &&
                    jc.relations.includes(neighborName)
                );

                if (joinCond) {
                    const neighborRelation = allRelations.find(r => r.name === neighborName);
                    if (!neighborRelation) {
                        throw new Error(`Relation ${neighborName} not found`);
                    }

                    const subtree = this.buildJoinSubtree(
                        neighborRelation,
                        joinGraph,
                        joinConditions,
                        visited,
                        allRelations
                    );
                    
                    children.push(subtree);
                    joinAttrs.add(joinCond.attributes[rootRelation.name]);
                }
            }
        }

        return new JoinTree(rootRelation, children, Array.from(joinAttrs));
    }

    /**
     * Recursively builds join subtrees
     * @private
     */
    static buildJoinSubtree(relation, joinGraph, joinConditions, visited, allRelations) {
        visited.add(relation.name);
        const children = [];
        const joinAttrs = new Set();

        const neighbors = joinGraph.get(relation.name);
        if (neighbors) {
            for (const neighborName of neighbors) {
                if (visited.has(neighborName)) continue;

                const joinCond = joinConditions.find(jc =>
                    jc.relations.includes(relation.name) &&
                    jc.relations.includes(neighborName)
                );

                if (joinCond) {
                    const neighborRelation = allRelations.find(r => r.name === neighborName);
                    if (!neighborRelation) {
                        throw new Error(`Relation ${neighborName} not found`);
                    }

                    const subtree = this.buildJoinSubtree(
                        neighborRelation,
                        joinGraph,
                        joinConditions,
                        visited,
                        allRelations
                    );
                    
                    children.push(subtree);
                    joinAttrs.add(joinCond.attributes[relation.name]);
                }
            }
        }

        return new JoinTree(relation, children, Array.from(joinAttrs));
    }

    /**
     * Estimates the cost of a join tree
     * @public
     */
    static estimateJoinTreeCost(joinTree) {
        let cost = joinTree.node.tuples.size;

        for (const child of joinTree.children) {
            cost += this.estimateJoinTreeCost(child);
            
            const joinSelectivity = this.calculateJoinSelectivity(
                joinTree.node,
                child.node,
                joinTree.joinAttributes
            );
            cost += joinTree.node.tuples.size * child.node.tuples.size * joinSelectivity;
        }

        return cost;
    }

    /**
     * Calculates join selectivity between two relations
     * @private
     */
    static calculateJoinSelectivity(rel1, rel2, joinAttributes) {
        let selectivity = 1;

        for (const attr of joinAttributes) {
            if (rel1.statistics?.attributeStats && rel2.statistics?.attributeStats) {
                const stats1 = rel1.statistics.attributeStats.get(attr);
                const stats2 = rel2.statistics.attributeStats.get(attr);

                if (stats1 && stats2) {
                    const distinctValues = Math.max(
                        stats1.distinctValues,
                        stats2.distinctValues
                    );
                    selectivity *= 1 / Math.max(1, distinctValues);
                }
            }
        }

        return selectivity;
    }
}

module.exports = JoinOptimizer;