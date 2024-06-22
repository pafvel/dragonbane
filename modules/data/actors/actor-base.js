import DragonbaneDataModel from "../DragonbaneDataModel.js";

export default class DoDActorBaseData extends DragonbaneDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return this.mergeSchema(super.defineSchema(), {
            description: new fields.StringField({ required: true, initial: "" }),
            movement: new fields.NumberField({ required: true, initial: 10 }),
            hitPoints: new fields.SchemaField({
                value: new fields.NumberField({ required: true, initial: 10 }),
                max: new fields.NumberField({ required: true, initial: 10 }),
            }),
            currency: new fields.SchemaField({
                gc: new fields.NumberField({ required: true, initial: 0 }),
                sc: new fields.NumberField({ required: true, initial: 0 }),
                cc: new fields.NumberField({ required: true, initial: 0 })
            }),

        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}
