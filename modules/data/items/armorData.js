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

    async addCardProperties(_context, data) {
        data.properties.push({ label: game.i18n.localize("DoD.armor.rating"), value: this.rating });
        if (this.bonuses?.length > 0) {
            const names = this.bonuses.map(b => game.i18n.localize(CONFIG.DoD.damageTypes[b])).filter(Boolean).join(", ");
            if (names) data.properties.push({ label: game.i18n.localize("DoD.armor.bonuses"), value: names });
        }
        if (this.weight > 0) {
            data.properties.push({ label: game.i18n.localize("DoD.gear.weight"), value: this.weight });
        }
    }
}
