import {DoDItemBaseData} from "./item-base.js";

export default class DoDKinData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            abilities: new fields.StringField({ required: true, initial: "" }),
            movement: new fields.NumberField({ required: true, initial: 10 }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }

    async getCardData(context) {
        const data = await super.getCardData(context);
        if (this.abilities) {
            data.properties.push({ label: game.i18n.localize("DoD.ui.character-sheet.kinAbilities"), value: this.abilities });
        }
        data.properties.push({ label: game.i18n.localize("DoD.ui.character-sheet.movement"), value: this.movement });
        return data;
    }
}