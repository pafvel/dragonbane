import {DoDItemBaseData} from "./item-base.js";

export default class DoDSpellData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            school: new fields.StringField({ required: true, initial: "" }),
            rank: new fields.NumberField({ required: true, initial: 0 }),
            prerequisite: new fields.StringField({ required: true, initial: "" }),
            requirement: new fields.StringField({ required: true, initial: "" }),
            castingTime: new fields.StringField({ required: true, initial: "action" }),
            rangeType: new fields.StringField({ required: true, initial: "range" }),
            range: new fields.NumberField({ required: true, initial: 0 }),
            areaOfEffect: new fields.StringField({ required: true, initial: "" }),
            duration: new fields.StringField({ required: true, initial: "instant" }),
            damage: new fields.StringField({ required: true, initial: "" }),
            damagePerPowerlevel: new fields.StringField({ required: true, initial: "" }),
            memorized: new fields.BooleanField({ required: true, initial: false }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}