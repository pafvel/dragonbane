import DoDActorBaseData from "./actor-base.js";
import StepDiceField from "../fields/step-dice-field.js";

export default class DoDCharacterBaseData extends DoDActorBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            kin: new fields.StringField({ required: true, initial: "" }),
            age: new fields.StringField({ required: true, initial: "" }),
            profession: new fields.StringField({ required: true, initial: "" }),
            motivation: new fields.StringField({ required: true, initial: "" }),
            willPoints: new fields.SchemaField({
                value: new fields.NumberField({ required: true, integer: true, initial: 10, min: 0 }),
                base: new fields.NumberField({ required: true, integer: true, initial: 10, min: 0 }),
                max: new fields.NumberField({ required: true, integer: true, initial: 10, min: 0 })
            }),
            damageBonus: new fields.SchemaField({
                agl: new fields.SchemaField({
                    base: new StepDiceField({ required: true, initial: "" }),
                    value: new StepDiceField({ required: true, initial: "" })
                }),
                str: new fields.SchemaField({
                    base: new StepDiceField({ required: true, initial: "" }),
                    value: new StepDiceField({ required: true, initial: "" })
                }),
            }),
        });
    };

    static migrateData(source) {

        if (typeof source.damageBonus?.str === "string") {
            const damageBonus = source.damageBonus.str;
            source.damageBonus.str = {base: String(damageBonus), value: String(damageBonus)};
        }
        if (typeof source.damageBonus?.agl === "string") {
            const damageBonus = source.damageBonus.agl;
            source.damageBonus.agl = {base: String(damageBonus), value: String(damageBonus)};
        }
        if (source.willPoints && ("max" in source.willPoints) && !("base" in source.willPoints)) {
            source.willPoints.base = source.willPoints.max;
        }
        return super.migrateData(source);
    }
}