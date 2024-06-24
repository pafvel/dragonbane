import {DoDItemBaseData} from "./item-base.js";

export default class DoDKinData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            abilities: new fields.StringField({ required: true, initial: "" }),
            movement: new fields.NumberField({ required: true, initial: 10 }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}