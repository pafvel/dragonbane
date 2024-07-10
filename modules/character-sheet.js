import * as DoDChat from "./chat.js";
import { DoD } from "./config.js";
import DoDAttributeTest from "./tests/attribute-test.js";
import DoDSkillTest from "./tests/skill-test.js";
import DoDSpellTest from "./tests/spell-test.js";
import DoDWeaponTest from "./tests/weapon-test.js";
import DoD_Utility from "./utility.js";

export default class DoDCharacterSheet extends ActorSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions,  {
            width: 700,
            height: 775,
            classes: ["DoD", "sheet", "character"],
            dragDrop: [{
                dragSelector: ".item-list .item",
                dropSelector: null,
                permissions: { dragstart: () => true }
            }],
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
        });
    }

    #focusElement;

    constructor(object, options) {
        switch (object.type) {
            case "character":
                break;
            case "monster":
                options.width = 580;
                options.height = 670;
                break;
            case "npc":
                options.width = 580;
                options.height = 640;
                break;
            default:
                break;
        }

        super(object, options);
        this.#focusElement = null;
    }

    get template() {
        return `systems/dragonbane/templates/${this.actor.type}-sheet.html`;
    }

    async close(options) {
        document.removeEventListener('keydown', this.keydownListener);
        return super.close(options);
     }

     render(force, options) {
        this.keydownListener = this.#onKeydown.bind(this);
        document.addEventListener('keydown', this.keydownListener);
        return super.render(force, options);
     }

     #onKeydown(event) {
        if ((event.code === "Delete" || event.code === "Backspace") && this.#focusElement) {
            // Don't delete items if an input element has focus
            if (event.currentTarget?.activeElement.nodeName.toLowerCase() === "input") {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            const itemId = this.#focusElement.dataset.itemId;
            const item = this.actor.items.get(itemId);

            this.#focusElement = null;

            if (item.type === "skill") {
                return item.update({ ["system.value"]: 0});
            } else {
                return this.actor.deleteEmbeddedDocuments("Item", [itemId]);
            }
        }
     }

    async getData() {
        const baseData = super.getData();

        let sheetData = {
            owner: baseData.actor.isOwner,
            observer: baseData.actor.isObserver,
            editable: this.isEditable,
            actor: baseData.actor,
            system: baseData.data.system,
            config: CONFIG.DoD
        };

        async function enrich(html) {
            if (html) {
                return await TextEditor.enrichHTML(html, {
                    secrets: sheetData.actor.isOwner,
                    async: true
                });
            } else {
                return html;
            }
        }

        sheetData.system.appearance = await enrich(sheetData.system.appearance);
        sheetData.system.description = await enrich(sheetData.system.description);
        sheetData.system.notes = await enrich(sheetData.system.notes);
        sheetData.system.weakness = await enrich(sheetData.system.weakness);
        sheetData.system.traits = await enrich(sheetData.system.traits);

        // Prepare character data and items.
        this._prepareItems(sheetData);

        return sheetData;
    }

    _prepareItems(sheetData) {

        const heroicAbilities = [];
        const kinAbilities = [];
        const professionAbilities = [];
        const spells = [];
        const schools = {};
        const inventory = [];
        const equippedWeapons = [];
        const injuries = [];

        let equippedArmor = sheetData.actor.system.equippedArmor;
        let equippedHelmet = sheetData.actor.system.equippedHelmet;
        let memento = null;
        let smallItems = [];

        for (let item of sheetData.actor.items.contents) {

            // any item can be a memento
            if (item.system.memento && this.actor.type === "character") {
                if(!memento) {
                    memento = item;
                    continue;
                } else {
                    // Memento slot busy. Clear flag and process as normal item
                    item.update({ ["system.memento"]: false});
                }
            }

            if (item.type === 'skill') {
                // moved to actor
                continue;
            }

            if (item.type === 'ability') {
                let ability = item;

                if (ability.system.abilityType === 'kin') {
                    kinAbilities.push(ability);
                } else if (ability.system.abilityType === 'profession') {
                    professionAbilities.push(ability);
                } else {
                    heroicAbilities.push(ability);
                }
                continue;
            }

            if (item.type === 'spell')
            {
                let spell = item;

                spells.push(spell);

                if (!schools[spell.system.school]) {
                    schools[spell.system.school] = [];
                }
                schools[spell.system.school].push(spell);
                continue;
            }

            if (item.type === "weapon") {
                if (item.system.worn) {
                    // TODO limit 3
                    equippedWeapons.push(item);
                } else if (item.system.weight === 0 && this.actor.type === "character") {
                    smallItems.push(item);
                } else {
                    inventory.push(item);
                }
                // weapons can be mementos
                if (item.system.memento && this.actor.type === "character") {
                    if(!memento) {
                        memento = item;
                    } else {
                        // Memento slot busy. Clear flag and process as normal item
                        item.update({ ["system.memento"]: false});
                    }
                }
                continue;
            }

            if (item.type === "armor") {
                if (!item.system.worn) {
                    if (item.system.weight === 0 && this.actor.type === "character") {
                        smallItems.push(item);
                    } else {
                        inventory.push(item);
                    }
                }
                continue;
            }

            if (item.type === "helmet") {
                if (!item.system.worn) {
                    if (item.system.weight === 0 && this.actor.type === "character") {
                        smallItems.push(item);
                    } else {
                        inventory.push(item);
                    }
                }
                continue;
            }
            if (item.type === "item") {
                if (item.system.weight === 0 && item.system.type !== "backpack" && this.actor.type === "character")
                {
                    smallItems.push(item);
                    continue;
                }
                inventory.push(item);
            }
            if (item.type === "injury") {
                injuries.push(item);
            }
        }

        // Kin and Profession
        sheetData.kin = sheetData.actor.system.kin;
        sheetData.kinName = sheetData.kin?.name;
        sheetData.profession = sheetData.actor.system.profession;
        sheetData.professionName = sheetData.profession?.name;

        // Items (skills, abilities, spells)
        sheetData.coreSkills = sheetData.actor.system.coreSkills?.sort(DoD_Utility.nameSorter);
        sheetData.magicSkills = sheetData.actor.system.magicSkills?.sort(DoD_Utility.nameSorter);
        sheetData.secondarySkills = sheetData.actor.system.secondarySkills?.sort(DoD_Utility.nameSorter);
        sheetData.weaponSkills = sheetData.actor.system.weaponSkills?.sort(DoD_Utility.nameSorter);
        sheetData.trainedSkills = sheetData.actor.system.trainedSkills?.sort(DoD_Utility.nameSorter).filter(s => s.system.hideTrained === false);

        sheetData.heroicAbilities = heroicAbilities.sort(DoD_Utility.nameSorter);
        sheetData.kinAbilities = kinAbilities.sort(DoD_Utility.nameSorter);
        sheetData.professionAbilities = professionAbilities.sort(DoD_Utility.nameSorter);
        sheetData.abilities = heroicAbilities.concat(kinAbilities, professionAbilities).sort(DoD_Utility.nameSorter);

        //
        let formattedAbilities = [];
        for (let i=0, j; i < sheetData.abilities.length; i=j) {
            let count = 1;
            // count number of abilities with same name and skip duplicates
            for (j = i+1; j < sheetData.abilities.length; j++) {
                if (sheetData.abilities[i].name === sheetData.abilities[j].name) {
                    count++;
                } else {
                    break;
                }
            }
            // Push first unique ability. Add ability count in parenthesis (if multiple)
            formattedAbilities.push({
                id: sheetData.abilities[i].id,
                name: count === 1 ? sheetData.abilities[i].name : sheetData.abilities[i].name + " (" + count + ")"
            });
        }
        sheetData.abilities = formattedAbilities;


        sheetData.spells = spells?.sort(DoD_Utility.nameSorter);
        sheetData.hasSpells = spells.length > 0;
        sheetData.memorizedSpells = sheetData.spells?.filter(s => s.system.memorized);

        sheetData.inventory = inventory?.sort(DoD_Utility.itemSorter);
        sheetData.equippedWeapons = equippedWeapons?.sort(DoD_Utility.itemSorter);
        sheetData.canEquipWeapon = equippedWeapons ? equippedWeapons.filter(w => !w.hasWeaponFeature("unarmed")).length < 3 : true;
        sheetData.equippedArmor = equippedArmor;
        sheetData.equippedHelmet = equippedHelmet;
        sheetData.hasArmor = equippedArmor || equippedHelmet;
        sheetData.smallItems = smallItems?.sort(DoD_Utility.itemSorter);
        sheetData.memento = memento;
        sheetData.canEquipItems = game.settings.get("dragonbane", "canEquipItems");
        sheetData.effects = Array.from(this.actor.allApplicableEffects());

        // Injuries
        sheetData.injuries = injuries?.sort(DoD_Utility.itemSorter);
        for (let injury of injuries) {
            let tooltip = DoD_Utility.removeEnrichment(injury.system.description);
            injury.system.tooltip = DoD_Utility.removeHtml(tooltip);
            if (isNaN(injury.system.healingTime)) {
                injury.system.healingTimeTooltip = game.i18n.localize("DoD.injury.rollHealingTime");
            } else {
                injury.system.healingTimeTooltip = game.i18n.localize("DoD.injury.clickHealingTime");

            }
            
        }

        this._updateEncumbrance(sheetData);

        // HP widget data
        sheetData.maxHP = sheetData.actor.system.hitPoints.max;
        sheetData.currentHP = sheetData.actor.system.hitPoints.value;
        sheetData.lostHP = sheetData.maxHP - sheetData.currentHP;
        sheetData.fillHP = sheetData.maxHP < 11 ? 11 - sheetData.maxHP : 0; // needed for layout
        sheetData.largeHP = sheetData.maxHP > 40; // switch to large hp widget

        // Death rolls widget data
        if (this.actor.type === "character") {
            sheetData.deathRollsSuccesses = sheetData.actor.system.deathRolls.successes;
            sheetData.deathRollsSuccessesRemaining = 3 - sheetData.deathRollsSuccesses;
            sheetData.deathRollsFailures = sheetData.actor.system.deathRolls.failures;
            sheetData.deathRollsFailuresRemaining = 3 - sheetData.deathRollsFailures;
        }

        // WP widget data
        if (this.actor.type === "character" || this.actor.type === "npc") {
            sheetData.hasWillpower = this.actor.type === "character" || sheetData.actor.system.willPoints.max > 0 || sheetData.abilities.length > 0 || sheetData.spells.length > 0 || !game.settings.get("dragonbane", "hideNpcWpWidget");
            //sheetData.hasWillpower = sheetData.actor.type != "monster" || sheetData.abilities.length > 0 || sheetData.spells.length > 0;
            if (sheetData.hasWillpower) {
                sheetData.maxWP = sheetData.actor.system.willPoints.max;
                sheetData.currentWP = sheetData.actor.system.willPoints.value;
                sheetData.lostWP = sheetData.maxWP - sheetData.currentWP;
                sheetData.fillWP = sheetData.maxWP < 11 ? 11 - sheetData.maxWP : 0; // needed for layout
                sheetData.largeWP = sheetData.maxWP > 40; // switch to large wp widget
            }
        }
    }

    _updateEncumbrance(sheetData) {
        if (this.actor.type === "character") {
            sheetData.maxEncumbrance = Math.ceil(0.5 * this.actor.system.attributes.str.value);
            if (sheetData.inventory.find(item => item.system.type === "backpack")) {
                sheetData.maxEncumbrance += 2;
            }
        }
        sheetData.encumbrance = 0;
        if (sheetData.inventory) {
            sheetData.inventory.forEach(item => sheetData.encumbrance += item.totalWeight);
        }
        if (sheetData.actor.system.currency) {
            let coins = sheetData.actor.system.currency.gc + sheetData.actor.system.currency.sc + sheetData.actor.system.currency.cc;
            sheetData.encumbrance += Math.floor(coins/100);
        }
        // Maximum 2 decimals
        sheetData.encumbrance = Math.round(100 * sheetData.encumbrance) / 100;

        if (this.actor.type === "character") {
            sheetData.overEncumbered = sheetData.encumbrance > sheetData.maxEncumbrance;
        }
    }

    activateListeners(html) {

        html.find(".item-edit").on("click contextmenu", this._onItemEdit.bind(this));

        if (this.object.isOwner) {

            // // Elements need focus for the keydown event to to work
            html.find(".item-delete-key").mouseenter(event => { this.#focusElement = event.currentTarget; });
            html.find(".item-delete-key").mouseleave(_event => { this.#focusElement = null; });

            html.find(".attribute-input").change(this._onEditAttribute.bind(this));
            html.find(".inline-edit").change(this._onInlineEdit.bind(this));
            html.find(".kin-edit").change(this._onKinEdit.bind(this));
            html.find(".profession-edit").change(this._onProfessionEdit.bind(this));
            html.find(".age-edit").change(this._onAgeEdit.bind(this));
            html.find(".item-delete").click(this._onItemDelete.bind(this));

            html.find(".rollable-attribute").click(this._onAttributeRoll.bind(this));
            html.find(".condition-panel").click(this._onConditionClick.bind(this));
            html.find(".rollable-skill").on("click contextmenu", this._onSkillRoll.bind(this));
            html.find(".rollable-damage").on("click contextmenu", this._onDamageRoll.bind(this));
            html.find(".rollable-healingTime").on("click contextmenu", this._onHealingTimeRoll.bind(this));
            html.find(".use-ability").on("click contextmenu", this._onUseAbility.bind(this));
            html.find("[data-action='roll-advancement']").on("click contextmenu", this._onAdvancementRoll.bind(this))
            html.find(".mark-advancement").on("click", this._onMarkAdvancement.bind(this))

            html.find(".hit-points-max-label").change(this._onEditHp.bind(this));
            html.find(".hit-points-current-label").change(this._onEditCurrentHp.bind(this));
            html.find(".will-points-max-label").change(this._onEditWp.bind(this));
            html.find(".will-points-current-label").change(this._onEditCurrentWp.bind(this));

            html.find(".hit-points-box").on("click contextmenu", this._onHitPointClick.bind(this));
            html.find(".will-points-box").on("click contextmenu", this._onWillPointClick.bind(this));

            html.find(".death-rolls-success").on("click contextmenu", this._onDeathRollsSuccessClick.bind(this));
            html.find(".death-rolls-success-label").on("click contextmenu", this._onDeathRollsSuccessClick.bind(this));
            html.find(".death-rolls-failure").on("click contextmenu", this._onDeathRollsFailureClick.bind(this));
            html.find(".death-rolls-failure-label").on("click contextmenu", this._onDeathRollsFailureClick.bind(this));
            html.find("[data-action='roll-deathRoll']").click(this._onDeathRoll.bind(this))

            html.find(".effect-edit").on("click contextmenu", this._onEffectEdit.bind(this));
            html.find(".effect-delete").click(this._onEffectDelete.bind(this));

            
            let restRoundButton = html.find(".rest-round");
            if (restRoundButton?.length > 0) {
                if (this.actor.system.canRestRound === false) {
                    restRoundButton[0].disabled = true;
                } else {
                    restRoundButton[0].disabled = false;
                    restRoundButton.on("click", this._onRestRound.bind(this));
                }
            }

            let restStretchButton = html.find(".rest-stretch");
            if (restStretchButton?.length > 0) {
                if (this.actor.system.canRestStretch === false) {
                    restStretchButton[0].disabled = true;
                } else {
                    restStretchButton[0].disabled = false;
                    restStretchButton.on("click", this._onRestStretch.bind(this));
                }
            }

            html.find(".rest-shift").on("click", this._onRestShift.bind(this));
            html.find(".rest-reset").on("click", this._onRestReset.bind(this));

            html.find(".item-create").click(this._onItemCreate.bind(this));

            if (this.object.type === "monster") {
                html.find(".monster-attack").on("click contextmenu", this._onMonsterAttack.bind(this));
                html.find(".monster-defend").on("click", this._onMonsterDefend.bind(this));
            }
        } else if (this.object.isObserver) {
            // Enable right-clicking skills & items
            html.find(".rollable-skill").on("contextmenu", this._onSkillRoll.bind(this));
            html.find(".use-ability").on("contextmenu", this._onUseAbility.bind(this));

            // Enable dragging items from this sheet
            let handler = this._onDragStart.bind(this);
            html.find('.draggable-item').each((_i, li) => {
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });

        }

        super.activateListeners(html);
    }

    _processSelectMonsterAttack(form, table) {
        let elements = form.getElementsByClassName("selectMonsterAttack");
        let element = elements.length > 0 ? elements[0] : null;
        if (element) {
            const value = parseInt(element.value);
            if (value > 0) {
                for (let tableResult of table.results) {
                    if (value === tableResult.range[0]) {
                        DoD_Utility.monsterAttack(this.actor, table, tableResult);
                        return;
                    }
                }
            } else {
                DoD_Utility.monsterAttack(this.actor, table);
            }
        }
    }

    async _onMonsterAttack(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        const table = this.actor.system.attackTable ? fromUuidSync(this.actor.system.attackTable) : null;
        if (!table) {
            DoD_Utility.WARNING("DoD.WARNING.missingMonsterAttackTable");
            return;
        }

        if (event.type === "click") { // left click
            let skipDialog = event.shiftKey || event.ctrlKey;
            if (!game.settings.get("dragonbane", "monsterAttackDialogIsDefault")) {
                skipDialog = !skipDialog;
            }
            if (skipDialog) {
                return DoD_Utility.monsterAttack(this.actor, table);
            }
            let dialogData = { };
            dialogData.attacks = [];
            for (let result of table.results) {
                // Find attack description
                let attack = {name: "", description: "", index: result.range[0]};
                if (result.documentCollection === "RollTable") {
                    let subTable = DoD_Utility.findTable(result.text);
                    if (subTable?.uuid !== table.uuid) {
                        attack.description = subTable?.description;
                    } else {
                        attack.description = result.text;
                    }
                } else {
                    attack.description = result.text;
                }
                attack.description = await TextEditor.enrichHTML(attack.description, { async: true });

                // Split attack name and description
                const match = attack.description.match(/<b>(.*?)<\/b>(.*)/);
                if (match) {
                    attack.name = match[1];
                    attack.description = match[2]
                } else {
                    attack.name = String(attack.index);
                }
                dialogData.attacks.push(attack);
            }

            const template = "systems/dragonbane/templates/partials/monster-attack-dialog.hbs";
            const html = await renderTemplate(template, dialogData);
            const labelOk = game.i18n.localize("DoD.ui.dialog.labelOk");
            const labelCancel = game.i18n.localize("DoD.ui.dialog.labelCancel");

            return await new Promise(
                resolve => {
                    const data = {
                        item: this.item,
                        title: game.i18n.localize("DoD.ui.dialog.monsterAttackTitle"),
                        content: html,
                        buttons: {
                            ok: {
                                label: labelOk,
                                callback: html => resolve(this._processSelectMonsterAttack(html[0].querySelector("form"), table))
                                //callback: html => resolve({cancelled: false})
                            },
                            cancel: {
                                label: labelCancel,
                                callback: _html => resolve({cancelled: true})
                            }
                        },
                        default: "ok",
                        close: () => resolve({cancelled: true})
                    };
                    new Dialog(data, null).render(true);
                }
            );
        } else { // right click
            return DoD_Utility.monsterAttackTable(this.actor, table);
        }
    }

    async _onMonsterDefend(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        // Monsters always dodge or parry with skill value 15
        const skill = {
            name: game.i18n.localize("DoD.ui.character-sheet.monsterDefendSkillFlavor"),
            system: {value: 15}
        }

        const test = new DoDSkillTest(this.actor, skill, {skipDialog: true});
        await test.roll();
    }

    _onHitPointClick(event) {
        event.preventDefault();

        let hp = this.actor.system.hitPoints;
        if (event.type === "click") { // left click
            if (hp.value > 0) {
                return this.actor.update({ ["system.hitPoints.value"]: hp.value-1});
            }
        } else { // right click
            if (hp.value < hp.max) {
                return this.actor.update({ ["system.hitPoints.value"]: hp.value+1});
            }
        }
    }

    _onWillPointClick(event) {
        event.preventDefault();

        let wp = this.actor.system.willPoints;
        if (event.type === "click") { // left click
            if (wp.value > 0) {
                return this.actor.update({ ["system.willPoints.value"]: wp.value-1});
            }
        } else { // right click
            if (wp.value < wp.max) {
                return this.actor.update({ ["system.willPoints.value"]: wp.value+1});
            }
        }
    }

    async _onDeathRollsSuccessClick(event) {
        event.preventDefault();

        let successes = this.actor.system.deathRolls.successes;
        console.assert(successes >= 0 && successes <= 3, "Dragonbane: system.deathRolls.successes out of range for " + this.actor.uuid);
        if (event.type === "click") { // left click
            if (successes < 3) {
                return await this.actor.update({ ["system.deathRolls.successes"]: successes+1});
            }
        } else { // right click
            if (successes > 0) {
                return await this.actor.update({ ["system.deathRolls.successes"]: successes-1});
            }
        }
    }

    async _onDeathRollsFailureClick(event) {
        event.preventDefault();

        let failures = this.actor.system.deathRolls.failures;
        console.assert(failures >= 0 && failures <= 3, "Dragonbane: system.deathRolls.failures out of range for " + this.actor.uuid);
        if (event.type === "click") { // left click
            if (failures < 3) {
                return await this.actor.update({ ["system.deathRolls.failures"]: failures+1});
            }
        } else { // right click
            if (failures > 0) {
                return await this.actor.update({ ["system.deathRolls.failures"]: failures-1});
            }
        }
    }

    async _onDeathRoll(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        let options = {
            canPush: false,
            flavor: "DoD.roll.deathRoll"
        };
        if (event.shiftKey || event.ctrlKey) {
            options = {
                noBanesBoons: event.shiftKey,
                defaultBanesBoons: event.ctrlKey
            };
        }

        let test = new DoDAttributeTest(this.actor, "con", options);
        await test.roll();

        const success = test.postRollData.success;
        const isDragon = test.postRollData.isDragon;
        const isDemon = test.postRollData.isDemon;

        async function updateDeathRolls(actor) {
            if (success) {
                if (actor.system.deathRolls.successes < 3) {
                    await actor.update({ ["system.deathRolls.successes"]: Math.min(3, actor.system.deathRolls.successes + (isDragon ? 2 : 1))});
                }
            } else {
                if (actor.system.deathRolls.failures < 3) {
                    await actor.update({ ["system.deathRolls.failures"]: Math.min(3, actor.system.deathRolls.failures + (isDemon ? 2 : 1))});
                }
            }
            if (actor.system.deathRolls.failures === 3 && game.settings.get("dragonbane", "automateCharacterDeath")) {
                const token = canvas.scene.tokens.find(t => t.actor.uuid === actor.uuid);
                if (token) {
                    const status = CONFIG.statusEffects.find(a => a.id === 'dead');
                    token.toggleActiveEffect(status, {active: true, overlay: true});
                }
                const actorName = actor.isToken ? actor.token.name : actor.name;
                const msg = "<p>" + game.i18n.format("DoD.ui.chat.characterDied", {actor: actorName}) + "</p>";
                ChatMessage.create({ content: msg });
            }
            if (actor.system.deathRolls.successes === 3) {
                const actorName = actor.isToken ? actor.token.name : actor.name;
                const msg = "<p>" + game.i18n.format("DoD.ui.chat.characterSurvived", {actor: actorName}) + "</p>";
                ChatMessage.create({ content: msg });
                await actor.update({["system.deathRolls.failures"]: 0, ["system.deathRolls.successes"]: 0});
            }

        }

        if(game.dice3d) {
            game.dice3d.waitFor3DAnimationByMessageID(test.rollMessage.id).then(
                () => updateDeathRolls(this.actor));
        } else {
            updateDeathRolls(this.actor);
        }
    }

    async _onRestRound(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        await this.actor.restRound();
    }

    async _onRestStretch(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        await this.actor.restStretch();
    }

    async _onRestShift(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        await this.actor.restShift();
    }

    async _onRestReset(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        await this.actor.restReset();
    }

    _onEditAttribute(event) {
        event.preventDefault();
        event.currentTarget.blur();

        let element = event.currentTarget;
        if (element.value < 1 || element.value > 18) {
            element.value = element.defaultValue;
            DoD_Utility.WARNING("DoD.WARNING.attributeOutOfRange")
            return false;
        }
    }

    async _onInlineEdit(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);
        let field = element.dataset.field;

        event.currentTarget.blur();

        if (element.type === "checkbox") {

            // Handle wearing armor, helmet and weapons
            if (field === "system.worn" && element.checked) {
                if (item.type === "weapon" && !item.hasWeaponFeature("unarmed")) {
                    const actorData = await this.getData();
                    if (!actorData.canEquipWeapon) {
                        element.checked = false;
                        DoD_Utility.WARNING("DoD.WARNING.maxWeaponsEquipped");
                        return;
                    }
                } else if (item.type==="armor" && this.actor.system.equippedArmor) {
                    await this.actor.system.equippedArmor.update({
                        ["system.worn"]: true,
                        ["system.memento"]: false
                    });
                } else if (item.type==="helmet" && this.actor.system.equippedHelmet) {
                    await this.actor.system.equippedHelmet.update({
                        ["system.worn"]: true,
                        ["system.memento"]: false
                    });
                }
            }

            // Handle equipping & unequipping weapons
            if (field === "system.mainHand" || field === "system.offHand") {
                const twoHanded = item.system.grip.value === "grip2h";
                if (element.checked) {
                    // Un-equip weapons in same hand or both hands if equipping 2-handed weapon
                    for (let actorItem of this.actor.items) {
                        if (actorItem.type === "weapon") {
                            if (actorItem.uuid !== item.uuid) {
                                // Equipping a different weapon
                                // Un-eqiup weapon in same hand or if any of the weapons is two-handed
                                if (twoHanded || actorItem.system.grip.value === "grip2h") {
                                    actorItem.update({["system.mainHand"]: false, ["system.offHand"]: false});
                                } else {
                                    actorItem.update({[field]: false});
                                }
                            }
                        }
                    }
                }
                // Equip/Unequip 2-handed weapon
                if (twoHanded) {
                    return item.update({["system.mainHand"]: element.checked, "system.offHand": element.checked});
                }
            }

            // Handle enable/disable effect
            if (field === "effect.disabled") {
                const effectId = element.closest(".sheet-table-data").dataset.effectId;
                const effects = Array.from(this.actor.allApplicableEffects());
                let effect = effects.find((e) => e.id === effectId);
                return await effect.update({ ["disabled"]: element.checked });
            }
            return await item.update({ [field]: element.checked });
        }

        let result = await item.update({ [field]: Number(element.value) });

        // Skill values may reset to their base chance.
        let value = foundry.utils.getProperty(item, field);
        element.value = value;
        return result;
    }

    _onEditHp(event) {
        event.preventDefault();
        event.currentTarget.blur();

        const newMax = Math.max(1, Math.floor(event.currentTarget.value));
        const currentDamage = Math.max(0, this.actor.system.hitPoints.base - this.actor.system.hitPoints.value);
        const newValue = Math.max(0, newMax - currentDamage);

        return this.actor.update({
            ["system.hitPoints.base"]: newMax,
            ["system.hitPoints.value"]: newValue
        });
    }
    _onEditCurrentHp(event) {
        event.preventDefault();
        event.currentTarget.blur();

        const newValue = DoD_Utility.clamp(event.currentTarget.value, 0, this.actor.system.hitPoints.max);

        event.currentTarget.value = newValue;
        return this.actor.update({
            ["system.hitPoints.value"]: newValue
        });
    }

    _onEditWp(event) {
        event.preventDefault();
        event.currentTarget.blur();

        const newMax = Math.max(0, Math.floor(event.currentTarget.value));
        const currentDamage = Math.max(0, this.actor.system.willPoints.max - this.actor.system.willPoints.value);
        const newValue = Math.max(0, newMax - currentDamage);

        return this.actor.update({
            ["system.willPoints.max"]: newMax,
            ["system.willPoints.value"]: newValue
        });
    }
    _onEditCurrentWp(event) {
        event.preventDefault();
        event.currentTarget.blur();

        const newValue = DoD_Utility.clamp(event.currentTarget.value, 0, this.actor.system.willPoints.max);

        return this.actor.update({
            ["system.willPoints.value"]: newValue
        });
    }

    async _onKinEdit(event) {
        event.preventDefault();
        event.currentTarget.blur();
        let kinName = event.currentTarget.value;
        let kin = await DoD_Utility.findKin(kinName);
        if (!kin) {
            await this.actor.removeKin();
            DoD_Utility.WARNING("DoD.WARNING.kin", {kin: kinName});
        } else {
            await this.actor.removeKin();
            await this.actor.createEmbeddedDocuments("Item", [kin.toObject()]);
            await this.actor.updateKinAbilities();
        }
    }

    async _onProfessionEdit(event) {
        event.preventDefault();
        event.currentTarget.blur();
        let professionName = event.currentTarget.value;
        let profession = await DoD_Utility.findProfession(professionName);
        if (!profession) {
            await this.actor.removeProfession();
            DoD_Utility.WARNING("DoD.WARNING.profession", {profession: professionName});
        } else {
            await this.actor.removeProfession();
            await this.actor.createEmbeddedDocuments("Item", [profession.toObject()]);

            let missingSkills = await this.actor.updateProfession();
            for (const skillName of missingSkills) {
                const skill = DoD_Utility.findSkill(skillName);
                if (skill) {
                    await this._onDropItemCreate(skill.toObject());
                } else {
                    DoD_Utility.WARNING("DoD.WARNING.professionSkill", {skill: skillName});
                }
            }
        }
    }

    async _onAgeEdit(event) {
        event.preventDefault();
        event.currentTarget.blur();

        const modifiers = {
            young: {
                ["system.attributes.str.value"]: 0,
                ["system.attributes.con.value"]: 1,
                ["system.attributes.agl.value"]: 1,
                ["system.attributes.int.value"]: 0,
                ["system.attributes.wil.value"]: 0,
                ["system.attributes.cha.value"]: 0,
            },
            adult: {
                ["system.attributes.str.value"]: 0,
                ["system.attributes.con.value"]: 0,
                ["system.attributes.agl.value"]: 0,
                ["system.attributes.int.value"]: 0,
                ["system.attributes.wil.value"]: 0,
                ["system.attributes.cha.value"]: 0,
            },
            old: {
                ["system.attributes.str.value"]: -2,
                ["system.attributes.con.value"]: -2,
                ["system.attributes.agl.value"]: -2,
                ["system.attributes.int.value"]: 1,
                ["system.attributes.wil.value"]: 1,
                ["system.attributes.cha.value"]: 0,
            }
        };

        const currentAge = this.actor.system.age || "adult";
        const newAge = event.currentTarget.value || "adult";

        let newValues = {"system.age": newAge};

        for (const key in modifiers[currentAge]) {
            newValues[key] = modifiers[newAge][key] - modifiers[currentAge][key] + foundry.utils.getProperty(this.actor, key);
            if (newValues[key] < 1 || newValues[key] > 18) {
                DoD_Utility.WARNING("DoD.WARNING.attributeOutOfRange");
            }
        }
        await this.actor.update(newValues);
    }

    async _itemDeleteDialog(item, flavor = "") {
        let content = flavor ? "<p>" + flavor + "</p>" : "";
        content += game.i18n.format("DoD.ui.dialog.deleteItemContent", {item: item.name});

        const itemType = item.documentName === "ActiveEffect" ? game.i18n.localize("DoD.ui.character-sheet.effect") : game.i18n.localize("TYPES.Item." + item.type);

        return await new Promise(
            resolve => {
                const data = {
                    title: game.i18n.format("DoD.ui.dialog.deleteItemTitle",
                        {item: itemType}),
                    content: content,
                    buttons: {
                        ok: {
                            icon: '<i class="fas fa-check"></i>',
                            label: game.i18n.localize("Yes"),
                            callback: () => resolve(true)
                        },
                        cancel: {
                            icon: '<i class="fas fa-times"></i>',
                            label: game.i18n.localize("No"),
                            callback: _html => resolve(false)
                        }
                    },
                    default: "cancel",
                    close: () => resolve(false)
                };
                new Dialog(data, null).render(true);
            }
        );
    }

    async _onItemDelete(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);

        const ok = await this._itemDeleteDialog(item);
        if (!ok) {
            return;
        }
        return this.actor.deleteEmbeddedDocuments("Item", [itemId]);
    }

    _onItemEdit(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);

        item?.sheet.render(true);
    }

    _onItemKeyDown(event) {
        event.preventDefault();

        // Del key
        if (event.keyCode === 46) {
            let element = event.currentTarget;
            let itemId = element.dataset.itemId;
            return this.actor.deleteEmbeddedDocuments("Item", [itemId]);
        }
    }


    async _onSkillRoll(event) {
        event.preventDefault();

        let itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);

        if (event.type === "click") { // left click - skill roll
            let test = null;
            let options = {};
            if (event.shiftKey || event.ctrlKey) {
                options = {
                    noBanesBoons: event.shiftKey,
                    defaultBanesBoons: event.ctrlKey
                };
            }
            if (game.user.targets.size > 0) {
                options.targets = Array.from(game.user.targets);
            }
            if (item.type === "skill") {
                test = new DoDSkillTest(this.actor, item, options);
            } else if (item.type === "spell") {
                if (item.system.rank > 0) {
                    if (this.actor.type === "monster") {
                        options.autoSuccess = true;
                    }
                    test = new DoDSpellTest(this.actor, item, options);
                } else {
                    const use = await new Promise(
                        resolve => {
                            const data = {
                                title: game.i18n.localize("DoD.ui.dialog.castMagicTrickTitle"),
                                content: game.i18n.format("DoD.ui.dialog.castMagicTrickContent", {spell: item.name}),
                                buttons: {
                                    ok: {
                                        icon: '<i class="fas fa-check"></i>',
                                        label: game.i18n.localize("Yes"),
                                        callback: () => resolve(true)
                                    },
                                    cancel: {
                                        icon: '<i class="fas fa-times"></i>',
                                        label: game.i18n.localize("No"),
                                        callback: _html => resolve(false)
                                    }
                                },
                                default: "cancel",
                                close: () => resolve(false)
                            };
                            new Dialog(data, null).render(true);
                        }
                    );
                    if (use) {
                        if (this.actor.type !== "monster" && this.actor.system.willPoints.value < 1) {
                            DoD_Utility.WARNING("DoD.WARNING.notEnoughWPForSpell");
                            return;
                        } else {
                            let content = "<p>" + game.i18n.format("DoD.ui.chat.castMagicTrick", {
                                actor: this.actor.name,
                                spell: item.name,
                                uuid: item.uuid
                            }) + "</p>";
                            if (this.actor.type !== "monster") {
                                const oldWP = this.actor.system.willPoints.value;
                                const newWP = oldWP - 1;
                                await this.actor.update({"system.willPoints.value": newWP});
                                content +=
                                `<div class="damage-details permission-observer" data-actor-id="${this.actor.uuid}">
                                    <i class="fa-solid fa-circle-info"></i>
                                    <div class="expandable" style="text-align: left; margin-left: 0.5em">
                                        <b>${game.i18n.localize("DoD.ui.character-sheet.wp")}:</b> ${oldWP} <i class="fa-solid fa-arrow-right"></i> ${newWP}<br>
                                    </div>
                                </div>`;
                            }

                            ChatMessage.create({
                                content: content,
                            });
                            }
                    }
                }
            } else if (item.type === "weapon") {
                test = new DoDWeaponTest(this.actor, item, options);
            }
            if (test) {
                await test.roll();
            }
        } else { // right click - edit item
            item.sheet.render(true);
        }
    }

    async _onUseAbility(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
        const item = this.actor.items.get(itemId);

        if (event.type === "click") { // left click - use item
            if (item.type === "ability") {
                this.actor.useAbility(item);
            }
        } else { // right click - edit item
            item.sheet.render(true);
        }
    }

    async _onDamageRoll(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
        const weapon = this.actor.items.get(itemId);

        if (event.type === "click") { // left click - roll damage

            const weaponDamage = weapon.system.damage;
            const skill = this.actor.findSkill(weapon.system.skill.name);
            const attribute = skill?.system.attribute;
            const damageBonus = this.actor.getDamageBonus(attribute);
            const damage = damageBonus ? weaponDamage + "+" + damageBonus : weaponDamage;
            let damageType = DoD.damageTypes.none;

            if (weapon.hasWeaponFeature("bludgeoning")) {
                damageType = DoD.damageTypes.bludgeoning;
            } else if (weapon.hasWeaponFeature("slashing")) {
                damageType = DoD.damageTypes.slashing;
            } else if (weapon.hasWeaponFeature("piercing")) {
                damageType = DoD.damageTypes.piercing;
            }

            const damageData = {
                actor: this.actor,
                weapon: weapon,
                damage: damage,
                damageType: damageType
            };

            const targets = Array.from(game.user.targets)
            if (targets.length > 0) {
                for (const target of targets) {
                    damageData.target = target.actor;
                    await DoDChat.inflictDamageMessage(damageData);
                }
            } else {
                await DoDChat.inflictDamageMessage(damageData);
            }
        } else { // right click - edit item
            weapon.sheet.render(true);
        }
    }

    async _onHealingTimeRoll(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
        const injury = this.actor.items.get(itemId);
        const healingTime = injury.system.healingTime;

        if (event.type === "click") { // left click    
            if (isNaN(healingTime)) {
                // Roll healing time
                try {
                    const roll = await new Roll(healingTime).roll(game.release.generation < 12 ? {async: true} : {});
                    const flavor = game.i18n.format("DoD.injury.healingTimeRollFlavor", {injury: injury.name, days: roll.total});
                    await roll.toMessage({
                        user: game.user.id,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor,
                    });
                    await injury.update({"system.healingTime": roll.total});
                } catch {
                    console.log("invalid formula");    
                }
            } else {
                // reduce healing time
                return await injury.reduceHealingTime({silent: true});
            }
        } else { // right click
            if (!isNaN(healingTime)) {
                // increase healing time
                return await injury.increaseHealingTime({silent: true});
            }
        }
    }

    async _onAttributeRoll(event) {
        event.preventDefault();

        let options = {};
        if (event.shiftKey || event.ctrlKey) {
            options = {
                noBanesBoons: event.shiftKey,
                defaultBanesBoons: event.ctrlKey
            };
        }
        let attributeName = event.currentTarget.dataset.attribute;
        let test = new DoDAttributeTest(this.actor, attributeName, options);
        await test.roll();
    }

    async _onMarkAdvancement(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest("tr").dataset.itemId;
        const skillItem = this.actor.items.get(itemId);
        const skillValue = skillItem.system.value;
        const baseChance = this.actor._getBaseChance(skillItem);
        let maxTrainedSkills = 8; // young
        if (this.actor.system.age === "adult") {
            maxTrainedSkills += 2;
        } else if (this.actor.system.age === "old") {
            maxTrainedSkills += 4;
        }

        const advancedSkillsCount = this.actor.system.trainedSkills.filter(skill => skill.system.value > 0).length;

        if (advancedSkillsCount < maxTrainedSkills && (skillValue === baseChance || skillValue === 0)) {

            // result: 0 -> Cancel
            // result: 1 -> Mark
            // result: 2 -> Train
            const result = await new Promise(
                resolve => {
                    const data = {
                        title: game.i18n.localize("DoD.ui.dialog.trainSkillTitle"),
                        content: game.i18n.format("DoD.ui.dialog.trainSkillContent", {skill: skillItem.name}),
                        buttons: {
                            train: {
                                icon: '<i class="fas fa-check"></i>',
                                label: game.i18n.localize("DoD.ui.dialog.trainLabel"),
                                callback: () => resolve(2)
                            },
                            mark: {
                                icon: '<i class="fas fa-times"></i>',
                                label: game.i18n.localize("DoD.ui.dialog.markLabel"),
                                callback: _html => resolve(1)
                            }
                        },
                        default: "train",
                        close: () => resolve(0)
                    };
                    new Dialog(data, null).render(true);
                }
            );
            switch (result) {
                case 0: // Cancel
                    return;
                case 1: // Mark
                    await skillItem.update({ "system.advance": true });
                    return;
                case 2: // Train
                    await skillItem.update({ "system.value": baseChance * 2 });
                    return;
            }
        } else {
            await skillItem.update({ "system.advance": true });
        }
    }

    async _onAdvancementRoll(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest("tr").dataset.itemId;
        const skillItem = this.actor.items.get(itemId);

        // left click to roll, right-click to clear
        if (event.type === "click") {

            // Make roll
            const roll = await new Roll("D20").roll(game.release.generation < 12 ? {async: true} : {});
            const advance = Math.min(DoD.skillMaximum , roll.result) > skillItem.system.value;
            const flavorText = advance ?
                game.i18n.format("DoD.skill.advancementSuccess", {skill: skillItem.name, old: skillItem.system.value, new: skillItem.system.value + 1}) :
                game.i18n.format("DoD.skill.advancementFail", {skill: skillItem.name});

            const msg = await roll.toMessage({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: flavorText
            });

            if (advance) {
                if(game.dice3d) {
                    game.dice3d.waitFor3DAnimationByMessageID(msg.id).then(
                        () => skillItem.update({ "system.value": skillItem.system.value + 1}));
                } else {
                    await skillItem.update({ "system.value": skillItem.system.value + 1});
                }
            }
        }
        // always clear advancement
        await skillItem.update({ "system.advance": false })
    }

    async _onConditionClick(event) {
        if (event.target.className === "condition-input") {
            return; // event is handled by input element
        }
        const elements = event.currentTarget.getElementsByClassName("condition-input");
        if (elements.length > 0) {
            let name = elements[0].name;
            await this.actor.update({[name]: !elements[0].checked});
            event.stopPropagation();
        }
    }

    static async _onDropTable(actor, _sheet, data) {
        if (data.type === "RollTable" && actor.isOwner && actor.type === "monster") {
            DoD_Utility.INFO("DoD.INFO.monsterAttackUpdated", {actor: actor.name});
            actor.update({ ["system.attackTable"]: data.uuid});
            return false; // Stop
        }
        return true; // Continue
    }

    async _onDropItem(event, data)
    {
        if ( !this.actor.isOwner ) return false;
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();
        const actorData = await this.getData();

        // Handle item sorting within the same Actor
        if ( this.actor.uuid === item.parent?.uuid ) {
            let dropTarget = event.target.closest(".item-list")?.dataset.droptarget;

            if (dropTarget) {
                if (dropTarget === "weapon" && itemData.type === "weapon")
                {
                    const worn = item.system.worn || actorData.canEquipWeapon || item.hasWeaponFeature("unarmed");
                    if(!worn) {
                        DoD_Utility.WARNING("DoD.WARNING.maxWeaponsEquipped");
                        return;
                    } else {
                        if (item.system.quantity > 1) {
                            // split item
                            itemData.system.quantity = 1;
                            itemData.system.worn = true;
                            await item.update({["system.quantity"]: item.system.quantity - 1 });
                            return await this._onDropItemCreate(itemData);
                        } else {
                            await item.update({
                                ["system.worn"]: worn,
                                ["system.memento"]: false
                            });
                            return this._onSortItem(event, itemData);
                        }
                    }
                }
                else if (dropTarget === "armor" && itemData.type === "armor") {
                    await actorData.equippedArmor?.update({ ["system.worn"]: false});
                    await item.update({
                        ["system.worn"]: true,
                        ["system.memento"]: false
                    });
                }
                else if (dropTarget === "helmet" && itemData.type === "helmet") {
                    await actorData.equippedHelmet?.update({ ["system.worn"]: false});
                    await item.update({
                        ["system.worn"]: true,
                        ["system.memento"]: false
                    });
                }
                else if (dropTarget === "memento") {
                    await actorData.memento?.update({ ["system.memento"]: false });
                    await item.update({ ["system.memento"]: true});
                }
                else if (dropTarget === "inventory" || dropTarget === "tiny") {
                    await item.update({
                        ["system.worn"]: false,
                        ["system.memento"]: false
                    });
                }
            }
            return this._onSortItem(event, itemData);
        }

        // Remove kin and kin abilities
        if (itemData.type === "kin") {
            await this.actor.removeKin();
        }

        // Remove profession and profession abilities
        if (itemData.type === "profession") {
            await this.actor.removeProfession();
        }

        // If there are available slots, equip weapons, armor and helmet
        if (item.type === "weapon" || item.type === "armor" || item.type === "helmet") {
            itemData.system.worn =
                item.type === "weapon" && (actorData.canEquipWeapon || item.hasWeaponFeature("unarmed"))
                || item.type === "armor" && !actorData.equippedArmor
                || item.type === "helmet" && !actorData.equippedHelmet;
        }

        // Create the owned item
        let returnValue = await this._onDropItemCreate(itemData);

        // Update kin and kin abilities
        if (itemData.type === "kin") {
            await this.actor.updateKinAbilities();
        }

        // Update profession and profession abilities
        if (itemData.type === "profession") {
            let missingSkills = await this.actor.updateProfession();
            for (const skillName of missingSkills) {
                const skill = await DoD_Utility.findSkill(skillName);
                if (skill && (skill.system.skillType === "secondary" || skill.system.skillType === "magic")) {
                    await this._onDropItemCreate(skill.toObject());
                    DoD_Utility.INFO("DoD.INFO.professionSkillAdded", {skill: skillName});
                } else {
                    DoD_Utility.WARNING("DoD.WARNING.professionSkill", {skill: skillName});
                }
            }
        }

        return returnValue;
    }

    async _onItemCreate(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const type = element.dataset.type;

        // Create effect
        if (type === "effect") {
            return this.actor.createEmbeddedDocuments("ActiveEffect", [{
                label: game.i18n.localize("New Effect"),
                icon: "icons/svg/aura.svg",
                origin: this.actor.uuid,
                disabled: false
            }]);
        }

        // Create item
        let itemData = {
            name: game.i18n.localize(`DoD.${type}.new`),
            type: element.dataset.type
        };

        // If there are available slots, equip weapons, armor and helmet
        if (type === "weapon" || type === "armor" || type === "helmet") {
            const actorData = await this.getData();
            itemData.system = {};
            itemData.system.worn =
                itemData.type === "weapon" && actorData.canEquipWeapon
                || itemData.type === "armor" && !actorData.equippedArmor
                || itemData.type === "helmet" && !actorData.equippedHelmet;
        }

        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    async _onEffectEdit(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const effectId = element.closest(".sheet-table-data").dataset.effectId;
        const effect = Array.from(this.actor.allApplicableEffects()).find(e => e.id === effectId);
        
        effect?.sheet.render(true);
    }
    async _onEffectDelete(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let effectId = element.closest(".sheet-table-data").dataset.effectId;
        let effect = this.actor.effects.get(effectId);

        const ok = await this._itemDeleteDialog(effect);
        if (!ok) {
            return;
        }
        return effect.delete();
    }

}
