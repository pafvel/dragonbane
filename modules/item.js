import DoD_Utility from "./utility.js";
import { DoD } from "./config.js";

export class DoDItem extends Item {
    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
      // As with the actor class, items are documents that can have their data
      // preparation methods overridden (such as prepareBaseData()).
      super.prepareData();
    }

    prepareDerivedData() {
        switch (this.type) {
            case "weapon":
                this._prepareWeapon();
                break;
            case "skill":
                this._prepareSkill();
                break;
        }
    }
    _prepareSkill() {
        this.system.attributeShort = game.i18n.localize("DoD.attributes." + this.system.attribute);
    }

    async _prepareWeapon() {
        // Migrate data from pre-release
        if (!Array.isArray(this.system.features)) {
            this.system.features = [];
        }
    
        // Grip label
        if (this.system.grip.value) {
            this.system.grip.label = "DoD.gripTypes." + this.system.grip.value;
        } else {
            this.system.grip.label = "DoD.gripTypes.none";
        }
        // Skill value
        let skill = this.actor?.getSkill(this.system.skill.name);
        this.system.skill.value = skill ? skill.system.value : 0;

        // Shield skill is same as best strength weapon skill
        if (this.actor && this.hasWeaponFeature("shield")) {
            for (let item of this.actor.items) {
                if (item.type == "skill" 
                && item.system.skillType == "weapon" 
                && item.system.attribute == "str"
                && item.system.value > this.system.skill.value)
                {
                    this.system.skill.name = item.name;
                    this.system.skill.value = item.system.value;
                }
            }
        }


        // Range
        if (this.actor) {
            let r = new Roll(String(this.system.range), {str: this.actor.system.attributes?.str.value});
            try {
                await r.evaluate({async: true});
                this.system.calculatedRange = r.total;
            } catch {
                DoD_Utility.WARNING("DoD.WARNING.cannotEvaluateFormula");
                this.system.range = "";
                this.system.calculatedRange = "";    
            }
        } else {
            let r = new Roll(String(this.system.range), {str: game.i18n.localize("DoD.attributes.str")});
            this.system.calculatedRange = r.formula;
        }
    }

    get displayName() {
        if (this.system.quantity == 1) {
            return this.name;
        }
        return this.name + " (" + this.system.quantity + ")";
    }

    get totalWeight() {
        return this.system.worn ? 0 : this.system.weight * this.system.quantity;
    }

    get displayWeight() {
        return this.totalWeight > 0 ? this.totalWeight : "-";
    }

    getSpellCost(powerLevel)
    {
        if (this.type != "spell") return 0;
        if (this.system.rank == 0) return 1; // Trick cost
        return powerLevel * 2; // Spell cost
    }

    get isDamaging() {
        if (this.type = "spell") {
            return this.system.damage?.length > 0 || this.system.damagePerPowerlevel?.length > 0;
        } else if (this.type = "weapon") {
            return this.system.damage?.length > 0;
        }
        return false;
    }

    get isHealing() {
        return this.isDamaging && this.system.damage[0] == "-";
    }

    hasWeaponFeature(feature) {
        return this.system.features.find(e => e == feature) ? true : false;
    }

    hasDamageBonus(damageType) {
        return this.system.bonuses?.find(e => e == damageType) ? true : false;
    }

    getArmorValue(damageType) {
        let bonus = this.hasDamageBonus(damageType) ? 2 : 0;
        return this.system.rating + bonus;
    }

    get requiredStr() {
        let str = Number(this.system.str);
        if (this.system.grip.value == "grip1h" && this.system.mainHand && this.system.offHand) {
            str = Math.max(0, str - 3);
        }
        return str;
    }

    get canImproveSkill() {
        return this.system.value < DoD.skillMaximum;
    }
}
  