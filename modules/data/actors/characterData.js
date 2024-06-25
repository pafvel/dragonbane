import DoDCharacterBaseData from "./character-base.js";

export default class DoDCharacterData extends DoDCharacterBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            attributes: new fields.SchemaField({
                str: new fields.SchemaField({
                    base: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 0
                    }),
                    value: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 0
                    })
                }),
                con: new fields.SchemaField({
                    base: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 0
                    }),
                    value: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 0
                    })
                }),
                agl: new fields.SchemaField({
                    base: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 0
                    }),
                    value: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 0
                    })
                }),
                int: new fields.SchemaField({
                    base: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 0
                    }),
                    value: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 0
                    })
                }),
                wil: new fields.SchemaField({
                    base: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 0
                    }),
                    value: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 0
                    })
                }),
                cha: new fields.SchemaField({
                    base: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 0
                    }),
                    value: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 0
                    })
                }),
            }),
            conditions: new fields.SchemaField({
                str: new fields.SchemaField({
                    value: new fields.BooleanField({ required: false, initial: false, label: "DoD.conditions.str" }),
                }),
                con: new fields.SchemaField({
                    value: new fields.BooleanField({ required: false, initial: false, label: "DoD.conditions.con" }),
                }),
                agl: new fields.SchemaField({
                    value: new fields.BooleanField({ required: false, initial: false, label: "DoD.conditions.agl" }),
                }),
                int: new fields.SchemaField({
                    value: new fields.BooleanField({ required: false, initial: false, label: "DoD.conditions.int" }),
                }),
                wil: new fields.SchemaField({
                    value: new fields.BooleanField({ required: false, initial: false, label: "DoD.conditions.wil" }),
                }),
                cha: new fields.SchemaField({
                    value: new fields.BooleanField({ required: false, initial: false, label: "DoD.conditions.cha" }),
                }),
            }),
            age: new fields.StringField({ required: true, initial: "adult" }),
            appearance: new fields.StringField({ required: true, initial: "" }),
            weakness: new fields.StringField({ required: true, initial: "" }),
            notes: new fields.StringField({ required: true, initial: "" }),
            deathRolls: new fields.SchemaField({
                successes: new fields.NumberField({ required: true, initial: 0 }),
                failures: new fields.NumberField({ required: true, initial: 0 })
            }),
        });
    };

    static migrateData(source) {
        
        for (const attribute in source.attributes) {
            if (!("base" in source.attributes[attribute]) && ("value" in source.attributes[attribute])) {
                source.attributes[attribute].base = source.attributes[attribute].value;
            }
        }
        
        return super.migrateData(source);
    }
}