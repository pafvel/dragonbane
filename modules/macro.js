import DoD_Utility from "./utility.js";
import DoDAttributeTest from "./tests/attribute-test.js";
import DoDSkillTest from "./tests/skill-test.js";
import DoDSpellTest from "./tests/spell-test.js";
import DoDWeaponTest from "./tests/weapon-test.js";
import { DoDActor } from "./actor.js";


export async function createItemMacro(data, slot) {

    if (data.type !== "Item") {
        return;
    }
    let document = await fromUuid(data.uuid);
    let macro = null;
    let command = "";
    if (document.type === "skill" || document.type === "spell" || document.type === "weapon") {
        command = `game.dragonbane.rollItem("${document.name}", "${document.type}");`;
    } else {
        command = `Hotbar.toggleDocumentSheet("${document.uuid}");`;
    }
    macro = game.macros.contents.find(m => (m.name === document.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: document.name,
            type: "script",
            img: document.img,
            command: command
        });
    }

    if (macro) {
        game.user.assignHotbarMacro(macro, slot);
    }
}

export async function rollAttributeMacro(actor, attributeName, options = {}) {

    if (!actor || !(actor instanceof DoDActor)) {
        DoD_Utility.WARNING("DoD.WARNING.macroNoActor");
        return;
    }

    let test = new DoDAttributeTest(actor, attributeName, {...{ defaultBanesBoons: true }, ...options});
    return await test.roll();
}

export function rollItemMacro(itemName, itemType, options = {}) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    if (!actor) {
        DoD_Utility.WARNING("DoD.WARNING.macroNoActor");
        return;
    }

    if (game.user.targets.size > 0) {
        options.targets = Array.from(game.user.targets);
    }

    const items = actor.items.filter(i => i.name === itemName && i.type === itemType);

    if (items.length > 1) {
        DoD_Utility.WARNING("DoD.WARNING.macroMultipleItems", {item: itemName, type: itemType});
    } else if (items.length === 0) {
        DoD_Utility.WARNING("DoD.WARNING.macroNoItem", {item: itemName, type: itemType});
        return;
    }

    const item = items[0];

    switch (item.type) {
        case "skill":
            return new DoDSkillTest(actor, item, options).roll();
        case "weapon":
            return new DoDWeaponTest(actor, item, options).roll();
        case "spell":
            return new DoDSpellTest(actor, item, options).roll();
        default:
            break;
    }
  }

  export function monsterAttackMacro() {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    if (!actor || actor.type !== "monster") {
        DoD_Utility.WARNING("DoD.WARNING.macroNoActor");
        return;
    }
    return DoD_Utility.monsterAttack(actor);
  }

  export function monsterDefendMacro() {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    if (!actor || actor.type !== "monster") {
        DoD_Utility.WARNING("DoD.WARNING.macroNoActor");
        return;
    }
    return DoD_Utility.monsterDefend(actor);
  }