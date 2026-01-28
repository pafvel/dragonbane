import DoDSkillTestMessageData from "./skill-test-message.js";
import { DoD } from "../../config.js";
import DoD_Utility from "../../utility.js";

export default class DoDWeaponTestMessageData extends DoDSkillTestMessageData {
    static TYPE = "weaponTest";
    static TEMPLATE = "systems/dragonbane/templates/partials/skill-roll-message.hbs";

    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            action: new fields.StringField({ required: true, initial: "" }),
            damageType: new fields.StringField({ required: true, initial: DoD.damageTypes.none }),
            extraDamage: new fields.StringField({ required: false, initial: "" }),
            extraDragons: new fields.NumberField({ required: false, initial: 0 }),
            isDamaging: new fields.BooleanField({ required: true, initial: false }),
            targetActorUuid: new fields.StringField({ required: false, initial: "" }),
            weaponUuid: new fields.StringField({ required: true, initial: "" }),
            criticalEffect: new fields.StringField({ required: false, initial: "" }),
            isRanged: new fields.BooleanField({ required: true, initial: false }),
        });
    }

    toContext() {
        const context = super.toContext();

        // replace weaponUuid with weapon
        context.weapon = fromUuidSync(this.weaponUuid);
        delete context.weaponUuid;

        // replace targetActorUuid with targetActor
        context.targetActor = this.targetActorUuid ? fromUuidSync(this.targetActorUuid) : "";
        delete context.targetActorUuid;

        return context;
    }

    static prepareSource(context) {
         // replace weapon & targetActor with weaponUuid & targetActorUuid
        const { weapon, targetActor, ...rest } = super.prepareSource(context);
        return { ...rest, weaponUuid: weapon.uuid, targetActorUuid: targetActor?.uuid || "" };
    }

    static fromContext(context) {
        const source = this.prepareSource(context);
        return new this(source);
    } 

    formatRollMessage() {
        const context = this.toContext();
        const locString = context.targetActor ? "DoD.roll.weaponRollTarget" : "DoD.roll.weaponRoll";

        let content = game.i18n.format(locString, {
                action: game.i18n.localize("DoD.attackTypes." + context.action),
                skill: context.weapon.name, // keeping this for backward compatibility in the localization strings
                weapon: context.weapon.name, // keeping this for backward compatibility in the localization strings
                uuid: context.weapon.uuid,
                result: this.formatRollResult(),
                target: context.targetActor?.isToken ? context.targetActor.token.name : context.targetActor?.name
            }
        );

        let extraContent = "";

        if (this.criticalEffect) {
            extraContent = "<p><b>" + game.i18n.localize("DoD.critChoices.choiceTitle") + ":</b> "
                        + "<em>" + game.i18n.localize(`DoD.critChoices.${this.criticalEffect}`) + "</em></p>";
        } else if (this.isDemon) {
            const tableName = this.isRanged ? "rangedMishapTable" : "meleeMishapTable";
            const mishapTableName = this.isRanged ? game.i18n.localize("DoD.tables.mishapRanged") : game.i18n.localize("DoD.tables.mishapMelee");
            const table = DoD_Utility.findSystemTable(tableName, mishapTableName);
            if (table) {
                extraContent = "<p>@Table[" + table.uuid + "]{" + table.name + "}</p>";
            } else {
                DoD_Utility.WARNING(game.i18n.localize("DoD.WARNING.noMeleeMishapTable"));
            }
        }        
        return { content: "<p>" + content + "</p>" + extraContent };
    }
    
    async onCritical(message) {
        const context = this.toContext();
        const actor = context.actor;
        if (!actor) return;

        // Prepare dialog template
        const hb = Handlebars.compile(`
            <form>
                <fieldset>
                <legend>{{legend}}</legend>
                {{radioBoxes critGroup critChoices checked=critChoice localize=true}}
                </fieldset>
            </form>
        `);

        // Prepare crit options
        const critGroup = "critChoice"
        const critChoices = {};

        // populate crit choices
        if (context.isDamaging) {
            critChoices.doubleWeaponDamage = game.i18n.localize("DoD.critChoices.doubleWeaponDamage");
        }
        if (!context.isRanged) {
            critChoices.extraAttack = game.i18n.localize("DoD.critChoices.extraAttack");
        }
        if (context.damageType === DoD.damageTypes.piercing && context.action !== "weakpoint") {
            critChoices.ignoreArmor = game.i18n.localize("DoD.critChoices.ignoreArmor");
        }

        // set default choice
        const critChoice = critChoices.doubleWeaponDamage ? "doubleWeaponDamage" : "extraAttack";

        // Create dialog content
        const content = hb({
            legend: game.i18n.localize("DoD.critChoices.choiceLabel"),
            critGroup: critGroup,
            critChoices: critChoices,
            critChoice: critChoice
        });

        // Show dialog
        const choice = await foundry.applications.api.DialogV2.input({
            window: { title: game.i18n.localize("DoD.critChoices.choiceTitle") + ": " + context.weapon.name },
            content,
        });
        if (choice === null) return; // dialog was closed

        // Update message
        const criticalEffect = choice.critChoice;
        const systemData = { ...this, criticalEffect };
        const model = new message.system.constructor(systemData);
        const messageData = await model.createMessageData(message.rolls[0]);
        await message.update(messageData);
    }
}

Hooks.once("init", () => {
  DoDWeaponTestMessageData.register();
});