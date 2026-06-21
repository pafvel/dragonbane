import {DoDItemBaseData} from "./item-base.js";

export default class DoDInjuryData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            healingTime: new fields.StringField({ required: true, initial: "" }),
            banes: new fields.StringField({ required: true, blank: true, initial: "" }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }

    async getCardData(context) {
        const data = await super.getCardData(context);
        if (this.healingTime) {
            data.properties.push({ label: game.i18n.localize("DoD.injury.healingTime"), value: this.healingTime });
        }
        if (this.banes) {
            data.properties.push({ label: game.i18n.localize("DoD.ui.character-sheet.banes"), value: this.banes });
        }
        return data;
    }
}