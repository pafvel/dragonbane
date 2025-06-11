import DoDTest from "./dod-test.js";

export default class DoDAttributeTest extends DoDTest {

    constructor(actor, attribute, options) {
        super(actor, options);
        this.attribute = attribute?.toLowerCase();
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
        this.preRollData.target = this.actor.getAttribute(this.attribute);
        this.preRollData.canPush = this.actor.type === "character" ? this.options.canPush : false;
        console.log(this.preRollData.attribute, this.preRollData.target);
    }

    updatePostRollData() {
        super.updatePostRollData();
        this.postRollData.success = this.postRollData.result <= this.preRollData.target;
        this.postRollData.isDragon = this.postRollData.result <= 1 + (this.preRollData.extraDragons ?? 0);
        this.postRollData.isDemon = this.postRollData.result >= 20 - (this.preRollData.extraDemons ?? 0);
        this.postRollData.canPush = this.preRollData.canPush && !this.postRollData.success && !this.postRollData.isDemon;

        if (this.postRollData.canPush) {
            this.updatePushRollChoices();
        }
    }

    formatRollMessage(postRollData) {
        let result = this.formatRollResult(postRollData);
        let localizedName = game.i18n.localize("DoD.attributes." + postRollData.attribute);
        let label = game.i18n.format(game.i18n.localize(this.options.flavor ?? "DoD.roll.attributeRoll"), {attribute: localizedName, result: result});
        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: postRollData.actor }),
            flavor: label
        };
    }

    getMessageTemplate() {
        return "systems/dragonbane/templates/partials/skill-roll-message.hbs";
    }

}