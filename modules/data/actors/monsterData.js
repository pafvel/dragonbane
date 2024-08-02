import DoDActorBaseData from "./actor-base.js";

export default class DoDMonsterData extends DoDActorBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            armor: new fields.NumberField({ required: true, initial: 0 }),
            ferocity: new fields.SchemaField({
                base: new fields.NumberField({ required: true, initial: 1, integer: true, min: 1 }),
                value: new fields.NumberField({ required: true, initial: 1, integer: true, min: 1 })
            }),
            size: new fields.StringField({ required: true, initial: "" }),
            traits: new fields.StringField({ required: true, initial: "" }),
            attackTable: new fields.StringField({ required: true, initial: "" }),
            previousMonsterAttack: new fields.StringField({ required: false, initial: "" }),
        });
    };

    static migrateData(source) {
        if (source.damageBonus) {
            delete source.damageBonus;
        }
        if (typeof source.ferocity === "number") {
            source.ferocity = {base: source.ferocity, value: source.ferocity};
        }
        return super.migrateData(source);
    }
}