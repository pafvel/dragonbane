import { DoD } from "./config.js";

export default class DoDActiveEffectConfig extends ActiveEffectConfig {
    get template() {
        return "systems/dragonbane/templates/active-effect-config.html";
    }

    async getData() {
        const sheetData = await super.getData();

        sheetData.config = DoD;

        return sheetData;
    }
}
