import DoDTest from "./dod-test.js";

export default class DoDAttributeTest extends DoDTest {

    constructor(actor, attribute, options) {
        super(options);
        this.data.actor = actor;
        this.data.attribute = attribute;
    }

    async getRollOptions() {
        let label = game.i18n.localize("DoD.ui.dialog.attributeRollLabel");
        let title = game.i18n.localize("DoD.ui.dialog.attributeRollTitle") + ": " + game.i18n.localize("DoD.attributes." + this.data.attribute);

        return this.getRollOptionsFromDialog(title, label);
    }

    formatRollMessage(roll) {
        let target = this.data.actor.system.attributes[this.data.attribute].value;
        let result = this.formatRollResult(roll, target);

        let localizedName = game.i18n.localize("DoD.attributes." + this.data.attribute);
        let label = game.i18n.format(game.i18n.localize("DoD.roll.attributeRoll"), {attribute: localizedName, result: result});
        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.data.actor }),
            flavor: label
        };
    }
}