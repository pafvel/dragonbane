import DoDSkillTestMessageData from "./skill-test-message.js";
import DoD_Utility from "../../utility.js";

export default class DoDSpellTestMessageData extends DoDSkillTestMessageData {
    static TYPE = "spellTest";
    static TEMPLATE = "systems/dragonbane/templates/partials/skill-roll-message.hbs";

    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            isDamaging: new fields.BooleanField({ required: true, initial: false }),
            isHealing: new fields.BooleanField({ required: true, initial: false }),
            powerLevel: new fields.NumberField({ required: true, initial: 0 }),
            spellUuid: new fields.StringField({ required: true, initial: "" }),
            targetActorUuid: new fields.StringField({ required: false, initial: "" }),
            criticalEffect: new fields.StringField({ required: false, initial: "" }),
            wpOld: new fields.NumberField({ required: true, initial: 0 }),
            wpNew: new fields.NumberField({ required: true, initial: 0 }),
            wpSourceUuid: new fields.StringField({ required: false, initial: "" }),
            craftItem: new fields.BooleanField({ required: false, initial: false }),
            craftedItem: new fields.StringField({ required: false, initial: "" }),
            craftedItemCount: new fields.NumberField({ required: false, initial: 0 }),
            consumedMaterials: new fields.ArrayField(new fields.StringField(), { required: false, initial: [] }),
            consumedMaterialsCount: new fields.NumberField({ required: false, initial: 0 }),
        });
    }

    get doubleSpellDamage() {
        return this.criticalEffect === "doubleDamage";
    }

    toContext() {
        const context = super.toContext();

        // replace spellUuid with spell
        context.spell = fromUuidSync(this.spellUuid);
        delete context.spellUuid;

        // replace targetActorUuid with targetActor
        context.targetActor = this.targetActorUuid ? fromUuidSync(this.targetActorUuid) : "";
        delete context.targetActorUuid;

        context.wpSource = this.wpSourceUuid ? fromUuidSync(this.wpSourceUuid) : null;
        delete context.wpSourceUuid;

        return context;
    }

    static prepareSource(context) {
         // replace spell & targetActor with spellUuid & targetActorUuid
        const { spell, targetActor, ...rest } = super.prepareSource(context);
        return { ...rest, spellUuid: spell.uuid, targetActorUuid: targetActor?.uuid || "" };
    }

    static fromContext(context) {
        const source = this.prepareSource(context);
        return new this(source);
    } 

    async getTooltip(roll) {
        const wpSourceName = this.wpSourceUuid ? (await fromUuid(this.wpSourceUuid))?.name : null;

        const toolTip =
        `<div class="permission-observer dice-tooltip" data-actor-id="${this.actorUuid}" style="text-align: left">
            <div class="wrapper">
                <b>${game.i18n.localize("DoD.ui.character-sheet.wp")}:</b> ${this.wpOld} <i class="fa-solid fa-arrow-right"></i> ${this.wpNew}
                ${wpSourceName ? `(${wpSourceName})` : ""}<br>
            </div>
        </div>`;

        return toolTip + await super.getTooltip(roll);
    }

    formatRollMessage() {
        const result = this.formatRollResult();
        const spell = fromUuidSync(this.spellUuid);
        const actor = fromUuidSync(this.actorUuid);
        const targetActor = this.targetActorUuid ? fromUuidSync(this.targetActorUuid) : null;
        const locString = this.powerLevel > 0 ? (targetActor ? "DoD.roll.spellRollTarget" : "DoD.roll.spellRoll") : "DoD.ui.chat.castMagicTrick";
        const content = game.i18n.format(locString, {
                actor: actor?.name,
                skill: spell?.name,
                spell: spell?.name,
                uuid: this.spellUuid,
                powerLevel: this.powerLevel,
                target: targetActor?.isToken ? targetActor.token.name : targetActor?.name,
                result: result
            }
        );

        let craftContent = "";
        if (this.consumedMaterials.length > 0) {
            craftContent = "<p><b>" + game.i18n.localize("DoD.recipe.consumedMaterials") + ":</b> <em>" + this.consumedMaterials.join(` (${this.consumedMaterialsCount}), `) + ` (${this.consumedMaterialsCount})</em></p>`;
        }
        if (this.craftedItem) {
            craftContent += "<p><b>" + game.i18n.localize("DoD.recipe.craftedItem") + ":</b> <em>" + this.craftedItem + ` (${this.craftedItemCount})</em></p>`;
        }

        let critContent = "";
        if (this.criticalEffect) {
            critContent = "<p><b>" + game.i18n.localize("DoD.magicCritChoices.choiceTitle") + ":</b> "
                        + "<em>" + game.i18n.localize(`DoD.magicCritChoices.${this.criticalEffect}`) + "</em></p>";
        } else if (this.isDemon) {
            const table = DoD_Utility.findSystemTable("magicMishapTable", game.i18n.localize("DoD.tables.mishapMagic"));
            if (table) {
                critContent = "<p>@Table[" + table.uuid + "]{" + table.name + "}</p>";
            } else {
                DoD_Utility.WARNING(game.i18n.localize("DoD.WARNING.noMagicMishapTable"));
            }
        }        
        return { content: "<p>" + content + craftContent + "</p>" + critContent };
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

        // Prepare spell crit options
        const magicCritGroup = "magicCritChoice"
        const magicCritChoices = {};

        if (context.actor.system.willPoints !== undefined) {
            magicCritChoices.noCost = game.i18n.localize("DoD.magicCritChoices.noCost");
        }
        if (context.isDamaging && !context.isHealing) {
            magicCritChoices.doubleDamage = game.i18n.localize("DoD.magicCritChoices.doubleDamage");
        }
        magicCritChoices.doubleRange = game.i18n.localize("DoD.magicCritChoices.doubleRange");
        magicCritChoices.extraSpell = game.i18n.localize("DoD.magicCritChoices.extraSpell");

        const magicCritChoice = magicCritChoices.noCost ? "noCost" : (magicCritChoices.doubleDamage ? "doubleDamage" : (magicCritChoices.doubleRange ? "doubleRange" : "extraSpell"))   ;

        // Create dialog content
        const content = hb({
            legend: game.i18n.localize("DoD.magicCritChoices.choiceLabel"),
            critGroup: magicCritGroup,
            critChoices: magicCritChoices,
            critChoice: magicCritChoice
        });

        // Show dialog
        const choice = await foundry.applications.api.DialogV2.input({
            window: { title: game.i18n.localize("DoD.magicCritChoices.choiceTitle") + ": " + context.spell.name },
            content,
        });
        if (choice === null) return; // dialog was closed

        // Apply effects of critical choice
        let systemData = null;
        const criticalEffect = choice.magicCritChoice;

        if (choice.magicCritChoice === "noCost") {
            const powerSource = context.wpSource ?? context.actor;
            const wpNew = this.wpOld;

            // Restore WP cost
            if (powerSource.system?.willPoints) { // actor
                powerSource.update({ ["system.willPoints.value"]: wpNew});
            } else if (powerSource.system?.enchantments?.charge) { // gear
                powerSource.update({ ["system.enchantments.charge"]: wpNew});
            } else if (powerSource.actor?.system.willPoints) { // token
                powerSource.actor.update({ ["system.willPoints.value"]: wpNew});
            }

            systemData = { ...this, criticalEffect, wpNew };
        } else {
            systemData = { ...this, criticalEffect };
        }

        // Update message
        const model = new message.system.constructor(systemData);
        const messageData = await model.createMessageData(message.rolls[0]);
        await message.update(messageData);
    }
}

Hooks.once("init", () => {
  DoDSpellTestMessageData.register();
});