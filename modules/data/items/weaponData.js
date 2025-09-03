import {DoDGearBaseData} from "./gear-base.js";

export default class DoDWeaponData extends DoDGearBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            grip: new fields.SchemaField({
                value: new fields.StringField({ required: true, initial: "" }),
            }),
            str: new fields.NumberField({ required: true, initial: 0 }),
            range: new fields.StringField({ required: true, initial: "" }),
            damage: new fields.StringField({ required: true, initial: "" }),
            durability: new fields.NumberField({ required: true, initial: 0 }),
            skill: new fields.SchemaField({
                name: new fields.StringField({ required: true, initial: "" }),
                value: new fields.NumberField({ required: true, initial: 0 })
            }),
            features: new fields.ArrayField(
                new fields.StringField({ required: true, initial: '' }), { required: true, initial: [] }
            ),
            broken: new fields.BooleanField({ required: true, blank: true, initial: false }),
            mainHand: new fields.BooleanField({ required: true, blank: true, initial: false }),
            offHand: new fields.BooleanField({ required: true, blank: true, initial: false }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}