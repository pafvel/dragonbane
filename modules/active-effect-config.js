import { DoD } from "./config.js";

export default class DoDActiveEffectConfig extends ActiveEffectConfig {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions,  {
            classes: ["DoD", "sheet", "active-effect-sheet"],
            width: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    get template() {
        if (game.release.generation < 12) {
            return "systems/dragonbane/templates/active-effect-config-v11.html";    
        }
        return "systems/dragonbane/templates/active-effect-config.html";
    }

    async getData() {
        const sheetData = await super.getData();

        sheetData.config = DoD;

        return sheetData;
    }
}
