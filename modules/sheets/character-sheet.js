import DoDAttributeTest from "../tests/attribute-test.js";
import DoD_Utility from "../utility.js";
import DoDActorBaseSheet from "./actor-base-sheet.js";
import { DoD } from "../config.js";

export default class DoDCharacterSheet extends DoDActorBaseSheet {

    static DEFAULT_OPTIONS = {
        classes: ["DoD", "sheet", "character"],
        position: { width: 700, height: 775 },
        window: { resizable: true, title: 'DoD.ActorSheetTitle' },
        form: {
            submitOnChange: true,
            closeOnSubmit: false
        },
        actions: {}
    };

    static TABS = {
        primary: {
            tabs: [
                { id: 'main', group: 'primary', label: 'DoD.ui.character-sheet.main' },
                { id: 'skills', group: 'primary', label: 'DoD.ui.character-sheet.skills' },
                { id: 'abilities', group: 'primary', label: 'DoD.ui.character-sheet.abilities' },
                { id: 'inventory', group: 'primary', label: 'DoD.ui.character-sheet.inventory' },
                { id: 'background', group: 'primary', label: 'DoD.ui.character-sheet.background' },
                { id: 'effects', group: 'primary', label: 'DoD.ui.character-sheet.effects' },
            ],
            initial: 'main'
        }
    }

    static PARTS = {
        header: { scrollable: [''], template: `systems/dragonbane/templates/parts/character-sheet-header.hbs` },
        tabs: { scrollable: [''], template: `systems/dragonbane/templates/parts/character-sheet-tabs.hbs` },
        main: { scrollable: [''], template: 'systems/dragonbane/templates/parts/character-sheet-main.hbs' },
        skills: { scrollable: [''], template: 'systems/dragonbane/templates/parts/character-sheet-skills.hbs' },
        abilities: { scrollable: [''], template: 'systems/dragonbane/templates/parts/character-sheet-abilities.hbs' },
        inventory: { scrollable: [''], template: 'systems/dragonbane/templates/parts/character-sheet-inventory.hbs' },
        background: { scrollable: [''], template: 'systems/dragonbane/templates/parts/character-sheet-background.hbs' },
        effects: { scrollable: [''], template: 'systems/dragonbane/templates/parts/character-sheet-effects.hbs' },
    }

    async _onRender(context, options) {
        await super._onRender(context, options);

        const html = $(this.element);

        if (this.actor.isOwner) {
            html.find(".kin-edit").change(this._onKinEdit.bind(this));
            html.find(".profession-edit").change(this._onProfessionEdit.bind(this));
            html.find(".age-edit").change(this._onAgeEdit.bind(this));

            html.find(".rollable-attribute").click(this._onAttributeRoll.bind(this));
            html.find(".condition-panel").click(this._onConditionClick.bind(this));
            html.find("[data-action='roll-advancement']").on("click contextmenu", this._onAdvancementRoll.bind(this))
            html.find(".mark-advancement").on("click", this._onMarkAdvancement.bind(this))

            html.find(".death-rolls-success").on("click contextmenu", this._onDeathRollsSuccessClick.bind(this));
            html.find(".death-rolls-success-label").on("click contextmenu", this._onDeathRollsSuccessClick.bind(this));
            html.find(".death-rolls-failure").on("click contextmenu", this._onDeathRollsFailureClick.bind(this));
            html.find(".death-rolls-failure-label").on("click contextmenu", this._onDeathRollsFailureClick.bind(this));
            html.find("[data-action='roll-deathRoll']").click(this._onDeathRoll.bind(this))

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

            if (this.actor.type === "monster") {
                html.find(".monster-attack").on("click contextmenu", this._onMonsterAttack.bind(this));
                html.find(".monster-defend").on("click", this._onMonsterDefend.bind(this));
            }
        } else if (this.actor.isObserver) {
            // Enable dragging items from this sheet
            let handler = this._onDragStart.bind(this);
            html.find('.draggable-item').each((_i, li) => {
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }
    }

    _prepareItems(context) {
        super._prepareItems(context);

        // Seperate memento from inventory
        context.mementos = this.actor.items.contents.filter(i => i.system.memento);
        context.inventory = context.inventory.filter(i => !i.system.memento);
        context.memento = context.mementos.length > 0 ? context.mementos[0] : null;

        // Separate small items (weight = 0) from normal inventory items (weight > 0)
        context.smallItems = context.inventory.filter(i => i.system.weight === 0 && i.system.type !== "backpack");
        context.inventory = context.inventory.filter(i => i.system.weight > 0 || i.system.type === "backpack");
    }

    _prepareItem(item, context) {
        if (item.system.storage) {
            context.storage.push(item);
        } else {
            super._prepareItem(item, context);
        }
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        context.appearanceHTML = await this.enrich(context.system.appearance);
        context.notesHTML = await this.enrich(context.system.notes);
        context.weaknessHTML = await this.enrich(context.system.weakness);

        // Death rolls widget data
        if (this.actor.system.deathRolls !== undefined) {
            context.deathRollsSuccesses = this.actor.system.deathRolls.successes;
            context.deathRollsSuccessesRemaining = 3 - this.actor.system.deathRolls.successes;
            context.deathRollsFailures = this.actor.system.deathRolls.failures;
            context.deathRollsFailuresRemaining = 3 - this.actor.system.deathRolls.failures;
        }

        context.damageBonusStr = DoD.dice[this.actor.system.damageBonus.str.value];
        context.damageBonusAgl = DoD.dice[this.actor.system.damageBonus.agl.value];

        return context;
    }

    async _onDeathRollsSuccessClick(event) {
        event.preventDefault();

        let successes = this.actor.system.deathRolls.successes;
        console.assert(successes >= 0 && successes <= 3, "Dragonbane: system.deathRolls.successes out of range for " + this.actor.uuid);
        if (event.type === "click") { // left click
            if (successes < 3) {
                return await this.actor.update({ ["system.deathRolls.successes"]: successes + 1 });
            }
        } else { // right click
            if (successes > 0) {
                return await this.actor.update({ ["system.deathRolls.successes"]: successes - 1 });
            }
        }
    }

    async _onDeathRollsFailureClick(event) {
        event.preventDefault();

        let failures = this.actor.system.deathRolls.failures;
        console.assert(failures >= 0 && failures <= 3, "Dragonbane: system.deathRolls.failures out of range for " + this.actor.uuid);
        if (event.type === "click") { // left click
            if (failures < 3) {
                return await this.actor.update({ ["system.deathRolls.failures"]: failures + 1 });
            }
        } else { // right click
            if (failures > 0) {
                return await this.actor.update({ ["system.deathRolls.failures"]: failures - 1 });
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

        if (test.options.cancelled) {
            return;
        }

        const success = test.postRollData.success;
        const isDragon = test.postRollData.isDragon;
        const isDemon = test.postRollData.isDemon;

        async function updateDeathRolls(actor) {
            if (success) {
                if (actor.system.deathRolls.successes < 3) {
                    await actor.update({ ["system.deathRolls.successes"]: Math.min(3, actor.system.deathRolls.successes + (isDragon ? 2 : 1)) });
                }
            } else {
                if (actor.system.deathRolls.failures < 3) {
                    await actor.update({ ["system.deathRolls.failures"]: Math.min(3, actor.system.deathRolls.failures + (isDemon ? 2 : 1)) });
                }
            }
            if (actor.system.deathRolls.failures === 3 && game.settings.get("dragonbane", "automateCharacterDeath")) {
                const status = CONFIG.statusEffects.find(a => a.id === 'dead');
                actor.toggleStatusEffect(status.id, { active: true, overlay: true });

                const actorName = actor.isToken ? actor.token.name : actor.name;
                const msg = "<p>" + game.i18n.format("DoD.ui.chat.characterDied", { actor: actorName }) + "</p>";
                ChatMessage.create({
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor }),
                    content: msg
                });
            }
            if (actor.system.deathRolls.successes === 3) {
                const actorName = actor.isToken ? actor.token.name : actor.name;
                const msg = "<p>" + game.i18n.format("DoD.ui.chat.characterSurvived", { actor: actorName }) + "</p>";
                ChatMessage.create({
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor }),
                    content: msg
                });
                await actor.update({ ["system.deathRolls.failures"]: 0, ["system.deathRolls.successes"]: 0 });
            }

        }

        if (game.dice3d) {
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

    _prepareSubmitData(event, form, formData, updateData = {}) {
        // Prevents updating the base value (due to data migration)
        // - if the input field still has focus when the sheet closes
        // - if the input field has changed
        // - if the value is unaffected by active effects
        // If the field is affected by active effects, it will be ignored by the super implementation.
        // Thus, the same behaviour us enforeced wether or not the attribute is affected by AE.
        const data = super._prepareSubmitData(event, form, formData, updateData);
        delete data?.system?.attributes?.str?.value
        delete data?.system?.attributes?.con?.value
        delete data?.system?.attributes?.agl?.value
        delete data?.system?.attributes?.int?.value
        delete data?.system?.attributes?.wil?.value
        delete data?.system?.attributes?.cha?.value
        return data;
    }

    async _onKinEdit(event) {
        event.preventDefault();
        event.currentTarget.blur();
        let kinName = event.currentTarget.value;
        let kin = await DoD_Utility.findKin(kinName);
        if (!kin) {
            await this.actor.removeKin();
            DoD_Utility.WARNING("DoD.WARNING.kin", { kin: kinName });
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
            DoD_Utility.WARNING("DoD.WARNING.profession", { profession: professionName });
        } else {
            await this.actor.removeProfession();
            await this.actor.createEmbeddedDocuments("Item", [profession.toObject()]);

            let missingSkills = await this.actor.updateProfession();
            for (const skillName of missingSkills) {
                const skill = await DoD_Utility.findSkill(skillName);
                if (skill) {
                    await this.actor.createEmbeddedDocuments("Item", [skill.toObject()]);
                } else {
                    DoD_Utility.WARNING("DoD.WARNING.professionSkill", { skill: skillName });
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

        let newValues = { "system.age": newAge };

        for (const key in modifiers[currentAge]) {
            newValues[key] = modifiers[newAge][key] - modifiers[currentAge][key] + foundry.utils.getProperty(this.actor, key);
            if (newValues[key] < 1 || newValues[key] > 18) {
                DoD_Utility.WARNING("DoD.WARNING.attributeOutOfRange");
            }
        }
        await this.actor.update(newValues);
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

            const result = await foundry.applications.api.DialogV2.confirm({
                window: { title: game.i18n.localize("DoD.ui.dialog.trainSkillTitle") },
                content: game.i18n.format("DoD.ui.dialog.trainSkillContent", { skill: skillItem.name }),
                yes: { label: game.i18n.localize("DoD.ui.dialog.trainLabel") },
                no: { label: game.i18n.localize("DoD.ui.dialog.markLabel") },
            });

            if (result === true) { // Train
                await skillItem.update({ "system.value": baseChance * 2 });
            } else if (result === false) { // Mark
                await skillItem.update({ "system.advance": true, "system.taught": false });
            } else { // Cancelled
            }
        } else {
            await skillItem.update({ "system.advance": true });
        }
    }

    async _onAdvancementRoll(event) {
        event.preventDefault();
        const DoD = CONFIG.DoD;

        const itemId = event.currentTarget.closest("tr").dataset.itemId;
        const skillItem = this.actor.items.get(itemId);

        // left click to roll, right-click to clear
        if (event.type === "click") {

            // Make roll
            const roll = await new Roll("D20").roll({});
            const advance = Math.min(DoD.skillMaximum, roll.result) > skillItem.system.value;
            const flavorText = advance ?
                game.i18n.format("DoD.skill.advancementSuccess", {
                    skill: skillItem.name,
                    old: skillItem.system.value,
                    new: skillItem.system.value + 1
                }) :
                game.i18n.format("DoD.skill.advancementFail", { skill: skillItem.name });

            const msg = await roll.toMessage({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: flavorText
            });

            if (advance) {
                if (game.dice3d) {
                    game.dice3d.waitFor3DAnimationByMessageID(msg.id).then(
                        () => skillItem.update({ "system.value": skillItem.system.value + 1, "system.taught": false }));
                } else {
                    await skillItem.update({ "system.value": skillItem.system.value + 1, "system.taught": false });
                }
            }
        }
        // always clear advancement
        await skillItem.update({ "system.advance": false });
        if (DoD.skillMaximum === skillItem.system.value) {
            //I.e. disable training if skill is at max
            await skillItem.update({ "system.taught": true });
        }
    }

    async _onConditionClick(event) {
        if (event.target.className === "condition-input") {
            return; // event is handled by input element
        }
        const elements = event.currentTarget.getElementsByClassName("condition-input");
        if (elements.length > 0) {
            let name = elements[0].name;
            await this.actor.update({ [name]: !elements[0].checked });
            event.stopPropagation();
        }
    }

    static async _onDropTable(actor, _sheet, data) {
        if (data.type === "RollTable" && actor.isOwner && actor.type === "monster") {
            DoD_Utility.INFO("DoD.INFO.monsterAttackUpdated", { actor: actor.name });
            actor.update({ ["system.attackTable"]: data.uuid });
            return false; // Stop
        }
        return true; // Continue
    }
}
