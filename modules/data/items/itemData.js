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

    async addCardProperties(_context, data) {
        if (this.weight > 0) {
            data.properties.push({ label: game.i18n.localize("DoD.gear.weight"), value: this.weight });
        }
    }
}
