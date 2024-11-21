import DragonbaneDataModel from "../DragonbaneDataModel.js";

export default class DoDActorBaseData extends DragonbaneDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return this.mergeSchema(super.defineSchema(), {
            description: new fields.StringField({ required: true, initial: "" }),
            movement: new fields.SchemaField({
                base: new fields.NumberField({ 
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 10,
                    min: 0,
                    }),
                value: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 10,
                    min: 0,
                })
            }),
            hitPoints: new fields.SchemaField({
                value: new fields.NumberField({ required: true, initial: 10 }),
                base: new fields.NumberField({ required: true, initial: 10 }),
                max: new fields.NumberField({ required: true, initial: 10 }),
            }),
            currency: new fields.SchemaField({
                gc: new fields.NumberField({ required: true, initial: 0 }),
                sc: new fields.NumberField({ required: true, initial: 0 }),
                cc: new fields.NumberField({ required: true, initial: 0 })
            }),
            encumbrance:  new fields.SchemaField({
                value: new fields.NumberField({required: true, integer: true, initial: 0, min: 0 })
            }),
        });
    };

    static migrateData(source) {
        if ("movement" in source && !(typeof source.movement === "object")) {
            source.movement = {base: Number(source.movement), value: Number(source.movement)};
        }
        if (source.hitPoints && ("max" in source.hitPoints) && !("base" in source.hitPoints)) {
            source.hitPoints.base = source.hitPoints.max;
        }
        return super.migrateData(source);
    }
}
