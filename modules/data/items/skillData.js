import {DoDItemBaseData} from "./item-base.js";

export default class DoDSkillData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            skillType: new fields.StringField({ required: true, initial: "" }),
            attribute: new fields.StringField({ required: true, initial: "" }),
            value: new fields.NumberField({ required: true, initial: 0 }),
            advance: new fields.NumberField({ required: true, initial: 0 }),
            taught: new fields.NumberField({ required: true, initial: 0 }),
            hideTrained: new fields.BooleanField({ required: true, initial: false }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}