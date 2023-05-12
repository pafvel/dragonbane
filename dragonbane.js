import { DoD } from "./modules/config.js";
import { DoDActor } from "./modules/actor.js";
import { DoDItem } from "./modules/item.js";
import * as DoDChat from "./modules/chat.js";
import DoDItemSheet from "./modules/item-sheet.js";
import DoDCharacterSheet from "./modules/character-sheet.js";
import DoD_Utility from "./modules/utility.js";
import * as DoDMigrate from "./modules/migrate.js";

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

    game.settings.register("dragonbane", "keepOwnershipOnImport", {
        name: "DoD.SETTINGS.keepOwnershipOnImport",
        hint: "DoD.SETTINGS.keepOwnershipOnImportHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("dragonbane", "systemMigrationVersion", {
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
        updateSpells: DoDMigrate.updateSpellsOnActors,
        updateSkills: DoDMigrate.updateSkillsOnActors,
        updateImages: DoDMigrate.updateItemImagesOnActors
    };
});

Hooks.once("ready", function () {

    if (!game.user.isGM) {
        return;
    }

    const SYSTEM_MIGRATION_VERSION = 0.01;
    const currentVersion = game.settings.get("dragonbane", "systemMigrationVersion");
    const needsMigration = !currentVersion || isNewerVersion(SYSTEM_MIGRATION_VERSION, currentVersion);

    if (needsMigration) {
        DoDMigrate.migrateWorld();
        game.settings.set("dragonbane", "systemMigrationVersion", SYSTEM_MIGRATION_VERSION);
    }
});

Hooks.on("renderChatLog", DoDChat.addChatListeners);
Hooks.on("getChatLogEntryContext", DoDChat.addChatMessageContextMenuOptions);

Hooks.on("renderJournalPageSheet", (obj, html, data) => {
    html.on('click contextmenu', '.table-roll', DoD_Utility.handleTableRoll.bind(DoD_Utility));
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
    }
]);

