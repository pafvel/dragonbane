import DoDTest from "./dod-test.js";

export default class DoDAttributeTest extends DoDTest {

    constructor(actor, attribute, options) {
        super(actor, options);
        this.attribute = attribute?.toLowerCase();
        if (this.options.canPush === undefined) {
            this.options.canPush = true;
        }
    }

    async getRollOptions() {
        let label = game.i18n.localize("DoD.ui.dialog.attributeRollLabel");
        let title = game.i18n.localize("DoD.ui.dialog.attributeRollTitle") + ": " + game.i18n.localize("DoD.attributes." + this.attribute);

        return this.getRollOptionsFromDialog(title, label);
    }

    updatePreRollData() {
        super.updatePreRollData();
        this.preRollData.actor = this.actor;
        this.preRollData.attribute = this.attribute;
        if (this.actor.type === "character") {
            this.preRollData.target = this.actor.system.attributes[this.attribute].value;
            this.preRollData.canPush = this.options.canPush;
        } else if (this.actor.type === "npc") {
            if (this.attribute === "con") {
                this.preRollData.target = this.actor.system.hitPoints.max - 2 * this.actor.items.filter(i => i.type === "ability" && i.system.secondaryAttribute === "hitPoints").length;
            } else if (this.attribute === "wil") {
                this.preRollData.target = this.actor.system.willPoints.max - 2 * this.actor.items.filter(i => i.type === "ability" && i.system.secondaryAttribute === "willPoints").length;
            } else if (this.attribute === "str") {
                switch (this.actor.system.damageBonus.str.value) {
                    case "d4":
                        this.preRollData.target = 14;
                        break;
                    case "d6":
                    case "d8":
                    case "d10":
                    case "d12":
                    case "d20":
                        this.preRollData.target = 17;
                        break;
                    default:
                        this.preRollData.target = 10;
                }
            } else if (this.attribute === "agl") {
                switch (this.actor.system.damageBonus.agl.value) {
                    case "d4":
                        this.preRollData.target = 14;
                        break;
                    case "d6":
                    case "d8":
                    case "d10":
                    case "d12":
                    case "d20":
                        this.preRollData.target = 17;
                        break;
                    default:
                        this.preRollData.target = 10;
                }
            } else {
                // INT and CHA
                this.preRollData.target = 10;
            }
            this.preRollData.canPush = false;
        } else {
            // monster
            this.preRollData.target = 15;
            this.preRollData.canPush = false;
        }
    }

    updatePostRollData() {
        super.updatePostRollData();
        this.postRollData.success = this.postRollData.result <= this.preRollData.target;
        this.postRollData.isDragon = this.postRollData.result <= 1 + (this.preRollData.extraDragons ?? 0);
        this.postRollData.isDemon = this.postRollData.result >= 20 - (this.preRollData.extraDemons ?? 0);
        this.postRollData.canPush = this.preRollData.canPush && !this.postRollData.success && !this.postRollData.isDemon;

        if (this.postRollData.canPush) {
            this.updatePushRollChoices();
        }
    }

    formatRollMessage(postRollData) {
        let result = this.formatRollResult(postRollData);
        let localizedName = game.i18n.localize("DoD.attributes." + postRollData.attribute);
        let label = game.i18n.format(game.i18n.localize(this.options.flavor ?? "DoD.roll.attributeRoll"), {attribute: localizedName, result: result});
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