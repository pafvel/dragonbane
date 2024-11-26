import {DoDItemBaseData} from "./item-base.js";

export default class DoDProfessionData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            attribute: new fields.StringField({ required: true, initial: "" }),
            skills: new fields.StringField({ required: true, initial: "" }),
            abilities: new fields.StringField({ required: true, initial: "" }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}