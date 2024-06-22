import {DoDGearBaseData} from "./gear-base.js";

export default class DoDHelmetData extends DoDGearBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            rating: new fields.NumberField({ required: true, initial: 0 }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}