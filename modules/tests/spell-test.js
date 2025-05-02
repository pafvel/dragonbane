import DoD_Utility from "../utility.js";
import DoDSkillTest from "./skill-test.js";


export default class DoDSpellTest extends DoDSkillTest  {

    constructor(actor, spell, options) {
        super(actor, actor.findMagicSkill(spell.system.school), options);
        this.spell = spell;
        this.hasPowerLevel = spell.system.rank > 0;
    }

    updateDialogData() {
        super.updateDialogData();
        this.dialogData.spell = this.spell;
        this.dialogData.hasPowerLevel = this.hasPowerLevel;
    }

    async getRollOptions() {

        if (!this.skill && !this.autoSuccess) {
            DoD_Utility.WARNING("DoD.WARNING.missingMagicSchool", {spell: this.spell.name});
            return {cancelled: true};
        }
        const label = game.i18n.localize("DoD.ui.dialog.skillRollLabel");
        const title = game.i18n.localize("DoD.ui.dialog.skillRollTitle") + ": " + this.spell.name;

        let options = await this.getRollOptionsFromDialog(title, label);
        if (options.cancelled) return options;

        if (!this.isReRoll && !this.autoSuccess) {
            // Check if the character has enough WP to cast spell
            let powerLevel = this.hasPowerLevel ? 1 : 0;
            if (!this.skipDialog && this.hasPowerLevel) {
                powerLevel = options.powerLevel;
            }
            const wpCost = this.spell.getSpellCost(powerLevel);
            const wp = this.actor.system.willPoints.value;
            if (wpCost > wp) {
                DoD_Utility.WARNING("DoD.WARNING.notEnoughWPForSpell");
                options.cancelled = true;
            }
        }
        return options;
    }

    processDialogOptions(form) {
        let options = super.processDialogOptions(form);

        // Process power level
        const elements = form.getElementsByClassName("power-level");
        const element = elements ? elements[0] : null;
        if (element) {
            options.powerLevel = Number(element.value);
        }
        return options;
    }

    updatePreRollData() {
        super.updatePreRollData();
        this.preRollData.spell = this.spell;
        this.preRollData.powerLevel = this.options.powerLevel ?? 1;
        this.preRollData.wpCost = this.options.wpCost ?? this.spell.getSpellCost(this.preRollData.powerLevel);
    }

    updatePostRollData() {
        super.updatePostRollData();

        if (this.actor.type !== "monster") {
            this.postRollData.wpOld = this.postRollData.actor.system.willPoints.value;
            this.postRollData.wpNew = this.isReRoll ? this.postRollData.wpOld : this.postRollData.actor.system.willPoints.value - this.postRollData.wpCost;
            if (this.postRollData.wpNew !== this.postRollData.wpOld) {
                // Pay WP cost
                this.postRollData.actor.update({ ["system.willPoints.value"]: this.postRollData.wpNew});

                // Add info to chat card
                this.postRollData.formulaInfo =
                `<div class="permission-observer dice-tooltip" data-actor-id="${this.postRollData.actor.uuid}" style="text-align: left">
                    <div class="wrapper">
                        <b>${game.i18n.localize("DoD.ui.character-sheet.wp")}:</b> ${this.postRollData.wpOld} <i class="fa-solid fa-arrow-right"></i> ${this.postRollData.wpNew}<br>
                    </div>
                </div>`;
            }
        }

        this.postRollData.isDamaging = this.spell.isDamaging;
        this.postRollData.isHealing = this.spell.isHealing;

        if (this.postRollData.isDemon) {
            this.postRollData.isMagicMishap = true;
            const table = DoD_Utility.findSystemTable("magicMishapTable", game.i18n.localize("DoD.tables.mishapMagic"));
            if (table) {
                this.postRollData.magicMishapTable = "@Table[" + table.uuid + "]{" + table.name + "}";
            } else {
                DoD_Utility.WARNING(game.i18n.localize("DoD.WARNING.noMagicMishapTable"));
            }

        }

        if (this.postRollData.isDragon) {
            this.postRollData.isMagicCrit = true;
            this.postRollData.magicCritGroup = "magicCritChoice"
            this.postRollData.magicCritChoices = {};

            // populate crit choices
            this.postRollData.magicCritChoices.noCost = game.i18n.localize("DoD.magicCritChoices.noCost");
            if (this.preRollData.spell.isDamaging) {
                this.postRollData.magicCritChoices.doubleDamage = game.i18n.localize("DoD.magicCritChoices.doubleDamage");
            }
            this.postRollData.magicCritChoices.doubleRange = game.i18n.localize("DoD.magicCritChoices.doubleRange");
            this.postRollData.magicCritChoices.extraSpell = game.i18n.localize("DoD.magicCritChoices.extraSpell");

            // set default choice
            this.postRollData.magicCritChoice = "noCost";
        }
    }

    formatRollMessage(postRollData) {
        const target = postRollData.targetActor;
        const result = this.formatRollResult(postRollData);
        const locString = postRollData.powerLevel > 0 ? (target ? "DoD.roll.spellRollTarget" : "DoD.roll.spellRoll") : "DoD.roll.skillRoll";
        const label = game.i18n.format(
            game.i18n.localize(locString),
            {
                skill: postRollData.spell.name,
                spell: postRollData.spell.name,
                powerLevel: postRollData.powerLevel,
                target: postRollData.targetActor?.isToken ? postRollData.targetActor.token.name : postRollData.targetActor?.name,
                result: result
            }
        );

        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: postRollData.actor }),
            flavor: label
        };
    }
}