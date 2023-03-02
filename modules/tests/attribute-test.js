import DoD_Utility from "../utility.js";
import DoDTest from "./dod-test.js";

export default class DoDAttributeTest extends DoDTest {

    constructor(actor, attribute, options) {
        super(actor, options);
        this.attribute = attribute;
        if (this.options.canPush === undefined) {
            this.options.canPush = true;
        }
    }

    async getRollOptions() {
        let label = game.i18n.localize("DoD.ui.dialog.attributeRollLabel");
        let title = game.i18n.localize("DoD.ui.dialog.attributeRollTitle") + ": " + game.i18n.localize("DoD.attributes." + this.attribute);

        return this.getRollOptionsFromDialog(title, label);
    }

    updatePreRollData() {
        super.updatePreRollData();
        this.preRollData.actor = this.actor;
        this.preRollData.attribute = this.attribute;
        this.preRollData.target = this.actor.system.attributes[this.attribute].value;
        this.preRollData.canPush = this.options.canPush;
        
    }

    updatePostRollData() {
        super.updatePostRollData();
        this.postRollData.success = this.preRollData.result <= this.preRollData.target;
        this.postRollData.canPush = this.preRollData.canPush && !this.postRollData.success && this.postRollData.result != 20;
        
        if (this.postRollData.canPush) {
            this.updatePushRollChoices();
        }
    }

    formatRollMessage(msgData) {
       let result = this.formatRollResult(msgData.result, msgData.target);

        let localizedName = game.i18n.localize("DoD.attributes." + msgData.attribute);
        let label = game.i18n.format(game.i18n.localize("DoD.roll.attributeRoll"), {attribute: localizedName, result: result});
        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: msgData.actor }),
            flavor: label
        };
    }

    getMessageTemplate() {
        return "systems/dragonbane/templates/partials/skill-roll-message.hbs";
    }

}