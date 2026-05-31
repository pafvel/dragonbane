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
            const wpSources = this.actor.getPowerSources({ source: this.options.wpSource });
    
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
        
        let title = this.options.title;
        if (!title) {
            if (this.options.autoSuccess) {
                title = game.i18n.localize("DoD.ui.dialog.castSpellTitle") + ": " + this.spell.name;
            } else {
                title = game.i18n.localize("DoD.ui.dialog.skillRollTitle") + ": " + this.spell.name;
            }
        }

        let label = this.options.label;
        if (!label) {
            if (this.options.autoSuccess) {
                label = game.i18n.localize("DoD.ui.dialog.castSpellLabel");
            } else {
                label = game.i18n.localize("DoD.ui.dialog.skillRollLabel");
            }
        }

        let icon = this.options.icon;
        if (!icon && !this.options.autoSuccess) {
            icon = "fa-solid fa-dice";
        }

        let options = await this.getRollOptionsFromDialog(title, label, icon);
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
        const powerLevel = this.dialogData.hasPowerLevel ? Number(input.powerLevel) : 0;
        const wpSource = this.dialogData.wpSources?.length > 1 ? this.dialogData.wpSources[Number(input.powerSource)] : this.actor;

        return { ...options, powerLevel, wpSource };
    }

    updatePreRollData() {
        super.updatePreRollData();
        this.preRollData.spell = this.spell;
        this.preRollData.powerLevel = this.options.powerLevel ?? (this.spell.system.rank > 0 ? 1 : 0);
        this.preRollData.wpCost = this.options.noWpCost ? 0 : this.options.wpCost ?? this.spell.getSpellCost(this.preRollData.powerLevel);
        this.preRollData.wpNew = this.options.wpNew;
        this.preRollData.wpOld = this.options.wpOld;
    }

    updatePostRollData() {
        super.updatePostRollData();

        const powerSource = this.options.wpSource ?? this.actor;
        if (powerSource.uuid !== this.actor.uuid) {
            this.postRollData.wpSourceUuid = powerSource.uuid;
        }

        // Update wpNew and wpOld
        if (!this.isReroll) {
            if (powerSource.system?.willPoints) { // actor
                this.postRollData.wpOld = powerSource.system.willPoints.value;
                this.postRollData.wpNew = powerSource.system.willPoints.value - this.postRollData.wpCost;
            } else if (powerSource.system?.enchantments?.charge) { // gear
                this.postRollData.wpOld = powerSource.system.enchantments.charge;
                this.postRollData.wpNew = powerSource.system.enchantments.charge - this.postRollData.wpCost;
            } else if (powerSource.actor?.system.willPoints) { // token
                this.postRollData.wpOld = powerSource.actor.system.willPoints.value;
                this.postRollData.wpNew = powerSource.actor.system.willPoints.value - this.postRollData.wpCost;
            } else if (powerSource.uuid === this.actor.uuid && this.actor.type === "monster") {
                // Monsters without a WP source can still cast spells, but it doesn't cost them WP
            }
        }

        // Pay WP cost
        if (!this.isReroll && this.postRollData.wpNew !== this.postRollData.wpOld) {
            if (powerSource.system?.willPoints) { // actor
                powerSource.update({ ["system.willPoints.value"]: this.postRollData.wpNew});
            } else if (powerSource.system?.enchantments?.charge) { // gear
                powerSource.update({ ["system.enchantments.charge"]: this.postRollData.wpNew});
            } else if (powerSource.actor?.system.willPoints) { // token
                powerSource.actor.update({ ["system.willPoints.value"]: this.postRollData.wpNew});
            } else if (powerSource.uuid === this.actor.uuid && this.actor.type === "monster") {
                // Monsters without a WP source can still cast spells, but it doesn't cost them WP
            } else {
                console.warn("Power source does not have WP or Charge", powerSource);
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