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

        context.renderCriticalEffect = this.isDragon && !this.criticalEffect;

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
        const toolTip =
        `<div class="permission-observer dice-tooltip" data-actor-id="${this.actorUuid}" style="text-align: left">
            <div class="wrapper">
                <b>${game.i18n.localize("DoD.ui.character-sheet.wp")}:</b> ${this.wpOld} <i class="fa-solid fa-arrow-right"></i> ${this.wpNew}<br>
            </div>
        </div>`;

        return toolTip + await super.getTooltip(roll);
    }


    formatRollMessage() {
        const result = this.formatRollResult();
        const spell = fromUuidSync(this.spellUuid);
        const targetActor = this.targetActorUuid ? fromUuidSync(this.targetActorUuid) : null;
        const locString = this.powerLevel > 0 ? (targetActor ? "DoD.roll.spellRollTarget" : "DoD.roll.spellRoll") : "DoD.roll.skillRoll";
        const content = game.i18n.format(locString, {
                skill: spell?.name,
                spell: spell?.name,
                uuid: this.spellUuid,
                powerLevel: this.powerLevel,
                target: targetActor?.isToken ? targetActor.token.name : targetActor?.name,
                result: result
            }
        );

        let extraContent = "";

        if (this.criticalEffect) {
            extraContent = "<p><b>" + game.i18n.localize("DoD.magicCritChoices.choiceTitle") + ":</b> "
                        + "<em>" + game.i18n.localize(`DoD.magicCritChoices.${this.criticalEffect}`) + "</em></p>";
        } else if (this.isDemon) {
            const table = DoD_Utility.findSystemTable("magicMishapTable", game.i18n.localize("DoD.tables.mishapMagic"));
            if (table) {
                extraContent = "<p>@Table[" + table.uuid + "]{" + table.name + "}</p>";
            } else {
                DoD_Utility.WARNING(game.i18n.localize("DoD.WARNING.noMagicMishapTable"));
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

        // Prepare spell crit options
        const magicCritGroup = "magicCritChoice"
        const magicCritChoices = {};

        magicCritChoices.noCost = game.i18n.localize("DoD.magicCritChoices.noCost");
        if (context.spell.isDamaging) {
            magicCritChoices.doubleDamage = game.i18n.localize("DoD.magicCritChoices.doubleDamage");
        }
        magicCritChoices.doubleRange = game.i18n.localize("DoD.magicCritChoices.doubleRange");
        magicCritChoices.extraSpell = game.i18n.localize("DoD.magicCritChoices.extraSpell");

        const magicCritChoice = "noCost";

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
            const wpNew = this.wpOld;
            await actor.update({ ["system.willPoints.value"]: wpNew});
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