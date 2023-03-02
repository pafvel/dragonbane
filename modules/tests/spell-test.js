import DoD_Utility from "../utility.js";
import DoDSkillTest from "./skill-test.js";


export default class DoDSpellTest extends DoDSkillTest  {

    constructor(actor, spell, options) {
        super(actor, actor.findSkill(spell.system.school), options);
        this.spell = spell;
        this.hasPowerLevel = spell.system.rank > 0;
    }
   
    updateDialogData() {
        super.updateDialogData();
        this.dialogData.spell = this.spell;
        this.dialogData.hasPowerLevel = this.hasPowerLevel;
    }

    async getRollOptions() {

        const label = game.i18n.localize("DoD.ui.dialog.skillRollLabel");
        const title = game.i18n.localize("DoD.ui.dialog.skillRollTitle") + ": " + this.spell.name;

        let options = await this.getRollOptionsFromDialog(title, label);
        if (options.cancelled) return options;
       
        // If dialog was skipped, set default value
        options.hasPowerLevel = this.hasPowerLevel;
        options.powerLevel = options.hasPowerLevel ? (this.options.powerLevel ?? 1) : 0;

        const wpCost = this.spell.getSpellCost(options.powerLevel);
        const wp = this.actor.system.willPoints.value;
        if (wpCost > wp) {
            DoD_Utility.WARNING("DoD.WARNING.notEnoughWPForSpell");
            options.cancelled = true;
        }
        return options;
    }

    processDialogOptions(form) {
        let options = super.processDialogOptions(form);

        // Process power level
        const elements = form.getElementsByClassName("power-level");
        const element = elements ? elements[0] : null;
        if (element) {
            options.powerLevel = Number(element.value);
        }
        return options;
    }    

    updatePreRollData() {
        super.updatePreRollData();
        this.preRollData.spell = this.spell;
        this.preRollData.powerLevel = this.options.powerLevel;
        this.preRollData.wpCost = this.options.wpCost ?? this.spell.getSpellCost(this.options.powerLevel);
    }

    updatePostRollData() {
        super.updatePostRollData();

        const wpNew = this.postRollData.actor.system.willPoints.value - this.postRollData.wpCost;

        this.postRollData.actor.update({ ["system.willPoints.value"]: wpNew});

        if (this.postRollData.result == 20) {
            this.postRollData.isMagicMishap = true;
        }

        if (this.postRollData.result == 1) {
            this.postRollData.isMagicCrit = true;
            this.postRollData.magicCritGroup = "magicCritChoice"
            this.postRollData.magicCritChoices = {};            

            // populate crit choices
            this.postRollData.magicCritChoices.doubleDamage = game.i18n.localize("DoD.magicCritChoices.doubleDamage");
            this.postRollData.magicCritChoices.noCost = game.i18n.localize("DoD.magicCritChoices.noCost");
            this.postRollData.magicCritChoices.extraSpell = game.i18n.localize("DoD.magicCritChoices.extraSpell");

            // set default choice
            this.postRollData.magicCritChoice = "doubleDamage";
        }
    }    

    formatRollMessage(msgData) {
        const target = msgData.skill?.system.value;
        const result = this.formatRollResult(msgData.result, target);
        const locString = msgData.powerLevel > 0 ? "DoD.roll.spellRoll" : "DoD.roll.skillRoll";
        const label = game.i18n.format(
            game.i18n.localize(locString), 
            {
                skill: msgData.spell.name, 
                spell: msgData.spell.name, 
                powerLevel: msgData.powerLevel,
                result: result
            }
        );

        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: msgData.actor }),
            flavor: label
        };
    }
}