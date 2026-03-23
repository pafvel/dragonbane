import DoDTestMessageBaseData from "./test-message-base.js";

export default class DoDSkillTestMessageData extends DoDTestMessageBaseData {
    static TYPE = "skillTest";
    static TEMPLATE = "systems/dragonbane/templates/partials/skill-roll-message.hbs";

    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            skillUuid: new fields.StringField({ required: true, initial: "" }),
            skillName: new fields.StringField({ required: true, initial: "" }),
            skillValue: new fields.NumberField({ required: true, initial: 0 }),
        });
    }

    toContext() {
        const context = super.toContext();

        // replace skillUuid with skill, or create a pseudo skill object for monster defend rolls
        if (this.skillUuid) {
            context.skill = fromUuidSync(this.skillUuid);
        } else {
            context.skill = { name: this.skillName, system: { value: this.skillValue } };
        }
        delete context.skillUuid;
        delete context.skillName;
        delete context.skillValue;
        
        return context;
    }

    static prepareSource(context) {
         // replace skill with skillUuid or (for monster defend rolls) skillName and skillValue
        const { skill, ...rest } = super.prepareSource(context);
        return { ...rest, skillUuid: skill?.uuid, skillName: skill?.name, skillValue: skill?.system.value };
    }

    static fromContext(context) {
        const source = this.prepareSource(context);
        return new this(source);
    } 

    formatRollMessage() {
        const result = this.formatRollResult();
        const content = this.skillUuid
        ? game.i18n.format("DoD.roll.skillRollUUID", { uuid: this.skillUuid, result: result})
        : game.i18n.format("DoD.roll.skillRoll", { skill: this.skillName, result: result });

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