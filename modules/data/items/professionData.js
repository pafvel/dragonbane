import {DoDItemBaseData} from "./item-base.js";

export default class DoDProfessionData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            attribute: new fields.StringField({ required: true, initial: "none" }),
            skills: new fields.StringField({ required: true, initial: "" }),
            abilities: new fields.StringField({ required: true, initial: "" }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }

    async getCardData(context) {
        const data = await super.getCardData(context);
        if (this.attribute && this.attribute !== "none") {
            data.properties.push({ label: game.i18n.localize("DoD.profession.key-attribute"), value: game.i18n.localize("DoD.attributes." + this.attribute) });
        }
        if (this.skills) {
            data.properties.push({ label: game.i18n.localize("DoD.ui.character-sheet.skills"), value: this.skills });
        }
        if (this.abilities) {
            data.properties.push({ label: game.i18n.localize("DoD.ui.character-sheet.abilities"), value: this.abilities });
        }
        return data;
    }
}