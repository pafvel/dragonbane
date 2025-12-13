import {DoDGearBaseData} from "./gear-base.js";

export default class DoDMoneyData extends DoDGearBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            type: new fields.StringField({ required: true, initial: "money" }),
            abbreviation: new fields.StringField({ required: true, blank: true, initial: "" }),
            value: new fields.NumberField({ required: true, integer: true, initial: 1, min: 1 }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}

