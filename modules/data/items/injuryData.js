import {DoDItemBaseData} from "./item-base.js";

export default class DoDInjuryData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            healingTime: new fields.StringField({ required: true, initial: "" }),
            banes: new fields.StringField({ required: true, blank: true, initial: "" }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}