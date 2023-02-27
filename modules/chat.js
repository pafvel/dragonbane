export function addChatListeners(app, html, data) {
    html.on("click", "button.weapon-roll", onDamageRoll);
    html.on("click", "button.push-roll", onPushRoll);
}

export function addChatMessageContextMenuOptions(html, options) {
    let canDealDamage = li => canvas.tokens.controlled.length > 0 && li.find(".damage-roll").length > 0;
    
    let dealDamage = function(li, multiplier = 1) {
        let damageData = {};
        let element = li.find(".damage-roll")[0];

        damageData.damage = element.dataset.damage;
        damageData.damageType = element.dataset.damageType.substr(String("DoD.damageTypes.").length);
        damageData.actor = canvas.tokens.controlled[0].actor;
        damageData.multiplier = multiplier;
        damageData.ignoreArmor = element.dataset.ignoreArmor;

        for (let token of canvas.tokens.controlled) {
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

function onDamageRoll(event) {
    console.log("onDamageRoll");

    let element = event.currentTarget;
    let actorId = element.dataset.actorId;
    let weaponId = element.dataset.weaponId;
    let damageType = element.dataset.damageType;
    let ignoreArmor = element.dataset.ignoreArmor;
    let actor = game.actors.get(actorId);
    let weapon = actor.items.get(weaponId);
    let weaponDamage = weapon.system.damage;
    let skill = actor.findSkill(weapon.system.skill.name);
    let attribute = skill?.system.attribute;
    let damageBonus = attribute ? actor.system.damageBonus[attribute] : 0;
    let damage = weaponDamage + "+" + damageBonus;

    let damageData = {
        actor: actor,
        weapon: weapon,
        damage: damage,
        damageType: damageType,
        ignoreArmor: ignoreArmor
    };

    inflictDamageMessage(damageData);    
}

function onPushRoll(event) {
    console.log("onPushRoll");
}

export async function inflictDamageMessage(damageData) {

    let roll = await new Roll(damageData.damage).roll({async: true});
    
    let msg = damageData.ignoreArmor ? "DoD.roll.damageIgnoreArmor" : "DoD.roll.damage";
    let flavor = game.i18n.format(game.i18n.localize(msg), {
        actor: damageData.actor.name,
        damage: roll.total,
        damageType: game.i18n.localize(damageData.damageType),
        weapon: damageData.weapon.name
    });
    
    let template = "systems/dragonbane/templates/partials/damage-roll-message.hbs";
    let templateContext = {
        formula: roll.formula,
        user: game.user.id,
        tooltip: await roll.getTooltip(),
        total: Math.round(roll.total * 100) / 100,
        damageType: damageData.damageType,
        ignoreArmor: damageData.ignoreArmor
    };
    let renderedTemplate = await renderTemplate(template, templateContext);

    let messageData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: damageData.actor }),
        flavor: flavor,
        content: renderedTemplate
    };
    roll.toMessage(messageData);
}

export async function applyDamageMessage(damageData) {

    let actor = damageData.actor;
    let damage = damageData.damage;
    let damageType = damageData.damageType;
    let multiplier = damageData.multiplier;
    let ignoreArmor = damageData.ignoreArmor;

    let armorValue = ignoreArmor ? 0 : actor.getArmorValue(damageType);
    let damageToApply = Math.max(0, Math.floor((damage - armorValue) * multiplier));
    if (damageToApply > 0) {
        actor.applyDamage(damageToApply);
    }
    
    let damageMessage = game.i18n.format(game.i18n.localize("DoD.ui.chat.damageApplied"), {damage: damageToApply, actor: actor.name});
    let damageDetails = game.i18n.format(game.i18n.localize("DoD.ui.chat.damageAppliedDetails"), {damage: damage, armor: armorValue});
    let msg = damageMessage + "<br/><br/>" + damageDetails;
    if (multiplier != 1) {
        msg += "<br>" + game.i18n.format(game.i18n.localize("DoD.ui.chat.damageAppliedMultiplier"), {multiplier: multiplier});
    }
    ChatMessage.create({ content: msg });
}