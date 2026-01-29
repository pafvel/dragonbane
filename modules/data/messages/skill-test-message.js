import DoDTestMessageBaseData from "./test-message-base.js";

export default class DoDSkillTestMessageData extends DoDTestMessageBaseData {
    static TYPE = "skillTest";
    static TEMPLATE = "systems/dragonbane/templates/partials/skill-roll-message.hbs";

    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            skillUuid: new fields.StringField({ required: true, initial: "" }),
        });
    }

    toContext() {
        const context = super.toContext();

        // replace skillUuid with skill
        context.skill = fromUuidSync(this.skillUuid);
        delete context.skillUuid;
        return context;
    }

    static prepareSource(context) {
         // replace skill with skillUuid
        const { skill, ...rest } = super.prepareSource(context);
        return { ...rest, skillUuid: skill?.uuid };
    }

    static fromContext(context) {
        const source = this.prepareSource(context);
        return new this(source);
    } 

    formatRollMessage() {
        const result = this.formatRollResult();
        const content = game.i18n.format("DoD.roll.skillRollUUID", {
            uuid: this.skillUuid,
            result: result
        });
        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: "<p>" + content + "</p>"
        };
    }

}

Hooks.once("init", () => {
  DoDSkillTestMessageData.register();
});