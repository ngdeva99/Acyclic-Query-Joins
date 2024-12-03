// src/processors/yannakakis.js
const { Relation } = require('../models/joinTree');
const fs = require('fs');

// src/processors/yannakakis.js
class YannakakisProcessor {
    static getCommonAttributes(rel1, rel2) {
        if (!rel1 || !rel2 || !rel1.attributes || !rel2.attributes) {
            return [];
        }
        return [...rel1.attributes].filter(attr => 
            rel2.attributes.has(attr)
        );
    }

    // static joinRelations(rel1, rel2) {
    //     if (!rel1 || !rel2) {
    //         throw new Error('Invalid relations for join');
    //     }

    //     const commonAttributes = this.getCommonAttributes(rel1, rel2);
        
    //     // Get indices for common attributes
    //     const rel1CommonIndices = commonAttributes.map(attr => 
    //         [...rel1.attributes].indexOf(attr)
    //     );
    //     const rel2CommonIndices = commonAttributes.map(attr =>  
    //         [...rel2.attributes].indexOf(attr)
    //     );

    //     // Get all attributes from rel1
    //     const rel1Attributes = [...rel1.attributes];

    //     // Get unique attributes from rel2 (not in common with rel1)
    //     const rel2UniqueAttrs = [...rel2.attributes].filter(attr => 
    //         !commonAttributes.includes(attr)
    //     );
    //     const rel2UniqueIndices = rel2UniqueAttrs.map(attr => 
    //         [...rel2.attributes].indexOf(attr)
    //     );

    //     // Combine all attributes
    //     const resultAttributes = [...rel1Attributes, ...rel2UniqueAttrs];

    //     // Perform the join
    //     const resultTuples = [];
    //     for (const tuple1 of rel1.tuples) {
    //         const key1 = JSON.stringify(rel1CommonIndices.map(i => tuple1[i]));
            
    //         for (const tuple2 of rel2.tuples) {
    //             const key2 = JSON.stringify(rel2CommonIndices.map(i => tuple2[i]));
                
    //             if (key1 === key2) {
    //                 const newTuple = [
    //                     ...tuple1,
    //                     ...rel2UniqueIndices.map(i => tuple2[i])
    //                 ];
    //                 resultTuples.push(newTuple);
    //             }
    //         }
    //     }

    //     return new Relation(
    //         `${rel1.name}_${rel2.name}`,
    //         resultAttributes,
    //         resultTuples
    //     );
    // }


    static joinRelations(rel1, rel2) {
        if (!rel1 || !rel2) {
            throw new Error('Invalid relations for join');
        }
    
        // Find common join attributes
        const commonAttrs = this.getCommonAttributes(rel1, rel2);
        if (commonAttrs.length === 0) {
            console.log('No common attributes found between relations:', 
                rel1.name, rel2.name);
            return null;
        }
    
        // Get indices for join attributes
        const rel1JoinIndices = commonAttrs.map(attr => 
            [...rel1.attributes].indexOf(attr));
        const rel2JoinIndices = commonAttrs.map(attr => 
            [...rel2.attributes].indexOf(attr));
    
        // Get all other attributes (non-join attributes)
        const rel2UniqueAttrs = [...rel2.attributes].filter(attr => 
            !commonAttrs.includes(attr));
        const rel2UniqueIndices = rel2UniqueAttrs.map(attr => 
            [...rel2.attributes].indexOf(attr));
    
        // Perform join
        const resultTuples = [];
        const joinKeyMap = new Map();
    
        // Build hash table for rel2
        rel2.tuples.forEach(tuple2 => {
            const key = JSON.stringify(rel2JoinIndices.map(i => tuple2[i]));
            if (!joinKeyMap.has(key)) {
                joinKeyMap.set(key, []);
            }
            joinKeyMap.get(key).push(tuple2);
        });
    
        // Probe phase
        rel1.tuples.forEach(tuple1 => {
            const key = JSON.stringify(rel1JoinIndices.map(i => tuple1[i]));
            const matches = joinKeyMap.get(key) || [];
            
            matches.forEach(tuple2 => {
                const newTuple = [
                    ...tuple1,
                    ...rel2UniqueIndices.map(i => tuple2[i])
                ];
                resultTuples.push(newTuple);
            });
        });
    
        return new Relation(
            `${rel1.name}_${rel2.name}`,
            [...rel1.attributes, ...rel2UniqueAttrs],
            resultTuples
        );
    }

    static bottomUpPhase(node) {
        if (!node || !node.relation) return null;
        
        // Process children recursively
        if (node.left) this.bottomUpPhase(node.left);
        if (node.right) this.bottomUpPhase(node.right);

        // Perform semi-joins with children
        if (node.left && node.left.relation) {
            const commonAttrs = this.getCommonAttributes(
                node.relation, 
                node.left.relation
            );
            if (commonAttrs.length > 0) {
                node.relation = node.relation.semiJoin(
                    node.left.relation, 
                    commonAttrs
                );
            }
        }

        if (node.right && node.right.relation) {
            const commonAttrs = this.getCommonAttributes(
                node.relation, 
                node.right.relation
            );
            if (commonAttrs.length > 0) {
                node.relation = node.relation.semiJoin(
                    node.right.relation, 
                    commonAttrs
                );
            }
        }

        return node;
    }

    static topDownPhase(node) {
        if (!node || !node.relation) return;

        // Semi-join with parent
        if (node.left && node.left.relation) {
            const commonAttrs = this.getCommonAttributes(
                node.relation,
                node.left.relation
            );
            if (commonAttrs.length > 0) {
                node.left.relation = node.left.relation.semiJoin(
                    node.relation,
                    commonAttrs
                );
            }
            this.topDownPhase(node.left);
        }

        if (node.right && node.right.relation) {
            const commonAttrs = this.getCommonAttributes(
                node.relation,
                node.right.relation
            );
            if (commonAttrs.length > 0) {
                node.right.relation = node.right.relation.semiJoin(
                    node.relation,
                    commonAttrs
                );
            }
            this.topDownPhase(node.right);
        }
    }

    static joinPhase(node) {
        if (!node || !node.relation) return null;

        let result = node.relation;

        try {
            // First join with left subtree
            if (node.left && node.left.relation) {
                const leftResult = this.joinPhase(node.left);
                if (leftResult) {
                    result = this.joinRelations(result, leftResult);
                }
            }
            
            // Then join with right subtree
            if (node.right && node.right.relation) {
                const rightResult = this.joinPhase(node.right);
                if (rightResult) {
                    result = this.joinRelations(result, rightResult);
                }
            }

            return result;
        } catch (error) {
            console.error('Error in join phase:', error);
            return null;
        }
    }

    static process(joinTree) {
        if (!joinTree || !joinTree.root || !joinTree.root.relation) {
            throw new Error('Invalid join tree structure');
        }

        console.log('Starting Yannakakis processing...');
        
        // Phase 1a: Bottom-up semi-joins
        console.log('Performing bottom-up phase...');
        this.bottomUpPhase(joinTree.root);
        
        // Phase 1b: Top-down semi-joins
        console.log('Performing top-down phase...');
        this.topDownPhase(joinTree.root);
        
        // Phase 2: Join Phase
        console.log('Performing join phase...');
        const result = this.joinPhase(joinTree.root);
        
        if (!result) {
            throw new Error('Join phase failed to produce a result');
        }

        console.log('Final attributes:', [...result.attributes]);
        console.log('Final tuple count:', result.tuples.length);
        if (result.tuples) {
            fs.appendFileSync(`report-1.txt`, JSON.stringify(result.tuples));
        }
        return result;
    }
}

module.exports = YannakakisProcessor;