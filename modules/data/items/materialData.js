import {DoDItemBaseData} from "./item-base.js";

export default class DoDMaterialData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            weight: new fields.NumberField({ required: true, nullable: true, initial: 0 }),
            quantity: new fields.NumberField({ required: true, nullable: true, initial: 1 }),
            cost: new fields.StringField({ required: true, blank: true, initial: "" }),
            supply: new fields.StringField({ required: true, blank: true, initial: "common" }),
            storage: new fields.BooleanField({ required: false, initial: false }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }

    async getCardData(context) {
        const data = await super.getCardData(context);
        if (this.weight > 0) {
            data.properties.push({ label: game.i18n.localize("DoD.gear.weight"), value: this.weight });
        }
        if (this.cost) {
            data.properties.push({ label: game.i18n.localize("DoD.gear.cost"), value: this.cost });
        }
        if (this.supply) {
            data.properties.push({ label: game.i18n.localize("DoD.gear.supply"), value: game.i18n.localize("DoD.supplyTypes." + this.supply) });
        }
        return data;
    }
}


