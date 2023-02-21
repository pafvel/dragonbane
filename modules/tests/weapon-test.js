import DoD_Utility from "../utility.js";
import DoDTest from "./dod-test.js";


export default class DoDWeaponTest extends DoDTest  {

    constructor(actor, weapon) {
        super();
        this.data.actor = actor;
        this.data.weapon = weapon;
        this.data.skill = actor.findSkill(weapon.system.skill.name);
        this.data.attribute = this.data.skill?.system.attribute;
    }
   
    updateRollData() {
        super.updateRollData();

        let hasSlashAttack = this.data.weapon.hasWeaponFeature("slashing");
        let hasStabAttack = this.data.weapon.hasWeaponFeature("piercing");
        let hasWeakpointAttack = hasStabAttack;
        let hasNormalAttack = !(hasStabAttack || hasSlashAttack);
        let hasToppleAttack = this.data.weapon.hasWeaponFeature("toppling");
        let hasDisarmAttack = true;
        let hasThrowAttack = this.data.weapon.hasWeaponFeature("thrown");
        let hasParry = !this.data.weapon.hasWeaponFeature("noparry");

        let actions = [];

        if(hasNormalAttack) {
            actions.push({
                id: "normal",
                label: game.i18n.localize("DoD.ui.dialog.attackNormal"),
                tooltip: game.i18n.localize("DoD.ui.dialog.attackNormalTooltip")
            });
        }
        if(hasSlashAttack) {
            actions.push({
                id: "slash",
                label: game.i18n.localize("DoD.ui.dialog.attackSlash"),
                tooltip: game.i18n.localize("DoD.ui.dialog.attackSlashTooltip")
            });
        }
        if(hasStabAttack) {
            actions.push({
                id: "stab",
                label: game.i18n.localize("DoD.ui.dialog.attackStab"),
                tooltip: game.i18n.localize("DoD.ui.dialog.attackStabTooltip")
            });
        }
        if(hasWeakpointAttack) {
            actions.push({
                id: "weakpoint",
                label: game.i18n.localize("DoD.ui.dialog.attackWeakpoint"),
                tooltip: game.i18n.localize("DoD.ui.dialog.attackWeakpointTooltip")
            });
        }
        if(hasToppleAttack) {
            actions.push({
                id: "topple",
                label: game.i18n.localize("DoD.ui.dialog.attackTopple"),
                tooltip: game.i18n.localize("DoD.ui.dialog.attackToppleTooltip")
            });
        }
        if(hasDisarmAttack) {
            actions.push({
                id: "disarm",
                label: game.i18n.localize("DoD.ui.dialog.attackDisarm"),
                tooltip: game.i18n.localize("DoD.ui.dialog.attackDisarmTooltip")
            });
        }        
        if(hasThrowAttack) {
            actions.push({
                id: "throw",
                label: game.i18n.localize("DoD.ui.dialog.attackThrow"),
                tooltip: game.i18n.localize("DoD.ui.dialog.attackThrowTooltip")
            });
        }        
        if(hasParry) {
            actions.push({
                id: "parry",
                label: game.i18n.localize("DoD.ui.dialog.attackParry"),
                tooltip: game.i18n.localize("DoD.ui.dialog.attackParryTooltip")
            });
        }

        if (actions.length > 0) {
            actions[0].checked = true;
        }

        this.data.actions = actions;

    }   

    formatRollMessage(roll) {
        let target = this.data.skill.system.value;
        let result = this.formatRollResult(roll, target);
        let locString = "DoD.roll.skillRoll";
        let label = game.i18n.format(game.i18n.localize(locString), 
            {
                skill: this.data.weapon.name, 
                result: result
            }
        );

        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.data.actor }),
            flavor: label
        };
    }

    async getRollOptions() {

        let label = game.i18n.localize("DoD.ui.dialog.skillRollLabel");
        let title = game.i18n.localize("DoD.ui.dialog.skillRollTitle") + ": " + this.data.weapon.name;

        return this.getRollOptionsFromDialog(title, label);
    }

    /*
    processDialogOptions(form) {
        let options = super.processDialogOptions(form);

        // Process power level
        let elements = form.getElementsByClassName("power-level");
        let element = elements ? elements[0] : null;
        if (element) {
            options.powerLevel = Number(element.value);
        }
        return options;
    }
    */
}