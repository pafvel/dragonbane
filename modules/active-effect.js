import { DoDActor } from "./actor.js";
import DoD_Utility from "./utility.js";

export default class DoDActiveEffect extends ActiveEffect {

    get canDeleteFromCharacterSheet() {
        return this.isOwner && this.parent instanceof DoDActor;
    }

    get applyOnlyWhenEquipped() {
        const flag = this.getFlag(game.system.id, "applyOnlyWhenEquipped");
        return !!flag;
    }
    set applyOnlyWhenEquipped(value) {
        this.setFlag(game.system.id, "applyOnlyWhenEquipped", value);
    }

    toObject(source=true) {
        const data = super.toObject(source);
        data.applyOnlyWhenEquipped = this.applyOnlyWhenEquipped;
        return data;
    }
  
    async update(data={}, context={}) {
        if ("applyOnlyWhenEquipped" in data) {
            await this.setFlag(game.system.id, "applyOnlyWhenEquipped", data.applyOnlyWhenEquipped);
        }
        return super.update(data, context);
    }
  
    get isSuppressed() {
        // If applyOnlyWhenEquipped is true, check if the item is equipped
        // NPCs and Monsters don't have equip checkboxes - assume that items are always equipped. Disable on effects tab instead.
        if (this.parent instanceof Item && !this.parent.system.worn && this.applyOnlyWhenEquipped && this.target?.type === "character") {
            return true;
        }
        return false;
    }

    get isCondition() {
        return this.statuses.first()?.startsWith("dragonbane.condition");
    }

    /**
    * 
    * @param {Actor} actor                   The Actor to whom this effect should be applied
    * @param {EffectChangeData} change       The change data being applied
    * @returns {*}                           The resulting applied value
    */
    apply(actor, change) {
        
        let key = change.key.split(".");

        if (key[0] === "system") {
            if (key[1] === "damageBonus") {
                DoDActiveEffect.deferChange(actor, change);
            } else if (key[1] === "movement") {
                DoDActiveEffect.deferChange(actor, change);
            } else if (key[1] === "hitPoints") {
                DoDActiveEffect.deferChange(actor, change);
            } else if (key[1] === "willPoints") {
                DoDActiveEffect.deferChange(actor, change);
            } else if (key[1] === "maxEncumbrance") {
                DoDActiveEffect.deferChange(actor, change);
            } else if(key[1] === "attributes") {
                if (actor.system.attributes) {
                    return super.apply(actor, change);
                }
            } else if(key[1] === "ferocity") {
                if (actor.system.ferocity) {
                    return super.apply(actor, change);
                }
            }    
        }
    }

    /**
    * Defers change until applyDeferredChange() is called
    * @param {DoDActor} actor              The Actor to whom this effect should be applied
    * @param {EffectChangeData} change     The change data being applied
    */
    static deferChange(actor, change) {
        if (!actor.system.deferredChanges) {
            actor.system.deferredChanges = [];
        }
        actor.system.deferredChanges.push(change);
    }

    /**
    * Applies deferred changes
    * @param {DoDActor} actor                   The Actor to whom this effect should be applied
    */
    static applyDeferredChanges(actor) {
        if (actor.system.deferredChanges) {
            for (let change of actor.system.deferredChanges) {
                const fieldName = change.key.replace("system.", "");
                const field = actor.system.schema.getField(fieldName);

                if (field) {
                    change.effect.applyDeferredChange(actor, change);
                
                    // Clean up the value
                    const newValue = foundry.utils.getProperty(actor, change.key);
                    const cleanValue = field.clean(newValue);
                    if (cleanValue !== newValue) {
                        foundry.utils.setProperty(actor, change.key, cleanValue);
                    }    
                }
            }
            delete actor.system.deferredChanges;
        }
    }

    /**
    * 
    * @param {Actor} actor                   The Actor to whom this effect should be applied
    * @param {EffectChangeData} change       The change data being applied
    */
    applyDeferredChange(actor, change) {
        let key = change.key.split(".");

        if (key[1] === "damageBonus") {
            this.applyDamageBonusChange(actor, change, key[2]);
        } else {
            super.apply(actor, change);
        }
    }

    /**
     * 
     * @param {DoDActor} actor          The Actor to whom this effect should be applied
     * @param {EffectChangeData} change The change data being applied
     * @param {String} attribute        The damage bonus attribute this change should be applied to
     */
    applyDamageBonusChange(actor, change, attribute) {
        const DoD = CONFIG.DoD;

        let value = actor.system.damageBonus[attribute].value.toLowerCase();
        const entries = Object.entries(DoD.dice);
        let index = entries.findIndex(e => e[0] == value);

        // Apply change
        const modes = CONST.ACTIVE_EFFECT_MODES;
        switch ( change.mode ) {
            case modes.ADD:
                {
                    let i = parseInt(change.value);
                    if(!isNaN(i)) {
                        index += i;
                    }
                    index = DoD_Utility.clamp(index, 0, entries.length-1);
                    value = entries[index][0];    
                }
                break;
            case modes.OVERRIDE:
                value = DoD.dice[String(change.value).toLowerCase()];
                index = entries.findIndex(e => e[1] == value);
                index = DoD_Utility.clamp(index, 0, entries.length-1);
                value = index > 0 ? value : DoD.dice.none;
            case modes.UPGRADE:
                {
                    let upgradeValue = DoD.dice[String(change.value).toLowerCase()];
                    let upgradeIndex = entries.findIndex(e => e[1] == upgradeValue);
                    index = Math.max(index, upgradeIndex);
                    index = DoD_Utility.clamp(index, 0, entries.length-1);
                    value = entries[index][0];
                }
                break;
            case modes.DOWNGRADE:
                {
                    let downgradeValue = DoD.dice[String(change.value).toLowerCase()];
                    let downgradeIndex = entries.findIndex(e => e[1] == downgradeValue);
                    index = Math.min(index, downgradeIndex);
                    index = DoD_Utility.clamp(index, 0, entries.length-1);
                    value = entries[index][0];
                }
                break;
            case modes.MULTIPLY:
            default:
                break;
        }
        actor.system.damageBonus[attribute].value = value;
    }
}