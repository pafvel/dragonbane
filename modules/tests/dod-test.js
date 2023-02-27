import DoD_Utility from "../utility.js";

export default class DoDTest {

    constructor(options) {
        this.data = {};
        this.data.boons = [];
        this.data.banes = [];
        this.data.fillerBanes = 0; // Needed for dialog box layout
        this.data.fillerBoons = 0; // Needed for dialog box layout
        this.data.actor = null; // may be set by sub-classes
        this.data.attribute = null; // may be set by sub-classes
        this.data.skill = null; // may be set by sub-classes
        this.noBanesBoons = options?.noBanesBoons;
        this.defaultBanesBoons = options?.defaultBanesBoons;
        this.skipDialog = this.noBanesBoons || this.defaultBanesBoons;
    }

    async roll() {
        this.updateRollData();

        this.options = await this.getRollOptions();
        if (this.options.cancelled) return;

        this.preRoll();
        
        let formula = this.formatRollFormula(this.options);
        this.roll = await new Roll(formula).roll({async: true});
        
        this.postRoll();

        let messageData = this.formatRollMessage(this.roll);
        let messageTemplate = this.getMessageTemplate();
        if (messageTemplate) {
            let renderedMessage = await this.renderRoll(this.roll, messageTemplate, this.data);
            messageData.content = renderedMessage;
        }
        this.roll.toMessage(messageData);
    }

    // This method should be overridden to provide title and label
    async getRollOptions() {
        return this.getRollOptionsFromDialog("", "");
    }

    preRoll() {}
    postRoll() {}

    updateRollData() {

        if (this.noBanesBoons) {
            return;
        }

        if (this.data.attribute) {
            let condition = this.data.actor.system.conditions[this.data.attribute];

            if (condition?.value) {
                let name = game.i18n.localize("DoD.conditions." + this.data.attribute);
                this.data.banes.push( {source: name, value: true});
            }
        }

        let rollTarget = this.data.skill ? this.data.skill.name.toLowerCase() : this.data.attribute;

        for (let item of this.data.actor.items.contents) {
            if (item.system.banes) {
                let banes = DoD_Utility.splitAndTrimString(item.system.banes.toLowerCase());
                if (banes.find(element => element.toLowerCase() == rollTarget)) {
                    let value = item.system.worn ? true : false;
                    this.data.banes.push( {source: item.name, value: value});    
                }
            }
            if (item.system.boons) {
                let boons = DoD_Utility.splitAndTrimString(item.system.boons.toLowerCase());
                if (boons.find(element => element.toLowerCase() == rollTarget)) {
                    let value = item.system.worn ? true : false;
                    this.data.boons.push( {source: item.name, value: value});    
                }
            }
        }

        // Needed for dialog box layout
        this.data.fillerBanes = Math.max(0, this.data.boons.length - this.data.banes.length);
        this.data.fillerBoons = Math.max(0, this.data.banes.length - this.data.boons.length);;
    }


    async getRollOptionsFromDialog(title, label) {

        if (this.skipDialog) {
            return this.data;
        }

        const template = "systems/dragonbane/templates/partials/roll-dialog.hbs";
        const html = await renderTemplate(template, this.data);

        return new Promise(
            resolve => {
                const data = {
                    actor: this.data.actor,
                    title: title,
                    content: html,
                    buttons: {
                        ok: {
                            label: label,
                            callback: html => resolve(this.processDialogOptions(html[0].querySelector("form")))
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

    processDialogOptions(form) {
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

    formatRollFormula(options) {
        let banes = (options.banes ? options.banes.length : 0) + (options.extraBanes ? options.extraBanes : 0);
        let boons = (options.boons ? options.boons.length : 0) + (options.extraBoons ? options.extraBoons : 0);

        if (banes > boons) {
            return "" + (1 + banes - boons) + "d20kh";
        } else if (banes < boons) {
            return "" + (1 + boons - banes) + "d20kl";
        } else {
            return "d20";
        }
    }

    formatRollResult(roll, target) {
        this.data.success = roll.result <= target;
        if (roll.result == 1) {
            return game.i18n.localize("DoD.roll.dragon");
        } else if (roll.result == 20) {
            return game.i18n.localize("DoD.roll.demon");
        } else {
            return roll.result <= target ? game.i18n.localize("DoD.roll.success") : game.i18n.localize("DoD.roll.failure");
        }

    }

    // This method should be overridden
    formatRollMessage(roll) {
        return {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.data.actor })
        };
    }

    async renderRoll(roll, template, templateContext, isPrivate = false) {
        if ( !roll._evaluated ) await roll.evaluate({async: true});

        let context = templateContext ? templateContext : {};
        context.formula = isPrivate ? "???" : roll.formula;
        context.user = game.user.id;
        context.tooltip = isPrivate ? "" : await roll.getTooltip();
        context.total = isPrivate ? "?" : Math.round(roll.total * 100) / 100;

        return await renderTemplate(template, context);
    }

    getMessageTemplate() {
        return null;
    }
}