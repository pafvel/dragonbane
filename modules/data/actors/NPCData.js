import DoDCharacterBaseData from "./character-base.js";

export default class DoDNPCData extends DoDCharacterBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            traits: new fields.StringField({ required: true, initial: "" }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}