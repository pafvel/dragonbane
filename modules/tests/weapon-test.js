import DoDSkillTest from "./skill-test.js";
import { DoD } from "../config.js";


export default class DoDWeaponTest extends DoDSkillTest  {

    constructor(actor, weapon, options) {
        super(actor, actor.findSkill(weapon.system.skill?.name), options);
        this.data.weapon = weapon;
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

        this.data.actions = actions;
    }   

    formatRollMessage(roll) {
        let target = this.data.skill?.system.value;
        let result = this.formatRollResult(roll, target);
        let locString = "DoD.roll.weaponRoll";
        let label = game.i18n.format(game.i18n.localize(locString), 
            {
                action: game.i18n.localize("DoD.attackTypes." + this.data.action),
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
        let options = await this.getRollOptionsFromDialog(title, label);
        if (!options.action) {
            options.action = this.data.actions[0].id;
        }
        return options;
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
        return options;
    }

    preRoll() {
        super.preRoll();
        if (this.options.action == "weakpoint") {
            this.options.extraBanes++;
        }
    }

    postRoll() {
        super.postRoll();

        this.data.action = this.options.action;
        switch(this.data.action) {
            case "slash":
                this.data.damageType = DoD.damageTypes.slashing;
                this.data.isDamaging = true;
                break;

            case "stab":
                this.data.damageType = DoD.damageTypes.piercing;
                this.data.isDamaging = true;
                break;
    
            case "weakpoint":
                this.data.damageType = DoD.damageTypes.piercing;
                this.data.isDamaging = true;
                this.data.ignoreArmor = true;
                break;

            case "topple":
            case "disarm":
            case "parry":
                this.data.damageType = DoD.damageTypes.none;
                this.data.isDamaging = false;
                break;
            
            case "normal":
                if (this.data.weapon.hasWeaponFeature("bludgeoning")) {
                this.data.isDamaging = true;
                    this.data.damageType = DoD.damageTypes.bludgeoning;
                    this.data.isDamaging = true;
                    break;
                }

            default:
                this.data.damageType = DoD.damageTypes.none;
                this.data.isDamaging = true;
        }

        if (this.roll.result == 20) {
            this.data.isMeleeMishap = true;
        }

        if (this.roll.result == 1 && this.data.action != "parry") {
            this.data.isMeleeCrit = true;
            this.data.meleeCritGroup = "meleeCritChoice"
            this.data.meleeCritChoices = {};            

            // populate crit choices
            if (this.data.isDamaging) {
                this.data.meleeCritChoices.doubleWeaponDamage = game.i18n.localize("DoD.meleeCritChoices.doubleWeaponDamage");
            }
            this.data.meleeCritChoices.extraAttack = game.i18n.localize("DoD.meleeCritChoices.extraAttack");
            if (this.data.damageType == DoD.damageTypes.piercing && this.data.action != "weakpoint") {
                this.data.meleeCritChoices.ignoreArmor = game.i18n.localize("DoD.meleeCritChoices.ignoreArmor");
            }

            // set default choice
            if (this.data.meleeCritChoices.doubleWeaponDamage) {
                this.data.meleeCritChoice = "doubleWeaponDamage";
            } else {
                this.data.meleeCritChoice = "extraAttack";
            }
        }
    }
}