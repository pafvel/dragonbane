import DoDActorBaseData from "./actor-base.js";

export default class DoDMonsterData extends DoDActorBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            armor: new fields.NumberField({ required: true, initial: 0 }),
            ferocity: new fields.NumberField({ required: true, initial: 1 }),
            size: new fields.StringField({ required: true, initial: "" }),
            traits: new fields.StringField({ required: true, initial: "" }),
            attackTable: new fields.StringField({ required: true, initial: "" }),
        });
    };

    static migrateData(source) {
        if (source.damageBonus) {
            delete source.damageBonus;
        }
        return super.migrateData(source);
    }
}