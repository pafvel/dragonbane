import DoD_Utility from "../utility.js";
import DoDRoll from "../roll.js";

/** A Dragonbane test roll */
export default class DoDTest {

    /**
     * Create a Test
     * @param {Actor} actor - Actor performing the test
     * @param {Object} [options] - Options for the test
     * @param {number} [options.manualBanes] - Number of manual (set outside the system) banes to apply
     * @param {number] [options.manualBoons] - Number of manual (set outside the system) boons to apply
     */
    constructor(actor, options = {}) {
        this.actor = actor;
        this.options = options;
        this.dialogData = {};
        this.preRollData = {};
        this.postRollData = {};
        this.noBanesBoons = options?.noBanesBoons;
        this.defaultBanesBoons = options?.defaultBanesBoons;
        this.skipDialog = options?.skipDialog || this.noBanesBoons || this.defaultBanesBoons;
        this.autoSuccess = options?.autoSuccess;

        // support manually passed banes/boons
        this.manualBanes = options?.manualBanes;
        this.manualBoons = options?.manualBoons;
    }

    async roll() {
        this.updateDialogData();
        this.options = {... this.options, ... await this.getRollOptions()};
        if (this.options.cancelled) return;

        this.updatePreRollData();
        const formula = this.options.formula ?? this.formatRollFormula(this.preRollData);
        const rollOptions = {
            boons: this.options.boons,
            banes: this.options.banes,
            extraBoons: this.options.extraBoons,
            extraBanes: this.options.extraBanes
        }
        this.roll = await new DoDRoll(formula, {}, rollOptions).roll({async: true});

        this.updatePostRollData();
        const messageData = this.formatRollMessage(this.postRollData);
        const messageTemplate = this.getMessageTemplate();
        if (messageTemplate) {
            let renderedMessage = await this.renderRoll(this.roll, messageTemplate, this.postRollData);
            let enrichedMessage = await TextEditor.enrichHTML(renderedMessage, { async: true });
            if (messageData.content) {
                messageData.content += renderedMessage;
            } else {
                messageData.content = renderedMessage
            }
        }
        if (this.autoSuccess && game.dice3d) game.dice3d.messageHookDisabled = true;
        this.rollMessage = await this.roll.toMessage(messageData);
        if (this.autoSuccess && game.dice3d) game.dice3d.messageHookDisabled = false;
        return this;
    }

    // This method should be overridden to provide title and label
    async getRollOptions() {
        return await this.getRollOptionsFromDialog("", "");
    }

    updatePreRollData() {
        this.preRollData.rollType = this.constructor.name;
        this.preRollData.banes = (this.options.banes ? this.options.banes.length : 0) + (this.options.extraBanes ? this.options.extraBanes : 0);
        this.preRollData.boons = (this.options.boons ? this.options.boons.length : 0) + (this.options.extraBoons ? this.options.extraBoons : 0);
        this.preRollData.autoSuccess = this.autoSuccess;
    }

    updatePostRollData() {
        this.postRollData = this.preRollData;
        this.postRollData.result = this.roll.result;
    }

    updatePushRollChoices() {
        const actor = this.postRollData.actor;
        this.postRollData.pushRollChoices = {};
        this.postRollData.pushRollChoice = null;
        for (const attribute in actor.system.attributes) {
            const condition = actor.system.conditions[attribute];
            if (condition) {
                if (!condition.value){

                    this.postRollData.pushRollChoices[attribute] =
                        game.i18n.localize("DoD.conditions." + attribute) + " (" +
                        game.i18n.localize("DoD.attributes." + attribute) + ")<br>";
                    if (!this.postRollData.pushRollChoice) {
                        this.postRollData.pushRollChoice = attribute;
                    }
                }
            } else {
                DoD_Utility.ERROR("Missing condition for attribute " + attribute);
            }
        }
        if (!this.postRollData.pushRollChoice) {
            this.postRollData.canPush = false;
            return;
        }
        this.postRollData.pushRollChoiceGroup = "pushRollChoice";
    }

    updateDialogData() {

        if (this.noBanesBoons || this.autoSuccess) {
            return;
        }

        let banes = [];
        let boons = [];

        if (this.attribute && this.actor.hasCondition(this.attribute)) {
            banes.push( {source: game.i18n.localize("DoD.conditions." + this.attribute), value: true});
        }

        let rollTarget = this.skill ? this.skill.name.toLowerCase() : this.attribute?.toLowerCase();
        let rollAttribute = (this.skill && this.skill.system.attribute) ? this.skill.system.attribute.toLowerCase() : rollTarget;

        for (let item of this.actor.items.contents) {
            if (item.system.banes?.length) {
                let itemBanes = DoD_Utility.splitAndTrimString(item.system.banes.toLowerCase());
                if (itemBanes.find(element => element.toLowerCase() == rollTarget || element.toLowerCase() == rollAttribute)) {
                    let value = item.system.worn ? true : false;
                    banes.push( {source: item.name, value: value});
                }
            }
            if (item.system.boons?.length) {
                let itemBoons = DoD_Utility.splitAndTrimString(item.system.boons.toLowerCase());
                if (itemBoons.find(element => element.toLowerCase() == rollTarget || element.toLowerCase() == rollAttribute)) {
                    let value = item.system.worn ? true : false;
                    boons.push( {source: item.name, value: value});
                }
            }
        }

        // Maybe shorten these to "Manual (x<number>)" in the future
        if (this.manualBanes) {
            for(let i = 0; i < this.manualBanes; i++) { banes.push({ source: 'Manual', value: true }); }
        }

        if (this.manualBoons) {
            for(let i = 0; i < this.manualBoons; i++) { boons.push({ source: 'Manual', value: true }); }
        }

        this.dialogData.banes = banes;
        this.dialogData.boons = boons;

        // Needed for dialog box layout
        this.dialogData.fillerBanes = Math.max(0, boons.length - banes.length);
        this.dialogData.fillerBoons = Math.max(0, banes.length - boons.length);
    }


    async getRollOptionsFromDialog(title, label) {

        if (this.skipDialog) {
            return {
                banes: this.options.defaultBanesBoons ? this.dialogData.banes.map((e) => e.source) : [],
                boons: this.options.defaultBanesBoons ? this.dialogData.boons.map((e) => e.source) : [],
                extraBanes: 0,
                extraBoons: 0
            }
        }

        const template = "systems/dragonbane/templates/partials/roll-dialog.hbs";
        const html = await renderTemplate(template, this.dialogData);

        return new Promise(
            resolve => {
                const data = {
                    actor: this.actor,
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
            }
        }
        // Process extra banes
        elements = form.getElementsByClassName("extraBanes");
        element = elements ? elements[0] : null;
        extraBanes = element ? Number(element.value) : 0;
        extraBanes = isNaN(extraBanes) ? 0 : extraBanes;

        // Process boons
        elements = form.getElementsByClassName("boons");
        element = elements ? elements[0] : null;
        inputs = element?.getElementsByTagName("input");
        for (let input of inputs) {
            if (input.type == "checkbox" && input.checked) {
                boons.push(input.name);
            }
        }
        // Process extra boons
        elements = form.getElementsByClassName("extraBoons");
        element = elements ? elements[0] : null;
        extraBoons = element ? Number(element.value) : 0;
        extraBoons = isNaN(extraBoons) ? 0 : extraBoons;

        return {
            banes: banes,
            boons: boons,
            extraBanes: extraBanes,
            extraBoons: extraBoons
        }
    }

    formatRollFormula(rollData) {
        const banes = rollData.banes;
        const boons = rollData.boons;

        if (banes > boons) {
            return "" + (1 + banes - boons) + "d20kh";
        } else if (banes < boons) {
            return "" + (1 + boons - banes) + "d20kl";
        } else {
            return "d20";
        }
    }

    formatRollResult(postRollData) {
        if (postRollData.isDragon) {
            return game.i18n.localize("DoD.roll.dragon");
        } else if (postRollData.isDemon) {
            return game.i18n.localize("DoD.roll.demon");
        } else {
            return postRollData.success ? game.i18n.localize("DoD.roll.success") : game.i18n.localize("DoD.roll.failure");
        }

    }

    // This method should be overridden
    formatRollMessage(postRollData) {
        return {
            user: game.user.id,
            flavor: postRollData.result
        };
    }

    async renderRoll(roll, template, templateContext) {
        if ( !roll._evaluated ) await roll.evaluate({async: true});

        const defaultContext = {
            formula: roll.formula,
            user: game.user.id,
            tooltip: await roll.getTooltip(),
            total: Math.round(roll.total * 100) / 100,
        };

        const context = {...defaultContext, ...templateContext};
        if (context.formulaInfo) {
            context.tooltip = context.formulaInfo + context.tooltip;
        }

        return await renderTemplate(template, context);
    }

    getMessageTemplate() {
        return null;
    }
}
