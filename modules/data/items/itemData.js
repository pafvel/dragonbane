import {DoDGearBaseData} from "./gear-base.js";

export default class DoDItemData extends DoDGearBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            type: new fields.StringField({ required: true, initial: "item" }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}