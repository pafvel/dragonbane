import DoD_Utility from "./utility.js";
import DoDAttributeTest from "./tests/attribute-test.js";
import DoDSkillTest from "./tests/skill-test.js";
import DoDWeaponTest from "./tests/weapon-test.js";
import DoDSpellTest from "./tests/spell-test.js";
import { DoD } from "./config.js";

export function addChatListeners(app, html, data) {
    html.on("click", ".inline-damage-roll", onInlineDamageRoll);
    html.on("click", "button.weapon-roll", onWeaponDamageRoll);
    html.on("click", "button.magic-roll", onMagicDamageRoll);
    html.on("click", "button.push-roll", onPushRoll);

    html.on('click contextmenu', '.table-roll', DoD_Utility.handleTableRoll.bind(DoD_Utility));
}

export function addChatMessageContextMenuOptions(html, options) {

    const canDealTargetDamage = li =>
    {
        const element = li.find(".damage-roll")[0];
        if (element?.dataset.targetId) {
            const target = DoD_Utility.getActorFromUUID(element.dataset.targetId);
            return target?.isOwner;
        }
        return false;
    }

    const dealTargetDamage = function(li, multiplier = 1) {
        const damageData = {};
        const element = li.find(".damage-roll")[0];

        damageData.damage = element.dataset.damage;
        damageData.damageType = element.dataset.damageType.substr(String("DoD.damageTypes.").length);
        damageData.actor = DoD_Utility.getActorFromUUID(element.dataset.targetId);
        damageData.multiplier = multiplier;
        damageData.ignoreArmor = element.dataset.ignoreArmor;

        if (damageData.actor.isOwner) {
            applyDamageMessage(damageData);
        } else {
            DoD_Utility.WARNING("DoD.WARNING.noPermissionToModifyActor");
        }
    }

    const canDealSelectedDamage = li =>
    {
        if(li.find(".damage-roll")[0]?.dataset.targetId) {
            return false;
        }
        if (canvas.tokens.controlled.length > 0 && li.find(".damage-roll").length > 0) {
            for (const token of canvas.tokens.controlled) {
                if (!token.isOwner) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    const dealSelectedDamage = function(li, multiplier = 1) {
        const damageData = {};
        const element = li.find(".damage-roll")[0];

        damageData.damage = element.dataset.damage;
        damageData.damageType = element.dataset.damageType.substr(String("DoD.damageTypes.").length);
        damageData.actor = canvas.tokens.controlled[0].actor;
        damageData.multiplier = multiplier;
        damageData.ignoreArmor = element.dataset.ignoreArmor;

        const targets = canvas.tokens.controlled;
        for (const target of targets) {
            if (target.actor.isOwner) {
                damageData.actor = target.actor;              
                applyDamageMessage(damageData);
            } else {
                DoD_Utility.WARNING("DoD.WARNING.noPermissionToModifyActor");
            }
        }
    }

    options.push(
        {
            name: game.i18n.format("DoD.ui.chat.dealDamage"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canDealTargetDamage,
            callback: li => dealTargetDamage(li)
        },
        {
            name: game.i18n.format("DoD.ui.chat.dealHalfDamage"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canDealTargetDamage,
            callback: li => dealTargetDamage(li, 0.5)
        },
        {
            name: game.i18n.format("DoD.ui.chat.dealDoubleDamage"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canDealTargetDamage,
            callback: li => dealTargetDamage(li, 2)
        },
        {
            name: game.i18n.format("DoD.ui.chat.dealSelectedDamage"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canDealSelectedDamage,
            callback: li => dealSelectedDamage(li)
        },
        {
            name: game.i18n.format("DoD.ui.chat.dealSelectedHalfDamage"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canDealSelectedDamage,
            callback: li => dealSelectedDamage(li, 0.5)
        },
        {
            name: game.i18n.format("DoD.ui.chat.dealSelectedDoubleDamage"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canDealSelectedDamage,
            callback: li => dealSelectedDamage(li, 2)
        }
    );
}

async function onInlineDamageRoll(event) {
    event.stopPropagation();
    event.preventDefault();

    const element = event.currentTarget;
    const actorId = element.dataset.actorId;
    const actor = actorId ? DoD_Utility.getActorFromUUID(actorId) : null;
    const damageType = element.dataset.damageType;
    const damage = element.dataset.damage;
    const action = element.dataset.action;
    let damageData = {
        actor: actor,
        action: action,
        damage: damage,
        damageType: damageType
    };
    
    const targets = Array.from(game.user.targets)
    if (targets.length > 0) {
        for (const target of targets) {
            damageData.target = target.actor;
            await inflictDamageMessage(damageData);    
        }
     } else {
        await inflictDamageMessage(damageData);    
    }
}

async function onWeaponDamageRoll(event) {
    const element = event.currentTarget;
    const actorId = element.dataset.actorId;
    const actor = DoD_Utility.getActorFromUUID(actorId);
    if (!actor) return;    
    
    const weaponId = element.dataset.weaponId;
    const damageType = element.dataset.damageType;
    const ignoreArmor = element.dataset.ignoreArmor;
    const weapon = actor.items.get(weaponId);
    const weaponDamage = weapon ? weapon.system.damage : null;
    const skill = weapon ? actor.findSkill(weapon.system.skill.name) : null;
    const attribute = skill ? skill.system.attribute : null;
    const damageBonus = attribute ? actor.system.damageBonus[attribute] : 0;
    const damage = weaponDamage ? weaponDamage + "+" + damageBonus : 0;
    let target = element.dataset.targetId ? DoD_Utility.getActorFromUUID(element.dataset.targetId) : null;


    const damageData = {
        actor: actor,
        weapon: weapon,
        damage: damage,
        damageType: damageType,
        ignoreArmor: ignoreArmor,
        target: target
    };
 
    if (element.dataset.isMeleeCrit) {
        const parent = element.parentElement;
        const critChoices = parent.getElementsByTagName("input");
        const choice = Array.from(critChoices).find(e => e.name=="critChoice" && e.checked);

        damageData[choice.value] = true;

        ChatMessage.create({
            content: game.i18n.localize("DoD.critChoices.choiceLabel") + ": "+ game.i18n.localize("DoD.critChoices." + choice.value),
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: damageData.actor }),
        });
    }

    if (!target) {
        const targets = Array.from(game.user.targets)
        if (targets.length > 0) {
            for (const target of targets) {
                damageData.target = target.actor;
                await inflictDamageMessage(damageData);    
            }
            return;
        }
    }
    inflictDamageMessage(damageData);    
}

async function onMagicDamageRoll(event) {
    const element = event.currentTarget;
    const actorId = element.dataset.actorId;
    const actor = DoD_Utility.getActorFromUUID(actorId);
    if (!actor) return;

    const spellId = element.dataset.spellId;
    const spell = spellId ? actor.items.get(spellId) : null;
    const powerLevel = Number(element.dataset.powerLevel);
    const isMagicCrit = element.dataset.isMagicCrit;
    let doubleDamage = false;

    if (isMagicCrit) {
    
        const parent = element.parentElement;
        const critChoices = parent.getElementsByTagName("input");
        const choice = Array.from(critChoices).find(e => e.name=="magicCritChoice" && e.checked);

        ChatMessage.create({
            content: game.i18n.localize("DoD.magicCritChoices.choiceLabel") + ": "+ game.i18n.localize("DoD.magicCritChoices." + choice.value),
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
        });

        if (choice.value == "noCost") {
            const wpCost = Number(element.dataset.wpCost);
            const wpNew = Math.min(actor.system.willPoints.max, actor.system.willPoints.value + wpCost);
            await actor.update({ ["system.willPoints.value"]: wpNew});
        }
        if (choice.value == "doubleDamage") {
            doubleDamage = true;
        }
    }

    if (spell?.isDamaging) {

        let damage = spell.system.damage;
        if (powerLevel > 1 && spell.system.damagePerPowerlevel.length > 0) {
            for (let i = 1; i < powerLevel; ++i) {
                if (damage.length > 0) {
                    damage += " + ";
                }
                damage += spell.system.damagePerPowerlevel;
            }
        }

        const target = element.dataset.targetId ? DoD_Utility.getActorFromUUID(element.dataset.targetId) : null;

        const damageData = {
            actor: actor,
            weapon: spell,
            damage: damage,
            damageType: DoD.damageTypes.none,
            doubleSpellDamage: doubleDamage,
            target: target
        };

        if (!target) {
            const targets = Array.from(game.user.targets)
            if (targets.length > 0) {
                for (const target of targets) {
                    damageData.target = target.actor;
                    await inflictDamageMessage(damageData);    
                }
                return;
            }
        }    
        inflictDamageMessage(damageData);    
    }
}

function onPushRoll(event) {
    console.log("onPushRoll");
    const element = event.currentTarget;
    const actorId = element.dataset.actorId;
    const actor = DoD_Utility.getActorFromUUID(actorId);
    if (!actor) return;    

    // Take condition
    const parent = element.parentElement;
    const pushChoices = parent.getElementsByTagName("input");
    const choice = Array.from(pushChoices).find(e => e.name=="pushRollChoice" && e.checked);
    if (!actor.hasCondition(choice.value)) {
        actor.updateCondition(choice.value, true);
        const msg = game.i18n.format("DoD.ui.chat.takeCondition", 
            {
                actor: actor.name,
                condition: game.i18n.localize("DoD.conditions." + choice.value)
            });
        ChatMessage.create({ 
            content: msg,
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: actor })
        });
    } else {
        DoD_Utility.WARNING("DoD.WARNING.conditionAlreadyTaken");
        return;
    }

    // Re-roll
    const options = {
        actorId: element.dataset.actorId,
        attribute: element.dataset.attribute,
        formula: element.dataset.formula,
        canPush: false,
        skipDialog: true
    }
    let test = null;
    switch (element.dataset.rollType) {
        case "DoDAttributeTest":
            test = new DoDAttributeTest(actor, options.attribute, options);
            break;
        case "DoDSkillTest":
            options.skill = actor.findSkill(element.dataset.skillName)
            test = new DoDSkillTest(actor, options.skill, options);
            break;
        case "DoDWeaponTest":
            options.action = element.dataset.action;
            options.weapon = fromUuidSync(element.dataset.weaponId);
            test = new DoDWeaponTest(actor, options.weapon, options);
            break;
        case "DoDSpellTest":
            options.spell = actor.findSpell(element.dataset.spellName);
            options.powerLevel = element.dataset.powerLevel;
            options.wpCost = 0;
            test = new DoDSpellTest(actor, options.spell, options);
            break;
        default:
            return;
    }
    test?.roll();
}

export async function inflictDamageMessage(damageData) {
  
    // Add "1" in front of D to make sure the first roll term is a Die.
    let formula = damageData.damage;
    if (formula[0] == "d" || formula[0] == "D") {
        formula = "1" + formula;
    }

    const roll = new Roll(formula);

    if (damageData.doubleWeaponDamage && roll.terms.length > 0) {
        let term = roll.terms[0];
        if (term instanceof Die) {
            term.number *= 2;
        }
    }

    await roll.roll({async: true});

    const weaponName = damageData.weapon?.name ?? damageData.action;
    let msg = weaponName ? (damageData.ignoreArmor ? "DoD.roll.damageIgnoreArmor" : "DoD.roll.damageWeapon") : "DoD.roll.damage";
    if (damageData.target) {
        msg += "Target";
    }
    const actorName = damageData.actor ? (damageData.actor.isToken ? damageData.actor.token.name : damageData.actor.name) : "";
    const targetName = damageData.target ? (damageData.target.isToken ? damageData.target.token.name : damageData.target.name) : "";

    const flavor = game.i18n.format(game.i18n.localize(msg), {
        actor: actorName,
        damage: damageData.doubleSpellDamage ? 2 * roll.total : roll.total,
        damageType: game.i18n.localize(damageData.damageType),
        weapon: weaponName,
        target: targetName
    });
    
    const template = "systems/dragonbane/templates/partials/damage-roll-message.hbs";
    const templateContext = {
        formula: roll.formula,
        user: game.user.id,
        tooltip: await roll.getTooltip(),
        total: Math.round(roll.total * 100) / 100,
        damageType: damageData.damageType,
        ignoreArmor: damageData.ignoreArmor,
        target: damageData.target
    };
    const renderedTemplate = await renderTemplate(template, templateContext);

    const messageData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: damageData.actor }),
        flavor: flavor,
        content: renderedTemplate
    };
    roll.toMessage(messageData);
}

export async function applyDamageMessage(damageData) {

    const actor = damageData.actor;
    const damage = damageData.damage;
    const damageType = damageData.damageType;
    const multiplier = damageData.multiplier;
    const ignoreArmor = damageData.ignoreArmor;

    const armorValue = ignoreArmor ? 0 : actor.getArmorValue(damageType);
    const damageToApply = Math.max(0, Math.floor((damage - armorValue) * multiplier));
    if (damageToApply > 0) {
        actor.applyDamage(damageToApply);
    }
    
    const actorName = actor.isToken ? actor.token.name : actor.name;
    const damageMessage = game.i18n.format(game.i18n.localize("DoD.ui.chat.damageApplied"), {damage: damageToApply, actor: actorName});
    const damageDetails = game.i18n.format(game.i18n.localize("DoD.ui.chat.damageAppliedDetails"), {damage: damage, armor: armorValue});
    let msg = damageMessage + "<br/><br/>" + damageDetails;
    if (multiplier != 1) {
        msg += "<br>" + game.i18n.format(game.i18n.localize("DoD.ui.chat.damageAppliedMultiplier"), {multiplier: multiplier});
    }
    ChatMessage.create({ content: msg });
}