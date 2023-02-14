import DoD_Utility from "../utility.js";
import DoDTest from "./dod-test.js";


export default class DoDSkillTest extends DoDTest  {

    constructor(actor, skill) {
        super();
        this.data = {};
        this.data.actor = actor;
        this.data.skill = skill;
    }
   
    async roll() {
        let options = await this._getRollOptions();
        if (options.cancelled) return;

        let rollString = this._getRollString(options);
        let roll = await new Roll(rollString).roll({async: true});
        let target = this.data.skill.system.value;
        let result = this._getRollResult(roll, target);
        let label = game.i18n.format(game.i18n.localize("DoD.roll.skillRoll"), {skill: this.data.skill.name, result: result});

        roll.toMessage({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.data.actor }),
            flavor: label
        });                 
    }

    _getRollString(options) {
        let banes = options.banes.length + options.extraBanes;
        let boons = options.boons.length + options.extraBoons;

        if (banes > boons) {
            return "" + (1 + banes - boons) + "d20kh";
        } else if (banes < boons) {
            return "" + (1 + boons - banes) + "d20kl";
        } else {
            return "d20";
        }
    }

    _updateRollData() {
        this.data.boons = [];
        this.data.banes = [];

        let condition = this.data.actor.system.conditions[this.data.skill.system.attribute];

        if (condition?.value) {
            let name = game.i18n.localize("DoD.conditions." + this.data.skill.system.attribute);
            this.data.banes.push( {source: name, value: true});
        }

        for (let item of this.data.actor.items.contents) {
            if (item.system.banes) {
                let banes = DoD_Utility.splitAndTrimString(item.system.banes.toLowerCase());
                if (banes.find(element => element.toLowerCase() == this.data.skill.name.toLowerCase())) {
                    let value = item.system.worn ? true : false;
                    this.data.banes.push( {source: item.name, value: value});    
                }
            }
            if (item.system.boons) {
                let boons = DoD_Utility.splitAndTrimString(item.system.boons.toLowerCase());
                if (boons.find(element => element.toLowerCase() == this.data.skill.name.toLowerCase())) {
                    let value = item.system.worn ? true : false;
                    this.data.boons.push( {source: item.name, value: value});    
                }
            }
        }
    }

    async _getRollOptions(rollType) {
        const template = "systems/dragonbane/templates/partials/roll-dialog.hbs";

        this._updateRollData();
        const html = await renderTemplate(template, this.data);

        return new Promise(
            resolve => {
                const data = {
                    actor: this.data.actor,
                    title: "Skill Roll: " + this.data.skill.name,
                    content: html,
                    buttons: {
                        ok: {
                            label: "Roll",
                            callback: html => resolve(this._processRollOptions(html[0].querySelector("form")))
                        }
                        /*
                        ,
                        cancel: {
                            label: "Cancel",
                            callback: html => resolve({cancelled: true})
                        }
                        */
                    },
                    default: "ok",
                    close: () => resolve({cancelled: true})
                };
                new Dialog(data, null).render(true);
            }
        );
    }

    _processRollOptions(form) {
        let banes = [];
        let boons = [];
        let extraBanes = 0;
        let extraBoons = 0;

        // Process banes
        let elements = form.getElementsByClassName("banes");
        let element = elements ? elements[0] : null;
        let inputs = element?.getElementsByTagName("input");
        for (let input of inputs) {
            if (input.type == "checkbox" && input.checked) {
                banes.push(input.name);
            } else if (input.name == "extraBanes") {
                extraBanes = Number(input.value);
                extraBanes = isNaN(extraBanes) ? 0 : extraBanes;
            }
        }

        // Process boons
        elements = form.getElementsByClassName("boons");
        element = elements ? elements[0] : null;
        inputs = element?.getElementsByTagName("input");
        for (let input of inputs) {
            if (input.type == "checkbox" && input.checked) {
                boons.push(input.name);
            } else if (input.name == "extraBoons") {
                extraBoons = Number(input.value);
                extraBoons = isNaN(extraBoons) ? 0 : extraBoons;
            }
        }

        return {
            banes: banes,
            boons: boons,
            extraBanes: extraBanes,
            extraBoons, extraBoons
        }
    }
}