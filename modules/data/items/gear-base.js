import {DoDItemBaseData} from "./item-base.js";

export class DoDGearBaseData extends DoDItemBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            weight: new fields.NumberField({ required: true, nullable: true, initial: 1 }),
            quantity: new fields.NumberField({ required: true, nullable: true, initial: 1 }),
            cost: new fields.StringField({ required: true, blank: true, initial: "" }),
            supply: new fields.StringField({ required: true, blank: true, initial: "common" }),
            worn: new fields.BooleanField({ required: true, initial: false }),
            memento: new fields.BooleanField({ required: true, initial: false }),
            boons: new fields.StringField({ required: true, blank: true, initial: "" }),
            banes: new fields.StringField({ required: true, blank: true, initial: "" }),
            storage: new fields.BooleanField({ required: false, initial: false }),
            enchantments: new fields.SchemaField({
                charge: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
                applyOnlyWhenEquipped: new fields.BooleanField({ required: true, initial: false }),
                spells: new fields.ArrayField( new fields.SchemaField({
                    uuid: new fields.DocumentUUIDField({ required: true, nullable: true, initial: undefined }),
                    powerLevel: new fields.NumberField({ required: true, integer: true, initial: 1, min: 1 }),
                    castable: new fields.BooleanField({ required: true, initial: false }),
                    free: new fields.BooleanField({ required: true, initial: false }),
                })),   
            }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }

    async getCardData(context) {
        const data = await super.getCardData(context);
        if (this.cost) {
            data.properties.push({ label: game.i18n.localize("DoD.gear.cost"), value: this.cost });
        }
        if (this.supply) {
            data.properties.push({ label: game.i18n.localize("DoD.gear.supply"), value: game.i18n.localize("DoD.supplyTypes." + this.supply) });
        }
        await this.addCardProperties(context, data);
        if (this.boons) {
            data.properties.push({ label: game.i18n.localize("DoD.ui.dialog.boons"), value: this.boons });
        }
        if (this.banes) {
            data.properties.push({ label: game.i18n.localize("DoD.ui.dialog.banes"), value: this.banes });
        }
        return data;
    }

    async addCardProperties(_context, _data) {}
}


