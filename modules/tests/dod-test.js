import DoD_Utility from "../utility.js";

export default class DoDTest {

    constructor() {}

    _getRollString(attributeName) {
        let condition = this.data.actor.system.conditions[attributeName];

        if (condition.value) {
            return "2d20kh";
        }
        return "d20";
    }

    _getRollResult(roll, target)
    {
        let result = "";
        if (roll.result == 1) {
            result = game.i18n.localize("DoD.roll.dragon");
        } else if (roll.result == 20) {
            result = game.i18n.localize("DoD.roll.demon");
        } else {
            result = roll.result <= target ? game.i18n.localize("DoD.roll.success") : game.i18n.localize("DoD.roll.failure");
        }
        return result;
    }
}