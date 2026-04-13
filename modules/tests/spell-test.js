import DoD_Utility from "../utility.js";
import DoDSkillTest from "./skill-test.js";
import DoDSpellTestMessageData from "../data/messages/spell-test-message.js";

export default class DoDSpellTest extends DoDSkillTest  {

    constructor(actor, spell, options) {
        super(actor, actor.findMagicSkill(spell.system.school), options);
        this.spell = spell;
        this.hasPowerLevel = spell.system.rank > 0;
    }

    updateDialogData() {
        super.updateDialogData();
        this.dialogData.spell = this.spell;
        this.dialogData.hasPowerLevel = this.hasPowerLevel;
        
        if (this.dialogData.hasPowerLevel) {
            this.dialogData.powerLevel = this.options.powerLevel ? this.options.powerLevel : 1;
        }

        if (!this.options.noWpCost) {
            // Find all possible wp sources, in priority order
            const wpSources = [];
    
            // Specified source, for example from an item being used to cast the spell
            if (this.options.wpSource) {
                if (this.options.wpSource.system.willPoints?.value > 0 || this.options.wpSource.system.enchantments?.charge > 0) {
                    wpSources.push(this.options.wpSource);
                }                
            }
    
            // Actor itself
            wpSources.push(this.actor);
    
            // Enchanted items with Charge
            for (let item of this.actor.items.contents) {
                if (item.system.enchantments?.charge > 0 
                    && (item.system.worn || item.system.enchantments?.applyOnlyWhenEquipped !== true)
                    && !(item.uuid === this.options.wpSource?.uuid))
                {
                    wpSources.push(item);
                }
            }
    
            // Other owned actors on the current scene (for example a familiar)
            const scene = this.actor.getActiveTokens()?.[0]?.scene;
            if (scene) {
                for (let token of scene.tokens) {
                    if (token.actor?.isOwner && token.actor.uuid !== this.actor.uuid && token.actor.system.willPoints?.value > 0) {
                        wpSources.push(token);
                    }
                }
            }
    
            // Only select WP source if there are multiple options
            if (wpSources.length > 1) {
                this.dialogData.wpSources = wpSources;
            }
        }
    }

    async getRollOptions() {

        if (!this.skill && !this.autoSuccess) {
            DoD_Utility.WARNING("DoD.WARNING.missingMagicSchool", {spell: this.spell.name});
            return {cancelled: true};
        }
        const label = game.i18n.localize("DoD.ui.dialog.skillRollLabel");
        const title = game.i18n.localize("DoD.ui.dialog.skillRollTitle") + ": " + this.spell.name;

        let options = await this.getRollOptionsFromDialog(title, label);
        if (options.cancelled) return options;

        if (!this.isReroll && !this.options.noWpCost) {
            // Check if the power source has enough WP to cast spell
            const powerSource = options.wpSource;
            let wp = 0;
            if (powerSource.system?.willPoints) { // actor
                wp = powerSource.system.willPoints.value;
            } else if (powerSource.system?.enchantments?.charge) { // gear
                wp = powerSource.system.enchantments.charge;
            } else if (powerSource.actor?.system.willPoints) { // token
                wp = powerSource.actor.system.willPoints.value;
            } else if (powerSource.uuid === this.actor.uuid && this.actor.type === "monster") {
                options.noWpCost = true;
            }

            let powerLevel = this.hasPowerLevel ? 1 : 0;
            if (!this.skipDialog && this.hasPowerLevel) {
                powerLevel = options.powerLevel;
            }
            const wpCost = options.noWpCost ? 0 : this.spell.getSpellCost(powerLevel);
            if (wpCost > wp) {
                DoD_Utility.WARNING("DoD.WARNING.notEnoughWPForSpell");
                options.cancelled = true;
            }
        }
        return options;
    }

    processDialogOptions(input) {
        const options = super.processDialogOptions(input);
        const powerLevel = Number(input.powerLevel);
        const wpSource = this.dialogData.wpSources?.length > 1 ? this.dialogData.wpSources[Number(input.powerSource)] : this.actor;

        return { ...options, powerLevel, wpSource };
    }

    updatePreRollData() {
        super.updatePreRollData();
        this.preRollData.spell = this.spell;
        this.preRollData.powerLevel = this.options.powerLevel ?? 1;
        this.preRollData.wpCost = this.options.noWpCost ? 0 : this.options.wpCost ?? this.spell.getSpellCost(this.preRollData.powerLevel);
    }

    updatePostRollData() {
        super.updatePostRollData();

        // Pay WP cost
        if (this.postRollData.wpCost > 0) {
            const powerSource = this.options.wpSource;
            if (powerSource.system?.willPoints) { // actor
                this.postRollData.wpOld = powerSource.system.willPoints.value;
                this.postRollData.wpNew = powerSource.system.willPoints.value - this.postRollData.wpCost;
                powerSource.update({ ["system.willPoints.value"]: this.postRollData.wpNew});
            } else if (powerSource.system?.enchantments?.charge) { // gear
                this.postRollData.wpOld = powerSource.system.enchantments.charge;
                this.postRollData.wpNew = powerSource.system.enchantments.charge - this.postRollData.wpCost;
                powerSource.update({ ["system.enchantments.charge"]: this.postRollData.wpNew});
            } else if (powerSource.actor?.system.willPoints) { // token
                this.postRollData.wpOld = powerSource.actor.system.willPoints.value;
                this.postRollData.wpNew = powerSource.actor.system.willPoints.value - this.postRollData.wpCost;
                powerSource.actor.update({ ["system.willPoints.value"]: this.postRollData.wpNew});
            } else if (powerSource.uuid === this.actor.uuid && this.actor.type === "monster") {
                // Monsters without a WP source can still cast spells, but it doesn't cost them WP

            } else {
                console.warn("Power source does not have WP or Charge", powerSource);
            }
            if (powerSource.name !== this.actor.name) {
                this.postRollData.wpSourceName = powerSource.name;
            }
        }

        this.postRollData.isDamaging = this.spell.isDamaging;
        this.postRollData.isHealing = this.spell.isHealing;
    }

    async createMessageData() {
        const model = DoDSpellTestMessageData.fromContext(this.postRollData);
        return await model.createMessageData(this.roll);
    }
}