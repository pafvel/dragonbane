import { DoDActor } from "./actor.js";
import { DoD } from "./config.js";
import DoD_Utility from "./utility.js";

export default class DoDActiveEffect extends ActiveEffect {

    get canDeleteFromCharacterSheet() {
        return this.isOwner && this.parent instanceof DoDActor;
    }

    /**
    * 
    * @param {Actor} actor                   The Actor to whom this effect should be applied
    * @param {EffectChangeData} change       The change data being applied
    * @returns {*}                           The resulting applied value
    */
    apply(actor, change) {
        
        let key = change.key.split(".");

        if (key[0] === "damageBonus") {
            DoDActiveEffect.deferChange(actor, change);
        } else if (key[0] === "system" && key[1] === "movement") {
            DoDActiveEffect.deferChange(actor, change);
        } else if (key[0] === "system" && key[1] === "hitPoints") {
            DoDActiveEffect.deferChange(actor, change);
        } else if (key[0] === "system" && key[1] === "willPoints") {
            DoDActiveEffect.deferChange(actor, change);
        } else if(key[0] === "system" && key[1] === "attributes") {
            if (actor.system.attributes) {
                return super.apply(actor, change);
            }
        } else if(key[0] === "system" && key[1] === "ferocity") {
            if (actor.system.ferocity) {
                return super.apply(actor, change);
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
                change.effect.applyDeferredChange(actor, change);
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

        if (key[0] === "damageBonus") {
            this.applyDamageBonusChange(actor, change, key[1]);
        } else if (key[0] === "system") {
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
                    index = DoD_Utility.clamp(index, 0, entries.length);
                    value = entries[index][0];    
                }
                break;
            case modes.OVERRIDE:
                value = DoD.dice[String(change.value).toLowerCase()];
                index = entries.findIndex(e => e[1] == value);
                index = DoD_Utility.clamp(index, 0, entries.length);
                value = index > 0 ? value : DoD.dice.none;
            case modes.UPGRADE:
                {
                    let upgradeValue = DoD.dice[String(change.value).toLowerCase()];
                    let upgradeIndex = entries.findIndex(e => e[1] == upgradeValue);
                    index = Math.max(index, upgradeIndex);
                    index = DoD_Utility.clamp(index, 0, entries.length);
                    value = entries[index][0];
                }
                break;
            case modes.DOWNGRADE:
                {
                    let downgradeValue = DoD.dice[String(change.value).toLowerCase()];
                    let downgradeIndex = entries.findIndex(e => e[1] == downgradeValue);
                    index = Math.min(index, downgradeIndex);
                    index = DoD_Utility.clamp(index, 0, entries.length);
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