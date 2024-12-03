// src/models/joinTree.js
class Relation {
    constructor(name, attributes, tuples) {
        this.name = name;
        this.attributes = new Set(attributes);
        this.tuples = tuples;
    }

    project(targetAttributes) {
        const indices = targetAttributes.map(attr => 
            [...this.attributes].indexOf(attr)
        ).filter(i => i !== -1);

        return new Relation(
            this.name,
            targetAttributes,
            this.tuples.map(tuple => indices.map(i => tuple[i]))
                .filter((tuple, index, self) => 
                    index === self.findIndex(t => 
                        t.every((val, i) => val === tuple[i])
                    )
                )
        );
    }

    semiJoin(other, commonAttributes) {
        const thisIndices = commonAttributes.map(attr => 
            [...this.attributes].indexOf(attr)
        );
        const otherIndices = commonAttributes.map(attr => 
            [...other.attributes].indexOf(attr)
        );

        const otherTupleSet = new Set(
            other.tuples.map(tuple => 
                JSON.stringify(otherIndices.map(i => tuple[i]))
            )
        );

        return new Relation(
            this.name,
            [...this.attributes],
            this.tuples.filter(tuple => 
                otherTupleSet.has(
                    JSON.stringify(thisIndices.map(i => tuple[i]))
                )
            )
        );
    }
}

class JoinNode {
    constructor(relation = null) {
        this.relation = relation;
        this.left = null;
        this.right = null;
    }
}

class JoinTree {
    constructor() {
        this.root = new JoinNode();
    }

    static fromJson(json) {
        if (!json || !json.relation) {
            throw new Error('Invalid join tree format: missing relation');
        }

        const tree = new JoinTree();
        tree.root = new JoinNode();

        // Create relation for root
        tree.root.relation = new Relation(
            json.relation.name,
            json.relation.attributes,
            json.relation.tuples
        );

        // Recursively build left subtree
        if (json.left) {
            tree.root.left = new JoinNode();
            tree.root.left.relation = new Relation(
                json.left.relation.name,
                json.left.relation.attributes,
                json.left.relation.tuples
            );
        }

        // Recursively build right subtree
        if (json.right) {
            tree.root.right = new JoinNode();
            tree.root.right.relation = new Relation(
                json.right.relation.name,
                json.right.relation.attributes,
                json.right.relation.tuples
            );
        }

        return tree;
    }
}

module.exports = { Relation, JoinTree, JoinNode };