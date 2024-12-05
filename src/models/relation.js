// deprecated -> refer Jointree Class

class Relation {
    constructor(name, attributes, tuples) {
        this.name = name;
        this.attributes = new Set(attributes);
        this.tuples = tuples;
    }

    project(targetAttributes) {
        const indices = targetAttributes.map(attr => 
            this.attributes.has(attr) ? [...this.attributes].indexOf(attr) : -1
        ).filter(i => i !== -1);

        return new Relation(
            this.name,
            targetAttributes,
            this.tuples.map(tuple => 
                indices.map(i => tuple[i])
            ).filter((tuple, index, self) => 
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

module.exports = Relation;