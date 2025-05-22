import DoDSkillTest from "./skill-test.js";
import DoD_Utility from "../utility.js";

export default class DoDWeaponTest extends DoDSkillTest  {

    constructor(actor, weapon, options) {
        super(actor, actor.findSkill(weapon.system.skill?.name), options);
        this.weapon = weapon;
    }

    async updateDialogData() {
        super.updateDialogData();

        const isThrownWeapon = this.weapon.hasWeaponFeature("thrown");
        const isRangedWeapon = !isThrownWeapon && this.weapon.system.calculatedRange >= 10;
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
        if (actorToken && targetToken) {
            if (game.release.generation < 12) {
                distance = canvas.grid.measureDistance(actorToken, targetToken, {gridSpaces: true});
            } else {
                distance = canvas.grid.measurePath([actorToken, targetToken]).distance;
            }
        }
        //const isInRange = distance <= this.weapon.system.calculatedRange;
        const isInMeleeRange = distance <= (isMeleeWeapon ? this.weapon.system.calculatedRange : (isLongWeapon ? 4 : 2));

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
        if(isThrownWeapon && !isRangedWeapon) {
            pushAction("throw");
        }
        if(hasParry && !isRangedWeapon) {
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
        const isMeleeAttack = isMeleeWeapon || isThrownWeapon && isInMeleeRange;
        if (isMeleeAttack && targetToken && actorToken) {
            if (targetToken.hasStatusEffect("prone") && !actorToken.hasStatusEffect("prone")) {
                this.dialogData.boons.push({source: game.i18n.localize("EFFECT.StatusProne"), value: true});
                this.dialogData.extraDamage = "D6";
            }
        }
        if(isRangedWeapon && targetToken && actorToken){

            if(distance <= 2){
                this.dialogData.banes.push({source: game.i18n.localize("DoD.effect.pointBlank"), value: true});
               
            }
            const itemRange = Number(this.weapon.system.range )

            if(itemRange < distance && distance  <= 2*itemRange ){
                 this.dialogData.banes.push({source: game.i18n.localize("DoD.effect.exceedWeaponRange"), value: true});
                
            }
              if(distance  > 2*itemRange ){
                 DoD_Utility.WARNING("DoD.effect.exceedWeaponRange");
                 this.dialogData.banes.push({source: game.i18n.localize("DoD.effect.exceedWeaponRange"), value: true});
               
            }
           const isTokenOnWhey =await this.chekTokenOnPath(actorToken, targetToken);
           if(isTokenOnWhey){
            this.dialogData.banes.push({source: game.i18n.localize("DoD.effect.anotherTokenOnLineofShot"), value: true});
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
    async chekTokenOnPath(actorToken, targetToken){
        let actorCoordinate = {}, targetCoordinate = {};
         if(game.release.generation < 13){
            actorCoordinate = {x:actorToken.x+actorToken._object.hitArea.center.x, y:actorToken.y+actorToken._object.hitArea.center.y};
            targetCoordinate = {x:targetToken.x+targetToken._object.hitArea.center.x, y:targetToken.y+targetToken._object.hitArea.center.y};
         }
         else{
            actorCoordinate = actorToken._object.center;
            targetCoordinate = targetToken._object.center;
         }
        const tokensOnCanva = game.canvas.tokens.objects.children.filter(token => token.id !== actorToken.id && token.id !== targetToken.id && token.document.hidden !== true);
        let point1 ={}, point2 ={}, point3={}, point4 ={}
        const isOnPath = tokensOnCanva.some(token => {
            if(game.release.generation < 13){
                point1 = {x:token.x, y:token.y};
                point2 = {x:token.x + token.hitArea.rightEdge.A.x, y: token.y};
                point3 = {x:token.x + token.hitArea.rightEdge.B.x, y: token.y+token.hitArea.rightEdge.B.y};
                point4 = {x:token.x, y:token.y + token.hitArea.leftEdge.A.y};
            }
            else{
                point1 = {x:token.x + token.hitArea.points[0], y:token.y + token.hitArea.points[1]}
                point2 = {x:token.x + token.hitArea.points[2], y:token.y + token.hitArea.points[3]}
                point3 = {x:token.x + token.hitArea.points[4], y:token.y + token.hitArea.points[5]}
                point4 = {x:token.x + token.hitArea.points[6], y:token.y +token.hitArea.points[7]}
            }
            const intersection1 = foundry.utils.lineSegmentIntersection(actorCoordinate,targetCoordinate,point1,point2)
            const intersection2 = foundry.utils.lineSegmentIntersection(actorCoordinate,targetCoordinate,point2,point3)
            const intersection3 = foundry.utils.lineSegmentIntersection(actorCoordinate,targetCoordinate,point3,point4)
            const intersection4 = foundry.utils.lineSegmentIntersection(actorCoordinate,targetCoordinate,point4,point1)
            const intersections = [intersection1, intersection2, intersection3, intersection4];          
            const hitPoints = [point1, point2, point3,point4]
            const nonNullIntersections = intersections.filter(i => i !== null);
            const cornerMatches = nonNullIntersections.filter(intersection =>
                hitPoints.some(pt => pt.x === intersection.x && pt.y === intersection.y)
            );

            let validIntersections = false;

            if (nonNullIntersections.length >= 2) {
                const cornerCount = cornerMatches.length;

                if (cornerCount === 0 || cornerCount > 2) {

                    validIntersections = true;
                }
            }
            return validIntersections
        });
        return isOnPath
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
                                callback: _html => resolve({cancelled: true})
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
        let weapon = postRollData.weapon.name;

        // Add durability info to message
        if (postRollData.action === "parry" && postRollData.success) {
            const durability = this.postRollData.weapon.system.durability ?? 0;
            weapon += `<span class="permission-observer" data-actor-id="${this.postRollData.actor.uuid}" style="font-weight:normal;"> (${game.i18n.localize("DoD.weapon.durability")} ${durability})</span>`;
        }

        let label = game.i18n.format(game.i18n.localize(locString),
            {
                action: game.i18n.localize("DoD.attackTypes." + postRollData.action),
                skill: weapon,
                result: result,
                target: this.postRollData.targetActor?.isToken ? this.postRollData.targetActor.token.name : this.postRollData.targetActor?.name
            }
        );

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


