import DoDActorBaseData from "./actor-base.js";

export default class DoDMonsterData extends DoDActorBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            armor: new fields.StringField({ required: true, initial: "" }),
            ferocity: new fields.StringField({ required: true, initial: "" }),
            size: new fields.StringField({ required: true, initial: "" }),
            traits: new fields.StringField({ required: true, initial: "" }),
            attackTable: new fields.StringField({ required: true, initial: "" }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}