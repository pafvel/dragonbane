import DoDTest from "./dod-test.js";
import DoDAttributeTestMessageData from "../data/messages/attribute-test-message.js";

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
    }

    updatePostRollData() {
        super.updatePostRollData();
        this.postRollData.success = this.postRollData.result <= this.preRollData.target;
        this.postRollData.isDragon = this.postRollData.result <= 1 + (this.preRollData.extraDragons ?? 0);
        this.postRollData.isDemon = this.postRollData.result >= 20 - (this.preRollData.extraDemons ?? 0);
        this.postRollData.canPush = this.preRollData.canPush && !this.postRollData.success && !this.postRollData.isDemon;
    }

    async createMessageData() {
        const model = DoDAttributeTestMessageData.fromContext(this.postRollData);
        return await model.createMessageData(this.roll);
    }

    getMessageTemplate() {
        return "systems/dragonbane/templates/partials/skill-roll-message.hbs";
    }

}