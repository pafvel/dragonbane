import DoDTest from "./dod-test.js";


export default class DoDSkillTest extends DoDTest {

    constructor(actor, skill, options) {
        super(actor, options);
        this.actor = actor;
        this.skill = skill;
        this.attribute = skill?.system.attribute;
        this.canPush = options ? options.canPush !== false : true;
        this.isReRoll = options?.isReRoll | false;
    }

    async getRollOptions() {
        const label = game.i18n.localize("DoD.ui.dialog.skillRollLabel");
        const title = game.i18n.localize("DoD.ui.dialog.skillRollTitle") + ": " + this.skill.name;
        return this.getRollOptionsFromDialog(title, label);
    }

    updatePreRollData() {
        super.updatePreRollData();
        this.preRollData.actor = this.actor;
        this.preRollData.skill = this.skill;
        this.preRollData.target = this.skill?.system.value;
        this.preRollData.canPush = this.options ? this.options.canPush !== false : true;
    }

    updatePostRollData() {
        super.updatePostRollData();
        this.postRollData.result = Number(this.roll.result);
        this.postRollData.success = this.autoSuccess || (this.postRollData.result <= this.preRollData.target);
        this.postRollData.isDragon = !this.autoSuccess && (this.postRollData.result <= 1 + (this.preRollData.extraDragons ?? 0));
        this.postRollData.isDemon = !this.autoSuccess && (this.postRollData.result >= 20 - (this.preRollData.extraDemons ?? 0));
        this.postRollData.canPush = this.preRollData.canPush && !this.postRollData.success && !this.postRollData.isDemon;

        if (this.postRollData.canPush) {
            this.updatePushRollChoices();
        }

        if (this.options.targets) {
            this.postRollData.targetActor = this.options.targets[0].actor;
        }

        if (game.settings.get("dragonbane","automaticSkillAdvancementMark") && (this.postRollData.isDemon || this.postRollData.isDragon)) {
            this.setAdvancementMark();
        }
    }

    async setAdvancementMark() {
        if (this.skill.system.advance) return;
        await this.skill.update({ "system.advance": true })
    }

    formatRollMessage(postRollData) {
        const resultMsg = this.formatRollResult(postRollData);
        const label = game.i18n.format(game.i18n.localize("DoD.roll.skillRoll"), { skill: postRollData.skill.name, result: resultMsg });
        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: postRollData.actor }),
            flavor: label
        };
    }

    getMessageTemplate() {
        return "systems/dragonbane/templates/partials/skill-roll-message.hbs";
    }

}