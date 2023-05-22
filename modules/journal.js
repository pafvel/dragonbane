import DoD_Utility from "./utility.js";

export async function enrichDisplayAbility (match, options) {
    const ability = fromUuidSync(match[1]);
    const abilityName = match[2] ?? ability?.name;
    const a = document.createElement("div");
    if (ability) {
        let html = `
        <div class="display-ability">
            <h4>@UUID[${match[1]}]{${ability.name}}</h4>
            <ul>
                <li><b>${game.i18n.localize("DoD.ability.requirement")}: </b><span>${ability.system.requirement}</span>
                <li><b>${game.i18n.localize("DoD.ability.wp")}: </b><span>${ability.system.wp}</span>
            </ul>
            ${ability.system.description}
        </div>`;
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

export async function enrichDisplayMonster (match, options) {
    const monster = await DoD_Utility.findMonster(match[1]);
    const monsterName = match[2] ?? monster?.name;
    const a = document.createElement("div");
    if (monster) {
        let html = `
        <div>
            <img src="${monster.img}">
            ${monster.system.description}
        </div>
        <div class="display-monster">
            <div class="monster-title">@UUID[${monster.uuid}]{${monsterName}}</div>
            <table>
                <tr>
                    <td><b>Handlingskraft: </b>${monster.system.ferocity}</td>
                    <td><b>Förflyttning: </b>${monster.system.movement}</td>
                </tr>
                <tr>
                    <td><b>Storlek: </b>${game.i18n.localize("DoD.sizeTypes." + monster.system.size)}</td>
                    <td><b>Skydd: </b>${monster.system.armor}</td>
                    <td><b>KP: </b>${monster.system.hitPoints.max}</td>
                </tr>
            </table>
            <div>
                ${monster.system.traits}
            </div>
        </div>`;
        a.innerHTML = await TextEditor.enrichHTML(html, {async: true});
    } else {
        a.dataset.monsterId = match[1];
        if (match[2]) a.dataset.monsterName = match[2];
        a.classList.add("content-link");
        a.classList.add("broken");
        a.innerHTML = `<i class="fas fa-unlink"></i> ${monsterName}`;
    }
    return a;
}

export async function enrichDisplayNpcCard(match, options) {
    const npc = await DoD_Utility.getActorFromUUID(match[1]);
    const npcName = match[2] ?? npc?.name;
    const a = document.createElement("div");
    if (npc) {
        let html = `
        <div class="display-npc">
            <div class="npc-title">@UUID[${npc.uuid}]{${npcName}}</div>
            <table>
                <tr><td>
                    
                    <div class="flexrow">
                        <div><b>${game.i18n.localize("DoD.ui.character-sheet.movement")}:&nbsp</b>${npc.system.movement}</div>`

        if (npc.getDamageBonus("str") != "") {
            html += `<div><b>${game.i18n.localize("DoD.ui.character-sheet.damageBonusSTR")}:&nbsp</b><span style="text-transform:uppercase">${npc.getDamageBonus("str")}</span></div>`;
        }
        if (npc.getDamageBonus("agi") != "") {
            html += `<div><b>${game.i18n.localize("DoD.ui.character-sheet.damageBonusAGL")}:&nbsp</b><span style="text-transform:uppercase">${npc.getDamageBonus("agi")}</span></div>`;
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
        
        html += `
                    </div>
                </td></tr>
                <tr><td>
                    <div class="flexrow">
                        <div><b>${game.i18n.localize("DoD.ui.character-sheet.armor")}:&nbsp</b>${armor}</div>
                        <div><b>${game.i18n.localize("DoD.ui.character-sheet.hp")}:&nbsp</b>${npc.system.hitPoints.max}</div>`;
        
        if (npc.hasAbilities) {
            html += `<div><b>${game.i18n.localize("DoD.ui.character-sheet.wp")}:&nbsp</b>${npc.system.willPoints.max}</div>`;
        }
        html += `
                    </div>
                </td></tr>`;


        // Skills
        // Only show skills if there is no weapon equipped using that skill
        const equippedWeapons = npc.getEquippedWeapons();
        const skills = npc.system.trainedSkills.filter(s => {
            if (s.system.skillType != "weapon") return true;
            if (equippedWeapons.find(w => w.system.skill.name == s.name) != null) return false;
            return true;
        });
        if (skills.length > 0) {
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

        // Abilities
        if (npc.hasAbilities) {
            const abilities = npc.items.filter(i => i.type == "ability");
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
        
        // Spells
        if (npc.hasSpells) {
            const spells = npc.items.filter(i => i.type == "spell");
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


        html += `
            </table>
            <div>
                ${npc.system.traits}
            </div>
        </div>`;
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

export async function enrichDisplayNpcDescription (match, options) {
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


export async function enrichDisplaySkill (match, options) {
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

export async function enrichDisplaySpell (match, options) {
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
            <li><b>${game.i18n.localize("DoD.spell.prerequisite")}: </b><span>${spell.system.prerequisite != "" ? spell.system.prerequisite : "-"}</span>
            <li><b>${game.i18n.localize("DoD.spell.requirement")}: </b><span>${spell.system.requirement != "" ? spell.system.requirement : "-"}</span>
            <li><b>${game.i18n.localize("DoD.spell.castingTime")}: </b><span>${game.i18n.localize("DoD.castingTimeTypes." + spell.system.castingTime)}</span>
            <li><b>${game.i18n.localize("DoD.spell.range")}: </b><span>${range}</span>
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

export async function enrichDisplayTable (match, options) {
    const table = DoD_Utility.findTable(match[1]);
    const tableName = match[2] ?? table?.name;
    const a = document.createElement("div");
    if (table) {
        a.classList.add("display-table");
        let html = `
        <table>
            <caption>@Table[${match[1]}]{${tableName}}</caption>
            <tr>
                <th>[[/roll ${table.formula}]]</th>
                <th>${game.i18n.localize("DoD.journal.tableResult")}</th>
            </tr>`;
        for (let result of table.results) {
            html += `
            <tr>
                <td>${result.range[0]}`;
            if (result.range[1] != result.range[0]) {
                html += ` - ${result.range[1]}`;
            }
            if (result.documentCollection == "RollTable") {
                let subTable = DoD_Utility.findTable(result.text);
                if (subTable?.uuid != table.uuid) {
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
            } else if (result.documentCollection == "Item") {
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

export async function enrichDisplayTrick(match, options) {
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
