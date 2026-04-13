import {DoDItemBaseData} from "./item-base.js";

export class DoDGearBaseData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            weight: new fields.NumberField({ required: true, nullable: true, initial: 1 }),
            quantity: new fields.NumberField({ required: true, nullable: true, initial: 1 }),
            cost: new fields.StringField({ required: true, blank: true, initial: "" }),
            supply: new fields.StringField({ required: true, blank: true, initial: "common" }),
            worn: new fields.BooleanField({ required: true, initial: false }),
            memento: new fields.BooleanField({ required: true, initial: false }),
            boons: new fields.StringField({ required: true, blank: true, initial: "" }),
            banes: new fields.StringField({ required: true, blank: true, initial: "" }),
            storage: new fields.BooleanField({ required: false, initial: false }),
            enchantments: new fields.SchemaField({
                charge: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
                applyOnlyWhenEquipped: new fields.BooleanField({ required: true, initial: false }),
                spells: new fields.ArrayField( new fields.SchemaField({
                    uuid: new fields.DocumentUUIDField({ required: true, nullable: true, initial: undefined }),
                    powerLevel: new fields.NumberField({ required: true, integer: true, initial: 1, min: 1 }),
                    castable: new fields.BooleanField({ required: true, initial: false }),
                    free: new fields.BooleanField({ required: true, initial: false }),
                })),   
            }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}


