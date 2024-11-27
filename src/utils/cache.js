class Cache {
    constructor() {
        this.relations = new Map();
        this.joinResults = new Map();
    }

    static getInstance() {
        if (!Cache.instance) {
            Cache.instance = new Cache();
        }
        return Cache.instance;
    }

    async storeRelation(relation) {
        const id = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.relations.set(id, relation);
        return id;
    }

    async retrieveRelation(id) {
        return this.relations.get(id);
    }

    async storeJoinResult(result) {
        const id = `join_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.joinResults.set(id, result);
        return id;
    }
    
    async retrieveJoinResult(id) {
        return this.joinResults.get(id);
    }
}

module.exports = Cache;