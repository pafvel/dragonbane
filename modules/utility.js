export default class DoD_Utility {
    
    static nameSorter(a, b) {
        let aa = a.name.toLowerCase();
        let bb = b.name.toLowerCase();
        if (aa < bb)
            return -1;
        if (aa > bb)
            return 1;
        return 0;
    }

    static calculateBaseChance(attribute) {
        if (attribute <=0) return 0;
        if (attribute <=5) return 3;
        if (attribute <= 8) return 4;
        if (attribute <= 12) return 5;
        if (attribute <= 15) return 6;
        return 7;
    }

    static getConditionByAttributeName(actor, attributeName) {
        for (const [key, condition] of Object.entries(actor.system.conditions)) {
            if (condition.attribute == attributeName) {
                return condition;
            }
        }
        return null;
    }

}
