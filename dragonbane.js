import { DoDActor } from "./modules/actor.js";
import DoDCharacterSheet from "./modules/character-sheet.js";
import * as DoDChat from "./modules/chat.js";
import { DoD } from "./modules/config.js";
import DoDItemSheet from "./modules/item-sheet.js";
import { DoDItem } from "./modules/item.js";
import * as DoDJournal from "./modules/journal.js";
import * as DoDMacro from "./modules/macro.js";
import * as DoDMigrate from "./modules/migrate.js";
import DoD_Utility from "./modules/utility.js";
import DoDRoll from "./modules/roll.js";

function registerHandlebarsHelpers() {

    /*
    * Repeat given markup with n times
    */
    Handlebars.registerHelper("times", function (n, block) {
        var result = "";
        for (let i = 0; i < n; ++i) {
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

        if (from < to) {
            for (i = from; i <= to; i += 1) {
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
        "systems/dragonbane/templates/partials/tooltip.hbs",
        "templates/dice/roll.html",
        "systems/dragonbane/templates/partials/roll.hbs",
        "systems/dragonbane/templates/partials/roll-no-total.hbs",
    ];

    return loadTemplates(templatePaths);
}

function registerSettings() {
    console.log("Dragonbane: Registering settings");

    // If true, keeps permission on assets when re-importing them
    game.settings.register("dragonbane", "keepOwnershipOnImport", {
        name: "DoD.SETTINGS.keepOwnershipOnImport",
        hint: "DoD.SETTINGS.keepOwnershipOnImportHint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    // If true, looks for skills in the world instead of the module when creating a new Actor.
    game.settings.register("dragonbane", "useWorldSkillsOnCreateActor", {
        name: "DoD.SETTINGS.useWorldSkillsOnCreateActor",
        hint: "DoD.SETTINGS.useWorldSkillsOnCreateActorHint",
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

    game.settings.register("dragonbane", "configuredYzeCombat", {
        config: false,
        scope: "world",
        type: Boolean,
        default: false
    });

    // User permission levels
    const permissionLevels = {};
    permissionLevels[CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE] = "OWNERSHIP.NONE";
    permissionLevels[CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED] = "OWNERSHIP.LIMITED";
    permissionLevels[CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER] = "OWNERSHIP.OBSERVER";
    permissionLevels[CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER] = "OWNERSHIP.OWNER";

    // Minimum level to view damage applied in messages
    game.settings.register("dragonbane", "viewDamagePermission", {
        name: "DoD.SETTINGS.viewDamagePermission",
        hint: "DoD.SETTINGS.viewDamagePermissionHint",
        scope: "world",
        config: true,
        default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
        type: Number,
        choices: permissionLevels
    });

    // If true, showing the "Select Monster Attack" dialog is default when making a monster attack.
    game.settings.register("dragonbane", "monsterAttackDialogIsDefault", {
        name: "DoD.SETTINGS.monsterAttackDialogIsDefault",
        hint: "DoD.SETTINGS.monsterAttackDialogIsDefaultHint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    // If true, autmatically marks Characters as dead when they fail 3 death rolls or get instantly killed
    game.settings.register("dragonbane", "automateCharacterDeath", {
        name: "DoD.SETTINGS.automateCharacterDeath",
        hint: "DoD.SETTINGS.automateCharacterDeathHint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });
    // If true, autmatically marks NPCs as dead when the reach 0 HP
    game.settings.register("dragonbane", "automateNpcDeath", {
        name: "DoD.SETTINGS.automateNpcDeath",
        hint: "DoD.SETTINGS.automateNpcDeathHint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });
    // If true, autmatically marks Monsters as dead when the reach 0 HP
    game.settings.register("dragonbane", "automateMonsterDeath", {
        name: "DoD.SETTINGS.automateMonsterDeath",
        hint: "DoD.SETTINGS.automateMonsterDeathHint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });
    // If true, autmatically marks Monsters as dead when the reach 0 HP
    game.settings.register("dragonbane", "canEquipItems", {
        name: "DoD.SETTINGS.canEquipItems",
        hint: "DoD.SETTINGS.canEquipItemsHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    // If true, hides WP gadget if NPC has 0 WP and no spells or abilities
    game.settings.register("dragonbane", "hideNpcWpWidget", {
        name: "DoD.SETTINGS.hideNpcWpWidget",
        hint: "DoD.SETTINGS.hideNpcWpWidgetHint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });
    // If true, allows dealing damage using the selection method
    game.settings.register("dragonbane", "allowDealDamageOnSelected", {
        name: "DoD.SETTINGS.allowDealDamageOnSelected",
        hint: "DoD.SETTINGS.allowDealDamageOnSelectedHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    // If true, automatically set skill advancement mark on a Dragon or Demon roll
    game.settings.register("dragonbane", "automaticSkillAdvancementMark", {
        name: "DoD.SETTINGS.automaticSkillAdvancementMark",
        hint: "DoD.SETTINGS.automaticSkillAdvancementMark",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });
}

Hooks.once("init", function () {
    console.log("DoD | Initializing Dragonbane System");

    CONFIG.DoD = DoD;

    CONFIG.Actor.documentClass = DoDActor;
    CONFIG.Item.documentClass = DoDItem;

    CONFIG.Dice.rolls.unshift(DoDRoll);

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("DoD", DoDCharacterSheet, { makeDefault: true });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("DoD", DoDItemSheet, { makeDefault: true });

    registerHandlebarsHelpers();
    preloadHandlebarsTemplates();

    registerSettings();

    game.dragonbane = {
        migrateWorld: DoDMigrate.migrateWorld,
        updateSpells: DoDMigrate.updateSpellsOnActors,
        //updateSkills: DoDMigrate.updateSkillsOnActors,
        //updateItems: DoDMigrate.updateItemsOnActors,
        //updateImages: DoDMigrate.updateItemImagesOnActors,
        rollAttribute: DoDMacro.rollAttributeMacro,
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
        const needsMigration = !currentVersion || foundry.utils.isNewerVersion(SYSTEM_MIGRATION_VERSION, currentVersion);

        if (needsMigration) {
            DoDMigrate.migrateWorld();
            game.settings.set("dragonbane", "systemMigrationVersion", SYSTEM_MIGRATION_VERSION);
        }
    }

    // If this is a new version, prompt adventure import
    if (game.user.isGM) {
        const systemVersion = game.settings.get("dragonbane", "systemVersion");
        if (!systemVersion || foundry.utils.isNewerVersion(game.system.version, systemVersion)) {
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
Hooks.on("renderChatMessage", DoDChat.hideChatPermissions);

for (const sheet of ["ActorSheet", "ItemSheet", "JournalPageSheet"]) {
    Hooks.on(`render${sheet}`, (app, html, options) => {
        html.on('click contextmenu', '.table-roll', DoD_Utility.handleTableRoll.bind(DoD_Utility));
        html.on("click", ".inline-damage-roll", DoDChat.onInlineDamageRoll);
        html.on("click", ".treasure-roll", DoDChat.onTreasureRoll);
    });
}

Hooks.on("dropActorSheetData", DoDCharacterSheet._onDropTable);

Hooks.on("preImportAdventure", (_adventure, _formData, _toCreate, toUpdate) => {
    // Apply seeting to keep ownership permission on import
    const keepOwnership = game.settings.get("dragonbane", "keepOwnershipOnImport");
    if (keepOwnership) {
        // Ignore ownership when updating data
        for (const [_documentName, updateData] of Object.entries(toUpdate)) {
            for (let data of updateData) {
                if (data.ownership) {
                    delete data.ownership;
                }
            }
        }
    }
    // Don't update "drawn" status on cards.
    if (toUpdate?.Cards) {
        for (let deck of toUpdate.Cards) {
            for (let card of deck.cards) {
                delete card.drawn;
            }
        }
    }
    return true;
});

// Re-generate thumbnails when importing scenes
Hooks.on('importAdventure', async (created, updated) => {
    if (created?.scenes?.size > 0) {
        console.log("Dragonbane: Re-generating thumbnails for " + created.name);
        created.scenes.forEach(async s => {
            const scene = game.scenes.get(s.id);
            const thumb = await scene.createThumbnail();
            scene.update({ "thumb": thumb.thumb });
        });
    }
});


Hooks.once('diceSoNiceInit', async (dice3d) => {
    await dice3d.addTexture("DragonbaneTexture", {
        name: game.i18n.localize("DoD.diceSoNice.textureTransparent"),
        composite: "destination-in",
        source: "systems/dragonbane/art/ui/dsn/texture.webp",
        bump: "systems/dragonbane/art/ui/dsn/texture.webp",
        material: "metal"
    });
});

Hooks.once('diceSoNiceReady', (dice3d) => {

    dice3d.addColorset({
        name: 'DragonbaneGreen1',
        description: game.i18n.localize("DoD.diceSoNice.colorGreen"),
        category: game.i18n.localize("DoD.diceSoNice.system"),
        foreground: '#ffffff',
        background: '#00a000',
        outline: 'none',
        edge: '#00a000',
        material: 'metal',
        font: "QTFrizQuad"
    },
        'preferred'
    );

    dice3d.addColorset({
        name: 'DragonbaneRed1',
        description: game.i18n.localize("DoD.diceSoNice.colorRed"),
        category: game.i18n.localize("DoD.diceSoNice.system"),
        foreground: '#ffffff',
        background: '#6F0000',
        outline: 'none',
        edge: '#6F0000',
        material: 'metal',
        font: "QTFrizQuad"
    },
        'default'
    );

    dice3d.addColorset({
        name: 'DragonbaneGreen2',
        description: game.i18n.localize("DoD.diceSoNice.colorGreenTransparent"),
        category: game.i18n.localize("DoD.diceSoNice.system"),
        foreground: '#ffffff',
        background: '#00a000',
        outline: '#00a000',
        edge: '#00a000',
        texture: 'DragonbaneTexture',
        material: 'metal',
        font: "QTFrizQuad"
    },
        'default'
    );

    dice3d.addColorset({
        name: 'DragonbaneRed2',
        description: game.i18n.localize("DoD.diceSoNice.colorRedTransparent"),
        category: game.i18n.localize("DoD.diceSoNice.system"),
        foreground: '#ffffff',
        background: '#6F0000',
        outline: '#6F0000',
        edge: '#6F0000',
        texture: 'DragonbaneTexture',
        material: 'metal',
        font: "QTFrizQuad"
    },
        'default'
    );


    dice3d.addSystem({ id: 'dragonbane', name: game.i18n.localize("DoD.diceSoNice.system") }, 'preferred');
    dice3d.addDicePreset({
        type: 'd20',
        labels: [
            "systems/dragonbane/art/ui/dsn/dod-ikon-drake-vit-256.png",
            "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
            "systems/dragonbane/art/ui/dsn/dod-ikon-demon-vit-256.png"
        ],
        bumpMaps: [
            "systems/dragonbane/art/ui/dsn/dod-ikon-drake-bump.png",
            , , , , , , , , , , , , , , , , , ,
            "systems/dragonbane/art/ui/dsn/dod-ikon-demon-bump.png"
        ],
        system: 'dragonbane',
    });
});

// Set up Year Zero Engine Combat
Hooks.on("yzeCombatReady", () => {
    if (game.settings.get("dragonbane", "configuredYzeCombat")) return;
    try {
        game.settings.set("yze-combat", "resetEachRound", true);
        game.settings.set("yze-combat", "slowAndFastActions", false);
        game.settings.set("yze-combat", "initAutoDraw", true);
        game.settings.set("yze-combat", "duplicateCombatantOnCombatStart", true);
        game.settings.set("yze-combat", "actorSpeedAttribute", "system.ferocity");
        game.settings.set("dragonbane", "configuredYzeCombat", true);
    } catch (e) {
        console.error("Dragonbane: Could not configure YZE Combat. Try refreshing the page");
    }
})

CONFIG.TextEditor.enrichers = CONFIG.TextEditor.enrichers.concat([
    {
        // Rollable damage
        // Format [[/damage <formula> [<slashing|piercing|bludgeoning>]]]
        pattern: /\[\[\/damage\s((?:\d+)?[dD](?:\d+)(?:[\+\-]\d+)?)\s?(slashing|piercing|bludgeoning)?(?:\s(.+))?\]\]/gm,
        enricher: (match, options) => {
            const a = document.createElement("a");
            a.classList.add("inline-roll");
            a.classList.add("inline-damage-roll");
            a.dataset.damage = match[1];
            a.dataset.damageType = "DoD.damageTypes." + (match[2] ?? "none");
            if (options.actor) a.dataset.actorId = options.actor.uuid;
            if (match[3]) a.dataset.action = match[3];

            a.innerHTML = `<i class="fas fa-dice-d20" style="float:none"></i>` + match[1] + " " + game.i18n.localize(a.dataset.damageType);
            return a;
        }
    },
    {
        // Rollable table
        pattern: /@Table\[(.+?)\](?:{(.+?)})?/gm,
        enricher: (match, options) => {
            const table = DoD_Utility.findTable(match[1]);
            const tableName = match[2] ?? table?.name;
            const a = document.createElement("a");
            if (table) {
                a.classList.add("inline-roll");
                a.classList.add("table-roll");
                a.dataset.tableId = table.uuid;
                a.dataset.tableName = table.name;
                a.innerHTML = `<i class="fas fa-dice-d20" style="float:none"></i><i class="fas fa-th-list" style="float:none"></i> ${tableName}`;
            } else {
                a.dataset.tableId = match[1];
                if (match[2]) a.dataset.tableName = match[2];
                a.classList.add("content-link");
                a.classList.add("broken");
                a.innerHTML = `<i class="fas fa-unlink" style="float:none"></i> ${tableName}`;
            }
            return a;
        }
    },
    {
        // Rollable treasure
        // Format [[/treasure <number>]]
        pattern: /\[\[\/treasure(\s[\d]+)?\]\]/gm,
        enricher: (match, options) => {
            const count = match[1] ?? 1;
            const a = document.createElement("a");
            a.classList.add("inline-roll");
            a.classList.add("treasure-roll");
            a.dataset.count = count;

            let text = "DoD.ui.chat.treasureCard";
            if (count > 1) text += "s";
            a.innerHTML = `<i class="fas fa-dice-d20"></i> ${game.i18n.format(text, { count: count })}`;
            return a;
        }
    },
    {
        pattern: /@DisplayAbility\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayAbility
    },
    {
        pattern: /@DisplayAbilityBox\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayAbilityBox
    },
    {
        pattern: /@DisplayMonster\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayMonster
    },
    {
        pattern: /@DisplayMonsterCard\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayMonsterCard
    },
    {
        pattern: /@DisplayMonsterDescription\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayMonsterDescription
    },
    {
        pattern: /@DisplayMonsterDescriptionCard\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayMonsterDescriptionCard
    },
    {
        pattern: /@DisplayNpc\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayNpc
    },
    {
        pattern: /@DisplayNpcCard\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayNpcCard
    },
    {
        pattern: /@DisplayNpcDescription\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayNpcDescription
    },
    {
        pattern: /@DisplaySkill\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplaySkill
    },
    {
        pattern: /@DisplaySpell\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplaySpell
    },
    {
        pattern: /@DisplayTable\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayTable
    },
    {
        pattern: /@DisplayTrick\[(.+?)\](?:{(.+?)})?/gm,
        enricher: DoDJournal.enrichDisplayTrick
    },
    {
        pattern: /@GearTableStart\[(.+?)\](?:{(.+?)})((?:(?!@GearTableEnd)[\S\s])+)@GearTableEnd/gm,
        enricher: DoDJournal.enrichGearTable
    }
]);

