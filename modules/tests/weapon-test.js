import DoDSkillTest from "./skill-test.js";
import DoD_Utility from "../utility.js";

export default class DoDWeaponTest extends DoDSkillTest  {

    constructor(actor, weapon, options) {
        super(actor, actor.findSkill(weapon.system.skill?.name), options);
        this.weapon = weapon;
    }

    updateDialogData() {
        super.updateDialogData();

        const isThrownWeapon = this.weapon.hasWeaponFeature("thrown");
        const isRangedWeapon = !isThrownWeapon && this.weapon.isRangedWeapon;
        const isMeleeWeapon = !isThrownWeapon && !isRangedWeapon;
        const isLongWeapon = this.weapon.hasWeaponFeature("long");
        const hasSlashAttack = this.weapon.hasWeaponFeature("slashing");
        const hasStabAttack = this.weapon.hasWeaponFeature("piercing");
        const hasWeakpointAttack = hasStabAttack;
        const hasNormalAttack = this.weapon.hasWeaponFeature("bludgeoning") || !(hasStabAttack || hasSlashAttack);
        const hasToppleAttack = true; //this.weapon.hasWeaponFeature("toppling");
        const hasDisarmAttack = true;
        const hasParry = !this.weapon.hasWeaponFeature("noparry");
        const isShield = this.weapon.hasWeaponFeature("shield");

        let actions = [];

        function pushAction(action) {
            actions.push({
                id: action,
                label: game.i18n.localize("DoD.attackTypes." + action),
                tooltip: game.i18n.localize("DoD.attackTypes." + action + "Tooltip")
            });
        }

        const actorToken = canvas.scene?.tokens?.find(t => t.actor?.uuid === this.actor.uuid);
        const targetToken = this.options.targets?.length > 0 ? this.options.targets[0].document : null;
        let distance = 0;
        let isInMeleeRange = true;
        let isMeleeAttack = isMeleeWeapon || isThrownWeapon;
        let isRangedAttack = isRangedWeapon || isThrownWeapon;
        if (actorToken && targetToken) {
            distance = computeTokenDistance(actorToken, targetToken);
            isInMeleeRange = distance <= (isMeleeWeapon ? this.weapon.system.calculatedRange : (isLongWeapon ? 4 : 2));
            isMeleeAttack = isMeleeWeapon || isThrownWeapon && isInMeleeRange;
            isRangedAttack = !isMeleeAttack;
        }

        if(isRangedWeapon) {
            pushAction("ranged");
        }
        if(isMeleeAttack && hasNormalAttack) {
            pushAction("normal");
        }
        if(isMeleeAttack && hasSlashAttack) {
            pushAction("slash");
        }
        if(isMeleeAttack && hasStabAttack) {
            pushAction("stab");
        }
        if(isMeleeAttack && hasWeakpointAttack) {
            pushAction("weakpoint");
        }
        if(isMeleeAttack && hasToppleAttack) {
            pushAction("topple");
        }
        if(isMeleeAttack && hasDisarmAttack) {
            pushAction("disarm");
        }
        if(isThrownWeapon && isRangedAttack) {
            pushAction("throw");
        }
        if(isMeleeAttack && hasParry) {
            pushAction("parry");
        }

        if (actions.length > 0) {
            if (isShield) {
                // Default action for shields is parry
                actions[actions.length - 1].checked = true;    
            } else {
                actions[0].checked = true;
            }
        }

        if (this.actor.type === "character" && this.weapon.requiredStr > this.actor.system.attributes.str.value) {
            this.dialogData.banes.push({source: game.i18n.localize("DoD.weapon.belowRequiredStr"), value: true});
        }

        // Boon and extra damage on melee attack on prone target
        if (isMeleeAttack && targetToken && actorToken) {
            if (targetToken.hasStatusEffect("prone") && !actorToken.hasStatusEffect("prone")) {
                this.dialogData.boons.push({source: game.i18n.localize("EFFECT.StatusProne"), value: true});
                this.dialogData.extraDamage = "D6";
            }
        }
        // Bane on ranged attacks at point blank
        if (targetToken && isRangedWeapon && distance <= 2) {
            this.dialogData.banes.push({source: game.i18n.localize("DoD.weapon.pointBlank"), value: true});
        }
        // Bane on ranged attacks at more than max range
        if (targetToken && (isRangedWeapon || isThrownWeapon) && distance > this.weapon.system.calculatedRange) {
            this.dialogData.banes.push({source: game.i18n.localize("DoD.weapon.longRange"), value: true});
        }
        // Bane if walls or tokens obstruct line of sight
        if (targetToken && actorToken && isRangedAttack) {

            const origin = actorToken.object.bounds.center;
            const destination = targetToken.object.bounds.center;

            // Check walls
            const sightBackend = CONFIG.Canvas.polygonBackends["sight"];
            const blockedByWall = sightBackend.testCollision(origin, destination, { mode: "any", type: "sight" });
            if (blockedByWall) {
                this.dialogData.banes.push({source: game.i18n.localize("DoD.weapon.lineOfSightWall"), value: true});
            }

            // Check tokens
            const ray = game.release.generation < 13 ? new Ray (origin, destination) : new foundry.canvas.geometry.Ray(origin, destination);
            const potentialBlockers = canvas.tokens.placeables.filter(t => t.id !== targetToken.id && t.id !== actorToken.id && !t.document.hidden);
            const blockers = potentialBlockers.filter(t => {
                const { x, y, width, height } = t.bounds;
                const sides = [
                    [ x,            y,          x + width, y            ], // top
                    [ x + width,    y,          x + width, y + height   ], // right
                    [ x + width,    y + height, x,         y + height   ], // bottom
                    [ x,            y + height, x,         y            ]  // left
                ];
                return sides.some(coords => !!ray.intersectSegment(coords));
            });
            if (blockers.length > 0) {
                const notProne = blockers.some( blocker => !blocker.document.hasStatusEffect("prone") );
                this.dialogData.banes.push({source: game.i18n.localize("DoD.weapon.lineOfSightToken"), value: notProne});
            }
        }

        this.dialogData.actions = actions;

        this.dialogData.enchantedWeapon = 0;
        if (this.weapon.hasWeaponFeature("enchanted1")) {
            this.dialogData.enchantedWeapon = 1;
        }
        if (this.weapon.hasWeaponFeature("enchanted2")) {
            this.dialogData.enchantedWeapon = 2;
        }
        if (this.weapon.hasWeaponFeature("enchanted3")) {
            this.dialogData.enchantedWeapon = 3;
        }
      
        this.dialogData.enchantedWeaponLevels = {"0": "-", "1": 1, "2": 2, "3": 3};
    }   

    async getRollOptionsFromDialog(title, label) {
        if (this.skipDialog) {
            const defaultOptions = {"enchantedWeapon": this.dialogData.enchantedWeapon};
            const options = await super.getRollOptionsFromDialog(title, label);
            return {...defaultOptions, ...options};
        } else {
            return super.getRollOptionsFromDialog(title, label);
        }

    }

    async getRollOptions() {

        let label = game.i18n.localize("DoD.ui.dialog.skillRollLabel");
        let title = game.i18n.localize("DoD.ui.dialog.skillRollTitle") + ": " + this.weapon.name;

        // User may cancel if the weapon is broken
        if (this.weapon.system.broken) {
            const brokenOpts = await new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("DoD.ui.dialog.brokenWeaponTitle"),
                content: game.i18n.localize("DoD.ui.dialog.brokenWeaponContent"),
                buttons: {
                ok: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("DoD.ui.dialog.performAction"),
                    callback: () => resolve({ cancelled: false })
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("DoD.ui.dialog.cancelAction"),
                    callback: () => resolve({ cancelled: true })
                }
                },
                default: "cancel",
                close: () => resolve({ cancelled: true })
            }).render(true);
            });
            if (brokenOpts.cancelled) return { cancelled: true };
        }
        // User may cancel if the distance to target is greater than 2x max range
        if (this.weapon.isRangedWeapon || this.weapon.hasWeaponFeature("thrown"))
        {
            const actorToken = canvas.scene?.tokens?.find(t => t.actor?.uuid === this.actor.uuid);
            const targetToken = this.options.targets?.length > 0 ? this.options.targets[0].document : null;
            let distance = 0;
            if (actorToken && targetToken) {
                distance = computeTokenDistance(actorToken, targetToken);
            }

            if (distance > 2 * this.weapon.system.calculatedRange) {
                const rangedOpts = await new Promise(resolve => {
                new Dialog({
                    title: game.i18n.localize("DoD.ui.dialog.longRangeTitle"),
                    content: game.i18n.localize("DoD.ui.dialog.longRangeContent"),
                    buttons: {
                    ok: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("DoD.ui.dialog.performAction"),
                        callback: () => resolve({ cancelled: false })
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("DoD.ui.dialog.cancelAction"),
                        callback: () => resolve({ cancelled: true })
                    }
                    },
                    default: "cancel",
                    close: () => resolve({ cancelled: true })
                }).render(true);
                });
                if (rangedOpts.cancelled) return { cancelled: true };
            }
        }
        // Finally, ask for the actual roll options
        return this.getRollOptionsFromDialog(title, label);       
    }

    formatRollMessage(postRollData) {
        let result = this.formatRollResult(postRollData);
        let locString = this.postRollData.targetActor ? "DoD.roll.weaponRollTarget" : "DoD.roll.weaponRoll";
        let weapon = postRollData.weapon.name;

        // Add durability info to message
        if (postRollData.action === "parry" && postRollData.success) {
            const durability = this.postRollData.weapon.system.durability ?? 0;
            weapon += `<span class="permission-observer" data-actor-id="${this.postRollData.actor.uuid}" style="font-weight:normal;"> (${game.i18n.localize("DoD.weapon.durability")} ${durability})</span>`;
        }

        let content = game.i18n.format(locString, {
                action: game.i18n.localize("DoD.attackTypes." + postRollData.action),
                skill: weapon,
                weapon: weapon,
                uuid: postRollData.weapon.uuid,
                result: result,
                target: this.postRollData.targetActor?.isToken ? this.postRollData.targetActor.token.name : this.postRollData.targetActor?.name
            }
        );

        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: postRollData.actor }),
            content: "<p>" + content + "</p>"
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
        if (options.action === "weakpoint") {
            options.banes.push(game.i18n.localize("DoD.attackTypes.weakpoint"));
        }

        if (options.action === "topple" && this.weapon.hasWeaponFeature("toppling")) {
            options.boons.push(game.i18n.localize("DoD.attackTypes.topple"));
        }
        ;

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
        const DoD = CONFIG.DoD;

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

        if (this.postRollData.isDragon && this.postRollData.action !== "parry") {
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
            if (this.postRollData.damageType === DoD.damageTypes.piercing && this.postRollData.action !== "weakpoint") {
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

/**
 * Computes the shortest distance in grid units required for one token to enter the bounding box of another, taking token size into consideration.
 * Returns zero if tokens already overlap partially or completely.
 * In game terms this can represent attack distance, where attack is a "step" into the nearest grid cell of the target token.
 * Works only for square grids.
 *
 * @param {foundry.documents.TokenDocument} token1 - First token {x, y, width, height}
 * @param {foundry.documents.TokenDocument} token2 - Second token {x, y, width, height}
 * @returns {number} Distance in grid units
 */
function computeTokenDistance(token1, token2) {
  const r1 = { left: token1.x, right: token1.x + token1.width * canvas.grid.size, top: token1.y, bottom: token1.y + token1.height * canvas.grid.size };
  const r2 = { left: token2.x, right: token2.x + token2.width * canvas.grid.size, top: token2.y, bottom: token2.y + token2.height * canvas.grid.size };

  // Return zero distance for full or partial overlap
  const horizontalOverlap = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
  const verticalOverlap   = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
  if (horizontalOverlap > 0 && verticalOverlap > 0) {
    return 0;
  }

  // Calculate horizontal and vertical distance
  const dx = r1.right < r2.left ? r2.left - r1.right : r1.left - r2.right;
  const dy = r1.bottom < r2.top ? r2.top - r1.bottom : r1.top - r2.bottom;

  // Chebyshev (chess board) distance plus one.
  // Plus one represents the extra step to enter the token space.
  return (Math.max(dx, dy) / canvas.grid.size + 1) * canvas.grid.distance;
}
