import DoDSkillTest from "./skill-test.js";
import { DoD } from "../config.js";


export default class DoDWeaponTest extends DoDSkillTest  {

    constructor(actor, weapon, options) {
        super(actor, actor.findSkill(weapon.system.skill?.name), options);
        this.weapon = weapon;
    }
   
    updateDialogData() {
        super.updateDialogData();

        let hasSlashAttack = this.weapon.hasWeaponFeature("slashing");
        let hasStabAttack = this.weapon.hasWeaponFeature("piercing");
        let hasWeakpointAttack = hasStabAttack;
        let hasNormalAttack = !(hasStabAttack || hasSlashAttack);
        let hasToppleAttack = this.weapon.hasWeaponFeature("toppling");
        let hasDisarmAttack = true;
        let hasThrowAttack = this.weapon.hasWeaponFeature("thrown");
        let hasParry = !this.weapon.hasWeaponFeature("noparry");

        let actions = [];

        function pushAction(action) {
            actions.push({
                id: action,
                label: game.i18n.localize("DoD.attackTypes." + action),
                tooltip: game.i18n.localize("DoD.attackTypes." + action + "Tooltip")
            });
        }

        if(hasNormalAttack) {
            pushAction("normal");
        }
        if(hasSlashAttack) {
            pushAction("slash");
        }
        if(hasStabAttack) {
            pushAction("stab");
        }
        if(hasWeakpointAttack) {
            pushAction("weakpoint");
        }
        if(hasToppleAttack) {
            pushAction("topple");
        }
        if(hasDisarmAttack) {
            pushAction("disarm");
        }        
        if(hasThrowAttack) {
            pushAction("throw");
        }        
        if(hasParry) {
            pushAction("parry");
        }

        if (actions.length > 0) {
            actions[0].checked = true;
        }

        this.dialogData.actions = actions;
    }   

    async getRollOptions() {

        let label = game.i18n.localize("DoD.ui.dialog.skillRollLabel");
        let title = game.i18n.localize("DoD.ui.dialog.skillRollTitle") + ": " + this.weapon.name;
        let options = await this.getRollOptionsFromDialog(title, label);
        if (!options.action) {
            options.action = this.dialogData.actions[0].id;
        }
        return options;
    }

    formatRollMessage(msgData) {
        let result = this.formatRollResult(msgData.result, msgData.target);
        let locString = "DoD.roll.weaponRoll";
        let label = game.i18n.format(game.i18n.localize(locString), 
            {
                action: game.i18n.localize("DoD.attackTypes." + msgData.action),
                skill: msgData.weapon.name, 
                result: result
            }
        );

        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: msgData.actor }),
            flavor: label
        };
    }


    processDialogOptions(form) {
        let options = super.processDialogOptions(form);

        // Process input action
        let elements = form.getElementsByClassName("weapon-action");
        let element = elements ? elements[0] : null;
        if (element) {
            let inputs = element.getElementsByTagName("input");
            for (let input of inputs) {
                if (input.checked) {
                    options.action = input.id;
                    break;
                }
            }
        }
        if (options.action == "weakpoint") {
            options.extraBanes++;
        }
        return options;
    }

    updatePreRollData() {
        super.updatePreRollData();
        this.preRollData.weapon = this.weapon;
        this.preRollData.action = this.options.action;
    }

    updatePostRollData() {
        super.updatePostRollData();

        switch(this.postRollData.action) {
            case "slash":
                this.postRollData.damageType = DoD.damageTypes.slashing;
                this.postRollData.isDamaging = true;
                break;

            case "stab":
                this.postRollData.damageType = DoD.damageTypes.piercing;
                this.postRollData.isDamaging = true;
                break;
    
            case "weakpoint":
                this.postRollData.damageType = DoD.damageTypes.piercing;
                this.postRollData.isDamaging = true;
                this.postRollData.ignoreArmor = true;
                break;

            case "topple":
            case "disarm":
            case "parry":
                this.postRollData.damageType = DoD.damageTypes.none;
                this.postRollData.isDamaging = false;
                break;
            
            case "normal":
                if (this.postRollData.weapon.hasWeaponFeature("bludgeoning")) {
                this.postRollData.isDamaging = true;
                    this.postRollData.damageType = DoD.damageTypes.bludgeoning;
                    this.postRollData.isDamaging = true;
                    break;
                }

            default:
                this.postRollData.damageType = DoD.damageTypes.none;
                this.postRollData.isDamaging = true;
        }

        if (this.postRollData.result == 20) {
            this.postRollData.isMeleeMishap = true;
        }

        if (this.postRollData.result == 1 && this.postRollData.action != "parry") {
            this.postRollData.isMeleeCrit = true;
            this.postRollData.meleeCritGroup = "meleeCritChoice"
            this.postRollData.meleeCritChoices = {};            

            // populate crit choices
            if (this.postRollData.isDamaging) {
                this.postRollData.meleeCritChoices.doubleWeaponDamage = game.i18n.localize("DoD.meleeCritChoices.doubleWeaponDamage");
            }
            this.postRollData.meleeCritChoices.extraAttack = game.i18n.localize("DoD.meleeCritChoices.extraAttack");
            if (this.postRollData.damageType == DoD.damageTypes.piercing && this.postRollData.action != "weakpoint") {
                this.postRollData.meleeCritChoices.ignoreArmor = game.i18n.localize("DoD.meleeCritChoices.ignoreArmor");
            }

            // set default choice
            if (this.postRollData.meleeCritChoices.doubleWeaponDamage) {
                this.postRollData.meleeCritChoice = "doubleWeaponDamage";
            } else {
                this.postRollData.meleeCritChoice = "extraAttack";
            }
        }
    }
}