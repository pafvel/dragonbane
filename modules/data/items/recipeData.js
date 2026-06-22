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

    async getCardData(context) {
        const data = await super.getCardData(context);
        if (this.school) {
            data.properties.push({ label: game.i18n.localize("DoD.weapon.skill"), value: this.school });
        }
        data.properties.push(
            { label: game.i18n.localize("DoD.spell.rank"), value: this.rank },
            { label: game.i18n.localize("DoD.spell.prerequisite"), value: this.prerequisite || "-" }
        );
        if (this.materials.length > 0) {
            await Promise.all(this.materials.map(m => m.resolve()));
            const materialValue = this.materials.filter(m => m.name).map(m =>
                context === "journal" && m.uuid ? `@UUID[${m.uuid}]{${m.name}}` : m.name
            ).join(", ");
            if (materialValue) {
                data.properties.push({ label: game.i18n.localize("DoD.recipe.materials"), value: materialValue });
            }
        }
        const resultItem = await this.item?.resolve();
        if (resultItem) {
            const resultValue = context === "journal" && resultItem.uuid ? `@UUID[${resultItem.uuid}]{${resultItem.name}}` : resultItem.name;
            data.properties.push({ label: game.i18n.localize("DoD.recipe.item"), value: resultValue });
        }
        return data;
    }
}