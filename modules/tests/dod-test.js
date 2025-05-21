import DoD_Utility from "../utility.js";
import DoDRoll from "../roll.js";

export default class DoDTest {

/*
    DoDTest options:
    @param {Boolean} noBanesBoons : make the roll without any banes or boons applied, skips dialog
    @param {Boolean} defaultBanesBoons : make the roll with the default banes and boons applied, skips dialog
    @param {Boolean} autoSuccess : the test will automatically succeed (used by Monsters casting spells)
    @param {Array} banes : array of Objects with {src: <localized string of source>; value: <true, to check by default in the dialog; false otherwise>}
    @param {Array} boons : array of Objects with {src: <localized string of source>; value: <true, to check by default in the dialog; false otherwise>}
    @param {Integer} extraBanes : the number of additional banes to apply
    @param {Integer} extraBoons : the number of additional boons to apply
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
        this.isReroll = options?.isReroll | false;
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
        this.roll = await new DoDRoll(formula, {}, rollOptions).roll(game.release.generation < 12 ? {async: true} : {});

        this.updatePostRollData();
        const messageData = this.formatRollMessage(this.postRollData);
        const messageTemplate = this.getMessageTemplate();
        if (messageTemplate) {
            let renderedMessage = await this.renderRoll(this.roll, messageTemplate, this.postRollData);
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
        this.postRollData.result = Number(this.roll.result);
    }

    updatePushRollChoices() {
        const actor = this.postRollData.actor;
        this.postRollData.pushRollChoices = {};
        this.postRollData.pushRollChoice = null;

        for (const attribute in actor.system.attributes) {
            const condition = actor.system.conditions[attribute];
            if (condition) {
                if (!condition.value) {
                    this.postRollData.pushRollChoices[attribute] =
                        game.i18n.localize("DoD.conditions." + attribute) + " (" +
                        game.i18n.localize("DoD.attributes." + attribute) + ")";
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

        const banes = this.options.banes ? this.options.banes.slice() : [];
        const boons = this.options.boons ? this.options.boons.slice() : [];

        if (this.attribute && this.actor.hasCondition(this.attribute)) {
            banes.push( {source: game.i18n.localize("DoD.conditions." + this.attribute), value: true});
        }

        let rollTarget = this.skill ? this.skill.name.toLowerCase() : this.attribute?.toLowerCase();
        let rollAttribute = (this.skill && this.skill.system.attribute) ? this.skill.system.attribute.toLowerCase() : rollTarget;

        for (let item of this.actor.items.contents) {
            if (item.system.banes?.length) {
                let itemBanes = DoD_Utility.splitAndTrimString(item.system.banes.toLowerCase());
                if (itemBanes.find(element => element.toLowerCase() === rollTarget || element.toLowerCase() === rollAttribute)) {
                    let value = !!item.system.worn || item.type === "injury";
                    banes.push( {source: item.name, value: value});
                }
            }
            if (item.system.boons?.length) {
                let itemBoons = DoD_Utility.splitAndTrimString(item.system.boons.toLowerCase());
                if (itemBoons.find(element => element.toLowerCase() === rollTarget || element.toLowerCase() === rollAttribute)) {
                    let value = !!item.system.worn;
                    boons.push( {source: item.name, value: value});
                }
            }
        }

        this.dialogData.banes = banes;
        this.dialogData.boons = boons;

        // Needed for dialog box layout
        this.dialogData.fillerBanes = Math.max(0, boons.length - banes.length);
        this.dialogData.fillerBoons = Math.max(0, banes.length - boons.length);
    }


    async getRollOptionsFromDialog(title, label) {

        if (this.isReroll) {
            return this.options.rerollOptions;
        }
        if (this.skipDialog) {
            return {
                banes: this.options.noBanesBoons ? [] : this.dialogData.banes.map((e) => e.source),
                boons: this.options.noBanesBoons ? [] : this.dialogData.boons.map((e) => e.source),
                extraBanes: 0,
                extraBoons: 0
            }
        }
         return await this.renderDialog(title, label);
    }
    async renderDialog(title, label){
        const template = "systems/dragonbane/templates/partials/roll-dialog.hbs";
        const html = await DoD_Utility.renderTemplate(template, this.dialogData);

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
                const dialog = new Dialog(data, null);
                Hooks.once("renderDialog", (app, htmlContent) => {
       
                    const form = htmlContent[0].querySelector("form");
                    const checkbox = form.querySelector("#throw");
                    const radialInput = form.querySelectorAll('input[type=radio]');
                    const targetToken = (this?.options?.targets?.length > 0) ? this.options.targets[0] : false;
                    if (checkbox && targetToken ) {
                        radialInput.forEach(input =>{ input.addEventListener("change", async event => {
                            const form = htmlContent[0].querySelector("form");
                            const tabel = form.querySelector(".sheet-table.banes")
                            const rows = tabel?.querySelectorAll("tr.sheet-table-data");
                            const lastRow = rows[rows.length - 1];
                           if(event.target.checked && event.target.id === "throw"){
                            const actorToken = game.canvas.tokens.placeables.filter(token => token.document.actorId === this.actor._id)[0]
                            
                            let itemRange = this.weapon.system.range;
                            if(itemRange === "@str"){
                                itemRange = this.actor.system.attributes.str.value
                            }
                            else{
                                itemRange = Number(itemRange);
                            }
                            if (actorToken && targetToken) {
                                let distance = 0;
                                let newBane = {};
                                if (game.release.generation < 13) {
                                    distance = canvas.grid.measureDistance(actorToken, targetToken, {gridSpaces: true});
                                } 
                                else {
                                    distance = canvas.grid.measurePath([actorToken, targetToken]).distance;
                                }
                                if(distance <= 2){
                                    newBane = {source: game.i18n.localize("DoD.effect.pointBlank"), value: true};
                                    this.dialogData.banes.push(newBane);           
                                }
                               
                                
                                if(itemRange < distance && distance  <= 2*itemRange ){
                                    newBane = {source: game.i18n.localize("DoD.effect.exceedWeaponRange"), value: true}
                                    this.dialogData.banes.push(newBane);
                                                
                                }
                                if(distance  > 2*itemRange ){
                                    DoD_Utility.WARNING("DoD.WARNING.exedWeaponRange");
                                    newBane = {source: game.i18n.localize("DoD.effect.exceedWeaponRange"), value: true}
                                    this.dialogData.banes.push(newBane);
                                               
                                }
                                if(Object.keys(newBane).length !== 0){
                                const newBaneHtml = `<tr class="sheet-table-data">
                                                        <td><input type="checkbox" name="${newBane.source}" checked ${newBane.value}/></td>
                                                        <td class="text-data">${newBane.source}</td>
                                                    </tr>`
                                    const tempWrapper = document.createElement("tbody");
                                    tempWrapper.innerHTML = newBaneHtml;
                                    const newRow = tempWrapper.firstElementChild;
                                    lastRow.parentNode.insertBefore(newRow, lastRow);
                                }
                                const chosenAction = this.dialogData.actions
                                chosenAction.forEach(action =>{
                                    if(action.id === event.target.id){
                                        action.checked = true
                                    }
                                    else{
                                        action.checked = false
                                    }
                                })
                                const isOnPath = this.chekTokenOnPath(actorToken, targetToken)
                                if(isOnPath){
                                    const isOnPathBane = {source: game.i18n.localize("DoD.effect.anotherTokenOnLineofShot"), value: true}
                                    this.dialogData.banes.push(isOnPathBane);
                                    const newBaneHtml = `<tr class="sheet-table-data">
                                                        <td><input type="checkbox" name="${isOnPathBane.source}" checked ${isOnPathBane.value}/></td>
                                                        <td class="text-data">${isOnPathBane.source}</td>
                                                    </tr>`
                                    const tempWrapper = document.createElement("tbody");
                                    tempWrapper.innerHTML = newBaneHtml;
                                    const newRow = tempWrapper.firstElementChild;
                                    lastRow.parentNode.insertBefore(newRow, lastRow);
                                    
                                    
                                }
               
                            }
                           }
                            else{
                                const pointBlankSource = game.i18n.localize("DoD.effect.pointBlank");
                                const exceedRangeSource = game.i18n.localize("DoD.effect.exceedWeaponRange");
                                const isOnPath = game.i18n.localize("DoD.effect.anotherTokenOnLineofShot")
                                const hadPointBlank = this.dialogData.banes.some(bane => bane.source === pointBlankSource);
                                const hadExeedRange = this.dialogData.banes.some(bane => bane.source === exceedRangeSource);
                                const hadIsOnPath = this.dialogData.banes.some(bane => bane.source === isOnPath);
                                if(hadExeedRange || hadPointBlank || hadIsOnPath ){
                                this.dialogData.banes = this.dialogData.banes.filter(bane =>
                                    bane.source !== pointBlankSource &&
                                    bane.source !== exceedRangeSource &&
                                    bane.source !== isOnPath
                                );
                                const chosenAction = this.dialogData.actions.filter(action => action.id === event.target.id)
                                chosenAction.forEach(action =>{
                                    if(action.id === event.target.id){
                                        action.checked = true
                                    }
                                    else{
                                        action.checked = false
                                    }
                                })
                                
                                rows.forEach(row => {
                                    const checkbox = row.querySelector('input[type="checkbox"]');
                                    const labelCell = row.querySelector('td.text-data');
                                    if (checkbox?.name === pointBlankSource && labelCell?.textContent.trim() === pointBlankSource){
                                        row.remove();        
                                    }
                                    if (checkbox?.name === exceedRangeSource && labelCell?.textContent.trim() === exceedRangeSource){
                                        row.remove();        
                                    }
                                    if (checkbox?.name === isOnPath && labelCell?.textContent.trim() === isOnPath){
                                        row.remove();        
                                    }
                                });

                            }

                           }

                        });
                        })
                    }
                });
            
                dialog.render(true);
            }
        );
    }
    async chekTokenOnPath(actorToken, targetToken){
        let actorCoordinate = {}, targetCoordinate = {};
         if(game.release.generation < 13){
            actorCoordinate = {x:actorToken.x+actorToken._object.hitArea.center.x, y:actorToken.y+actorToken._object.hitArea.center.y};
            targetCoordinate = {x:targetToken.x+targetToken._object.hitArea.center.x, y:targetToken.y+targetToken._object.hitArea.center.y};
         }
         else{
            actorCoordinate = actorToken._object.center;
            targetCoordinate = targetToken._object.center;
         }
        const tokensOnCanva = game.canvas.tokens.objects.children.filter(token => token.id !== actorToken.id && token.id !== targetToken.id && token.document.hidden !== true);
       
        const isOnPath = tokensOnCanva.some(token => {
            if(game.release.generation < 13){
                point1 = {x:token.x, y:token.y};
                point2 = {x:token.x + token.hitArea.rightEdge.A.x, y: token.y};
                point3 = {x:token.x + token.hitArea.rightEdge.B.x, y: token.y+token.hitArea.rightEdge.B.y};
                point4 = {x:token.x, y:token.y + token.hitArea.leftEdge.A.y};
            }
            else{
                point1 = {x:token.x + token.hitArea.points[0], y:token.y + token.hitArea.points[1]}
                point2 = {x:token.x + token.hitArea.points[2], y:token.y + token.hitArea.points[3]}
                point3 = {x:token.x + token.hitArea.points[4], y:token.y + token.hitArea.points[5]}
                point4 = {x:token.x + token.hitArea.points[6], y:token.y + token.hitArea.points[7]}
            }
            const intersection1 = foundry.utils.lineSegmentIntersection(actorCoordinate,targetCoordinate,point1,point2)
            const intersection2 = foundry.utils.lineSegmentIntersection(actorCoordinate,targetCoordinate,point2,point3)
            const intersection3 = foundry.utils.lineSegmentIntersection(actorCoordinate,targetCoordinate,point3,point4)
            const intersection4 = foundry.utils.lineSegmentIntersection(actorCoordinate,targetCoordinate,point4,point1)
            const intersections = [intersection1, intersection2, intersection3, intersection4];          
            const hitPoints = [point1, point2, point3,point4]
            const nonNullIntersections = intersections.filter(i => i !== null);
            const cornerMatches = nonNullIntersections.filter(intersection =>
                hitPoints.some(pt => pt.x === intersection.x && pt.y === intersection.y)
            );

            let validIntersections = false;

            if (nonNullIntersections.length >= 2) {
                const cornerCount = cornerMatches.length;

                if (cornerCount === 0 || cornerCount > 2) {

                    validIntersections = true;
                }
            }
            return validIntersections
        });
        return isOnPath
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
            if (input.type === "checkbox" && input.checked) {
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
            if (input.type === "checkbox" && input.checked) {
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
        if ( !roll._evaluated ) await roll.evaluate(game.release.generation < 12 ? {async: true} : {});

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

        return await DoD_Utility.renderTemplate(template, context);
    }

    getMessageTemplate() {
        return null;
    }
}