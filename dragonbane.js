import { DoD } from "./modules/config.js";
import { DoDActor } from "./modules/actor.js";
import { DoDItem } from "./modules/item.js";
import * as DoDChat from "./modules/chat.js";
import DoDItemSheet from "./modules/item-sheet.js";
import DoDCharacterSheet from "./modules/character-sheet.js";
import DoD_Utility from "./modules/utility.js";
import * as DoDMigrate from "./modules/migrate.js";
import * as DoDMacro from "./modules/macro.js";
import * as DoDJournal from "./modules/journal.js";

function registerHandlebarsHelpers() {
    
    /*
    * Repeat given markup with n times
    */
    Handlebars.registerHelper("times", function(n, block) {
        var result = "";
        for(let i = 0; i < n; ++i) {
            result += block.fn(i);
        }
        return result;
    });

    /*
    * Repeat given markup in the range: from <= @index <= to
    * provides @index for the repeated iteraction
    */
    Handlebars.registerHelper("range", function (from, to, block) {
        var result = "";
        var i;
        var data = {};

        if ( from < to ) {
            for ( i = from; i <= to; i += 1 ) {
                data.index = i;
                result += block.fn(this, {
                    data: data
                });
            }
        } else {
            result = block.inverse(this);
        }
        return result;
    });    
}

async function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/dragonbane/templates/partials/hp-widget.hbs",
        "systems/dragonbane/templates/partials/wp-widget.hbs",
        "systems/dragonbane/templates/partials/character-sheet-main.hbs",
        "systems/dragonbane/templates/partials/character-sheet-skills.hbs",
        "systems/dragonbane/templates/partials/character-sheet-abilities.hbs",
        "systems/dragonbane/templates/partials/character-sheet-inventory.hbs",
        "systems/dragonbane/templates/partials/character-sheet-background.hbs",
        "systems/dragonbane/templates/partials/monster-sheet-main.hbs",
        "systems/dragonbane/templates/partials/npc-sheet-main.hbs",
        "systems/dragonbane/templates/partials/npc-sheet-skills.hbs",
        "systems/dragonbane/templates/partials/npc-sheet-inventory.hbs",
        "systems/dragonbane/templates/partials/roll-dialog.hbs",
        "systems/dragonbane/templates/partials/damage-roll-message.hbs",
        "systems/dragonbane/templates/partials/skill-roll-message.hbs",
        "templates/dice/roll.html",
        "systems/dragonbane/templates/partials/roll-no-total.hbs",
    ];

    return loadTemplates(templatePaths);
}

function registerSettings() {
    console.log ("Dragonbane: Registering settings");

    // If true, keeps permission on assets when re-importing them
    game.settings.register("dragonbane", "keepOwnershipOnImport", {
        name: "DoD.SETTINGS.keepOwnershipOnImport",
        hint: "DoD.SETTINGS.keepOwnershipOnImportHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    // Most recent system version
    game.settings.register("dragonbane", "systemVersion", {
        config: false,
        scope: "world",
        type: String,
        default: ""
    });

    // Most recent data format version
    game.settings.register("dragonbane", "systemMigrationVersion", {
        config: false,
        scope: "world",
        type: String,
        default: ""
    });

    // The core module registers itself here, could be different language versions.
    game.settings.register("dragonbane", "coreModuleCompendium", {
        config: false,
        scope: "world",
        type: String,
        default: ""
    });

    game.settings.register("dragonbane", "magicMishapTable", {
        config: false,
        scope: "world",
        type: String,
        default: ""
    });

    game.settings.register("dragonbane", "meleeMishapTable", {
        config: false,
        scope: "world",
        type: String,
        default: ""
    });

    game.settings.register("dragonbane", "rangedMishapTable", {
        config: false,
        scope: "world",
        type: String,
        default: ""
    });

    game.settings.register("dragonbane", "treasureTable", {
        config: false,
        scope: "world",
        type: String,
        default: ""
    });
}

Hooks.once("init", function() {
    console.log("DoD | Initializing Dragonbane System");
    
    CONFIG.DoD = DoD;

    CONFIG.Actor.documentClass = DoDActor;
    CONFIG.Item.documentClass = DoDItem;

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("DoD", DoDCharacterSheet, {makeDefault: true});

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("DoD", DoDItemSheet, {makeDefault: true});

    registerHandlebarsHelpers();
    preloadHandlebarsTemplates();

    registerSettings();

    game.dragonbane = {
        migrateWorld: DoDMigrate.migrateWorld,
        //updateSpells: DoDMigrate.updateSpellsOnActors,
        //updateSkills: DoDMigrate.updateSkillsOnActors,
        //updateImages: DoDMigrate.updateItemImagesOnActors,
        rollItem: DoDMacro.rollItemMacro,
        monsterAttack: DoDMacro.monsterAttackMacro,
        monsterDefend: DoDMacro.monsterDefendMacro,
        drawTreasureCards: DoD_Utility.drawTreasureCards
    };
});

Hooks.once("ready", async function () {

    Hooks.on("hotbarDrop", (bar, data, slot) => {
        if (data.type == "Item") {
            DoDMacro.createItemMacro(data, slot);
            return false;
        }
    });

    // Migration
    if (game.user.isGM) {
        const SYSTEM_MIGRATION_VERSION = 0.01;
        const currentVersion = game.settings.get("dragonbane", "systemMigrationVersion");
        const needsMigration = !currentVersion || isNewerVersion(SYSTEM_MIGRATION_VERSION, currentVersion);
    
        if (needsMigration) {
            DoDMigrate.migrateWorld();
            game.settings.set("dragonbane", "systemMigrationVersion", SYSTEM_MIGRATION_VERSION);
        }
    }

    // If this is a new version, prompt adventure import
    if (game.user.isGM) {
        const systemVersion = game.settings.get("dragonbane", "systemVersion");
        if (!systemVersion || isNewerVersion(game.system.version, systemVersion)) {
            const pack = game.packs.get("dragonbane.dragonbane-drakar-och-demoner-system");
            const adventureId = pack?.index.contents[0]._id;
            if (adventureId) {
                const adventure = await pack.getDocument(adventureId);
                await adventure.sheet.render(true);
                game.settings.set("dragonbane", "systemVersion", game.system.version);
            }
        }    
    }

    // Show welcome journal when importing the adventure
    Hooks.on('importAdventure', async (created, updated) => {
        const ADVENTURE_NAME = "Dragonbane / Drakar och Demoner - System";
        if (created?.name == ADVENTURE_NAME) {
            const title = "(" + game.i18n.lang.toLowerCase() + ")";
            const adventureJournal = created.journal.find(j => j.name.toLowerCase().includes(title));
            if (adventureJournal) {
                const gameJournal = game.journal.get(adventureJournal.id);
                gameJournal?.show();
            }
        }
        console.log("Dragonbane: Imported " + created.name);
    });
});

Hooks.on("renderChatLog", DoDChat.addChatListeners);
Hooks.on("getChatLogEntryContext", DoDChat.addChatMessageContextMenuOptions);

Hooks.on("renderJournalPageSheet", (obj, html, data) => {
    html.on('click contextmenu', '.table-roll', DoD_Utility.handleTableRoll.bind(DoD_Utility));
    html.on("click", ".inline-damage-roll", DoDChat.onInlineDamageRoll);
    html.on("click", ".treasure-roll", DoDChat.onTreasureRoll);
});

Hooks.on("preImportAdventure", (_adventure, _formData, _toCreate, toUpdate) => {
    const keepOwnership = game.settings.get("dragonbane", "keepOwnershipOnImport");
    if (keepOwnership) {
        // Ignore ownership when updating data
        for ( const [_documentName, updateData] of Object.entries(toUpdate) ) {
            for (let data of updateData) {
                if (data.ownership) {
                    delete data.ownership;
                }
            }
        }
    }
    return true;
});

CONFIG.TextEditor.enrichers = CONFIG.TextEditor.enrichers.concat([
    {
        // Rollable damage
        // Format [[/damage <formula> [<slashing|piercing|bludgeoning>]]]
        pattern : /\[\[\/damage\s((?:\d+)?[dD](?:\d+)(?:[\+\-]\d+)?)\s?(slashing|piercing|bludgeoning)?(?:\s(.+))?\]\]/gm,
        enricher : (match, options) => {
            const a = document.createElement("a");
            a.classList.add("inline-roll");
            a.classList.add("inline-damage-roll");
            a.dataset.damage = match[1];
            a.dataset.damageType = "DoD.damageTypes." + (match[2] ?? "none");
            if (options.actor) a.dataset.actorId = options.actor.uuid;
            if (match[3]) a.dataset.action = match[3];

            a.innerHTML = `<i class="fas fa-dice-d20"></i>` + match[1] + " " + game.i18n.localize(a.dataset.damageType);
            return a;
        }
    },
    {
        // Rollable table
        pattern : /@Table\[(.+?)\](?:{(.+?)})?/gm,
        enricher : (match, options) => {
            const table = DoD_Utility.findTable(match[1]);
            const tableName = match[2] ?? table?.name;
            const a = document.createElement("a");
            if (table) {
                a.classList.add("inline-roll");
                a.classList.add("table-roll");
                a.dataset.tableId = table.uuid;
                a.dataset.tableName = table.name;
                a.innerHTML = `<i class="fas fa-dice-d20"></i><i class="fas fa-th-list"></i> ${tableName}`;
            } else {
                a.dataset.tableId = match[1];
                if (match[2]) a.dataset.tableName = match[2];
                a.classList.add("content-link");
                a.classList.add("broken");
                a.innerHTML = `<i class="fas fa-unlink"></i> ${tableName}`;
            }
            return a;
        }
    },
    {
        // Rollable treasure
        // Format [[/treasure <number>]]
        pattern : /\[\[\/treasure(\s[\d]+)?\]\]/gm,
        enricher : (match, options) => {
            const count = match[1] ?? 1;
            const a = document.createElement("a");
            a.classList.add("inline-roll");
            a.classList.add("treasure-roll");
            a.dataset.count = count;

            let text = "DoD.ui.chat.treasureCard";
            if (count > 1) text += "s";
            a.innerHTML = `<i class="fas fa-dice-d20"></i> ${game.i18n.format(text, {count: count})}`;
            return a;
        }
    },
    {
        pattern : /@DisplayAbility\[(.+?)\](?:{(.+?)})?/gm,
        enricher : DoDJournal.enrichDisplayAbility
    },
    {
        pattern : /@DisplayMonster\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayMonster
    },
    {
        pattern : /@DisplayMonsterCard\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayMonsterCard
    },
    {
        pattern : /@DisplayMonsterDescription\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayMonsterDescription
    },
    {
        pattern : /@DisplayMonsterDescriptionCard\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayMonsterDescriptionCard
    },
    {
        pattern : /@DisplayNpc\[(.+?)\](?:{(.+?)})?/gm,
        enricher : DoDJournal.enrichDisplayNpc
    },
    {
        pattern : /@DisplayNpcCard\[(.+?)\](?:{(.+?)})?/gm,
        enricher : DoDJournal.enrichDisplayNpcCard
    },
    {
        pattern : /@DisplayNpcDescription\[(.+?)\](?:{(.+?)})?/gm,
        enricher : DoDJournal.enrichDisplayNpcDescription
    },
    {
        pattern : /@DisplaySkill\[(.+?)\](?:{(.+?)})?/gm,
        enricher : DoDJournal.enrichDisplaySkill
    },
    {
        pattern : /@DisplaySpell\[(.+?)\](?:{(.+?)})?/gm,
        enricher : DoDJournal.enrichDisplaySpell 
    },
    {
        pattern : /@DisplayTable\[(.+?)\](?:{(.+?)})?/gm,
        enricher : DoDJournal.enrichDisplayTable
    },
    {
        pattern : /@DisplayTrick\[(.+?)\](?:{(.+?)})?/gm,
        enricher : DoDJournal.enrichDisplayTrick
    },
    {
        pattern : /@GearTableStart\[(.+?)\](?:{(.+?)})((?:(?!@GearTableEnd)[\S\s])+)@GearTableEnd/gm,
        enricher : DoDJournal.enrichGearTable
    }
]);

