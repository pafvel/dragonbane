import { DoD } from "./modules/config.js";
import { DoDActor } from "./modules/actor.js";
import { DoDItem } from "./modules/item.js";

import DoDItemSheet from "./modules/item-sheet.js";
import DoDCharacterSheet from "./modules/character-sheet.js";

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
        "systems/dragonbane/templates/partials/character-sheet-spells.hbs",
        "systems/dragonbane/templates/partials/character-sheet-combat.hbs",
        "systems/dragonbane/templates/partials/character-sheet-inventory.hbs",
        "systems/dragonbane/templates/partials/character-sheet-background.hbs",
        "systems/dragonbane/templates/partials/roll-dialog.hbs"
    ];

    return loadTemplates(templatePaths);
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
});