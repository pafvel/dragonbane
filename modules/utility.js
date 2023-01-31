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

    static itemSorter(a, b) {
        return a.sort - b.sort;
    }

    static calculateBaseChance(attribute) {
        if (attribute <=0) return 0;
        if (attribute <=5) return 3;
        if (attribute <= 8) return 4;
        if (attribute <= 12) return 5;
        if (attribute <= 15) return 6;
        return 7;
    }

    static calculateDamageBonus(attribute) {
        if (attribute <=12) return "0";
        if (attribute <=16) return "+" + game.i18n.localize("DoD.dice.d4");
        return "+" + game.i18n.localize("DoD.dice.d6");
    }

    static calculateMovement(attribute) {
        if (attribute <=6) return 6;
        if (attribute <=9) return 8;
        if (attribute <= 12) return 10;
        if (attribute <= 15) return 12;
        return 14;
    }

    static getConditionByAttributeName(actor, attributeName) {
        for (const [key, condition] of Object.entries(actor.system.conditions)) {
            if (condition.attribute == attributeName) {
                return condition;
            }
        }
        return null;
    }

    static async getBaseSkills() {
        let baseSkills = [];
    
        let packName = "world.fardigheter-drakar-och-demoner";
        let pack = game.packs.get(packName);
        if (pack) {
            let docs = await pack.getDocuments();
            if (docs) {
                docs = docs.filter(doc => doc.system.skillType == "core" || doc.system.skillType == "weapon");
                docs.forEach(doc => baseSkills.push(doc.toObject()));
            }
        }
        return baseSkills;
    }
}
