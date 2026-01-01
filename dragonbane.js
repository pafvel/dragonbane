import { DoD } from "./modules/config.js";

import { DoDActor } from "./modules/actor.js";
import { DoDItem } from "./modules/item.js";

import DoD_Utility from "./modules/utility.js";
import DoDRoll from "./modules/roll.js";

import * as DoDChat from "./modules/chat.js";
import * as DoDJournal from "./modules/journal.js";
import * as DoDMacro from "./modules/macro.js";
import * as DoDMigrate from "./modules/migrate.js";

import DoDCharacterSheet from "./modules/sheets/character-sheet.js";
import DoDNpcSheet from "./modules/sheets/npc-sheet.js";
import DoDMonsterSheet from "./modules/sheets/monster-sheet.js";
import DoDAbilitySheet from "./modules/sheets/item/ability-sheet.js";
import DoDArmorSheet from "./modules/sheets/item/armor-sheet.js";
import DoDHelmetSheet from "./modules/sheets/item/helmet-sheet.js";
import DoDInjurySheet from "./modules/sheets/item/injury-sheet.js";
import DoDItemSheet from "./modules/sheets/item/item-sheet.js";
import DoDKinSheet from "./modules/sheets/item/kin-sheet.js";
import DoDMoneySheet from "./modules/sheets/item/money-sheet.js";
import DoDProfessionSheet from "./modules/sheets/item/profession-sheet.js";
import DoDSkillSheet from "./modules/sheets/item/skill-sheet.js";
import DoDSpellSheet from "./modules/sheets/item/spell-sheet.js";
import DoDWeaponSheet from "./modules/sheets/item/weapon-sheet.js";

import DoDCharacterData from "./modules/data/actors/characterData.js";
import DoDNPCData from "./modules/data/actors/NPCData.js";
import DoDMonsterData from "./modules/data/actors/monsterData.js";
import DoDAbilityData from "./modules/data/items/abilityData.js";
import DoDActiveEffectData from "./modules/data/items/activeEffectData.js";
import DoDArmorData from "./modules/data/items/armorData.js";
import DoDHelmetData from "./modules/data/items/helmetData.js";
import DoDInjuryData from "./modules/data/items/injuryData.js";
import DoDItemData from "./modules/data/items/itemData.js";
import DoDKinData from "./modules/data/items/kinData.js";
import DoDMoneyData from "./modules/data/items/moneyData.js";
import DoDProfessionData from "./modules/data/items/professionData.js";
import DoDSkillData from "./modules/data/items/skillData.js";
import DoDWeaponData from "./modules/data/items/weaponData.js";
import DoDSpellData from "./modules/data/items/spellData.js";

import DoDActiveEffect from "./modules/active-effect.js";
import DoDActiveEffectConfig from "./modules/active-effect-config.js";
import DoDTokenRuler from "./modules/token-ruler.js";

import DoDActorSettings from "./modules/apps/actor-settings.js";
import DoDAutomationSettings from "./modules/apps/automation-settings.js";
import DoDCombatSettings from "./modules/apps/combat-settings.js";
import DoDOptionalRuleSettings from "./modules/apps/optional-rule-settings.js";
import DoDCoreSettings from "./modules/apps/core-settings.js";

function registerHandlebarsHelpers() {

    /*
    * Repeat given markup with n times
    */
    Handlebars.registerHelper("times", function (n, block) {
        let result = "";
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
        let result = "";
        let i;
        const data = {};

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
        "systems/dragonbane/templates/partials/damage-roll-message.hbs",
        "systems/dragonbane/templates/partials/hp-widget.hbs",
        "systems/dragonbane/templates/partials/item-sheet-effects.hbs",
        "systems/dragonbane/templates/partials/roll-dialog.hbs",
        "systems/dragonbane/templates/partials/roll-no-total.hbs",
        "systems/dragonbane/templates/partials/roll.hbs",
        "systems/dragonbane/templates/partials/skill-roll-message.hbs",
        "systems/dragonbane/templates/partials/tooltip.hbs",
        "systems/dragonbane/templates/partials/wp-widget.hbs",
        "systems/dragonbane/templates/partials/waypoint-label.hbs",
    ];

    return foundry.applications.handlebars.loadTemplates(templatePaths);
}

function registerSettings() {
    console.log("Dragonbane: Registering settings");

    DoDActorSettings.registerSettings();
    DoDAutomationSettings.registerSettings();
    DoDCombatSettings.registerSettings();
    DoDCoreSettings.registerSettings();
    DoDOptionalRuleSettings.registerSettings();

    // If true, keeps permission on assets when re-importing them
    game.settings.register("dragonbane", "keepOwnershipOnImport", {
        name: "DoD.SETTINGS.keepOwnershipOnImport",
        hint: "DoD.SETTINGS.keepOwnershipOnImportHint",
        scope: "world",
        config: true,
        default: true,
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

    game.settings.register("dragonbane", "configuredYzeCombat", {
        config: false,
        scope: "world",
        type: Boolean,
        default: false
    });

    // Setting to ensure that turn marker is registered only once
    game.settings.register("dragonbane", "registeredTurnMarker", {
        config: false,
        scope: "world",
        type: Boolean,
        default: false
    });

}

Hooks.once("init", function () {
    console.log("DoD | Initializing Dragonbane System");

    CONFIG.DoD = DoD;

    CONFIG.DoD.Actors       = foundry.documents.collections.Actors;
    CONFIG.DoD.Items        = foundry.documents.collections.Items;
    CONFIG.DoD.ItemSheet    = foundry.appv1.sheets.ItemSheet;
    CONFIG.DoD.FilePicker   = foundry.applications.apps.FilePicker;
    CONFIG.DoD.TextEditor   = foundry.applications.ux.TextEditor;

    CONFIG.DoD.ActiveEffectConfig = foundry.applications.sheets.ActiveEffectConfig;
    CONFIG.DoD.DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;

    CONFIG.Actor.documentClass = DoDActor;
    CONFIG.Item.documentClass = DoDItem;
    CONFIG.ActiveEffect.documentClass = DoDActiveEffect;
    CONFIG.ActiveEffect.legacyTransferral = false;

    CONFIG.Dice.rolls.unshift(DoDRoll);

    CONFIG.Token.rulerClass = DoDTokenRuler;

    foundry.utils.mergeObject(CONFIG.Actor.dataModels, {
        character: DoDCharacterData,
        monster:DoDMonsterData,
        npc: DoDNPCData
    });

    foundry.utils.mergeObject(CONFIG.Item.dataModels, {
        ability: DoDAbilityData,
        armor: DoDArmorData,
        helmet: DoDHelmetData,
        item: DoDItemData,
        injury: DoDInjuryData,
        kin: DoDKinData,
        money: DoDMoneyData,
        profession: DoDProfessionData,
        skill: DoDSkillData,
        spell: DoDSpellData,
        weapon: DoDWeaponData
    });

    CONFIG.ActiveEffect.dataModels["base"] = DoDActiveEffectData;

    CONFIG.DoD.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
    CONFIG.DoD.Actors.registerSheet("DoD", DoDCharacterSheet, { types: ["character"], makeDefault: true });
    CONFIG.DoD.Actors.registerSheet("DoD", DoDNpcSheet, { types: ["npc"], makeDefault: true });
    CONFIG.DoD.Actors.registerSheet("DoD", DoDMonsterSheet, { types: ["monster"], makeDefault: true });

    CONFIG.DoD.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
    CONFIG.DoD.Items.registerSheet("DoD", DoDAbilitySheet, { types: ["ability"], makeDefault: true });
    CONFIG.DoD.Items.registerSheet("DoD", DoDArmorSheet, { types: ["armor"], makeDefault: true });
    CONFIG.DoD.Items.registerSheet("DoD", DoDHelmetSheet, { types: ["helmet"], makeDefault: true });
    CONFIG.DoD.Items.registerSheet("DoD", DoDInjurySheet, { types: ["injury"], makeDefault: true });
    CONFIG.DoD.Items.registerSheet("DoD", DoDItemSheet, { types: ["item"], makeDefault: true });
    CONFIG.DoD.Items.registerSheet("DoD", DoDKinSheet, { types: ["kin"], makeDefault: true });
    CONFIG.DoD.Items.registerSheet("DoD", DoDMoneySheet, {types: ["money"], makeDefault: true});
    CONFIG.DoD.Items.registerSheet("DoD", DoDProfessionSheet, { types: ["profession"], makeDefault: true });
    CONFIG.DoD.Items.registerSheet("DoD", DoDSkillSheet, { types: ["skill"], makeDefault: true });
    CONFIG.DoD.Items.registerSheet("DoD", DoDSpellSheet, { types: ["spell"], makeDefault: true });
    CONFIG.DoD.Items.registerSheet("DoD", DoDWeaponSheet, { types: ["weapon"], makeDefault: true });

    CONFIG.DoD.DocumentSheetConfig.unregisterSheet(ActiveEffect, "core", CONFIG.DoD.ActiveEffectConfig);
    CONFIG.DoD.DocumentSheetConfig.registerSheet(ActiveEffect, "DoD", DoDActiveEffectConfig, {makeDefault :true});

    registerHandlebarsHelpers();
    preloadHandlebarsTemplates();

    registerSettings();

    game.dragonbane = {
        migrateWorld: DoDMigrate.migrateWorld,
        //updateSpells: DoDMigrate.updateSpellsOnActors,
        //updateSkills: DoDMigrate.updateSkillsOnActors,
        //updateItems: DoDMigrate.updateItemsOnActors,
        //updateImages: DoDMigrate.updateItemImagesOnActors,
        rollAttribute: DoDMacro.rollAttributeMacro,
        rollItem: DoDMacro.rollItemMacro,
        useItem: DoDMacro.useItemMacro,
        monsterAttack: DoDMacro.monsterAttackMacro,
        monsterDefend: DoDMacro.monsterDefendMacro,
        drawTreasureCards: DoD_Utility.drawTreasureCards
    };

    // Add status effects for conditions
    for (const [_key, value] of Object.entries(DoD.conditionEffects)) {
        CONFIG.statusEffects.push(value);
    }
    // Don't show conditions on the TokenHUD
    Hooks.on('renderTokenHUD', (_app, html, _options) => {
        for (const [_key, value] of Object.entries(DoD.conditionEffects)) {
            for (const effect of html.querySelectorAll(`.effect-control[data-status-id="${value.id}"]`)) {
                effect.remove();
            }
        }
    });

    // Ensure world money items exist on ready
    Hooks.once("ready", async () => {
        await DoDMigrate.ensureWorldMoneyItems();
    });

    Hooks.on("renderChatMessageHTML", DoDChat.addChatListeners);
    Hooks.on("getChatMessageContextOptions", DoDChat.addChatMessageContextMenuOptions);
    Hooks.on("renderChatMessageHTML", DoDChat.hideChatPermissions);
});

Hooks.once("ready", async function () {

    Hooks.on("hotbarDrop", (_bar, data, slot) => {
        if (data.type === "Item") {
            DoDMacro.createItemMacro(data, slot);
            return false;
        }
    });

    // Migration
    if (game.user.isGM) {
        const SYSTEM_MIGRATION_VERSION = 0.02;
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
    Hooks.on('importAdventure', async (created, _updated) => {
        const ADVENTURE_NAME = "Dragonbane / Drakar och Demoner - System";
        if (created?.name === ADVENTURE_NAME) {
            const title = "(" + game.i18n.lang.toLowerCase() + ")";
            const adventureJournal = created.journal.find(j => j.name.toLowerCase().includes(title));
            if (adventureJournal) {
                const gameJournal = game.journal.get(adventureJournal.id);
                gameJournal?.show();
            }
        }
        console.log("Dragonbane: Imported " + created.name);
    });

    // Register token turn marker once
    if ( game.settings.get("dragonbane", "registeredTurnMarker") === false) {
        const combatTrackerConfig = game.settings.get("core", "combatTrackerConfig");
        combatTrackerConfig.turnMarker.src = "systems/dragonbane/art/tokens/token-frame.webp";
        game.settings.set("core", "combatTrackerConfig", combatTrackerConfig);
        game.settings.set("dragonbane", "registeredTurnMarker", true);
    }
});

for (const sheet of ["DoDActorBaseSheet", "DoDItemBaseSheet", "JournalPageSheet", "JournalEntryPageSheet"]) {
    Hooks.on(`render${sheet}`, (_app, html, _options) => {
        DoD_Utility.addHtmlEventListener(html, 'click contextmenu', '.table-roll', DoD_Utility.handleTableRoll.bind(DoD_Utility));
        DoD_Utility.addHtmlEventListener(html, "click", ".inline-damage-roll", DoDChat.onInlineDamageRoll);
        DoD_Utility.addHtmlEventListener(html, "click", ".treasure-roll", DoDChat.onTreasureRoll);
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
Hooks.on('importAdventure', async (created, _updated) => {
    if (created?.scenes?.size > 0) {
        for (const s of created.scenes) {
            const scene = game.scenes.get(s.id);
            let exists = false;
            try {
                const files = await CONFIG.DoD.FilePicker.browse("data", scene.thumb.substring(0, scene.thumb.lastIndexOf('/')));
                if (files.files.includes(s.thumb)) {
                    exists = true;
                }
            } catch { /* directory doesn't exist */ }

            if (!exists) {
                const thumb = await scene.createThumbnail();
                await scene.update({ "thumb": thumb.thumb });
            }
        }
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
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            "systems/dragonbane/art/ui/dsn/dod-ikon-demon-bump.png"
        ],
        system: 'dragonbane',
    });
});

// Set up Year Zero Engine Combat
Hooks.on("yzeCombatReady", () => {
    if (game.settings.get("dragonbane", "configuredYzeCombat")) {
        // Update to match new data model
        if (game.settings.get("yze-combat", "actorSpeedAttribute") === "system.ferocity") {
            game.settings.set("yze-combat", "actorSpeedAttribute", "system.ferocity.value");
        }
        return;
    }
    try {
        game.settings.set("yze-combat", "resetEachRound", true);
        game.settings.set("yze-combat", "slowAndFastActions", false);
        game.settings.set("yze-combat", "initAutoDraw", true);
        game.settings.set("yze-combat", "duplicateCombatantOnCombatStart", true);
        game.settings.set("yze-combat", "actorSpeedAttribute", "system.ferocity.value");
        game.settings.set("dragonbane", "configuredYzeCombat", true);
    } catch (e) {
        console.error("Dragonbane: Could not configure YZE Combat. Try refreshing the page");
    }
})

CONFIG.TextEditor.enrichers = CONFIG.TextEditor.enrichers.concat([
    {
        // Rollable damage
        // Format [[/damage <formula> [<slashing|piercing|bludgeoning>]]]
        pattern: /\[\[\/damage\s((?:\d+)?[dD](?:\d+)(?:[\+\-]\d+)?)\s?(slashing|piercing|bludgeoning)?(?:\s(.+?))?\]\]/gm,
        enricher: (match, options) => {
            const a = document.createElement("a");
            a.classList.add("inline-roll");
            a.classList.add("inline-damage-roll");
            a.dataset.damage = match[1];
            a.dataset.damageType = DoDOptionalRuleSettings.damageTypes ? "DoD.damageTypes." + (match[2] ?? "none") : "DoD.damageTypes.none";
            if (options.actor) a.dataset.actorId = options.actor.uuid;
            if (match[3]) a.dataset.action = match[3];

            a.innerHTML = `<i class="fas fa-dice-d20" style="float:none"></i>` + match[1] + " " + game.i18n.localize(a.dataset.damageType);
            return a;
        }
    },
    {
        // Rollable table
        pattern: /@Table\[(.+?)\](?:{(.+?)})?/gm,
        enricher: (match, _options) => {
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
        enricher: (match, _options) => {
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

