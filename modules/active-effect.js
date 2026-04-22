import { DoDActor } from "./actor.js";
import { DoD } from "./config.js";

export default class DoDActiveEffect extends ActiveEffect {

    static migrateData(source) {
        
        // Migrate old flag to system field
        const flags = source.flags?.[game.system.id];
        if (flags?.applyOnlyWhenEquipped !== undefined) {
            // Move to system field
            const oldValue = flags.applyOnlyWhenEquipped;
            foundry.utils.setProperty(source, "system.applyOnlyWhenEquipped", oldValue);

            // Remove old flag
            delete flags.applyOnlyWhenEquipped;
            if (!Object.keys(flags).length) {
                delete source.flags[game.system.id];
            }
        }
        return super.migrateData(source);
    }

    async _preUpdate(data, options, user) {
        await super._preUpdate(data, options, user);

        const changes = data.system?.changes;
        if (!Array.isArray(changes)) return;
        
        // Set the correct phase for known attributes, default to "initial" for custom changes.
        const attrs = DoD.activeEffectAttributes;
        for (const change of changes) {
            const a = attrs.find(({ key }) => key === change.key);
            change.phase =  a ? a.phase : "initial";
        }
    }

    get canDeleteFromCharacterSheet() {
        return this.isOwner && this.parent instanceof DoDActor;
    }

    get isSuppressed() {
        // If applyOnlyWhenEquipped is true, check if the item is equipped
        // NPCs and Monsters don't have equip checkboxes - assume that items are always equipped. Disable on effects tab instead.
        if (this.parent instanceof Item && !this.parent.system.worn && this.system.applyOnlyWhenEquipped && this.target?.type === "character") {
            return true;
        }
        if (this.parent instanceof Item && this.parent.system.storage) {
            return true;
        }
        return false;
    }

    get isCondition() {
        return this.statuses.first()?.startsWith("dragonbane.condition");
    }
}