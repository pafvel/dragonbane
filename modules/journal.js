import DoD_Utility from "./utility.js";

/**
 * Used to parse e.g. the brackets part of @DisplayNpc[Actor.gwFbDqFlJJrjeM3a named] to get {uuid: Actor.gwFbDqFlJJrjeM3a , named: true}
 * @param {String} match            The part of regexp match between brackets, contains UUID and optional flags, space delimited
 * @returns {uuid: String, <flags>} The uuid and each flag as a boolean set to true
 */
function parseMatch(match) {
    const words = match.split(" ");
    let result = {};
    if (words.length) {
        result.uuid = words[0];
    }
    for (let i=1; i<words.length; i++) {
        result[words[i]] = true;
    }
    return result;
}

export async function enrichDisplayAbility (match, options) {
    const ability = fromUuidSync(match[1]);
    const abilityName = match[2] ?? ability?.name;
    const a = document.createElement("div");
    if (ability) {
        const requirement = ability.system.requirement?.length > 0 ? ability.system.requirement : "-";
        const wp = ability.system.wp ?? "-";
        let html = "";
        if (options.box) {
            html += `
            <blockquote class="info">
            <div class="display-ability">
                <h3>@UUID[${match[1]}]{${abilityName}}</h3>
                <p></p>
                <ul>`;
        } else {
            html += `
            <div class="display-ability">
                <h4>@UUID[${match[1]}]{${abilityName}}</h4>
                <ul>`;
        }
        if (ability.system.abilityType !== "kin") {
            html += `
                    <li><b>${game.i18n.localize("DoD.ability.requirement")}: </b><span>${requirement}</span>`;
        }
        html += `
                    <li><b>${game.i18n.localize("DoD.ability.wp")}: </b><span>${wp}</span>
                </ul>
                ${ability.system.description}
            </div>`;
        if (options.box) {
            html += `</blockquote>`;
        }
        a.innerHTML = await TextEditor.enrichHTML(html, {async: true});
    } else {
        a.dataset.abilityId = match[1];
        if (match[2]) a.dataset.abilityName = match[2];
        a.classList.add("content-link");
        a.classList.add("broken");
        a.innerHTML = `<i class="fas fa-unlink"></i> ${abilityName}`;
    }
    return a;
}
export async function enrichDisplayAbilityBox (match, options = {}) {
    options.box = true;
    return enrichDisplayAbility(match, options);
}

export async function enrichDisplayMonsterCard (match, _options) {
    return enrichDisplayMonster(match, {skipImage: true});
}

export async function enrichDisplayMonster (match, options) {
    const parsedMatch = parseMatch(match[1]);
    const monster = await DoD_Utility.findMonster(parsedMatch.uuid);
    const monsterName = match[2] ?? monster?.name;
    const skipImage = options?.skipImage || false;
    let titleClasses = "monster-title";
    if(parsedMatch.named) {
        titleClasses += " named";
    }

    const a = document.createElement("div");
    if (monster) {
        let html = "";
        if (!skipImage) {
            html += `
            <div>
                <img src="${monster.img}">
                ${monster.system.description}
            </div>
            `;
        }
        html += `
        <div class="display-monster">
            <div class="${titleClasses}">@UUID[${monster.uuid}]{${monsterName}}</div>
            <table>
                <tr>
                    <td><b>${game.i18n.localize("DoD.ui.character-sheet.ferocity")}: </b>${monster.system.ferocity}</td>
                    <td><b>${game.i18n.localize("DoD.ui.character-sheet.size")}: </b>${game.i18n.localize("DoD.sizeTypes." + monster.system.size)}</td>
                </tr>
                <tr>
                    <td><b>${game.i18n.localize("DoD.ui.character-sheet.movement")}: </b>${monster.system.movement}</td>
                    <td><b>${game.i18n.localize("DoD.ui.character-sheet.armor")}: </b>${monster.getArmorValue()}</td>
                    <td><b>${game.i18n.localize("DoD.ui.character-sheet.hp")}: </b>${monster.system.hitPoints.max}</td>
                </tr>
            </table>
            <div>
                ${monster.system.traits}
            </div>
        </div>`;
        a.innerHTML = await TextEditor.enrichHTML(html, {async: true});
    } else {
        a.dataset.monsterId = parsedMatch.uuid;
        if (match[2]) a.dataset.monsterName = match[2];
        a.classList.add("content-link");
        a.classList.add("broken");
        a.innerHTML = `<i class="fas fa-unlink"></i> ${monsterName}`;
    }
    return a;
}

export async function enrichDisplayMonsterDescriptionCard (match, _options) {
    const parsedMatch = parseMatch(match[1]);
    const monster = await DoD_Utility.findMonster(parsedMatch.uuid);
    const monsterName = match[2] ?? monster?.name;
    const table = monster?.system.attackTable ? fromUuidSync(monster.system.attackTable) : null;
    let titleClasses = "monster-title";
    if(parsedMatch.named) {
        titleClasses += " named";
    }

    const a = document.createElement("div");
    if (monster) {
        let html = `
        <div class="display-monster">
            <div class="${titleClasses}">@UUID[${monster.uuid}]{${monsterName}}</div>
            <div>
                ${monster.system.description}
            </div>
            <table>
                <tr>
                    <td><b>${game.i18n.localize("DoD.ui.character-sheet.ferocity")}: </b>${monster.system.ferocity}</td>
                    <td><b>${game.i18n.localize("DoD.ui.character-sheet.movement")}: </b>${monster.system.movement}</td>
                </tr>
                <tr>
                    <td><b>${game.i18n.localize("DoD.ui.character-sheet.size")}: </b>${game.i18n.localize("DoD.sizeTypes." + monster.system.size)}</td>
                    <td><b>${game.i18n.localize("DoD.ui.character-sheet.armor")}: </b>${monster.getArmorValue()}</td>
                    <td><b>${game.i18n.localize("DoD.ui.character-sheet.hp")}: </b>${monster.system.hitPoints.max}</td>
                </tr>
            </table>
            <div>
                ${monster.system.traits}
            </div>
            <div class="display-table">
                ${displayTable(monster?.system.attackTable, table, game.i18n.localize("DoD.journal.monsterAttacks"))}
            </div>
        </div>`;
        a.innerHTML = await TextEditor.enrichHTML(html, {async: true});
    } else {
        a.dataset.monsterId = parsedMatch.uuid;
        if (match[2]) a.dataset.monsterName = match[2];
        a.classList.add("content-link");
        a.classList.add("broken");
        a.innerHTML = `<i class="fas fa-unlink"></i> ${monsterName}`;
    }
    return a;
}

export async function enrichDisplayMonsterDescription (match, _options) {
    const parsedMatch = parseMatch(match[1]);
    const monster = await DoD_Utility.findMonster(parsedMatch.uuid);
    const monsterName = match[2] ?? monster?.name;
    let titleClasses = "monster-title";
    if(parsedMatch.named) {
        titleClasses += " named";
    }

    const a = document.createElement("div");
    if (monster) {
        let html = `
        <div class="display-monster">
            <div class="${titleClasses}">@UUID[${monster.uuid}]{${monsterName}}</div>
            <div>
                ${monster.system.description}
            </div>
        </div>`;
        a.innerHTML = await TextEditor.enrichHTML(html, {async: true});
    } else {
        a.dataset.monsterId = parsedMatch.uuid;
        if (match[2]) a.dataset.monsterName = match[2];
        a.classList.add("content-link");
        a.classList.add("broken");
        a.innerHTML = `<i class="fas fa-unlink"></i> ${monsterName}`;
    }
    return a;
}

export async function enrichDisplayNpc(match, _options) {
    return enrichDisplayNpcCard(match, {skipDescription: false});
}
export async function enrichDisplayNpcCard(match, options) {
    const parsedMatch = parseMatch(match[1]);
    const npc = await DoD_Utility.getActorFromUUID(parsedMatch.uuid);
    const npcName = match[2] ?? npc?.name;
    const skipDescription = options?.skipDescription != null ? options.skipDescription : true;
    const a = document.createElement("div");
    let titleClasses = "npc-title";
    if(parsedMatch.named) {
        titleClasses += " named";
    }
    if (npc) {
        let html = `
        <div class="display-npc">
            <div class="${titleClasses}">@UUID[${npc.uuid}]{${npcName}}</div>`;
        if (!skipDescription) {
            html += `${npc.system.description}`;
        }
        html += `
            <table>
                <tr><td>
                    
                    <div class="flexrow">
                        <div><b>${game.i18n.localize("DoD.ui.character-sheet.movement")}:&nbsp</b>${npc.system.movement}</div>`

        if (npc.getDamageBonus("str") !== "") {
            html += `<div><b>${game.i18n.localize("DoD.ui.character-sheet.damageBonusSTR")}:&nbsp</b><span style="text-transform:uppercase">${npc.getDamageBonus("str")}</span></div>`;
        }
        if (npc.getDamageBonus("agl") !== "") {
            html += `<div><b>${game.i18n.localize("DoD.ui.character-sheet.damageBonusAGL")}:&nbsp</b><span style="text-transform:uppercase">${npc.getDamageBonus("agl")}</span></div>`;
        }

        html += `
                    </div>
                </td></tr>
                <tr><td>
                    <div class="flexrow">
                        <div><b>${game.i18n.localize("DoD.ui.character-sheet.hp")}:&nbsp</b>${npc.system.hitPoints.max}</div>`;

        if (npc.hasAbilities || npc.hasSpells || npc.system.willPoints.max > 0) {
            html += `<div><b>${game.i18n.localize("DoD.ui.character-sheet.wp")}:&nbsp</b>${npc.system.willPoints.max}</div>`;
        }
        html += `
                    </div>
                </td></tr>`;


        // Skills
        // Only show skills if there is no weapon equipped using that skill
        const equippedWeapons = npc.getEquippedWeapons();
        const skills = npc.system.trainedSkills.filter(s => {
            if (s.system.skillType !== "weapon") return true;
            return equippedWeapons.find(w => w.system.skill.name === s.name) == null;

        });
        if (skills.length > 0) {
            skills.sort(DoD_Utility.nameSorter);
            html += `
                <tr><td>
                    <div class="flexrow list-row">
                        <div style="flex-shrink:0;flex-grow:0"><b>${game.i18n.localize("DoD.ui.character-sheet.skills")}:&nbsp</b></div>
                        <div style="flex-shrink:0;flex-grow:1"><span class="comma-list">`;
            for (const skill of skills) {
                html += `<span>${skill.name} ${skill.system.value}</span>`
            }
            html += `
                        </span></div>
                    </div>
                </td></tr>`
        }

        // Magic tricks
        const tricks = npc.items.filter(i => i.type === "spell" && !(i.system.rank > 0));
        if (tricks.length > 0) {
            html += `
            <tr><td>
                <div class="flexrow list-row">
                    <div><b>${game.i18n.localize("DoD.ui.character-sheet.tricks")}:&nbsp</b></div>
                    <div><span class="comma-list">`;
            for (const trick of tricks) {
                html += `<span>${trick.name}</span>`
            }
            html += `
                        </span></div>
                    </div>
                </td></tr>`
        }

        // Spells
        const spells = npc.items.filter(i => i.type === "spell" && i.system.rank > 0);
        if (spells.length) {
            html += `
            <tr><td>
                <div class="flexrow list-row">
                    <div><b>${game.i18n.localize("DoD.ui.character-sheet.spells")}:&nbsp</b></div>
                    <div><span class="comma-list">`;
            for (const spell of spells) {
                html += `<span>${spell.name}</span>`
            }
            html += `
                        </span></div>
                    </div>
                </td></tr>`            
        }

        // Abilities
        if (npc.hasAbilities) {
            let abilities = npc.items.filter(i => i.type === "ability").sort(DoD_Utility.nameSorter);
            // Format duplicate abilities
            let formattedAbilities = [];
            for (let i=0, j; i < abilities.length; i=j) {
                let count = 1;
                // count number of abilities with same name and skip duplicates
                for (j = i+1; j < abilities.length; j++) {
                    if (abilities[i].name === abilities[j].name) {
                        count++;
                    } else {
                        break;
                    }
                }
                // Push first unique ability. Add ability count in parenthesis (if multiple)
                formattedAbilities.push({
                    name: count === 1 ? abilities[i].name : abilities[i].name + " (" + count + ")"
                });
            }
            abilities = formattedAbilities;

            html += `
                <tr><td>
                    <div class="flexrow list-row">
                        <div><b>${game.i18n.localize("DoD.ui.character-sheet.abilities")}:&nbsp</b></div>
                        <div ><span class="comma-list">`;
            for (const ability of abilities) {
                html += `<span>${ability.name}</span>`
            }
            html += `
                        </span></div>
                    </div>
                </td></tr>`
        }

        // Weapons
        if (equippedWeapons.length > 0) {
            html += `
                <tr><td>
                    <div class="flexrow list-row">
                        <div><b>${game.i18n.localize("DoD.ui.character-sheet.weapons")}:&nbsp</b></div>
                        <div><span class="comma-list">`;
            for (const weapon of equippedWeapons) {
                html += `<span>${weapon.name} ${weapon.system.skill.value} (${weapon.system.damage})</span>`
            }
            html += `
                        </span></div>
                    </div>
                </td></tr>`
        }

        // Armor
        let armor = "";
        if (npc.system.equippedArmor) {
            armor += `${npc.system.equippedArmor.name} (${npc.system.equippedArmor.system.rating})`;
        }
        if (npc.system.equippedHelmet) {
            if (armor.length > 0) {
                armor += `, `;
            }
            armor += `${npc.system.equippedHelmet.name} (${npc.system.equippedHelmet.system.rating})`;
        }
        if (!npc.system.equippedArmor && !npc.system.equippedHelmet) {
            armor = "-";
        }
        html += `
        <tr><td>
        <div class="flexrow list-row">
            <div><b>${game.i18n.localize("DoD.ui.character-sheet.armor")}:&nbsp</b></div>
            <div>${armor}</div>
        </div>
        </td></tr>`;

        html += `
            </table>
            <div>
                ${npc.system.traits}
            </div>
        </div>`;
        a.innerHTML = await TextEditor.enrichHTML(html, {async: true});
    } else {
        a.dataset.npcId = parsedMatch.uuid;
        if (match[2]) a.dataset.npcName = match[2];
        a.classList.add("content-link");
        a.classList.add("broken");
        a.innerHTML = `<i class="fas fa-unlink"></i> ${npcName}`;
    }
    return a;
}

export async function enrichDisplayNpcDescription (match, _options) {
    const npc = await DoD_Utility.getActorFromUUID(match[1]);
    const npcName = match[2] ?? npc?.name;
    const a = document.createElement("div");
    if (npc) {
        let html = `${npc.system.description}`;
        a.innerHTML = await TextEditor.enrichHTML(html, {async: true});
    } else {
        a.dataset.npcId = match[1];
        if (match[2]) a.dataset.npcName = match[2];
        a.classList.add("content-link");
        a.classList.add("broken");
        a.innerHTML = `<i class="fas fa-unlink"></i> ${npcName}`;
    }
    return a;
}


export async function enrichDisplaySkill (match, _options) {
    const skill = fromUuidSync(match[1]);
    const skillName = match[2] ?? skill?.name;
    const a = document.createElement("div");
    if (skill) {
        let html = `
        <div class="display-skill">
            <h4>@UUID[${match[1]}]{${skillName}} <small>(${game.i18n.localize("DoD.attributes." + skill.system.attribute)})</small></h4>
            ${skill.system.description}
        </div>`;
        a.innerHTML = await TextEditor.enrichHTML(html, {async: true});
    } else {
        a.dataset.skillId = match[1];
        if (match[2]) a.dataset.skillName = match[2];
        a.classList.add("content-link");
        a.classList.add("broken");
        a.innerHTML = `<i class="fas fa-unlink"></i> ${skillName}`;
    }
    return a;
}

export async function enrichDisplaySpell (match, _options) {
    const spell = fromUuidSync(match[1]);
    const spellName = match[2] ?? spell?.name;
    const a = document.createElement("div");
    if (spell) {
        let range = "";
        switch (spell.system.rangeType) {
            case "range":
                range = spell.system.range ? spell.system.range + " " + game.i18n.localize("DoD.unit.meterPlural") : "-";
                break;
            case "personal":
                range = game.i18n.localize("DoD.spellRangeTypes.personal");
                break;
            case "touch":
                range = game.i18n.localize("DoD.spellRangeTypes.touch");
                break;
            case "cone":
                range = `${spell.system.range} ${game.i18n.localize("DoD.unit.meterPlural")} (${game.i18n.localize("DoD.spellRangeTypes.cone")})`;
                break;
            case "sphere":
                range = `${spell.system.range} ${game.i18n.localize("DoD.unit.meterPlural")} (${game.i18n.localize("DoD.spellRangeTypes.sphere")})`;
                break;
        }

        let html = `
        <div class="display-spell">
            <h4>@UUID[${match[1]}]{${spell.name}}</h4>
            <ul>
            <li><b>${game.i18n.localize("DoD.spell.rank")}: </b><span>${spell.system.rank}</span>
            <li><b>${game.i18n.localize("DoD.spell.prerequisite")}: </b><span>${spell.system.prerequisite !== "" ? spell.system.prerequisite : "-"}</span>
            <li><b>${game.i18n.localize("DoD.spell.requirement")}: </b><span>${spell.system.requirement !== "" ? spell.system.requirement : "-"}</span>
            <li><b>${game.i18n.localize("DoD.spell.castingTime")}: </b><span>${game.i18n.localize("DoD.castingTimeTypes." + spell.system.castingTime)}</span>
            <li><b>${game.i18n.localize("DoD.spell.rangeType")}: </b><span>${range}</span>
            <li><b>${game.i18n.localize("DoD.spell.duration")}: </b><span>${game.i18n.localize("DoD.spellDurationTypes." + spell.system.duration)}</span>
            </ul>
            ${spell.system.description}
        </div>`;
        a.innerHTML = await TextEditor.enrichHTML(html, {async: true});
    } else {
        a.dataset.spellId = match[1];
        if (match[2]) a.dataset.spellName = match[2];
        a.classList.add("content-link");
        a.classList.add("broken");
        a.innerHTML = `<i class="fas fa-unlink"></i> ${spellName}`;
    }
    return a;
}

function displayTable(uuid, table, tableName) {
    if (!table) {
        return "";
    }

    /*
    // Rollable table in caption
    let html = `
    <table>
        <caption>@Table[${uuid}]{${tableName}}</caption>
        <tr>
            <th>[[/roll ${table.formula}]]</th>
            <th>${game.i18n.localize("DoD.journal.tableResult")}</th>
        </tr>`;
    */

    // Rollable table in roll column header
    let html = `
    <table>
        <caption>${tableName}</caption>
        <tr>
            <th style="text-transform: uppercase;">@Table[${uuid}]{${table.formula}}</th>
            <th>${game.i18n.localize("DoD.journal.tableResult")}</th>
        </tr>`;

    for (let result of table.results) {
        html += `
        <tr>
            <td>${result.range[0]}`;
        if (result.range[1] !== result.range[0]) {
            html += ` - ${result.range[1]}`;
        }
        if (result.documentCollection === "RollTable") {
            let subTable = DoD_Utility.findTable(result.text);
            if (subTable?.uuid !== table.uuid) {
                let subTableName = result.text;
                if(subTableName.startsWith(table.name)) {
                    subTableName = subTableName.slice(table.name.length);
                    if (subTableName.startsWith(" - ")) {
                        subTableName = subTableName.slice(3);
                    }
                }
                html += `</td>
                    <td>${subTable?.description} @DisplayTable[RollTable.${result.documentId}]{${subTableName}}</td>
                </tr>`;
            } else {
                html += `</td>
                    <td>${result.text}</td>
                </tr>`;
            }
        } else if (result.documentCollection === "Item") {
            html += `</td>
                <td>@UUID[Item.${result.documentId}]{${result.text}}</td>
            </tr>`;
        } else {
            html += `</td>
                <td>${result.text}</td>
            </tr>`;
        }
    }
    html += `</table>`;
    return html;
}

export async function enrichDisplayTable (match, _options) {
    const table = DoD_Utility.findTable(match[1]);
    const tableName = match[2] ?? table?.name;
    const a = document.createElement("div");
    if (table) {
        a.classList.add("display-table");
        let html = displayTable(match[1], table, tableName);
        a.innerHTML = await TextEditor.enrichHTML(html, {async: true});
    } else {
        a.dataset.tableId = match[1];
        if (match[2]) a.dataset.tableName = match[2];
        a.classList.add("content-link");
        a.classList.add("broken");
        a.innerHTML = `<i class="fas fa-unlink"></i> ${tableName}`;
    }
    return a;
}

export async function enrichDisplayTrick(match, _options) {
    const spell = fromUuidSync(match[1]);
    const spellName = match[2] ?? spell?.name;
    const a = document.createElement("div");
    if (spell) {
        let html = `
        <div class="display-spell">
            <h4>@UUID[${match[1]}]{${spellName}}</h4>
            ${spell.system.description}
        </div>`;
        a.innerHTML = await TextEditor.enrichHTML(html, {async: true});
    } else {
        a.dataset.spellId = match[1];
        if (match[2]) a.dataset.spellName = match[2];
        a.classList.add("content-link");
        a.classList.add("broken");
        a.innerHTML = `<i class="fas fa-unlink"></i> ${spellName}`;
    }
    return a;
}

export async function enrichGearTable(match, _options) {
    const type = match[1];
    const name = match[2];
    const content = match[3];

    const div = document.createElement("div");
    div.classList.add("display-table");
    div.classList.add("gear-table");

    // Table and caption
    let html = `
        <table>
            <caption>${name}</caption>            
    `;

    // Header
    switch (type) {
        case "armor":
            html += `
            <tr>
                <th style="text-align:left;width: 20%">${game.i18n.localize("DoD.gearTypeName." + type)}</th>
                <th style="text-align:center">${game.i18n.localize("DoD.armor.rating")}</th>
                <th style="text-align:center">${game.i18n.localize("DoD.gear.cost")}</th>
                <th>${game.i18n.localize("DoD.gear.supply")}</th>
                <th>${game.i18n.localize("DoD.ui.character-sheet.banes")}</th>
            </tr>`;
            break;

        case "clothes":
        case "service":
        case "travel":
        case "animal":
            html += `
            <tr>
                <th style="text-align:left;width: 20%">${game.i18n.localize("DoD.gearTypeName." + type)}</th>
                <th style="text-align:center">${game.i18n.localize("DoD.gear.cost")}</th>
                <th>${game.i18n.localize("DoD.gear.supply")}</th>
                <th>${game.i18n.localize("DoD.gear.effect")}</th>
            </tr>`;
            break;

        case "instrument":
        case "trade":
        case "knowledge":
        case "light":
        case "tool":
        case "container":
        case "medicine":
        case "hunting":
            html += `
            <tr>
                <th style="text-align:left;width: 20%">${game.i18n.localize("DoD.gearTypeName." + type)}</th>
                <th style="text-align:center">${game.i18n.localize("DoD.gear.cost")}</th>
                <th>${game.i18n.localize("DoD.gear.supply")}</th>
                <th style="text-align:center">${game.i18n.localize("DoD.gear.weight")}</th>
                <th>${game.i18n.localize("DoD.gear.effect")}</th>
            </tr>`;
            break;

        case "melee":
        case "ranged":
                    html += `
            <tr>
                <th style="text-align:left;width: 20%">${game.i18n.localize("DoD.gearTypeName." + type)}</th>
                <th style="text-align:center">${game.i18n.localize("DoD.weapon.grip")}</th>
                <th style="text-align:center">${game.i18n.localize("DoD.weapon.str")}</th>
                <th style="text-align:center">${game.i18n.localize("DoD.weapon.rangeShort")}</th>
                <th style="text-align:center">${game.i18n.localize("DoD.weapon.damageShort")}</th>
                <th style="text-align:center">${game.i18n.localize("DoD.weapon.durabilityShort")}</th>
                <th style="text-align:center">${game.i18n.localize("DoD.gear.cost")}</th>
                <th>${game.i18n.localize("DoD.gear.supply")}</th>
                <th>${game.i18n.localize("DoD.weapon.features")}</th>
            </tr>`;
            break;
    }


    // Gear
    const regexp = /@Gear\[(.+?)\](?:{(.+?)})?/gm;
    const matches = content.matchAll(regexp);
    for (const match of matches) {
        const uuid = match[1];
        const item = fromUuidSync(uuid);
        const itemName = match[2] ?? item.name;

        switch (type) {
            case "armor":
                html += `
                <tr>
                    <td style="text-align:left">@UUID[${uuid}]{${itemName}}</td>
                    <td style="text-align:center">${item.system.rating}</td>
                    <td style="text-align:center">${item.system.cost}</td>
                    <td>${game.i18n.localize("DoD.supplyTypes." + item.system.supply)}</td>
                    <td>${item.system.banes}</td>
                </tr>`;
                break;

            case "clothes":
            case "service":
            case "travel":
            case "animal":
                html += `
                <tr>
                    <td style="text-align:left">@UUID[${uuid}]{${itemName}}</td>
                    <td style="text-align:center">${item.system.cost}</td>
                    <td>${game.i18n.localize("DoD.supplyTypes." + item.system.supply)}</td>
                    <td>${item.system.description}</td>
                </tr>`;
                break;

            case "instrument":
            case "trade":
            case "knowledge":
            case "light":
            case "tool":
            case "container":
            case "medicine":
            case "hunting":
                html += `
                <tr>
                    <td style="text-align:left">@UUID[${uuid}]{${itemName}}</td>
                    <td style="text-align:center">${item.system.cost}</td>
                    <td>${game.i18n.localize("DoD.supplyTypes." + item.system.supply)}</td>
                    <td style="text-align:center">${item.system.weight}</td>
                    <td>${item.system.description}</td>
                </tr>`;
                break;


            case "melee":
            case "ranged":
                {
                    let range = item.system.range.toString() ?? "";
                    range = range.replace("@str", game.i18n.localize("DoD.attributes.str"));
    
                    html += `
                    <tr>
                        <td style="text-align:left">@UUID[${uuid}]{${itemName}}</td>
                        <td style="text-align:center">${game.i18n.localize(item.system.grip.label)}</td>
                        <td style="text-align:center">${item.system.str > 0 ? item.system.str : "-"}</td>
                        <td style="text-align:center">${range}</td>
                        <td style="text-align:center">${item.system.damage}</td>
                        <td style="text-align:center">${item.system.durability > 0 ? item.system.durability : "-"}</td>
                        <td style="text-align:center">${item.system.cost !== "" ? item.system.cost : "-"}</td>
                        <td>${game.i18n.localize("DoD.supplyTypes." + item.system.supply)}</td>
                        <td class="comma-list">`;
    
                    for (const feature of item.system.features) {
                        html += `<span>${game.i18n.localize("DoD.weaponFeatureTypes." + feature)}</span>`;
                    }
    
                    html += `
                        </td>
                    </tr>`;
                    break;    
                }
        }
    }



    html += `</table>`

    div.innerHTML = await TextEditor.enrichHTML(html, {async: true});
    return div;
}
