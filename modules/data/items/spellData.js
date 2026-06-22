import {DoDItemBaseData} from "./item-base.js";

export default class DoDSpellData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            school: new fields.StringField({ required: true, initial: "" }),
            rank: new fields.NumberField({ required: true, initial: 0 }),
            prerequisite: new fields.StringField({ required: true, initial: "" }),
            requirement: new fields.StringField({ required: true, initial: "" }),
            castingTime: new fields.StringField({ required: true, initial: "action" }),
            rangeType: new fields.StringField({ required: true, initial: "range" }),
            range: new fields.NumberField({ required: true, initial: 0 }),
            areaOfEffect: new fields.StringField({ required: true, initial: "" }),
            duration: new fields.StringField({ required: true, initial: "instant" }),
            damage: new fields.StringField({ required: true, initial: "" }),
            damagePerPowerlevel: new fields.StringField({ required: true, initial: "" }),
            memorized: new fields.BooleanField({ required: true, initial: false }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }

    async getCardData(context) {
        const data = await super.getCardData(context);

        if (this.rank > 0) {

            let range = "";
            switch (this.rangeType) {
                case "range":
                    range = this.range ? this.range + " " + game.i18n.localize("DoD.unit.meterPlural") : "-";
                    break;
                case "personal":
                    range = game.i18n.localize("DoD.spellRangeTypes.personal");
                    break;
                case "touch":
                    range = game.i18n.localize("DoD.spellRangeTypes.touch");
                    break;
                case "cone":
                    range = `${this.range} ${game.i18n.localize("DoD.unit.meterPlural")} (${game.i18n.localize("DoD.spellRangeTypes.cone")})`;
                    break;
                case "sphere":
                    range = `${this.range} ${game.i18n.localize("DoD.unit.meterPlural")} (${game.i18n.localize("DoD.spellRangeTypes.sphere")})`;
                    break;
            }

            if (context === "chat" && this.school) {
                data.properties.push({ label: game.i18n.localize("DoD.spell.school"), value: this.school });
            }
            data.properties.push(
                { label: game.i18n.localize("DoD.spell.rank"), value: this.rank },
                { label: game.i18n.localize("DoD.spell.prerequisite"), value: this.prerequisite || "-" },
                { label: game.i18n.localize("DoD.spell.requirement"), value: this.requirement || "-" },
                { label: game.i18n.localize("DoD.spell.castingTime"), value: game.i18n.localize("DoD.castingTimeTypes." + this.castingTime) },
                { label: game.i18n.localize("DoD.spell.rangeType"), value: range },
                { label: game.i18n.localize("DoD.spell.duration"), value: game.i18n.localize("DoD.spellDurationTypes." + this.duration) }
            );
        }

        return data;
    }
}