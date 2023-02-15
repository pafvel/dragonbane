import DoD_Utility from "../utility.js";
import DoDTest from "./dod-test.js";


export default class DoDSpellTest extends DoDTest  {

    constructor(actor, spell) {
        super();
        this.data.actor = actor;
        this.data.spell = spell;
        this.data.skill = actor.findSkill(spell.system.school);
        this.data.attribute = this.data.skill?.system.attribute;
        this.data.hasPowerLevel = spell.system.rank > 0;
    }
   
    formatRollMessage(roll) {
        let target = this.data.skill.system.value;
        let result = this.formatRollResult(roll, target);
        let locString = this.data.hasPowerLevel ? "DoD.roll.spellRoll" : "DoD.roll.skillRoll";
        let powerLevel = this.data.hasPowerLevel ? this.options.powerLevel : 0;
        let label = game.i18n.format(
            game.i18n.localize(locString), 
            {
                spell: this.data.spell.name, 
                powerLevel: powerLevel,
                result: result
            }
        );

        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.data.actor }),
            flavor: label
        };
    }

    async getRollOptions() {

        let label = game.i18n.localize("DoD.ui.dialog.skillRollLabel");
        let title = game.i18n.localize("DoD.ui.dialog.skillRollTitle") + ": " + this.data.spell.name;

        let options = await this.getRollOptionsFromDialog(title, label);
        if (options.cancelled) return options;

        let wpCost = this.data.spell.getSpellCost(options.powerLevel);
        let wp = this.data.actor.system.willPoints.value;
        if (wpCost > wp) {
            DoD_Utility.WARNING("DoD.WARNING.notEnoughWPForSpell");
            options.cancelled = true;
        }
        return options;
    }

    processDialogOptions(form) {
        let options = super.processDialogOptions(form);

        // Process power level
        let elements = form.getElementsByClassName("power-level");
        let element = elements ? elements[0] : null;
        if (element) {
            options.powerLevel = Number(element.value);
        }
        return options;
    }

    postRoll() {
        let wpCost = this.data.spell.getSpellCost(this.options.powerLevel);
        let wp = this.data.actor.system.willPoints.value;
        this.data.actor.update({ ["system.willPoints.value"]: wp - wpCost});
    }
}