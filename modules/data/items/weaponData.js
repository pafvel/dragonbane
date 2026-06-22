import {DoDGearBaseData} from "./gear-base.js";

export default class DoDWeaponData extends DoDGearBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            grip: new fields.SchemaField({
                value: new fields.StringField({ required: true, initial: "none" }),
            }),
            str: new fields.NumberField({ required: true, initial: 0 }),
            range: new fields.StringField({ required: true, initial: "" }),
            damage: new fields.StringField({ required: true, initial: "" }),
            durability: new fields.NumberField({ required: true, initial: 0 }),
            skill: new fields.SchemaField({
                name: new fields.StringField({ required: true, initial: "" }),
                value: new fields.NumberField({ required: true, initial: 0 })
            }),
            features: new fields.ArrayField(
                new fields.StringField({ required: true, initial: '' }), { required: true, initial: [] }
            ),
            broken: new fields.BooleanField({ required: true, blank: true, initial: false }),
            mainHand: new fields.BooleanField({ required: true, blank: true, initial: false }),
            offHand: new fields.BooleanField({ required: true, blank: true, initial: false }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }

    async addCardProperties(_context, data) {
        const item = this.parent;
        if (this.skill.name) {
            data.properties.push({ label: game.i18n.localize("DoD.weapon.skill"), value: this.skill.name });
        }
        if (this.grip.value && this.grip.value !== "none") {
            data.properties.push({ label: game.i18n.localize("DoD.weapon.grip"), value: game.i18n.localize("DoD.gripTypes." + this.grip.value) });
        }
        if (this.str > 0) {
            data.properties.push({ label: game.i18n.localize("DoD.weapon.str"), value: this.str });
        }
        const range = item.calculatedRange;
        if (range) {
            data.properties.push({ label: game.i18n.localize("DoD.weapon.range"), value: range });
        }
        if (this.damage) {
            data.properties.push({ label: game.i18n.localize("DoD.weapon.damage"), value: this.damage });
        }
        if (this.durability > 0) {
            data.properties.push({ label: game.i18n.localize("DoD.weapon.durability"), value: this.durability });
        }
        if (this.features?.length > 0) {
            const names = this.features.map(f => game.i18n.localize(CONFIG.DoD.weaponFeatureTypes[f])).filter(Boolean).join(", ");
            if (names) data.properties.push({ label: game.i18n.localize("DoD.weapon.features"), value: names });
        }
        if (this.weight > 0) {
            data.properties.push({ label: game.i18n.localize("DoD.gear.weight"), value: this.weight });
        }
    }
}