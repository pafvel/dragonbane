import DoDSkillTest from "./skill-test.js";
import { DoD } from "../config.js";
import DoD_Utility from "../utility.js";


export default class DoDWeaponTest extends DoDSkillTest  {

    constructor(actor, weapon, options) {
        super(actor, actor.findSkill(weapon.system.skill?.name), options);
        this.weapon = weapon;
    }
   
    updateDialogData() {
        super.updateDialogData();

        const isRangedWeapon = this.weapon.system.range >= 10;
        const hasSlashAttack = this.weapon.hasWeaponFeature("slashing");
        const hasStabAttack = this.weapon.hasWeaponFeature("piercing");
        const hasWeakpointAttack = hasStabAttack;
        const hasNormalAttack = !(hasStabAttack || hasSlashAttack);
        const hasToppleAttack = this.weapon.hasWeaponFeature("toppling");
        const hasDisarmAttack = true;
        const hasThrowAttack = this.weapon.hasWeaponFeature("thrown");
        const hasParry = !this.weapon.hasWeaponFeature("noparry");

        let actions = [];

        function pushAction(action) {
            actions.push({
                id: action,
                label: game.i18n.localize("DoD.attackTypes." + action),
                tooltip: game.i18n.localize("DoD.attackTypes." + action + "Tooltip")
            });
        }

        if(isRangedWeapon) {
            pushAction("ranged");
        }
        if(hasNormalAttack && !isRangedWeapon) {
            pushAction("normal");
        }
        if(hasSlashAttack && !isRangedWeapon) {
            pushAction("slash");
        }
        if(hasStabAttack && !isRangedWeapon) {
            pushAction("stab");
        }
        if(hasWeakpointAttack && !isRangedWeapon) {
            pushAction("weakpoint");
        }
        if(hasToppleAttack && !isRangedWeapon) {
            pushAction("topple");
        }
        if(hasDisarmAttack && !isRangedWeapon) {
            pushAction("disarm");
        }        
        if(hasThrowAttack && !isRangedWeapon) {
            pushAction("throw");
        }        
        if(hasParry && !isRangedWeapon) {
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
        let options = {cancelled: true};

        if (this.weapon.system.broken) {
            options = await new Promise(
                resolve => {
                    const data = {
                        title: game.i18n.localize("DoD.ui.dialog.brokenWeaponTitle"),
                        content: game.i18n.localize("DoD.ui.dialog.brokenWeaponContent"),
                        buttons: {
                            ok: {
                                icon: '<i class="fas fa-check"></i>',
                                label: game.i18n.localize("DoD.ui.dialog.performAction"),
                                callback: () => {
                                    resolve(this.getRollOptionsFromDialog(title, label));              
                                }
                            }                            ,
                            cancel: {
                                icon: '<i class="fas fa-times"></i>',
                                label: game.i18n.localize("DoD.ui.dialog.cancelAction"),
                                callback: html => resolve({cancelled: true})
                            }
                        },
                        default: "cancel",
                        close: () => resolve({cancelled: true})
                    };
                    new Dialog(data, null).render(true);
                }
            );
        } else {
            options = await this.getRollOptionsFromDialog(title, label);
        }
        return options;
    }

    formatRollMessage(postRollData) {
        let result = this.formatRollResult(postRollData);
        let locString = this.postRollData.targetActor ? "DoD.roll.weaponRollTarget" : "DoD.roll.weaponRoll";
        let label = game.i18n.format(game.i18n.localize(locString), 
            {
                action: game.i18n.localize("DoD.attackTypes." + postRollData.action),
                skill: postRollData.weapon.name, 
                result: result,
                target: this.postRollData.targetActor?.isToken ? this.postRollData.targetActor.token.name : this.postRollData.targetActor?.name
            }
        );

        if (postRollData.action == "parry" && postRollData.success) {
            if (postRollData.weapon.hasWeaponFeature("shield")) {
                label += game.i18n.format("DoD.roll.parryShield", {durability: postRollData.weapon.system.durability});
            } else {
                label += game.i18n.format("DoD.roll.parryWeapon", {durability: postRollData.weapon.system.durability});
            }
        }

        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: postRollData.actor }),
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
            options.banes.push(game.i18n.localize("DoD.attackTypes.weakpoint"));
        }

        // Process extra damage
        elements = form.getElementsByClassName("extra-damage");
        element = elements ? elements[0] : null;
        if (element && element.value.length > 0) {
            if (element.validity.valid) {
                options.extraDamage = element.value;
            } else {
                DoD_Utility.WARNING("DoD.WARNING.cannotEvaluateFormula");
            }
        }       

        // Process enchanted weapon
        elements = form.getElementsByClassName("enchanted-weapon");
        element = elements ? elements[0] : null;
        if (element) {
            const value = Number(element.value);
            if (value > 0) {
                options.enchantedWeapon = value;
            }
        }       


        return options;
    }

    updatePreRollData() {
        super.updatePreRollData();
        this.preRollData.weapon = this.weapon;
        this.preRollData.action = this.options.action ?? this.dialogData.actions[0].id;
        this.preRollData.extraDamage = this.options.extraDamage;
        this.preRollData.extraDragons = this.options.enchantedWeapon ?? 0;
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
                    this.postRollData.damageType = DoD.damageTypes.bludgeoning;
                    this.postRollData.isDamaging = true;
                    break;
                }

            case "throw":
            case "ranged":
                this.postRollData.isRanged = true;
                if (this.postRollData.weapon.hasWeaponFeature("piercing")) {
                    this.postRollData.damageType = DoD.damageTypes.piercing;
                    this.postRollData.isDamaging = true;
                    break;
                }
                if (this.postRollData.weapon.hasWeaponFeature("bludgeoning")) {
                    this.postRollData.damageType = DoD.damageTypes.bludgeoning;
                    this.postRollData.isDamaging = true;
                    break;
                }

            default:
                this.postRollData.damageType = DoD.damageTypes.none;
                this.postRollData.isDamaging = true;
        }

        if (this.postRollData.isDemon) {
            if (this.postRollData.isRanged) {
                this.postRollData.isRangedMishap = true;
                const table = DoD_Utility.findSystemTable("rangedMishapTable", game.i18n.localize("DoD.tables.mishapRanged"));
                if (table) {
                    this.postRollData.rangedMishapTable = "@Table[" + table.uuid + "]{" + table.name + "}";
                } else {
                    DoD_Utility.WARNING(game.i18n.localize("DoD.WARNING.noRangedMishapTable"));
                }
            } else {
                this.postRollData.isMeleeMishap = true;
                const table = DoD_Utility.findSystemTable("meleeMishapTable", game.i18n.localize("DoD.tables.mishapMelee"));
                if (table) {
                    this.postRollData.meleeMishapTable = "@Table[" + table.uuid + "]{" + table.name + "}";
                } else {
                    DoD_Utility.WARNING(game.i18n.localize("DoD.WARNING.noMeleeMishapTable"));
                }
            }
        }

        if (this.postRollData.isDragon && this.postRollData.action != "parry") {
            this.postRollData.isMeleeCrit = true;
            this.postRollData.meleeCritGroup = "critChoice"
            this.postRollData.critChoices = {};            

            // populate crit choices
            if (this.postRollData.isDamaging) {
                this.postRollData.critChoices.doubleWeaponDamage = game.i18n.localize("DoD.critChoices.doubleWeaponDamage");
            }
            if (!this.postRollData.isRanged) {
                this.postRollData.critChoices.extraAttack = game.i18n.localize("DoD.critChoices.extraAttack");
            }
            if (this.postRollData.damageType == DoD.damageTypes.piercing && this.postRollData.action != "weakpoint") {
                this.postRollData.critChoices.ignoreArmor = game.i18n.localize("DoD.critChoices.ignoreArmor");
            }

            // set default choice
            if (this.postRollData.critChoices.doubleWeaponDamage) {
                this.postRollData.critChoice = "doubleWeaponDamage";
            } else {
                this.postRollData.critChoice = "extraAttack";
            }
        }
    }
}