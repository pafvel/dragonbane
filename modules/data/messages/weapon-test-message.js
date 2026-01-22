import DoDSkillTestMessageData from "./skill-test-message.js";
import { DoD } from "../../config.js";

export default class DoDWeaponTestMessageData extends DoDSkillTestMessageData {
    static TYPE = "weaponTest";
    static TEMPLATE = "systems/dragonbane/templates/partials/skill-roll-message.hbs";

    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            action: new fields.StringField({ required: true, initial: "" }),
            damageType: new fields.StringField({ required: true, initial: DoD.damageTypes.none }),
            extraDamage: new fields.StringField({ required: false, initial: "" }),
            extraDragons: new fields.NumberField({ required: false, initial: 0 }),
            isDamaging: new fields.BooleanField({ required: true, initial: false }),
            targetActorUuid: new fields.StringField({ required: false, initial: "" }),
            weaponUuid: new fields.StringField({ required: true, initial: "" }),
        });
    }

    toContext() {
        const context = super.toContext();

        // replace weaponUuid with weapon
        context.weapon = fromUuidSync(this.weaponUuid);
        delete context.weaponUuid;

        // replace targetActorUuid with targetActor
        context.targetActor = this.targetActorUuid ? fromUuidSync(this.targetActorUuid) : "";
        delete context.targetActorUuid;

        return context;
    }

    static prepareSource(context) {
         // replace weapon & targetActor with weaponUuid & targetActorUuid
        const { weapon, targetActor, ...rest } = super.prepareSource(context);
        return { ...rest, weaponUuid: weapon.uuid, targetActorUuid: targetActor?.uuid || "" };
    }

    static fromContext(context) {
        const source = this.prepareSource(context);
        return new this(source);
    } 

    formatRollMessage() {
        const context = this.toContext();
        const locString = context.targetActor ? "DoD.roll.weaponRollTarget" : "DoD.roll.weaponRoll";

        let content = game.i18n.format(locString, {
                action: game.i18n.localize("DoD.attackTypes." + context.action),
                skill: context.weapon.name, // keeping this for backward compatibility in the localization strings
                weapon: context.weapon.name, // keeping this for backward compatibility in the localization strings
                uuid: context.weapon.uuid,
                result: this.formatRollResult(),
                target: context.targetActor?.isToken ? context.targetActor.token.name : context.targetActor?.name
            }
        );

        return {
            content: "<p>" + content + "</p>"
        };
    }
    

}

Hooks.once("init", () => {
  DoDWeaponTestMessageData.register();
});