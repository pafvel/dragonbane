import DoDSkillTestMessageData from "./skill-test-message.js";

export default class DoDSpellTestMessageData extends DoDSkillTestMessageData {
    static TYPE = "spellTest";
    static TEMPLATE = "systems/dragonbane/templates/partials/skill-roll-message.hbs";

    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            isDamaging: new fields.BooleanField({ required: true, initial: false }),
            isHealing: new fields.BooleanField({ required: true, initial: false }),
            powerLevel: new fields.NumberField({ required: true, initial: 0 }),
            spellUuid: new fields.StringField({ required: true, initial: "" }),
            targetActorUuid: new fields.StringField({ required: false, initial: "" }),
        });
    }

    toContext() {
        const context = super.toContext();

        // replace spellUuid with spell
        context.spell = fromUuidSync(this.spellUuid);
        delete context.spellUuid;

        // replace targetActorUuid with targetActor
        context.targetActor = this.targetActorUuid ? fromUuidSync(this.targetActorUuid) : "";
        delete context.targetActorUuid;

        return context;
    }

    static prepareSource(context) {
         // replace spell & targetActor with spellUuid & targetActorUuid
        const { spell, targetActor, ...rest } = super.prepareSource(context);
        return { ...rest, spellUuid: spell.uuid, targetActorUuid: targetActor?.uuid || "" };
    }

    static fromContext(context) {
        const source = this.prepareSource(context);
        return new this(source);
    } 

    formatRollMessage() {
        const result = this.formatRollResult();
        const spell = fromUuidSync(this.spellUuid);
        const targetActor = this.targetActorUuid ? fromUuidSync(this.targetActorUuid) : null;
        const locString = this.powerLevel > 0 ? (targetActor ? "DoD.roll.spellRollTarget" : "DoD.roll.spellRoll") : "DoD.roll.skillRoll";
        const content = game.i18n.format(locString, {
                skill: spell?.name,
                spell: spell?.name,
                uuid: this.spellUuid,
                powerLevel: this.powerLevel,
                target: targetActor?.isToken ? targetActor.token.name : targetActor?.name,
                result: result
            }
        );

        return {
            content: "<p>" + content + "</p>"
        };
    }
    
}

Hooks.once("init", () => {
  DoDSpellTestMessageData.register();
});