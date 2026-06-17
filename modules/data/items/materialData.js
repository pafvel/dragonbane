import {DoDItemBaseData} from "./item-base.js";

export default class DoDMaterialData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            weight: new fields.NumberField({ required: true, nullable: true, initial: 0 }),
            quantity: new fields.NumberField({ required: true, nullable: true, initial: 1 }),
            cost: new fields.StringField({ required: true, blank: true, initial: "" }),
            supply: new fields.StringField({ required: true, blank: true, initial: "common" }),
            storage: new fields.BooleanField({ required: false, initial: false }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}


