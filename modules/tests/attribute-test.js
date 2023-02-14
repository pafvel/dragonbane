//import DoD_Utility from "../utility.js";
import DoDTest from "./dod-test.js";

export default class DoDAttributeTest extends DoDTest {

    constructor(actor, attributeName) {
        super();
        this.data = {};
        this.data.actor = actor;
        this.data.attributeName = attributeName;
    }

    async roll() {
        let rollString = this._getRollString(this.data.attributeName);
        let roll = new Roll(rollString).roll({async: false});
        let target = this.data.actor.system.attributes[this.data.attributeName].value;
        let result = this._getRollResult(roll, target);      
        let localizedName = game.i18n.localize("DoD.attributes." + this.data.attributeName);
        let label = game.i18n.format(game.i18n.localize("DoD.roll.attributeRoll"), {attribute: localizedName, result: result});

        roll.toMessage({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.data.actor }),
            flavor: label
        });        

    }
}