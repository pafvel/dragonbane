import DoDSkillTest from "./skill-test.js";
import DoD_Utility from "../utility.js";
import DoDOptionalRuleSettings from "../apps/optional-rule-settings.js";
import DoDWeaponTestMessageData from "../data/messages/weapon-test-message.js";

export default class DoDWeaponTest extends DoDSkillTest  {

    constructor(actor, weapon, options) {
        super(actor, actor.findSkill(weapon.system.skill?.name), options);
        this.weapon = weapon;
    }

    updateDialogData() {
        super.updateDialogData();

        const useDamageTypes = DoDOptionalRuleSettings.damageTypes;
        const isThrownWeapon = this.weapon.hasWeaponFeature("thrown");
        const isRangedWeapon = !isThrownWeapon && this.weapon.isRangedWeapon;
        const isMeleeWeapon = !isThrownWeapon && !isRangedWeapon;
        const hasMeleeAttack = isMeleeWeapon || isThrownWeapon;
        const isLongWeapon = this.weapon.hasWeaponFeature("long");
        const hasSlashAttack = this.weapon.hasWeaponFeature("slashing") && useDamageTypes;
        const hasStabAttack = this.weapon.hasWeaponFeature("piercing")  && useDamageTypes;
        const hasWeakpointAttack = hasStabAttack;
        const hasNormalAttack = this.weapon.hasWeaponFeature("bludgeoning") || !(hasStabAttack || hasSlashAttack);
        const hasToppleAttack = true;
        const hasDisarmAttack = true;
        const hasParry = !this.weapon.hasWeaponFeature("noparry");
        const isShield = this.weapon.hasWeaponFeature("shield");
        const actorToken = canvas.scene?.tokens?.find(t => t.actor?.uuid === this.actor.uuid);
        const targetToken = this.options.targets?.length > 0 ? this.options.targets[0].document : null;

        //
        // Calculate ranges
        //
        let distance = 0;
        let isInMeleeRange = true;

        if (actorToken && targetToken) {

            // Calculate separation between actor and target tokens
            distance = DoD_Utility.calculateDistanceBetweenTokens(actorToken, targetToken);

            // Determine available attack types based on range and weapon
            isInMeleeRange = distance <= (isMeleeWeapon ? this.weapon.calculateRange() : (isLongWeapon ? 4 : 2));
        }

        //
        // Determine available actions
        //
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
        if(hasMeleeAttack && hasNormalAttack) {
            pushAction("normal");
        }
        if(hasMeleeAttack && hasSlashAttack) {
            pushAction("slash");
        }
        if(hasMeleeAttack && hasStabAttack) {
            pushAction("stab");
        }
        if(hasMeleeAttack && hasWeakpointAttack) {
            pushAction("weakpoint");
        }
        if(hasMeleeAttack && hasToppleAttack) {
            pushAction("topple");
        }
        if(hasMeleeAttack && hasDisarmAttack) {
            pushAction("disarm");
        }
        if(isThrownWeapon) {
            pushAction("throw");
        }
        if(hasMeleeAttack && hasParry) {
            pushAction("parry");
        }

        //
        // Set default action
        //
        if (actions.length > 0) {
            let defaultIndex = 0;
            if (isShield) {
                // Default action for shields is parry
                defaultIndex = actions.findIndex(a => a.id === "parry");
            } else if (isThrownWeapon && !isInMeleeRange) {
                // Default action for thrown weapons at range is throw
                defaultIndex = actions.findIndex(a => a.id === "throw");
            }
            if (defaultIndex < 0) defaultIndex = 0;
            actions[defaultIndex].checked = true;
        }

        this.dialogData.actions = actions;

        //
        // Automatic banes and boons
        //

        // Bane if weapon is broken
        if (this.weapon.system.broken) {
            this.dialogData.banes.push({source: game.i18n.localize("DoD.weapon.broken"), value: true});       
        }

        // Bane for strength below weapon requirement
        if (this.actor.type === "character" && this.weapon.requiredStr > this.actor.system.attributes.str.value) {
            this.dialogData.banes.push({source: game.i18n.localize("DoD.weapon.belowRequiredStr"), value: true});
        }

        if (actorToken && targetToken) {

            // Boon and extra damage on melee attack on prone target
            if (hasMeleeAttack && isInMeleeRange) {
                if (targetToken.hasStatusEffect("prone") && !actorToken.hasStatusEffect("prone")) {
                    this.dialogData.boons.push({source: game.i18n.localize("EFFECT.StatusProne"), value: true});
                    this.dialogData.extraDamage = "D6";
                }
            }
            // Bane on ranged attacks at point blank
            if (isRangedWeapon && distance <= 2) {
                this.dialogData.banes.push({source: game.i18n.localize("DoD.weapon.pointBlank"), value: true});
            }
            // Bane on ranged attacks at more than max range
            if ((isRangedWeapon || isThrownWeapon) && distance > this.weapon.calculateRange()) {
                this.dialogData.banes.push({source: game.i18n.localize("DoD.weapon.longRange"), value: true});
            }
            // Bane if walls or tokens obstruct line of sight
            if ((isRangedWeapon || isThrownWeapon && !isInMeleeRange)) {

                const origin = actorToken.object.bounds.center;
                const destination = targetToken.object.bounds.center;

                // Check walls
                const sightBackend = CONFIG.Canvas.polygonBackends["sight"];
                const blockedByWall = sightBackend.testCollision(origin, destination, { mode: "any", type: "sight" });
                if (blockedByWall) {
                    this.dialogData.banes.push({source: game.i18n.localize("DoD.weapon.lineOfSightWall"), value: true});
                }

                // Check tokens
                const ray = new foundry.canvas.geometry.Ray(origin, destination);
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
        }

        //
        // Enchanted weapons
        //
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
            const confirmAction = await foundry.applications.api.DialogV2.confirm({
                window:  { title: game.i18n.localize("DoD.ui.dialog.brokenWeaponTitle") },
                content: game.i18n.localize("DoD.ui.dialog.brokenWeaponContent"),
                yes: { label: game.i18n.localize("DoD.ui.dialog.performAction") },
                no:  { label: game.i18n.localize("DoD.ui.dialog.cancelAction") }
            });            
            if (!confirmAction) return { cancelled: true };
        }
        // User may cancel if the distance to target is greater than 2x max range
        if (this.weapon.isRangedWeapon || this.weapon.hasWeaponFeature("thrown"))
        {
            const actorToken = canvas.scene?.tokens?.find(t => t.actor?.uuid === this.actor.uuid);
            const targetToken = this.options.targets?.length > 0 ? this.options.targets[0].document : null;
            let distance = 0;
            if (actorToken && targetToken) {
                distance = canvas.grid.measurePath([actorToken, targetToken]).distance;
            }

            if (distance > 2 * this.weapon.calculateRange()) {
                const confirmRangedAction = await foundry.applications.api.DialogV2.confirm({
                    window:  { title: game.i18n.localize("DoD.ui.dialog.longRangeTitle") },
                    content: game.i18n.localize("DoD.ui.dialog.longRangeContent"),
                    yes: { label: game.i18n.localize("DoD.ui.dialog.performAction") },
                    no:  { label: game.i18n.localize("DoD.ui.dialog.cancelAction") }
                });            
                if (!confirmRangedAction) return { cancelled: true };
            }
        }
        // Finally, ask for the actual roll options
        return this.getRollOptionsFromDialog(title, label);       
    }

    async createMessageData() {
        const model = DoDWeaponTestMessageData.fromContext(this.postRollData);
        return await model.createMessageData(this.roll);
    }

    processDialogOptions(input) {
        const options = super.processDialogOptions(input);

        // Process inputs
        const action = String(input.action);
        const extraDamage = String(input.extraDamage).trim();
        const enchantedWeapon = Number(input.enchantedWeapon);

        // Add automatic banes and boons
        if (action === "weakpoint") {
            options.banes.push(game.i18n.localize("DoD.attackTypes.weakpoint"));
        }
        if (action === "topple" && this.weapon.hasWeaponFeature("toppling")) {
            options.boons.push(game.i18n.localize("DoD.attackTypes.topple"));
        }

        // TODO: Validate extra damage formula
    
        return { ...options, action, extraDamage, enchantedWeapon };
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
                } else {
                    this.postRollData.damageType = DoD.damageTypes.none;
                }
                this.postRollData.isDamaging = true;
                break;

            case "throw":
            case "ranged":
                this.postRollData.isRanged = true;
                if (this.postRollData.weapon.hasWeaponFeature("piercing")) {
                    this.postRollData.damageType = DoD.damageTypes.piercing;
                } else if (this.postRollData.weapon.hasWeaponFeature("bludgeoning")) {
                    this.postRollData.damageType = DoD.damageTypes.bludgeoning;
                } else if (this.postRollData.weapon.hasWeaponFeature("slashing")) {
                    this.postRollData.damageType = DoD.damageTypes.slashing;
                } else {
                    this.postRollData.damageType = DoD.damageTypes.none;
                }
                this.postRollData.isDamaging = true;
                break;

            default:
                this.postRollData.damageType = DoD.damageTypes.none;
                this.postRollData.isDamaging = true;
        }

        if (DoDOptionalRuleSettings.damageTypes === false) {
            this.postRollData.damageType = DoD.damageTypes.none;
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