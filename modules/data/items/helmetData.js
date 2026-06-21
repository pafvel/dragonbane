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

    async addCardProperties(_context, data) {
        data.properties.push({ label: game.i18n.localize("DoD.armor.rating"), value: this.rating });
        if (this.weight > 0) {
            data.properties.push({ label: game.i18n.localize("DoD.gear.weight"), value: this.weight });
        }
    }
}