import {DoDItemBaseData} from "./item-base.js";

export default class DoDRecipeData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            // Common spell fields
            school: new fields.StringField({ required: true, initial: "" }),
            rank: new fields.NumberField({ required: true, initial: 1 }),
            prerequisite: new fields.StringField({ required: true, initial: "" }),
            memorized: new fields.BooleanField({ required: true, initial: false }),
            // Crafting specific fields
            materials: new fields.ArrayField(new fields.SchemaField({
                name: new fields.StringField({ required: true, initial: "" }),
                quantity: new fields.NumberField({ required: true, initial: 1 }),
            }), { required: true, initial: [] }),
            item: new fields.SchemaField({
                uuid: new fields.StringField({ required: true, initial: "" }),
            }),
            // Poison specific fields
            hasPotency: new fields.BooleanField({ required: true, initial: false }),
            potency: new fields.NumberField({ required: true, initial: 0 }),
            potencyPerPowerlevel: new fields.NumberField({ required: true, initial: 0 }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}