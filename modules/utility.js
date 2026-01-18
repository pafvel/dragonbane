import DoDActorSettings from "./apps/actor-settings.js";
import DoDCoreSettings from "./apps/core-settings.js";
import DoDSkillTest from "./tests/skill-test.js";

export default class DoD_Utility {

    static clamp(value, min, max) {
        if(value < min) {
            return min;
        } else if (value > max) {
            return max;
        } else {
            return value;
        }
    };

    static nameSorter(a, b) {
        let aa = a.name.toLowerCase();
        let bb = b.name.toLowerCase();
        if (aa < bb)
            return -1;
        if (aa > bb)
            return 1;
        return 0;
    }

    static itemSorter(a, b) {
        return a.sort - b.sort;
    }

    static calculateBaseChance(attribute) {
        if (attribute <=0) return 0;
        if (attribute <=5) return 3;
        if (attribute <= 8) return 4;
        if (attribute <= 12) return 5;
        if (attribute <= 15) return 6;
        return 7;
    }

    static calculateDamageBonus(attribute) {
        const DoD = CONFIG.DoD;
        if (attribute <=12) {
            return DoD.dice.none;
        } else if (attribute <=16) {
            return DoD.dice.d4;
        } else {
            return DoD.dice.d6;
        }
    }

    static calculateMovementModifier(attribute) {
        if (attribute <=6) return -4;
        if (attribute <=9) return -2;
        if (attribute <= 12) return 0;
        if (attribute <= 15) return 2;
        return 4;
    }

    static getConditionByAttributeName(actor, attributeName) {
        return actor.system.conditions[attributeName];
    }

    static async getBaseSkills() {
        if (!DoDActorSettings.useWorldSkills) {
            // Get skills from core module compendium
            const compendiumName = game.settings.get("dragonbane", "coreModuleCompendium");
            const pack = game.packs.get(compendiumName + "." + compendiumName);
            if (pack) {
                let skills = [];
                for (let content of pack.index.contents) {
                    const adventure = await pack.getDocument(content._id);
                    skills = skills.concat(Array.from(adventure.items.filter(i => i.type === "skill" && (i.system.skillType === "core" || i.system.skillType === "weapon"))));
                }
                skills = Array.from(skills);
                if (skills.length > 0) {
                    return skills.map(skill => skill.toObject());
                } else {
                    DoD_Utility.WARNING("DoD.WARNING.noSkillsInCompendium");
                }
            }
        }

        // If no compendium, look for skills in the active game
        let skills = game.items.filter(i => i.type === "skill" && (i.system.skillType === "core" || i.system.skillType === "weapon"));
        return skills.map(skill => skill.toObject());
    }

    static async findAbility(abilityName) {
        // Prio 1: World items
        let ability = this.findItem(abilityName, "ability", game.items);
        return ability;
    }

    static async findKin(kinName) {
        // Prio 1: World items
        let kin = this.findItem(kinName, "kin", game.items);
        return kin;
    }

    static async findMonster(monsterUUID) {
        const monster = this.getActorFromUUID(monsterUUID);
        return monster;
    }

    static async findSkill(skillName) {
        // Prio 1: World items
        let kin = this.findItem(skillName, "skill", game.items);
        return kin;
    }

    static async findProfession(professionName) {
        // Prio 1: World items
        let kin = this.findItem(professionName, "profession", game.items);
        return kin;
    }

    static findTable(name, options) {
        if (!name) return null;
        
        let table = game.tables.find(i => i.name.toLowerCase() === name.toLowerCase()) || fromUuidSync(name);
        if (!table) {
            if (!options?.noWarnings){
                console.log(game.i18n.format(game.i18n.localize("DoD.WARNING.tableNotFound"), {id: name}));
                //DoD_Utility.WARNING("DoD.WARNING.tableNotFound", {id: name});
            }
            return null;
        }
        if (!(table instanceof RollTable)) {
            if (!options?.noWarning){
                console.log(game.i18n.format(game.i18n.localize("DoD.WARNING.typeMismatch"), {id: name}));
                //DoD_Utility.WARNING("DoD.WARNING.typeMismatch", {id: name});
            }
            return null;
        }
        return table;
    }

    static findSystemTable(settingName, tableName) {
        const tableId = DoDCoreSettings[settingName];
        let table = DoD_Utility.findTable(tableId, {noWarnings: true});
        if (!table) {
            table = DoD_Utility.findTable("RollTable." + tableId, {noWarnings: true});
        }
        if (!table && tableName) {
            table = DoD_Utility.findTable(tableName, {noWarnings: true});
        }
        return table;
    }

    static async findItem(itemName, itemType, collection) {
        let name = itemName.toLowerCase();
        let item = collection.find(i => i.type === itemType && i.name.toLowerCase() === name);
        return item?.clone();
    }

    static getActorFromUUID(uuid, options = {noWarnings: false}) {
        let doc = null;
        try {
            doc = fromUuidSync(uuid);
        } catch (err) {
            if(!options.noWarnings) {
                DoD_Utility.WARNING(err.message);
            }

        }
        let actor = doc?.actor ?? doc;
        if (!actor) {
            if(!options.noWarnings) {
                DoD_Utility.WARNING("DoD.WARNING.actorNotFound", {id: uuid});
            }
            return null;
        }
        return actor;
    }

    static splitAndTrimString(str) {
        let result = str?.split(',');
        for (let i = 0; i < result.length; i++) {
            result[i] = result[i].replace(/^\s+|\s+$/gm,'');
        }
        return result;
    }

    static async handleTableRoll(event) {
        const tableId = event.target.dataset.tableId;
        const tableName = event.target.dataset.tableName;
        const table = fromUuidSync(tableId) || this.findTable(tableName);
        if (table) {
            if (event.type === "click") { // left click
                table.draw();
            } else { // right click
                table.sheet.render(true);
            }
        }
        event.preventDefault();
        event.stopPropagation();
    }

    static async expandTableResult(tableResult)
    {
        // Recursive roll if the result is a table
        if (tableResult && tableResult.type === CONST.TABLE_RESULT_TYPES.DOCUMENT) {
            if ( this.getTableResultType(tableResult) === "RollTable" ) {
                const tableId = foundry.utils.parseUuid(tableResult.documentUuid).id;
                const innerTable = game.tables.get(tableId);
                if (innerTable) {
                    const innerRoll = await innerTable.roll();
                    return innerRoll.results;
                }
            }
        }
        return [tableResult];
    }

    static async monsterAttackTable(actor, table)
    {
        if (!actor) {
            return;
        }

        if (!table) {
            table = actor.system.attackTable ? fromUuidSync(actor.system.attackTable) : null;
            if (!table) {
                DoD_Utility.WARNING("DoD.WARNING.missingMonsterAttackTable");
                return;
            }
        }

        let attacks = [];
        for (let tableResult of table.results) {
            attacks.push({result: tableResult, skip: tableResult.uuid === actor.system.previousMonsterAttack});
        }

        return table.sheet.render(true);
    }

    static async monsterAttack(actor, table, tableResult = null) {

        if (!actor) {
            return;
        }

        if (!table) {
            table = actor.system.attackTable ? fromUuidSync(actor.system.attackTable) : null;
            if (!table) {
                DoD_Utility.WARNING("DoD.WARNING.missingMonsterAttackTable");
                return;
            }
        }

        const draw = await actor.drawMonsterAttack(table, tableResult);
        const results = draw.results;
        const roll = draw.roll;

        if (results.length === 0) {
            return;
        }

        // Construct chat data
        const flavorKey = "DoD.ui.character-sheet.monsterAttackFlavor";
        let messageData = {
            flavor: game.i18n.format(flavorKey, {actor: actor.name, table: table.name}),
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({token: this.token}),
            sound: CONFIG.sounds.dice,
            flags: {"core.RollTable": table.id}
        };

        // Copy results to avoid modifying table
        let messageResults = [];
        for (let result of results) {
            const r = result.toObject(false);
            const chatText = await result.description;

            r.description = result.parent.id !== table.id ? result.parent.description + "<p>" + chatText + "</p>" : chatText;;
            r.icon = result.icon;
            messageResults.push(r);
        }
        // Enrich HTML with knowledge of actor
        for (let r of messageResults) {
            r.details = await CONFIG.DoD.TextEditor.enrichHTML(r.description, {actor: actor, async: true});
        }

        // Render the chat card which combines the dice roll with the drawn results
        messageData.content = await DoD_Utility.renderTemplate(CONFIG.RollTable.resultTemplate, {
            description: await CONFIG.DoD.TextEditor.enrichHTML(table.description, {documents: true, async: true}),
            results: messageResults,
            rollHTML: table.displayRoll && roll ? await roll.render() : null,
            table: table
        });
  
        // Create the chat message
        ChatMessage.applyRollMode(messageData, game.settings.get("core", "rollMode"));
        return ChatMessage.create(messageData);
    }

    static async monsterDefend(actor) {
        if (!actor) {
            return;
        }
        const skill = {
            name: game.i18n.localize("DoD.ui.character-sheet.monsterDefendSkillFlavor"),
            system: {value: 15}
        }
        const test = new DoDSkillTest(actor, skill, {skipDialog: true});
        await test.roll();
    }

     static async drawTreasureCards(number) {
        const table = DoD_Utility.findSystemTable("treasureTable");
        const count = table ? DoD_Utility.clamp(number, 1, table.results.size) : 0;

        if (!table || count === 0) {
            DoD_Utility.WARNING(game.i18n.localize("DoD.WARNING.noTreasureTable"));
            return;
        }

        const results = [];
        const rolls = [];

        // Force replacement to avoid modifying the table
        const replacement = table.replacement
        table.replacement = true;

        // Draw one at a time
        let reRolls = 100; // re-roll duplicates up to this many times
        while (results.length < count) {
            const draw = await table.draw({displayChat: false});
            // add results if they are unique or we have run out of re-rolls
            if (results.findIndex(r => r.id === draw.results[0].id) === -1 || reRolls === 0) {
                rolls.push(draw.roll);
                results.push(draw.results[0]);
            } else {
                --reRolls;
            }
        }

        // Restore replacement
        table.replacement = replacement;

        // Construct a Roll object using the constructed pool
        const pool = foundry.dice.terms.PoolTerm.fromRolls(rolls);
        const roll = Roll.defaultImplementation.fromTerms([pool]);

        // Display results
        await table.toMessage(results, {roll: roll});
    }

    static getViewDamagePermission() {
        const permissionValue = game.settings.get("dragonbane", "viewDamagePermission");
        function getKeyByValue(object, value) {
            return Object.keys(object).find(key =>
                object[key] === value);
        }
        return getKeyByValue(CONST.DOCUMENT_OWNERSHIP_LEVELS, permissionValue);
    }

    static removeEnrichment(text) {
        return text.replace(/@(.+?)\[(.+?)\]{(.+?)}/gm, "$3");
    }
    static removeHtml(html) {
        return html.replace(/(<([^>]+)>)/gi, "");
    }
    static INFO(msg, params) {
        if (!params) {
            return ui.notifications.info(game.i18n.localize(msg));
        } else {
            return ui.notifications.info(game.i18n.format(game.i18n.localize(msg), params));
        }
    }

    static WARNING(msg, params) {
        if (!params) {
            return ui.notifications.warn(game.i18n.localize(msg));
        } else {
            return ui.notifications.warn(game.i18n.format(game.i18n.localize(msg), params));
        }
    }

    static ERROR(msg, params) {
        if (!params) {
            return ui.notifications.error(game.i18n.localize(msg));
        } else {
            return ui.notifications.error(game.i18n.format(game.i18n.localize(msg), params));
        }
    }

    static addHtmlEventListener(html, eventNames, selector, eventHandler, { capture = false } = {}) {
    for (const eventName of eventNames.split(/\s+/)) {
        const wrappedHandler = (e) => {
        if (!e.target) return;
        const target = e.target.closest(selector);
        if (target) eventHandler.call(target, e);
        };
        html.addEventListener(eventName, wrappedHandler, { capture });
    }
    }

    static async renderTemplate(path, data) {
        return foundry.applications.handlebars.renderTemplate(path, data);
    }

    static getTableResultType(result) {
        if (result?.type === "document") {
            return foundry.utils.parseUuid(result.documentUuid).type;
        } else {
            return result?.type;
        }
    }

    static getTableResultId(result) {
        if (result?.type === "document") {
            return foundry.utils.parseUuid(result.documentUuid).id;
        } else {
            return null;
        }
    }

    static getAttributeFromDamageBonus(damageBonus) {
        switch (damageBonus) {
            case "d4":
                return 14;
            case "d6":
            case "d8":
            case "d10":
            case "d12":
            case "d20":
                return 17;
            default:
                return 10;
        }
    }

    // Calculate separation between tokens by displacing center points to account for token size
    static calculateDistanceBetweenTokens(tokenA, tokenB) {

        // helper function to calculate distance from the token center point 
        // to the center of the grid cell just inside edge of the token
        function tokenDisplacement(token) {
            return {
                x: (token.width - 1) * 0.5 * token.parent.grid.size,
                y: (token.height - 1) * 0.5 * token.parent.grid.size
            }
        }

        // Find center points and displacements
        let centerA = tokenA.getCenterPoint();
        let centerB = tokenB.getCenterPoint();
        const displacementA = tokenDisplacement(tokenA);
        const displacementB = tokenDisplacement(tokenB);

        // Displace target center point towards actor center point
        if (centerA.x < centerB.x) {
            centerB.x -= Math.min(displacementB.x, centerB.x - centerA.x);
        } else if (centerA.x > centerB.x) {
            centerB.x += Math.min(displacementB.x, centerA.x - centerB.x);
        }
        if (centerA.y < centerB.y) {
            centerB.y -= Math.min(displacementB.y, centerB.y - centerA.y);
        } else if (centerA.y > centerB.y) {
            centerB.y += Math.min(displacementB.y, centerA.y - centerB.y);
        }

        // Displace actor center point towards new target center point
        if (centerA.x < centerB.x) {
            centerA.x += Math.min(displacementA.x, centerB.x - centerA.x);
        } else if (centerA.x > centerB.x) {
            centerA.x -= Math.min(displacementA.x, centerA.x - centerB.x);
        }
        if (centerA.y < centerB.y) {
            centerA.y += Math.min(displacementA.y, centerB.y - centerA.y);
        } else if (centerA.y > centerB.y) {
            centerA.y -= Math.min(displacementA.y, centerA.y - centerB.y);
        }

        // Measure distance between adjusted center points
        return  Math.round(canvas.grid.measurePath([centerA, centerB]).distance);
    }        
}
