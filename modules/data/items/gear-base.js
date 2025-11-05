import {DoDItemBaseData} from "./item-base.js";

export class DoDGearBaseData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            weight: new fields.NumberField({ required: true, nullable: true, initial: 1 }),
            quantity: new fields.NumberField({ required: true, nullable: true, initial: 1 }),
            cost: new fields.StringField({ required: true, blank: true, initial: "" }),
            supply: new fields.StringField({ required: true, blank: true, initial: "" }),
            worn: new fields.BooleanField({ required: true, initial: false }),
            memento: new fields.BooleanField({ required: true, initial: false }),
            boons: new fields.StringField({ required: true, blank: true, initial: "" }),
            banes: new fields.StringField({ required: true, blank: true, initial: "" }),
            storage: new fields.BooleanField({ required: false, initial: false }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}


