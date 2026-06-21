import {DoDItemBaseData} from "./item-base.js";

export default class DoDSkillData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            skillType: new fields.StringField({ required: true, initial: "core" }),
            attribute: new fields.StringField({ required: true, initial: "none" }),
            value: new fields.NumberField({ required: true, initial: 0 }),
            advance: new fields.NumberField({ required: true, initial: 0 }),
            taught: new fields.BooleanField({ required: true, initial: false }),
            hideTrained: new fields.BooleanField({ required: true, initial: false }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }

    async getCardData(context) {
        const data = await super.getCardData(context);
        if (context === "chat") {
            data.properties.push(
                { label: game.i18n.localize("DoD.skill.type"), value: game.i18n.localize(CONFIG.DoD.skillTypes[this.skillType]) },
                { label: game.i18n.localize("DoD.skill.attribute"), value: game.i18n.localize("DoD.attributes." + this.attribute) }
            );
            data.actions.push({ label: game.i18n.localize("DoD.ui.dialog.skillRollLabel"), action: "useSkill" });
        } else {
            data.subtitle = game.i18n.localize("DoD.attributes." + this.attribute);
        }
        return data;
    }
}