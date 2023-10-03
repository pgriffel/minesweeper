
/**
 * Provides a unique id. The id is used in relations to identify objects and define equivalence
 * relation 'equiv'.
 */
export interface Identifiable {
    id: string;
}


/**
 * Are two entities equivalent? The equivalence is defined by the id property.
 * 
 * @param x An Identifiable
 * @param y An other Identifiable
 * @returns True iff x and y have the same id
 */
export function equiv(x: Identifiable, y: Identifiable) {
    return x.id === y.id;
}


/**
 * A mathematical/logical relation.
 * 
 * Defined by a characteristic function that abstracts from any implementation. Corresponds
 * with the set { (x, y) | x in rel.domain and y in rel.range and rel.at(x, y)}.
 */
export interface Relation<T extends Identifiable, U extends Identifiable> {
    domain: T[],
    range: U[],
    at: (x: T, y: U) => boolean
}


/**
 * Warshall's algorhitm for a relation's closure
 * 
 * @param relation A relation. The domain and range must be the same.
 * @returns The closure of the relation
 */
export function closure<T extends Identifiable>(relation: Relation<T, T>): Relation<T, T> {

    // The closure's characeristic function is backed by a table of tables. These
    // tables depend on the entities' unique id.
    const related = new Map<string, Map<string, boolean>>();

    // Set the value for a pair to true or false
    function put(x: T, y: T, value: boolean) {
        let map = related.get(x.id);
        if (!map) {
            map = new Map();
            related.set(x.id, map);
        }
        map.set(y.id, value);
    }

    // Get the value for a pair
    function get(x: T, y: T): boolean {
        let map = related.get(x.id);
        if (map) {
            return map.get(y.id) || false;
        } else {
            return false;
        }
    }

    // Initialize the backing tables with the given relation
    for (const x of relation.domain) {
        for (const y of relation.domain) {
            put(x, y, relation.at(x, y));
        }   
    }

    // Perform Warshall's triple nested loops
    for (const k of relation.domain) {
        for (const i of relation.domain) {
            for (const j of relation.domain) {
                put(i, j, get(i, j) || (get(i, k) && get(k, j)));
            }
        }    
    }

    // Return a new relation with the closure 
    return {
        domain: relation.domain,
        range: relation.range,
        at: (x: T, y: T) => get(x, y)
    };
}
