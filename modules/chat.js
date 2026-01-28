import DoD_Utility from "./utility.js";
import DoDAttributeTest from "./tests/attribute-test.js";
import DoDSkillTest from "./tests/skill-test.js";
import DoDWeaponTest from "./tests/weapon-test.js";
import DoDSpellTest from "./tests/spell-test.js";
import { DoDActor } from "./actor.js";
import DoDRollDamageMessageData from "./data/messages/roll-damage-message.js";
import { DoD } from "./config.js";

export function addChatListeners(_app, html, _data) {

    DoD_Utility.addHtmlEventListener(html, "click", ".inline-damage-roll", onInlineDamageRoll);   
    DoD_Utility.addHtmlEventListener(html, "click", ".treasure-roll", onTreasureRoll);
    DoD_Utility.addHtmlEventListener(html, "click", "button.weapon-roll", onWeaponDamageRoll);
    DoD_Utility.addHtmlEventListener(html, "click", "button.magic-roll", onMagicDamageRoll);
    DoD_Utility.addHtmlEventListener(html, "click", "button.critical-roll", onCriticalDamageRoll);
    DoD_Utility.addHtmlEventListener(html, "click", "button.push-roll", onPushRoll);
    DoD_Utility.addHtmlEventListener(html, "click", ".damage-details", onExpandableClick);
    DoD_Utility.addHtmlEventListener(html, 'click contextmenu', '.table-roll', DoD_Utility.handleTableRoll.bind(DoD_Utility));

    DoD_Utility.addHtmlEventListener(html, "click", "[data-action='dealDamage']", onDealDamage);
    DoD_Utility.addHtmlEventListener(html, "click", "[data-action='dealDoubleDamage']", onDealDoubleDamage);
    DoD_Utility.addHtmlEventListener(html, "click", "[data-action='dealHalfDamage']", onDealHalfDamage);
    DoD_Utility.addHtmlEventListener(html, "click", "[data-action='dealDamageIgnoreArmor']", onDealDamageIgnoreArmor);
    DoD_Utility.addHtmlEventListener(html, "click", "[data-action='healDamage']", onHealDamage);

    DoD_Utility.addHtmlEventListener(html, "pointerenter",
        "[data-action='dealDamage'], [data-action='dealDoubleDamage'], [data-action='dealHalfDamage'], [data-action='dealDamageIgnoreArmor'], [data-action='healDamage']",
        onEnterDealDamage, { capture: true });
    DoD_Utility.addHtmlEventListener(html, "pointerleave",
        "[data-action='dealDamage'], [data-action='dealDoubleDamage'], [data-action='dealHalfDamage'], [data-action='dealDamageIgnoreArmor'], [data-action='healDamage']",
        onLeaveDealDamage, { capture: true });
}

function onDealDamage(event) {
    const li = event.currentTarget.closest("li");
    dealTargetDamage(li);
}

function onDealDoubleDamage(event) {
    const li = event.currentTarget.closest("li");
    dealTargetDamage(li, 2);
}

function onDealHalfDamage(event) {
    const li = event.currentTarget.closest("li");
    dealTargetDamage(li, 0.5);
}

function onDealDamageIgnoreArmor(event) {
    const li = event.currentTarget.closest("li");
    dealTargetDamage(li, 1, true);
}

function onHealDamage(event) {
    const li = event.currentTarget.closest("li");
    healTarget(li);
}

function onEnterDealDamage(event) {
    const li = event.currentTarget.closest("li");
    const element = li.querySelector(".damage-roll") || li.querySelector(".healing-roll");
    const actor = getTarget(element);
    const token = actor?.token?.object;
    token?._onHoverIn(event, { hoverOutOthers: true });
}

function onLeaveDealDamage(event) {
    const li = event.currentTarget.closest("li");
    const element = li.querySelector(".damage-roll") || li.querySelector(".healing-roll");
    const actor = getTarget(element);
    const token = actor?.token?.object;
    token?._onHoverOut(event);
}

function messageFromElement(element) {
    const messageId = element.closest(".chat-message")?.dataset.messageId;
    return game.messages.get(messageId);
}

function getTarget(element) {
    let target = null;
    if (element) {
        // Get target from message data
        if (element.dataset.targetId) {
            target = DoD_Utility.getActorFromUUID(element.dataset.targetId);
        }
        // Get target from user target
        if (!target) {
            const targets = Array.from(game.user.targets);
            if (targets.length > 0) {
                target = targets[0].actor;
            }
        }
    }
    return target;
}

function dealTargetDamage(li, multiplier = 1, ignoreArmor = false) {
    const damageData = {};
    const element = li.querySelector(".damage-roll") || li.querySelector(".dice-total");

    damageData.damage = element.dataset.damage ?? Number(element.innerText);
    damageData.damageType = element.dataset.damageType?.substring(String("DoD.damageTypes.").length);
    damageData.actor = getTarget(element);
    damageData.multiplier = multiplier;
    damageData.ignoreArmor = ignoreArmor || element.dataset.ignoreArmor;

    if (!(damageData.actor instanceof DoDActor)) {
        DoD_Utility.WARNING("TOKEN.WarningNoActor");
    }
    else if (!damageData.actor.isOwner) {
        DoD_Utility.WARNING("DoD.WARNING.noPermissionToModifyActor");
    } else {
        applyDamageMessage(damageData);
    }
}

function healTarget(li, _multiplier = 1, _ignoreArmor = false) {
    const healingData = {};
    const element = li.querySelector(".healing-roll") || li.querySelector(".dice-total");

    healingData.damage = element.dataset.healing ?? Number(element.innerText);
    healingData.actor = getTarget(element);

    if (!(healingData.actor instanceof DoDActor)){
        DoD_Utility.WARNING("TOKEN.WarningNoActor");
    }
    else if (!healingData.actor.isOwner) {
        DoD_Utility.WARNING("DoD.WARNING.noPermissionToModifyActor");
    } else {
        applyHealingMessage(healingData);
    }
}

export function addChatMessageContextMenuOptions(_html, options) {

    function isTestMessage(message) {
        return message.type === "attributeTest" ||
               message.type === "skillTest" ||
               message.type === "weaponTest" ||
               message.type === "spellTest";
    }

    const canDealTargetDamage = li =>
    {
        if (li.querySelector(".healing-roll")) {
            return false;
        }
        if (isTestMessage(messageFromElement(li))) {
            return false;
        }
        const element = li.querySelector(".damage-roll") || li.querySelector(".dice-total");
        const target = getTarget(element);
        return target ? target.isOwner : false;
    }

    const canHealTarget = li =>
    {
        if (li.querySelector(".damage-roll")) {
            return false;
        }
        if (isTestMessage(messageFromElement(li))) {
            return false;
        }
        const element = li.querySelector(".healing-roll") || li.querySelector(".dice-total")
        const target = getTarget(element);
        return target ? target.isOwner : false;
    }

    const canDealSelectedDamage = li =>
    {
        if(!game.user.isGM || canDealTargetDamage(li)) {
            return false;
        }

        if (!game.settings.get("dragonbane", "allowDealDamageOnSelected")) {
            return false;
        }

        if (isTestMessage(messageFromElement(li))) {
            return false;
        }

        if (canvas.tokens.controlled.length === 0 || li.querySelector(".healing-roll") || li.querySelector(".skill-roll")) {
            return false;
        }

        if ((li.querySelector(".damage-roll"))) {
            for (const token of canvas.tokens.controlled) {
                if (!token.isOwner) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    const dealSelectedDamage = function(li, multiplier = 1, ignoreArmor = false) {
        const damageData = {};
        const element = li.querySelector(".damage-roll");

        damageData.damage = element.dataset.damage;
        damageData.damageType = element.dataset.damageType?.substring(String("DoD.damageTypes.").length);
        damageData.actor = canvas.tokens.controlled[0].actor;
        damageData.multiplier = multiplier;
        damageData.ignoreArmor = ignoreArmor || element.dataset.ignoreArmor;

        const targets = canvas.tokens.controlled;
        for (const target of targets) {
            if (!target.actor) {
                DoD_Utility.WARNING("TOKEN.WarningNoActor");
            }
            else if (!target.actor.isOwner) {
                DoD_Utility.WARNING("DoD.WARNING.noPermissionToModifyActor");
            } else {
                damageData.actor = target.actor;
                applyDamageMessage(damageData);
            }
        }
    }

    const canHealSelectedDamage = li =>
    {
        if (!game.user.isGM || canHealTarget(li)) {
            return false;
        }

        if (canvas.tokens.controlled.length === 0 || li.querySelector(".damage-roll") || li.querySelector(".skill-roll")) {
            return false;
        }

        if (isTestMessage(messageFromElement(li))) {
            return false;
        }

        if (li.querySelector(".healing-roll")) {
            for (const token of canvas.tokens.controlled) {
                if (!token.isOwner) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    const healSelectedDamage = function(li) {
        const healingData = {};
        const element = li.querySelector(".dice-total");

        healingData.damage = Number(element.innerText);

        for (const target of canvas.tokens.controlled) {
            if (!target.actor) {
                DoD_Utility.WARNING("TOKEN.WarningNoActor");
            }
            else if (!target.actor.isOwner) {
                DoD_Utility.WARNING("DoD.WARNING.noPermissionToModifyActor");
            } else {
                healingData.actor = target.actor;
                applyHealingMessage(healingData);
            }
        }
    }

    const canUndoDamage = li =>
    {
        const element = li.querySelector(".damage-message");
        if (element?.dataset.actorId) {
            const target = DoD_Utility.getActorFromUUID(element.dataset.actorId);
            return target?.isOwner && Number(element?.dataset.damage) !== 0;
        }
        return false;
    }

    const undoDamage = function(li) {
        const element = li.querySelector(".damage-message");
        const healingData = {
            actor: DoD_Utility.getActorFromUUID(element?.dataset.actorId),
            damage: Number(element?.dataset.damage)
        };
        applyHealingMessage(healingData);
    }


    options.unshift(
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
            name: game.i18n.format("DoD.ui.chat.dealDamageIgnoreArmor"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canDealTargetDamage,
            callback: li => dealTargetDamage(li, 1, true)
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
        },
        {
            name: game.i18n.format("DoD.ui.chat.dealSelectedDamageIgnoreArmor"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canDealSelectedDamage,
            callback: li => dealSelectedDamage(li, 1, true)
        },
        {
            name: game.i18n.format("DoD.ui.chat.healTarget"),
            icon: '<i class="fas fa-user-plus"></i>',
            condition: canHealTarget,
            callback: li => healTarget(li)
        },
        {
            name: game.i18n.format("DoD.ui.chat.healSelectedDamage"),
            icon: '<i class="fas fa-user-plus"></i>',
            condition: canHealSelectedDamage,
            callback: li => healSelectedDamage(li)
        },
        {
            name: game.i18n.format("DoD.ui.chat.undoDamage"),
            icon: '<i class="fas fa-undo-alt"></i>',
            condition: canUndoDamage,
            callback: li => undoDamage(li)
        }
    );
}

export async function onInlineDamageRoll(event) {
    if (event.detail === 2) { // double-click
        return;
    };
    event.stopPropagation();
    event.preventDefault();

    const element = event.target;
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
export async function onTreasureRoll(event) {
    if (event.detail === 2) { // double-click
        return;
    };
    event.stopPropagation();
    event.preventDefault();

    const element = event.target;
    const count = element.dataset.count;

    DoD_Utility.drawTreasureCards(count);
}

async function onWeaponDamageRoll(event) {
    if (event.detail === 2) { // double-click
        return;
    };
    event.stopPropagation();
    event.preventDefault();

    // get the message
    const messageId = event.target.closest(".chat-message")?.dataset.messageId;
    const message = game.messages.get(messageId);
    if (!message) return;

    const context = message.system.toContext();
    const actor = context.actor;
    const weapon = context.weapon;
    const target = context.targetActor;
    const damageType = context.damageType;
    const ignoreArmor = context.ignoreArmor || context.action === "weakpoint" && context.success || context.criticalEffect === "ignoreArmor";
    const extraDamage = context.extraDamage;
    const weaponDamage = weapon ? weapon.system.damage : null;
    const skill = weapon ? actor.findSkill(weapon.system.skill.name) : null;
    const attribute = skill ? skill.system.attribute : null;
    let damageBonus = attribute ? actor.system.damageBonus[attribute]?.value : 0;

    if (weapon.hasWeaponFeature("noDamageBonus")) {
        damageBonus = 0;
    }

    let damage = weaponDamage;
    if (damageBonus && damageBonus !== "0" && damageBonus !== "none") {
        damage += " + " + damageBonus;
    }
    if (extraDamage && extraDamage !== "0") {
        damage += " + " + extraDamage;
    }

    const damageData = {
        actor: actor,
        weapon: weapon,
        damage: damage,
        damageType: damageType,
        doubleWeaponDamage: context.criticalEffect === "doubleWeaponDamage",
        ignoreArmor: ignoreArmor,
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
    await inflictDamageMessage(damageData);
}

async function onMagicDamageRoll(event) {
    if (event.detail === 2) { // double-click
        return;
    };
    event.stopPropagation();
    event.preventDefault();

    // get the message
    const messageId = event.target.closest(".chat-message")?.dataset.messageId;
    const message = game.messages.get(messageId);
    if (!message) return;

    const context = message.system.toContext();
    const actor = context.actor;
    const spell = context.spell;

    if (!(actor && spell?.isDamaging)) return;

    let damage = spell.system.damage;
    if (context.powerLevel > 1 && spell.system.damagePerPowerlevel?.length > 0) {
        for (let i = 1; i < context.powerLevel; ++i) {
            if (damage.length > 0) {
                damage += " + ";
            }
            damage += spell.system.damagePerPowerlevel;
        }
    }

    const damageData = {
        actor: actor,
        weapon: spell,
        damage: damage,
        damageType: DoD.damageTypes.none,
        doubleSpellDamage: context.criticalEffect === "doubleDamage",
        target: context.targetActor
    };

    if (!damageData.target) {
        const targets = Array.from(game.user.targets)
        if (targets.length > 0) {
            for (const target of targets) {
                damageData.target = target.actor;
                await inflictDamageMessage(damageData);
            }
            return;
        }
    }
    await inflictDamageMessage(damageData);
}

async function onCriticalDamageRoll(event) {
    if (event.detail === 2) { // double-click
        return;
    };
    event.stopPropagation();
    event.preventDefault(); 

    // get the message
    const messageId = event.target.closest(".chat-message")?.dataset.messageId;
    const message = game.messages.get(messageId);
    if (!message) return;

    message.system.onCritical(message);
}

async function onPushRoll(event) {
    if (event.detail === 2) { // double-click
        return;
    };
    event.stopPropagation();
    event.preventDefault();

    const messageId = event.target.closest(".chat-message")?.dataset.messageId;
    const message = game.messages.get(messageId);
    
    if (!message) return;

    const context = message.system.toContext();
    const actor = context.actor;
    if (!actor) return;
    
    // Prepare push roll choices
    const pushRollChoices = {};

    for (const attribute in actor.system.attributes) {
        const condition = actor.system.conditions[attribute];
        if (condition) {
            if (!condition.value) {
                pushRollChoices[attribute] =
                    game.i18n.localize("DoD.conditions." + attribute) + " (" +
                    game.i18n.localize("DoD.attributes." + attribute) + ")";
            }
        } else {
            DoD_Utility.ERROR("Missing condition for attribute " + attribute);
        }
    }

    if (Object.keys(pushRollChoices).length === 0) {
        DoD_Utility.WARNING("DoD.WARNING.conditionAlreadyTaken");
        return;
    }

    // Create dialog content
    const content = `
    <form>
        <fieldset>
        <legend>${game.i18n.localize("DoD.roll.pushChoiceLabel")}</legend>

        ${Object.entries(pushRollChoices).map(([attribute, label], i) => `
            <label>
            <input
                type="radio"
                name="pushChoice"
                value="${attribute}"
                ${i === 0 ? "checked" : ""}
            >
            ${label}
            </label>
        `).join("")}

        </fieldset>
    </form>
    `;
    
    // Determine dialog title
    let rollTitle = "";
    switch (message.type) {
        case "attributeTest":
            rollTitle =  context.attribute.toUpperCase();
            break;
        case "skillTest":
        case "weaponTest":
        case "spellTest":
            rollTitle = context.skill.name || context.weapon?.name || context.spell?.name;
            break;
        default:
            return;
    }    

     // Show dialog
    const choice = await foundry.applications.api.DialogV2.prompt({
        window: { title: game.i18n.localize("DoD.roll.pushButtonLabel") + ": " + rollTitle },
        content,
        ok: {
            icon: "fa-solid fa-arrow-rotate-right",
            label: game.i18n.localize("DoD.roll.pushButtonLabel"),
            callback: (event, button) => button.form.elements.pushChoice.value
    },
    });
    if (choice === null) return; // dialog was closed
    
    // Take condition
    if (!actor.hasCondition(choice)) {
        actor.updateCondition(choice, true);
        const msg = game.i18n.format("DoD.ui.chat.takeCondition",
            {
                actor: actor.name,
                condition: game.i18n.localize("DoD.conditions." + choice)
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
    const rerollOptions = message?.rolls[0].options;

    const options = {
        actorId: message.system.actorUuid,
        attribute: message.system.attribute,
        formula: message.system.formula,
        canPush: false,
        skipDialog: true,
        isReroll: true,
        rerollOptions,
    };

    if (context.targetActor) {
        const targetToken = canvas.scene?.tokens?.find(t => t.actor?.uuid === context.targetActor.uuid);
        if (targetToken) {
            options.targets = [targetToken];
        }
    }

    let test = null;
    switch (message.type) {
        case "attributeTest":
            test = new DoDAttributeTest(actor, options.attribute, options);
            break;
        case "skillTest":
            options.skill = context.skill
            test = new DoDSkillTest(actor, options.skill, options);
            break;
        case "weaponTest":
            options.action = context.action;
            options.extraDamage = context.extraDamage;
            options.weapon = context.weapon;
            test = new DoDWeaponTest(actor, options.weapon, options);
            break;
        case "spellTest":
            options.spell = context.spell;
            options.powerLevel = context.powerLevel;
            options.wpCost = Number(event.target.dataset.wpCost);
            test = new DoDSpellTest(actor, options.spell, options);
            break;
        default:
            return;
    }
    test?.roll();
}

export async function inflictDamageMessage(damageData) {

    let formula = damageData.damage;

    let isHealing = false;
    if (formula[0] === "-") {
        isHealing = true;
        formula = formula.substring(1);
    }

    // Add "1" in front of D to make sure the first roll term is a Die.
    if (formula[0] === "d" || formula[0] === "D") {
        formula = "1" + formula;
    }

    // Check for monster vs prone target
    if (damageData.actor?.isMonster && damageData.target) {
        const actorToken = canvas.scene.tokens.find(t => t.actor.uuid === damageData.actor.uuid);
        const targetToken = canvas.scene.tokens.find(t => t.actor.uuid === damageData.target.uuid);
        if (actorToken && !actorToken.hasStatusEffect("prone") && targetToken && targetToken.hasStatusEffect("prone")) {

            const addDamage = await foundry.applications.api.DialogV2.confirm({
                window: { title: game.i18n.localize("DoD.ui.dialog.addMeleeDamageVsProneTitle") },
                content: game.i18n.format("DoD.ui.dialog.addMeleeDamageVsProneMessage", {target: targetToken.name}),
            });

            if (addDamage) {
                formula += "+1D6";
            }
        }
    }
    
    if (damageData.doubleSpellDamage) {
        formula = "2*(" + formula + ")";
    }
    const roll = new Roll(formula);

    if (damageData.doubleWeaponDamage && roll.terms.length > 0) {
        let term = roll.terms[0];
        if (term instanceof foundry.dice.terms.Die) {
            term.number *= 2;
        }
    }

    await roll.roll({});

    const rollDamageMessage = DoDRollDamageMessageData.fromContext({
        actor: damageData.actor,
        weapon: damageData.weapon,
        targetActor: damageData.target,
        damage: roll.total,
        damageType: damageData.damageType,
        formula: roll.formula,
        isHealing: isHealing,
        ignoreArmor: damageData.ignoreArmor
    });

    rollDamageMessage.toMessage(roll);
}

export async function applyDamageMessage(damageData) {

    const actor = damageData.actor;
    const damage = damageData.damage;
    const damageType = damageData.damageType;
    const multiplier = damageData.multiplier;
    const ignoreArmor = damageData.ignoreArmor;
    const armorValue = ignoreArmor ? 0 : actor.getArmorValue(damageType);
    const damageToApply = Math.max(0, Math.floor((damage - armorValue) * multiplier));
    const oldHP = actor.system.hitPoints.value;

    if (damageToApply > 0) {
        await actor.applyDamage(damageToApply);
    }
    const newHP = actor.system.hitPoints.value;
    const damageTaken = oldHP - newHP;

    const actorName = actor.isToken ? actor.token.name : actor.name;
    const token = canvas.scene.tokens.find(t => t.actor.uuid === actor.uuid);

    const permissionKey = DoD_Utility.getViewDamagePermission().toLowerCase();

    let message = "";
    let isDead = false;
    let instantDeath = false;

    // Automate Character going prone when reaching 0 HP
    if (actor.type === "character") {
        if (oldHP > 0 && damageToApply >= oldHP) {
            if (token && !token.hasStatusEffect("prone")) {
                const status = CONFIG.statusEffects.find(a => a.id === 'prone');
                token.actor.toggleStatusEffect(status.id, {active: true});
                message += "<p>" + game.i18n.format("DoD.ui.chat.characterProne", {actor: actorName}) + "</p>";
            }
        }
    }

    // Automate instant death
    if (damageToApply - oldHP >= actor.system.hitPoints.max) {
        isDead = true;
        instantDeath = true;
    }

    // Automate NPC & Monster death
    if (!isDead && (actor.type === "npc" || actor.type === "monster")) {
        if (oldHP > 0 && damageToApply >= oldHP) {
            isDead = true;
        }
    }

    // Automate Character death
    if (!isDead && actor.type === "character") {
        // Characters add death roll when at 0 HP and taking damage
        if (oldHP === 0 && damageToApply > 0) {
            let failures = actor.system.deathRolls.failures;
            if (failures < 3) {
                await actor.update({["system.deathRolls.failures"]: ++failures});
                message += "<p>" + game.i18n.format("DoD.ui.chat.failedDeathRoll", {actor: actorName}) + "</p>";
                if (failures === 3) {
                    isDead = true;
                }
            }
        }
    }

    if (isDead) {
        if (actor.type === "npc" && game.settings.get("dragonbane", "automateNpcDeath")
        || actor.type === "monster" && game.settings.get("dragonbane", "automateMonsterDeath")
        || actor.type === "character" && game.settings.get("dragonbane", "automateCharacterDeath"))
        {
            const status = CONFIG.statusEffects.find(a => a.id === 'dead');
            if (token && !token.hasStatusEffect("dead")) {
                token.actor.toggleStatusEffect(status.id, {active: true, overlay: true});
            }
            if (instantDeath) {
                message += "<p>" + game.i18n.format("DoD.ui.chat.characterDiedInstantly", {actor: actorName}) + "</p>";
            } else {
                message += "<p>" + game.i18n.format("DoD.ui.chat.characterDied", {actor: actorName}) + "</p>";
            }
        }
    }

    let html = `
        <div class="damage-message permission-${permissionKey}" data-damage="${damageTaken}" data-actor-id="${actor.uuid}">
            ${game.i18n.format(game.i18n.localize("DoD.ui.chat.damageApplied"), {damage: damageTaken, actor: actorName})}
            ${message}
            <div class="damage-details permission-observer" data-actor-id="${actor.uuid}">
                <i class="fa-solid fa-circle-info"></i>
                <div class="expandable" style="text-align: left; margin-left: 0.5em">
                    <b>${game.i18n.localize("DoD.ui.chat.damageDetailDamage")}:</b> ${damage} ${game.i18n.localize("DoD.damageTypes." + (damageType ?? "none"))}<br>
                    <b>${game.i18n.localize("DoD.ui.chat.damageDetailArmor")}:</b> ${armorValue}<br>
                    <b>${game.i18n.localize("DoD.ui.chat.damageDetailMultiplier")}:</b> x${multiplier}<br>
                    <b>${game.i18n.localize("DoD.ui.chat.damageDetailTotal")}:</b> ${damageToApply}<br>
                    <b>${game.i18n.localize("DoD.ui.character-sheet.hp")}:</b> ${oldHP} <i class="fa-solid fa-arrow-right"></i> ${newHP}<br>
                </div>
            </div>            
        </div>
        <div class="damage-message permission-not-${permissionKey}" data-actor-id="${actor.uuid}">
            ${game.i18n.format(game.i18n.localize("DoD.ui.chat.damageApplied"), {damage: "???", actor: actorName})}
            ${message}
        </div>`;
    ChatMessage.create({ 
        user: game.user.id,
        content: html
    });
}

export async function applyHealingMessage(damageData) {

    const actor = damageData.actor;
    const damage = damageData.damage;
    const oldHP = actor.system.hitPoints.value;
    let newHP = oldHP;

    if (damage > 0) {
        newHP = await actor.applyDamage(-damage);
    }

    const actorName = actor.isToken ? actor.token.name : actor.name;
    const permissionKey = DoD_Utility.getViewDamagePermission().toLowerCase();

    const msg = `
    <div class="permission-${permissionKey}" data-actor-id="${actor.uuid}">
        ${game.i18n.format(game.i18n.localize("DoD.ui.chat.healingApplied"), {damage: newHP - oldHP, actor: actorName})}
        <div class="damage-details permission-observer" data-actor-id="${actor.uuid}">
            <i class="fa-solid fa-circle-info"></i>
            <div class="expandable" style="text-align: left; margin-left: 0.5em">
                <b>${game.i18n.localize("DoD.ui.character-sheet.hp")}:</b> ${oldHP} <i class="fa-solid fa-arrow-right"></i> ${newHP}<br>
            </div>
        </div>            
    </div>
    <div class="permission-not-${permissionKey}" data-actor-id="${actor.uuid}">
        ${game.i18n.format(game.i18n.localize("DoD.ui.chat.healingApplied"), {damage: "???", actor: actorName})}
    </div>`;

    if (oldHP === 0 && newHP > 0) {
        const token = canvas.scene.tokens.find(t => t.actor.uuid === actor.uuid);
        if (token && token.hasStatusEffect("dead")) {
            const status = CONFIG.statusEffects.find(a => a.id === 'dead');
            token.actor.toggleStatusEffect(status.id);
        }
    }

    ChatMessage.create({
        user: game.user.id,
        content: msg
    });
}

export function hideChatPermissions(_app, html, _data) {
    if (!game.user.isGM) {
        for (const el of html.querySelectorAll(".permission-gm")) {
            el.remove();
        }        
    } else {
        for (const el of html.querySelectorAll(".permission-not-gm")) {
            el.remove();
        }        
    }

    for (const el of html.querySelectorAll(".permission-owner")) {
        const actor = DoD_Utility.getActorFromUUID(el.dataset.actorId, {noWarnings: true});
        if (actor && !actor.isOwner) {
            el.remove();
        }
    }

    for (const el of html.querySelectorAll(".permission-not-owner")) {
        const actor = DoD_Utility.getActorFromUUID(el.dataset.actorId, {noWarnings: true});
        if (actor && actor.isOwner) {
            el.remove();
        }
    }

    for (const el of html.querySelectorAll(".permission-observer")) {
        const actor = DoD_Utility.getActorFromUUID(el.dataset.actorId, {noWarnings: true});
        if (actor && !actor.isObserver) {
            el.remove();
        }
    }

    for (const el of html.querySelectorAll(".permission-not-observer")) {
        const actor = DoD_Utility.getActorFromUUID(el.dataset.actorId, {noWarnings: true});
        if (actor && actor.isObserver) {
            el.remove();
        }
    }

    for (const el of html.querySelectorAll(".permission-limited")) {
        const actor = DoD_Utility.getActorFromUUID(el.dataset.actorId, {noWarnings: true});
        if (actor && !actor.isLimited) {
            el.remove();
        }
    }

    for (const el of html.querySelectorAll(".permission-not-limited")) {
        const actor = DoD_Utility.getActorFromUUID(el.dataset.actorId, {noWarnings: true});
        if (actor && actor.isLimited) {
            el.remove();
        }
    }

    for (const el of html.querySelectorAll(".permission-not-none")) {
        el.remove();
    }        
}

export function onExpandableClick(event) {
    event.preventDefault();

    // Toggle the message flag
    let roll = event.target;
    const msgElement = roll.closest(".message");
    const message = game.messages.get(msgElement.dataset.messageId);
    message._expanded = !message._expanded;

    // Expand or collapse tooltips
    const tooltips = msgElement.querySelectorAll(".expandable");
    for ( let tip of tooltips ) {
      if ( message._expanded ) $(tip).slideDown(200);
      else $(tip).slideUp(200);
      tip.classList.toggle("expanded", message._expanded);
    }
  }