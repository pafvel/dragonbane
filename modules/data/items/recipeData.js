import {DoDItemBaseData} from "./item-base.js";
import DoDItemRef from "./item-ref.js";

export default class DoDRecipeData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            // Common spell fields
            school: new fields.StringField({ required: true, initial: "" }),
            rank: new fields.NumberField({ required: true, initial: 1 }),
            prerequisite: new fields.StringField({ required: true, initial: "" }),
            memorized: new fields.BooleanField({ required: true, initial: false }),
            // Crafting specific fields
            materials: new fields.ArrayField(
                new foundry.data.fields.EmbeddedDataField(DoDItemRef),
                { required: true, initial: [] }
            ),
            item: new foundry.data.fields.EmbeddedDataField(DoDItemRef, { nullable: true, required: false, initial: null }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}