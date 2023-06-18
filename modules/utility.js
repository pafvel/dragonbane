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
        if (attribute <=12) return "0";
        if (attribute <=16) return game.i18n.localize("DoD.dice.d4");
        return game.i18n.localize("DoD.dice.d6");
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
        // Get skills from core module compendium
        const compendiumUuid = game.settings.get("dragonbane", "coreModuleCompendium");
        if (compendiumUuid) {
            const compendium = await fromUuid(compendiumUuid);
            if (compendium) {
                let skills = compendium.items.filter(i => i.type == "skill" && (i.system.skillType == "core" || i.system.skillType == "weapon"));
                skills = Array.from(skills);
                return skills.map(skill => skill.toObject());
            }
        }

        // If no compendium, look for skills in the active game
        let skills = game.items.filter(i => i.type == "skill" && (i.system.skillType == "core" || i.system.skillType == "weapon"));
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
        let table = game.tables.find(i => i.name.toLowerCase() == name.toLowerCase()) || fromUuidSync(name);
        if (!table) {
            if (!options?.noWarnings){
                DoD_Utility.WARNING("DoD.WARNING.tableNotFound", {id: name});
            }
            return null;    
        }
        if (!table instanceof RollTable) {
            if (!options?.noWarning){
                DoD_Utility.WARNING("DoD.WARNING.typeMismatch", {id: name});
            }
            return null;    
        }
        return table;
    }

    static findSystemTable(settingName, tableName) {
        const tableId = game.settings.get("dragonbane", settingName);
        let tableUuid = "RollTable." + tableId;
        let table = DoD_Utility.findTable(tableUuid, {noWarnings: true});
        if (!table) {
            table = DoD_Utility.findTable(tableName, {noWarnings: true});
        }
        return table;
    }

    static async findItem(itemName, itemType, collection) {
        let name = itemName.toLowerCase();
        let item = collection.find(i => i.type == itemType && i.name.toLowerCase() == name);
        return item?.clone();
    }

    static getActorFromUUID(uuid) {
        let doc = null;
        try {
            doc = fromUuidSync(uuid);
        } catch (err) {
            DoD_Utility.WARNING(err.message);
        }
        let actor = doc?.actor ?? doc;
        if (!actor) {
            DoD_Utility.WARNING("DoD.WARNING.actorNotFound", {id: uuid});
            return null;    
        }
        return actor;
    }
    
    static splitAndTrimString(str) {
        let result = str?.split(',');
        for (var i = 0; i < result.length; i++) {
            result[i] = result[i].replace(/^\s+|\s+$/gm,'');
        }
        return result;
    }

    static async handleTableRoll(event) {
        const tableId = event.currentTarget.dataset.tableId;
        const tableName = event.currentTarget.dataset.tableName;
        const table = fromUuidSync(tableId) || this.findTable(tableName);
        if (table) {
            if (event.type == "click") { // left click
                table.draw();
            } else { // right click
                table.sheet.render(true);
            }
        }
        event.preventDefault();
        event.stopPropagation();
    }
    
    static async monsterAttack(actor, table) {

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

        const draw = await actor.drawMonsterAttack(table);
        const results = draw.results;
        const roll = draw.roll;

        if (results.length == 0) {
            return;
        }          

        // Construct chat data
        const flavorKey = "DoD.ui.character-sheet.monsterAttackFlavor";
        let messageData = {
            flavor: game.i18n.format(flavorKey, {actor: actor.name, table: table.name}),
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({token: this.token}),
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            roll: roll,
            sound: CONFIG.sounds.dice,
            flags: {"core.RollTable": table.id}
        };

        // Copy results to avoid modifying table
        let messageResults = await results.map(result => {
            const r = result.toObject(false);
            r.text = result.getChatText();
            r.icon = result.icon;
            return r;
        });
        // Enrich HTML with knowledge of actor
        for (let r of messageResults) {
            r.text = await TextEditor.enrichHTML(r.text, {actor: actor, async: true});                
        }

        // Render the chat card which combines the dice roll with the drawn results
        messageData.content = await renderTemplate(CONFIG.RollTable.resultTemplate, {
            description: await TextEditor.enrichHTML(table.description, {documents: true, async: true}),
            results: messageResults,
            rollHTML: table.displayRoll && roll ? await roll.render() : null,
            table: table
        });

        // Create the chat message
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
        
        const tableId = game.settings.get("dragonbane", "treasureTable");
        const table = DoD_Utility.findTable("RollTable." + tableId);

        if (!table) { 
            DoD_Utility.WARNING(game.i18n.localize("DoD.WARNING.noTreasureTable"));
            return;
        }
        
        const count = DoD_Utility.clamp(number, 1, table.results.size);

        // RollTable.drawMany doesn't work with nested tables, using this as workaround
        async function drawMany(t, cnt) {
            const results = [];
            const rolls = [];

            // Draw one at a time
            for (let i = 0; i < cnt; ++i) {
                const draw = await t.draw({displayChat: false});
                rolls.push(draw.roll);
                results.push(draw.results[0]);
            }
            // Construct a Roll object using the constructed pool
            const pool = PoolTerm.fromRolls(rolls);
            const roll = Roll.defaultImplementation.fromTerms([pool]);

            // Display results and reset table
            await t.toMessage(results, {roll: roll});
            await t.resetResults();        
        };
        drawMany(table, count);
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
}
