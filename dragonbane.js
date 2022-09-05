import { DoD } from "./modules/config.js";
import DoDItemSheet from "./modules/dod-item-sheet.js";

Hooks.once("init", function() {
    console.log("DoD | Initializing Dragonbane System");
    
    CONFIG.DoD = DoD;

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("DoD", DoDItemSheet, {makeDefault: true});
});