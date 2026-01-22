import DoDTestMessageBaseData from "./test-message-base.js";

export default class DoDAttributeTestMessageData extends DoDTestMessageBaseData {
    static TYPE = "attributeTest";
    static TEMPLATE = "systems/dragonbane/templates/partials/skill-roll-message.hbs";

    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            attribute: new fields.StringField({ required: true, initial: "" }),
        });
    }

    static fromContext(context) {
        const source = this.prepareSource(context);
        return new this(source);
    } 

    formatRollMessage() {
        let result = this.formatRollResult();
        let localizedName = game.i18n.localize("DoD.attributes." + this.attribute);
        let content = game.i18n.format(game.i18n.localize("DoD.roll.attributeRoll"), {attribute: localizedName, result: result});
        return {
            content: "<p>" + content + "</p>"
        };
    }
}

Hooks.once("init", () => {
  DoDAttributeTestMessageData.register();
});