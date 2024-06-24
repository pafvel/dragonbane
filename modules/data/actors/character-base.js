import DoDActorBaseData from "./actor-base.js";

export default class DoDCharacterBaseData extends DoDActorBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            kin: new fields.StringField({ required: true, initial: "" }),
            age: new fields.StringField({ required: true, initial: "" }),
            profession: new fields.StringField({ required: true, initial: "" }),
            motivation: new fields.StringField({ required: true, initial: "" }),
            willPoints: new fields.SchemaField({
                value: new fields.NumberField({ required: true, initial: 10 }),
                max: new fields.NumberField({ required: true, initial: 10 })
            }),
            damageBonus: new fields.SchemaField({
                agl: new fields.StringField({ required: true, initial: "" }),
                str: new fields.StringField({ required: true, initial: "" })
            }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}