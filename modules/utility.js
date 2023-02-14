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

    static calculateMovementModifier(attribute) {
        if (attribute <=6) return -4;
        if (attribute <=9) return -2;
        if (attribute <= 12) return 0;
        if (attribute <= 15) return 2;
        return 4;
    }

    static getConditionByAttributeName(actor, attributeName) {
        return actor.system.conditions[attributeName];
        /*
        for (const [key, condition] of Object.entries(actor.system.conditions)) {
            if (condition.attribute == attributeName) {
                return condition;
            }
        }
        return null;
        */
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

    static async findAbility(abilityName) {
        // Prio 1: World items
        let ability = this.findItem(abilityName, "ability", game.items);
        return ability;
    }

    static async findKin(kinName) {
        // Prio 1: World items
        let kin = this.findItem(kinName, "kin", game.items);
        return kin;
    }

    static async findProfession(kinName) {
        // Prio 1: World items
        let kin = this.findItem(kinName, "profession", game.items);
        return kin;
    }

    static async findItem(itemName, itemType, collection) {
        let name = itemName.toLowerCase();
        let item = collection.find(i => i.type == itemType && i.name.toLowerCase() == name);
        return item?.clone();
    }

    static splitAndTrimString(str) {
        let result = str?.split(',');
        for (var i = 0; i < result.length; i++) {
            result[i] = result[i].replace(/^\s+|\s+$/gm,'');
        }
        return result;
    }

    static WARNING(msg, params) {
        if (!params) {
            return ui.notifications.warn(game.i18n.localize(msg));
        } else {
            return ui.notifications.warn(game.i18n.format(game.i18n.localize(msg), params));
        }
    }
}
