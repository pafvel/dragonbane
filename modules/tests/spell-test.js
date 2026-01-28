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

        if (!this.isReroll && !this.autoSuccess) {
            // Check if the character has enough WP to cast spell
            let powerLevel = this.hasPowerLevel ? 1 : 0;
            if (!this.skipDialog && this.hasPowerLevel) {
                powerLevel = options.powerLevel;
            }
            const wpCost = this.spell.getSpellCost(powerLevel);
            const wp = this.actor.system.willPoints.value;
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
        return { ...options, powerLevel };
    }

    updatePreRollData() {
        super.updatePreRollData();
        this.preRollData.spell = this.spell;
        this.preRollData.powerLevel = this.options.powerLevel ?? 1;
        this.preRollData.wpCost = this.options.wpCost ?? this.spell.getSpellCost(this.preRollData.powerLevel);
    }

    updatePostRollData() {
        super.updatePostRollData();

        if (this.actor.type !== "monster") {
            this.postRollData.wpOld = this.postRollData.actor.system.willPoints.value;
            this.postRollData.wpNew = this.isReroll ? this.postRollData.wpOld : this.postRollData.actor.system.willPoints.value - this.postRollData.wpCost;
            if (this.postRollData.wpNew !== this.postRollData.wpOld) {
                // Pay WP cost
                this.postRollData.actor.update({ ["system.willPoints.value"]: this.postRollData.wpNew});
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