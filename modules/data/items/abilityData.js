import {DoDItemBaseData} from "./item-base.js";

export default class DoDAbilityData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            abilityType: new fields.StringField({ required: true, initial: "" }),
            requirement: new fields.StringField({ required: true, initial: "" }),
            wp: new fields.StringField({ required: true, initial: "" }),
            boons: new fields.StringField({ required: true, initial: "" }),
            secondaryAttribute: new fields.StringField({ required: true, initial: "none" }),
            secondaryAttributeBonus: new fields.NumberField({ required: true, initial: 0 }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }

    async getCardData(context) {
        const data = await super.getCardData(context);

        if (this.abilityType !== "kin") {
            data.properties.push({ label: game.i18n.localize("DoD.ability.requirement"), value: this.requirement || "-" });
        }
        data.properties.push({ label: game.i18n.localize("DoD.ability.wp"), value: this.wp || "-" });
        if (this.boons) {
            data.properties.push({ label: game.i18n.localize("DoD.ui.dialog.boons"), value: this.boons });
        }

        return data;
    }
}