export default class DoD_Utility {
    
    static clamp(value, min, max) {
        if(value < min) {
            return min;
        } else if (value > max) {
            return max;
        } else {
            return value;
        }
    };

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
        if (attribute <=16) return game.i18n.localize("DoD.dice.d4");
        return game.i18n.localize("DoD.dice.d6");
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
    }

    static async getBaseSkills() {
        let skills = game.items.filter(i => i.type == "skill" && (i.system.skillType == "core" || i.system.skillType == "weapon"));
        return skills.map(skill => skill.toObject());
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

    static async findSkill(skillName) {
        // Prio 1: World items
        let kin = this.findItem(skillName, "skill", game.items);
        return kin;
    }

    static async findProfession(professionName) {
        // Prio 1: World items
        let kin = this.findItem(professionName, "profession", game.items);
        return kin;
    }

    static findTable(name) {
        let table = game.tables.find(i => i.name.toLowerCase() == name.toLowerCase()) || fromUuidSync(name);
        if (!table) {
            DoD_Utility.WARNING("DoD.WARNING.tableNotFound", {id: name});
            return null;    
        }
        return table;
    }

    static async findItem(itemName, itemType, collection) {
        let name = itemName.toLowerCase();
        let item = collection.find(i => i.type == itemType && i.name.toLowerCase() == name);
        return item?.clone();
    }

    static getActorFromUUID(uuid) {
        let doc = null;
        try {
            doc = fromUuidSync(uuid);
        } catch (err) {
            DoD_Utility.WARNING(err.message);
        }
        let actor = doc?.actor ?? doc;
        if (!actor) {
            DoD_Utility.WARNING("DoD.WARNING.actorNotFound", {id: uuid});
            return null;    
        }
        return actor;
    }
    
    static splitAndTrimString(str) {
        let result = str?.split(',');
        for (var i = 0; i < result.length; i++) {
            result[i] = result[i].replace(/^\s+|\s+$/gm,'');
        }
        return result;
    }

    static async handleTableRoll(event) {
        const tableId = event.currentTarget.dataset.tableId;
        const tableName = event.currentTarget.dataset.tableName;
        const table = fromUuidSync(tableId) || this.findTable(tableName);
        if (table) {
            if (event.type == "click") { // left click
                table.draw();
            } else { // right click
                table.sheet.render(true);
            }
        }
        event.preventDefault();
        event.stopPropagation();
    }
    

    static INFO(msg, params) {
        if (!params) {
            return ui.notifications.info(game.i18n.localize(msg));
        } else {
            return ui.notifications.info(game.i18n.format(game.i18n.localize(msg), params));
        }
    }

    static WARNING(msg, params) {
        if (!params) {
            return ui.notifications.warn(game.i18n.localize(msg));
        } else {
            return ui.notifications.warn(game.i18n.format(game.i18n.localize(msg), params));
        }
    }
}
