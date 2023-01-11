import { DoD } from "./modules/config.js";
import { DoDActor } from "./modules/actor.js";

import DoDItemSheet from "./modules/item-sheet.js";
import DoDCharacterSheet from "./modules/character-sheet.js";

Hooks.once("init", function() {
    console.log("DoD | Initializing Dragonbane System");
    
    CONFIG.DoD = DoD;

    CONFIG.Actor.documentClass = DoDActor;

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("DoD", DoDCharacterSheet, {makeDefault: true});

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("DoD", DoDItemSheet, {makeDefault: true});
});