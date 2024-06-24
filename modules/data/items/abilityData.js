import {DoDItemBaseData} from "./item-base.js";

export default class DoDAbilityData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            abilityType: new fields.StringField({ required: true, initial: "" }),
            requirement: new fields.StringField({ required: true, initial: "" }),
            wp: new fields.StringField({ required: true, initial: "" }),
            boons: new fields.StringField({ required: true, initial: "" }),
            secondaryAttribute: new fields.StringField({ required: true, initial: "" }),
            secondaryAttributeBonus: new fields.NumberField({ required: true, initial: 0 }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}