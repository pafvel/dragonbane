import DoD_Utility from "./utility.js";

export function addChatListeners(app, html, data) {
    html.on("click", "button.weapon-roll", onDamageRoll);
    html.on("click", "button.push-roll", onPushRoll);
}

export function addChatMessageContextMenuOptions(html, options) {
    const canDealDamage = li => canvas.tokens.controlled.length > 0 && li.find(".damage-roll").length > 0;
    
    const dealDamage = function(li, multiplier = 1) {
        const damageData = {};
        const element = li.find(".damage-roll")[0];

        damageData.damage = element.dataset.damage;
        damageData.damageType = element.dataset.damageType.substr(String("DoD.damageTypes.").length);
        damageData.actor = canvas.tokens.controlled[0].actor;
        damageData.multiplier = multiplier;
        damageData.ignoreArmor = element.dataset.ignoreArmor;

        for (const token of canvas.tokens.controlled) {
            damageData.actor = token.actor;
            applyDamageMessage(damageData);
        }
    }

    options.push(
        {
            name: game.i18n.format("DoD.ui.chat.dealDamage"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canDealDamage,
            callback: li => dealDamage(li)
        },
        {
            name: game.i18n.format("DoD.ui.chat.dealHalfDamage"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canDealDamage,
            callback: li => dealDamage(li, 0.5)
        },
        {
            name: game.i18n.format("DoD.ui.chat.dealDoubleDamage"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canDealDamage,
            callback: li => dealDamage(li, 2)
        }
    );
}

async function onDamageRoll(event) {
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

    const damageData = {
        actor: actor,
        weapon: weapon,
        damage: damage,
        damageType: damageType,
        ignoreArmor: ignoreArmor
    };
 
    if (element.dataset.isMeleeCrit) {
        const parent = element.parentElement;
        const critChoices = parent.getElementsByTagName("input");
        const choice = Array.from(critChoices).find(e => e.name=="meleeCritChoice" && e.checked);

        damageData[choice.value] = true;

        ChatMessage.create({
            content: game.i18n.localize("DoD.meleeCritChoices.choiceLabel") + ": "+ game.i18n.localize("DoD.meleeCritChoices." + choice.value),
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: damageData.actor }),
        });
    }

    if (element.dataset.isMagicCrit) {
        const parent = element.parentElement;
        const critChoices = parent.getElementsByTagName("input");
        const choice = Array.from(critChoices).find(e => e.name=="magicCritChoice" && e.checked);

        damageData[choice.value] = true;

        ChatMessage.create({
            content: game.i18n.localize("DoD.magicCritChoices.choiceLabel") + ": "+ game.i18n.localize("DoD.magicCritChoices." + choice.value),
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: damageData.actor }),
        });

        if (choice.value == "noCost") {
            const wpCost = Number(element.dataset.wpCost);
            const wpNew = Math.min(actor.system.willPoints.max, actor.system.willPoints.value + wpCost);
            await actor.update({ ["system.willPoints.value"]: wpNew});
        }
        return;
    }

    inflictDamageMessage(damageData);    
}

function onPushRoll(event) {
    console.log("onPushRoll");
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

    const msg = damageData.ignoreArmor ? "DoD.roll.damageIgnoreArmor" : "DoD.roll.damage";
    const flavor = game.i18n.format(game.i18n.localize(msg), {
        actor: damageData.actor.name,
        damage: roll.total,
        damageType: game.i18n.localize(damageData.damageType),
        weapon: damageData.weapon.name
    });
    
    const template = "systems/dragonbane/templates/partials/damage-roll-message.hbs";
    const templateContext = {
        formula: roll.formula,
        user: game.user.id,
        tooltip: await roll.getTooltip(),
        total: Math.round(roll.total * 100) / 100,
        damageType: damageData.damageType,
        ignoreArmor: damageData.ignoreArmor
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
    
    const damageMessage = game.i18n.format(game.i18n.localize("DoD.ui.chat.damageApplied"), {damage: damageToApply, actor: actor.name});
    const damageDetails = game.i18n.format(game.i18n.localize("DoD.ui.chat.damageAppliedDetails"), {damage: damage, armor: armorValue});
    const msg = damageMessage + "<br/><br/>" + damageDetails;
    if (multiplier != 1) {
        msg += "<br>" + game.i18n.format(game.i18n.localize("DoD.ui.chat.damageAppliedMultiplier"), {multiplier: multiplier});
    }
    ChatMessage.create({ content: msg });
}