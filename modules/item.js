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
        if (this.type === "weapon") {
            this._prepareWeapon();
        }
    }
    _prepareWeapon() {
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
  }
  