import DoD_Utility from "./utility.js";

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
                if (item.type === "skill"
                && item.system.skillType === "weapon"
                && item.system.attribute === "str"
                && item.system.value > this.system.skill.value)
                {
                    this.system.skill.name = item.name;
                    this.system.skill.value = item.system.value;
                }
            }
        }
    }

    calculateRange() {
        if (this.actor && this.system.range !== "") {
            const str = this.actor.getAttribute("str");
            const agl = this.actor.getAttribute("agl");
            try {
                let r = new Roll(String(this.system.range), {str, agl});
                r.evaluateSync({});
                return r.total;
            } catch {
                DoD_Utility.WARNING("DoD.WARNING.cannotEvaluateFormula");
                return undefined;
            }
        } else {
            let r = new Roll(String(this.system.range), {
                agl: game.i18n.localize("DoD.attributes.agl"),
                str: game.i18n.localize("DoD.attributes.str")
            });
            return r.formula;
        }
    }

    get calculatedRange() {
        return this.calculateRange();
    }

    get displayName() {
        if (this.system.quantity === 1) {
            return this.name;
        }
        return this.name + " (" + this.system.quantity + ")";
    }

    get totalWeight() {
        if (this.system.worn === undefined || this.system.weight === undefined || this.system.quantity === undefined) {
            return 0;
        }
        return this.system.worn ? 0 : Math.round(100 * this.system.weight * this.system.quantity) / 100;
    }

    get displayWeight() {
        return this.totalWeight > 0 ? this.totalWeight : "-";
    }

    getSpellCost(powerLevel)
    {
        if (!this.isSpellType) return 0;
        if (this.system.rank === 0) return 1; // Trick cost
        const rankMultiplier = this.system.rank === 6 ? 3 : 1; // Rank 6 spells, e.g. Dracomancy, cost triple
        return powerLevel * 2 * rankMultiplier; // Spell cost
    }

    get isDamaging() {
        if (this.type === "spell") {
            return this.system.damage?.length > 0 || this.system.damagePerPowerlevel?.length > 0;
        } else if (this.type === "weapon") {
            return this.system.damage?.length > 0;
        }
        return false;
    }

    get isHealing() {
        return this.isDamaging && this.system.damage[0] === "-";
    }

    hasWeaponFeature(feature) {
        return !!this.system.features.find(e => e === feature);
    }

    hasDamageBonus(damageType) {
        return !!this.system.bonuses?.find(e => e === damageType);
    }

    getArmorValue(damageType) {
        let bonus = this.hasDamageBonus(damageType) ? 2 : 0;
        return this.system.rating + bonus;
    }

    get requiredStr() {
        let str = Number(this.system.str);
        if (this.system.grip.value === "grip1h" && this.system.mainHand && this.system.offHand) {
            str = Math.max(0, str - 3);
        }
        return str;
    }

    get canImproveSkill() {
        return this.system.value < CONFIG.DoD.skillMaximum;
    }

    /**
     * 
     * @param {Boolean} options.remove      true: Remove injury if healing time = 0; false: Don't remove injury; undefined: Popup dialog to ask if injury should be deleted
     * @param {Boolean} options.silent      true: Don't create chat message
     * @returns 
     */
    async reduceHealingTime(options = {}) {
        if(this.type !== "injury" || isNaN(this.system.healingTime)) {
            return;
        }
        const newHealingTime = Math.max(Number(this.system.healingTime) - 1, 0);

        if (!options.silent) {
            ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: game.i18n.format("DoD.injury.healingTimeChanged", {injury: this.name, from: this.system.healingTime, to: newHealingTime})
            });
        }

        await this.update({"system.healingTime": newHealingTime});

        if (newHealingTime === 0) {
            if ("remove" in options) {
                if (options.remove) {
                    return await this.actor.deleteEmbeddedDocuments("Item", [this.id]);
                }
            } else {
                return await this.actor.deleteItemDialog(this, game.i18n.format("DoD.injury.healingTimeExpired", {injury: this.name}));
            }
        }
    }
    /**
     * 
     * @param {Boolean} options.silent      true: Don't create chat message
     * @returns 
     */
    async increaseHealingTime(options = {}) {
        if(this.type !== "injury" || isNaN(this.system.healingTime)) {
            return;
        }
        const newHealingTime = Number(this.system.healingTime) + 1;

        if (!options.silent) {
            ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: game.i18n.format("DoD.injury.healingTimeChanged", {injury: this.name, from: this.system.healingTime, to: newHealingTime})
            });
        }

        return await this.update({"system.healingTime": newHealingTime});
    }

    get isKinAbility() {
        return this.type === "ability" && this.system.abilityType === "kin";
    }

    get isProfessionAbility() {
        return this.type === "ability" && this.system.abilityType === "profession";
    }

    async removeAbility(name) {
        // Ability names defined in the current kin/profession
        const oldAbilityNames = DoD_Utility.splitAndTrimString(this.system.abilities);
        const newAbilityNames = oldAbilityNames?.filter(e => e.toUpperCase() !== name.toUpperCase());
        const newAbilities = newAbilityNames?.join(", ");
        if (newAbilities !== this.system.abilities) {
            await this.update({"system.abilities": newAbilities});
        }
    }

    findMaterial(name, actor = this.actor) {
        return actor.items.find(item =>
            item.name.toLowerCase() === name.toLowerCase() && item.isInventoryItem && item.system.quantity > 0);
    }

    countMaterial(name, actor = this.actor) {
        return actor.items.reduce((sum, item) => {
            if (item.name.toLowerCase() === name.toLowerCase() && item.isInventoryItem) {
                return sum + item.system.quantity;
            }
            return sum;
        }, 0);
    }

    countMaterials(actor = this.actor) {
        if (this.type !== "recipe") return [];
        const materialCounts = [];
        for (const m of this.system.materials) {
            materialCounts.push(this.countMaterial(m.name, actor));
        }
        return materialCounts;
    }

    hasMaterials({ actor, count = 1 } = { actor: this.actor, count: 1 }) {
        if (this.type !== "recipe") return;
        const materialMap = {};
        for (const m of this.system.materials) {
            const name = m.name.toLowerCase();
            if (!materialMap[name]) {
                materialMap[name] = 0;
            }
            materialMap[name]++;
        }
        for (const materialName in materialMap) {
            if (this.countMaterial(materialName, actor) < count * materialMap[materialName]) {
                return false;
            }
        }
        return true;
    }

    async consumeMaterials({ actor, count } = { actor: this.actor, count: 1 }) {
        if (this.type !== "recipe") return;

        if (!this.hasMaterials({ actor, count })) {
            DoD_Utility.WARNING("DoD.WARNING.missingMaterial");
            return;
        }

        for (const m of this.system.materials) {
            let consumed = 0;
            while (consumed < count) {
                const material = this.findMaterial(m.name, actor);
                if (material) {
                    // Consume the material
                    const toConsume = Math.min(material.system.quantity, count - consumed);
                    await material.update({"system.quantity": material.system.quantity - toConsume});
                    consumed += toConsume;
                } else {
                    DoD_Utility.ERROR("DoD.WARNING.missingMaterial"); // This should not happen
                    break;
                }
            }
        }
    }

    get canCraftItem() {
        if (this.type !== "recipe") return false;
        if (!this.system.item.resolveSync()) {
            return false;
        }
        return this.hasMaterials(this.actor);
    }

    hasPotency() {
        return DoD_Utility.hasDefinition(this.system.itemDescription, "potency");
    }

    async createCraftedItem({ actor, count = 1, powerLevel = 1 } = { actor: this.actor, count: 1, powerLevel: 1 }) {
        if (this.type !== "recipe") return;
        const item = await this.system.item.resolve();
        if (item) {
            // Loop one at a time so dice formulas in properties roll independently per item
            for (let i = 0; i < count; i++) {
                const newItemData = foundry.utils.duplicate(item.toObject());
                const { resolvedStr: description, resolved } =
                    await DoD_Utility.resolveDefinitions(item.system.itemDescription, { powerLevel });
                newItemData.system.itemDescription = description;
                const cost = await DoD_Utility.resolveInlineVars(item.system.cost, resolved);
                newItemData.system.cost = cost;

                const stackableItem = actor.findStackableItem(item, newItemData);
                if (stackableItem) {
                    await stackableItem.update({"system.quantity": stackableItem.system.quantity + 1});
                } else {
                    newItemData.system.quantity = 1;
                    await actor.createEmbeddedDocuments("Item", [newItemData]);
                }
            }
        } else {
            DoD_Utility.WARNING("DoD.WARNING.cannotCreateCraftedItem");
        }
    }

    get isRangedWeapon() {
        return this.type === "weapon" && this.calculatedRange >= 10;
    }

    get isSpellType() {
        return this.type === "spell" || this.type === "recipe";
    }

    get isInventoryItem() {
        return ["armor", "helmet", "item", "material", "weapon"].includes(this.type);
    }
}
