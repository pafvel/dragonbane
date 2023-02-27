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

    _prepareWeapon() {
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
    }

    get displayName() {
        if (this.system.quantity == 1) {
            return this.name;
        }
        return this.name + " (" + this.system.quantity + ")";
    }

    get totalWeight() {
        return this.system.weight * this.system.quantity;
    }

    getSpellCost(powerLevel)
    {
        if (this.type != "spell") return 0;
        if (this.system.rank == 0) return 1; // Trick cost
        return powerLevel * 2; // Spell cost
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
}
  