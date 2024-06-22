import {DoDGearBaseData} from "./gear-base.js";

export default class DoDArmorData extends DoDGearBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            rating: new fields.NumberField({ required: true, initial: 0 }),
            banes: new fields.StringField({ required: true, initial: "" }),
            bonuses: new fields.ArrayField(
                new fields.StringField({ required: true, initial: '' }), { required: true, initial: [] }
            ),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}
