import DoDCharacterBaseData from "./character-base.js";

export default class DoDCharacterData extends DoDCharacterBaseData {
    static defineSchema() {
        const { fields } = foundry.data;

        function attributeField() {
            return new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 10,
                min: 1,
                max: 18
            });
        }

        function attributeSchema() {
            return new fields.SchemaField({
                base: attributeField(),
                value: attributeField(),
            });
        }

        return this.mergeSchema(super.defineSchema(), {
            attributes: new fields.SchemaField({
                str: attributeSchema(),
                con: attributeSchema(),
                agl: attributeSchema(),
                int: attributeSchema(),
                wil: attributeSchema(),
                cha: attributeSchema(),
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
            canRestRound: new fields.BooleanField({ required: false, initial: true }),
            canRestStretch: new fields.BooleanField({ required: false, initial: true }),
            maxEncumbrance:  new fields.SchemaField({
                base: new fields.NumberField({
                    required: true, 
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                value: new fields.NumberField({
                    required: true, 
                    integer: true,
                    initial: 0,
                    min: 0,
                })
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