import DoD_Utility from "./utility.js";
import DoDAttributeTest from "./tests/attribute-test.js";
import DoDSkillTest from "./tests/skill-test.js";
import DoDSpellTest from "./tests/spell-test.js";
import DoDWeaponTest from "./tests/weapon-test.js";
import { DoD } from "./config.js";
import * as DoDChat from "./chat.js";

export default class DoDCharacterSheet extends ActorSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions,  {
            width: 700,
            height: 775,
            classes: ["DoD", "sheet", "character"],
            dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null}],
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
        });
    }

    #focusElement;

    constructor(object, options) {
        switch (object.type) {
            case "character":
                break;
            case "monster":
                options.width = 480;
                options.height = 670;
                break;
            case "npc":
                options.width = 480;
                options.height = 600;
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
        Hooks.off("dropActorSheetData", this.onDropTableListener);
        return super.close(options);
     }   
  
     render(force, options) {
        this.keydownListener = this.#onKeydown.bind(this);
        document.addEventListener('keydown', this.keydownListener);

        this.onDropTableListener = this._onDropTable.bind(this);
        Hooks.on("dropActorSheetData", this.onDropTableListener);

        return super.render(force, options);
     }

     #onKeydown(event) {
        if (event.code === "Delete" && this.#focusElement) {
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
            data: baseData.data.system,
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

        sheetData.data.appearance = await enrich(sheetData.data.appearance);
        sheetData.data.description = await enrich(sheetData.data.description);
        sheetData.data.notes = await enrich(sheetData.data.notes);
        sheetData.data.weakness = await enrich(sheetData.data.weakness);
        sheetData.data.traits = await enrich(sheetData.data.traits);

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
        let equippedArmor = sheetData.actor.system.equippedArmor;
        let equippedHelmet = sheetData.actor.system.equippedHelmet;
        let memento = null;
        let smallItems = [];
        
        for (let item of sheetData.actor.items.contents) {

            // any item can be a memento
            if (item.system.memento && this.actor.type == "character") {
                if(!memento) {
                    memento = item;
                    continue;
                } else {
                    // Memento slot busy. Clear flag and process as normal item
                    item.update({ ["system.memento"]: false}); 
                }
            }

            if (item.type == 'skill') {
                // moved to actor
                continue;
            }

            if (item.type == 'ability') {
                let ability = item;

                if (ability.system.abilityType == 'kin') {
                    kinAbilities.push(ability);
                } else if (ability.system.abilityType == 'profession') {
                    professionAbilities.push(ability);
                } else {
                    heroicAbilities.push(ability);
                }
                continue;
            }

            if (item.type == 'spell')
            {
                let spell = item;

                spells.push(spell);
                
                if (!schools[spell.system.school]) {
                    schools[spell.system.school] = [];
                }
                schools[spell.system.school].push(spell);
                continue;
            }
            
            if (item.type == "weapon") {
                if (item.system.worn) {
                    // TODO limit 3
                    equippedWeapons.push(item);
                } else {
                    inventory.push(item);
                }
                // weapons can be mementos
                if (item.system.memento && this.actor.type == "character") {
                    if(!memento) {
                        memento = item;
                    } else {
                        // Memento slot busy. Clear flag and process as normal item
                        item.update({ ["system.memento"]: false}); 
                    }
                }

                continue;
            }
            
            if (item.type == "armor") {
                if (!item.system.worn) {
                    inventory.push(item);
                }
                continue;
            }

            if (item.type == "helmet") {
                if (!item.system.worn) {
                    inventory.push(item);
                }
                continue;
            }
            
            if (item.type == "item") {
                if (item.system.weight == 0 && item.system.type != "backpack" && this.actor.type == "character")
                {
                    smallItems.push(item);
                    continue;
                }
                inventory.push(item);
                continue;
            }
        }
        
        // Kin and Profession
        sheetData.kin = sheetData.actor.system.kin;
        sheetData.kinName = sheetData.kin?.name;
        sheetData.profession = sheetData.actor.system.profession;
        sheetData.professionName = sheetData.profession?.name;

        // Items (skills, abilities, spells)
        sheetData.coreSkills = sheetData.actor.system.coreSkills?.sort(DoD_Utility.nameSorter);;
        sheetData.magicSkills = sheetData.actor.system.magicSkills?.sort(DoD_Utility.nameSorter); 
        sheetData.secondarySkills = sheetData.actor.system.secondarySkills?.sort(DoD_Utility.nameSorter); 
        sheetData.weaponSkills = sheetData.actor.system.weaponSkills?.sort(DoD_Utility.nameSorter);
        sheetData.trainedSkills = sheetData.actor.system.trainedSkills?.sort(DoD_Utility.nameSorter);

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
                name: count == 1 ? sheetData.abilities[i].name : sheetData.abilities[i].name + " (" + count + ")"
            });
        }
        sheetData.abilities = formattedAbilities;


        sheetData.spells = spells?.sort(DoD_Utility.nameSorter);
        sheetData.hasSpells = spells.length > 0;
        sheetData.memorizedSpells = sheetData.spells?.filter(s => s.system.memorized);

        sheetData.inventory = inventory?.sort(DoD_Utility.itemSorter);
        sheetData.equippedWeapons = equippedWeapons?.sort(DoD_Utility.itemSorter);
        sheetData.equippedArmor = equippedArmor;
        sheetData.equippedHelmet = equippedHelmet;
        sheetData.smallItems = smallItems?.sort(DoD_Utility.itemSorter);
        sheetData.memento = memento;

        this._updateEncumbrance(sheetData);

        // HP widget data
        sheetData.maxHP = sheetData.actor.system.hitPoints.max;
        sheetData.currentHP = sheetData.actor.system.hitPoints.value;
        sheetData.lostHP = sheetData.maxHP - sheetData.currentHP;
        sheetData.fillHP = sheetData.maxHP < 11 ? 11 - sheetData.maxHP : 0; // needed for layout
        sheetData.largeHP = sheetData.maxHP > 40; // switch to large hp widget

        // Death rolls widget data
        if (this.actor.type == "character") {
            sheetData.deathRollsSuccesses = sheetData.actor.system.deathRolls.successes;
            sheetData.deathRollsSuccessesRemaining = 3 - sheetData.deathRollsSuccesses;
            sheetData.deathRollsFailures = sheetData.actor.system.deathRolls.failures;
            sheetData.deathRollsFailuresRemaining = 3 - sheetData.deathRollsFailures;
        }

        // WP widget data
        if (this.actor.type == "character" || this.actor.type == "npc") {
            sheetData.hasWillpower = sheetData.actor.type == "character" || sheetData.abilities.length > 0 || sheetData.spells.length > 0;
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
        if (this.actor.type == "character") {
            sheetData.maxEncumbrance = Math.ceil(0.5 * this.actor.system.attributes.str.value);
            if (sheetData.inventory.find(item => item.system.type == "backpack")) {
                sheetData.maxEncumbrance += 2;
            }
            sheetData.encumbrance = 0;
            if (sheetData.inventory) {
                sheetData.inventory.forEach(item => sheetData.encumbrance += item.totalWeight);
            }
            let coins = sheetData.actor.system.currency.gc + sheetData.actor.system.currency.sc + sheetData.actor.system.currency.cc;
            sheetData.encumbrance += Math.floor(coins/100);
            
            sheetData.overEncumbered = sheetData.encumbrance > sheetData.maxEncumbrance;
        }
    }

    activateListeners(html) {

        html.find(".item-edit").on("click contextmenu", this._onItemEdit.bind(this));

        if (this.object.isOwner) {

            // // Elements need focus for the keydown event to to work
            html.find(".item-delete-key").mouseenter(event => { this.#focusElement = event.currentTarget; });
            html.find(".item-delete-key").mouseleave(event => { this.#focusElement = null; });

            html.find(".attribute-input").change(this._onEditAttribute.bind(this));
            html.find(".inline-edit").change(this._onInlineEdit.bind(this));
            html.find(".kin-edit").change(this._onKinEdit.bind(this));
            html.find(".profession-edit").change(this._onProfessionEdit.bind(this));
            html.find(".age-edit").change(this._onAgeEdit.bind(this));
            html.find(".item-delete").click(this._onItemDelete.bind(this));

            html.find(".rollable-attribute").click(this._onAttributeRoll.bind(this));
            html.find(".condition-panel").click(this._onConditionClick.bind(this));
            html.find(".rollable-skill").on("click contextmenu", this._onSkillRoll.bind(this));
            html.find(".rollable-damage").click(this._onDamageRoll.bind(this));

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

            html.find(".rest-round").on("click", this._onRestRound.bind(this));                
            html.find(".rest-stretch").on("click", this._onRestStretch.bind(this));                
            html.find(".rest-shift").on("click", this._onRestShift.bind(this));                

            if (this.object.type === "monster") {
                html.find(".monster-attack").on("click contextmenu", this._onMonsterAttack.bind(this));                
                html.find(".monster-defend").on("click", this._onMonsterDefend.bind(this));                
            }
        } else if (this.object.isObserver) {
            html.find(".rollable-skill").on("contextmenu", this._onSkillRoll.bind(this));
        }

        super.activateListeners(html);
    }

    async _onMonsterAttack(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        const table = this.actor.system.attackTable ? fromUuidSync(this.actor.system.attackTable) : null; 
        if (!table) {
            DoD_Utility.WARNING("DoD.WARNING.missingMonsterAttackTable");
            return;
        }


        if (event.type == "click") { // left click
            return DoD_Utility.monsterAttack(this.actor, table);
        } else { // right click
            return table.sheet.render(true);
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
        if (event.type == "click") { // left click
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
        if (event.type == "click") { // left click
            if (wp.value > 0) {
                return this.actor.update({ ["system.willPoints.value"]: wp.value-1});
            }
        } else { // right click
            if (wp.value < wp.max) {
                return this.actor.update({ ["system.willPoints.value"]: wp.value+1});
            }
        }
    }

    _onDeathRollsSuccessClick(event) {
        event.preventDefault();

        let successes = this.actor.system.deathRolls.successes; 
        if (event.type == "click") { // left click
            if (successes < 3) {
                return this.actor.update({ ["system.deathRolls.successes"]: successes+1});
            }
        } else { // right click
            if (successes > 0) {
                return this.actor.update({ ["system.deathRolls.successes"]: successes-1});
            }
        }
    }

    _onDeathRollsFailureClick(event) {
        event.preventDefault();

        let failures = this.actor.system.deathRolls.failures; 
        if (event.type == "click") { // left click
            if (failures < 3) {
                return this.actor.update({ ["system.deathRolls.failures"]: failures+1});
            }
        } else { // right click
            if (failures > 0) {
                return this.actor.update({ ["system.deathRolls.failures"]: failures-1});
            }
        }
    }

    async _onRestRound(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        const roll = await new Roll("D6").roll({async: true});
        const currentWP = this.actor.system.willPoints.value;
        const maxWP = this.actor.system.willPoints.max;
        const newWP = Math.min(maxWP, currentWP + roll.total);
        
        const msg = await roll.toMessage({
            user: game.user.id,
            actor: this.actor,
            flavor: game.i18n.format("DoD.ui.character-sheet.restRound", {actor: this.actor.name, wp: newWP - currentWP})
        });
        game.dice3d.waitFor3DAnimationByMessageID(msg.id).then(
            () => this.actor.update({["system.willPoints.value"]: newWP })
        );
    }
    async _onRestStretch(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        // Make roll
        const roll = await new Roll("D6[Hit Points] + D6[Willpower Points]").roll({async: true});
        
        // Calc HP
        const currentHP = this.actor.system.hitPoints.value;
        const maxHP = this.actor.system.hitPoints.max;
        const newHP = Math.min(maxHP, currentHP + Number(roll.terms[0].total));
        
        // Calc WP
        const currentWP = this.actor.system.willPoints.value;
        const maxWP = this.actor.system.willPoints.max;
        const newWP = Math.min(maxWP, currentWP + Number(roll.terms[2].total));
        
        // Render message
        const context =  {
            formula: roll.formula,
            user: game.user.id,
            tooltip: await roll.getTooltip()
        };
        const template = "systems/dragonbane/templates/partials/roll-no-total.hbs";
        const content = await renderTemplate(template, context);
        const msg = await roll.toMessage({
            user: game.user.id,
            actor: this.actor,
            flavor: game.i18n.format("DoD.ui.character-sheet.restStretch", {actor: this.actor.name, hp: newHP - currentHP, wp: newWP - currentWP}),
            content: content
        });

        // Wait for dice and update actor
        game.dice3d.waitFor3DAnimationByMessageID(msg.id).then(
            () => this.actor.update({
                ["system.hitPoints.value"]: newHP,
                ["system.willPoints.value"]: newWP
             })
        );

    }

    async _onRestShift(event) {
        event.preventDefault();
        event.currentTarget?.blur();

        // Make roll
        const roll = await new Roll("D6[Hit Points] + D6[Willpower Points]").roll({async: true});
        
        // Calc HP
        const currentHP = this.actor.system.hitPoints.value;
        const maxHP = this.actor.system.hitPoints.max;
        const newHP = maxHP;
        
        // Calc WP
        const currentWP = this.actor.system.willPoints.value;
        const maxWP = this.actor.system.willPoints.max;
        const newWP = maxWP;

        ChatMessage.create({
            user: game.user.id,
            flavor: game.i18n.format("DoD.ui.character-sheet.restShift", {actor: this.actor.name, hp: newHP - currentHP, wp: newWP - currentWP})
        });        
        this.actor.update({
            ["system.hitPoints.value"]: newHP,
            ["system.willPoints.value"]: newWP,
            ["system.conditions.str.value"]: false,
            ["system.conditions.con.value"]: false,
            ["system.conditions.agl.value"]: false,
            ["system.conditions.int.value"]: false,
            ["system.conditions.wil.value"]: false,
            ["system.conditions.cha.value"]: false
        });
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

    _onInlineEdit(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);
        let field = element.dataset.field;

        event.currentTarget.blur();

        if (element.type == "checkbox") {

            // Handle equipping & unequipping weapons
            if (field == "system.mainHand" || field == "system.offHand") {
                const twoHanded = item.system.grip.value == "grip2h";
                if (element.checked) {
                    // Un-equip weapons in same hand or both hands if equipping 2-handed weapon
                    for (let actorItem of this.actor.items) {
                        if (actorItem.type == "weapon") {
                            if (actorItem.uuid != item.uuid) {
                                // Equipping a different weapon
                                // Un-eqiup weapon in same hand or if any of the weapons is two-handed
                                if (twoHanded || actorItem.system.grip.value == "grip2h") {
                                    actorItem.update({["system.mainHand"]: false, ["system.offHand"]: false});
                                } else {
                                    actorItem.update({[field]: false});
                                }
                            } else {
                                // Equipping same weapon
                                // Un-equip from other hand if one-handed
                                if (!twoHanded) {
                                    if (field == "system.mainHand") {
                                        actorItem.update({ ["system.offHand"]: false });
                                    } else {
                                        actorItem.update({ ["system.mainHand"]: false });
                                    }
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
            return item.update({ [field]: element.checked });
        }

        return item.update({ [field]: Number(element.value) });
    }

    _onEditHp(event) {
        event.preventDefault();
        event.currentTarget.blur();

        const newMax = Math.max(1, Math.floor(event.currentTarget.value));
        const currentDamage = Math.max(0, this.actor.system.hitPoints.max - this.actor.system.hitPoints.value);
        const newValue = Math.max(0, newMax - currentDamage);        

        return this.actor.update({
            ["system.hitPoints.max"]: newMax,
            ["system.hitPoints.value"]: newValue
        });
    }
    _onEditCurrentHp(event) {
        event.preventDefault();
        event.currentTarget.blur();

        const newValue = DoD_Utility.clamp(event.currentTarget.value, 0, this.actor.system.hitPoints.max);

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
            await this.actor.updateKin();
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
            newValues[key] = modifiers[newAge][key] - modifiers[currentAge][key] + getProperty(this.actor, key);
            if (newValues[key] < 1 || newValues[key] > 18) {
                DoD_Utility.WARNING("DoD.WARNING.attributeOutOfRange");
            }
        }
        await this.actor.update(newValues);
    }

    _onItemDelete(event) {
        event.preventDefault();       
        let element = event.currentTarget;
        let itemId = element.closest(".sheet-table-data").dataset.itemId;

        return this.actor.deleteEmbeddedDocuments("Item", [itemId]);
    }

    _onItemEdit(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);

        item.sheet.render(true);
    }

    _onItemKeyDown(event) {
        event.preventDefault();

        // Del key
        if (event.keyCode == 46) {
            let element = event.currentTarget;
            let itemId = element.dataset.itemId;
            return this.actor.deleteEmbeddedDocuments("Item", [itemId]);
        }
    }

 
    async _onSkillRoll(event) {
        event.preventDefault();

        let itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);

        if (event.type == "click") { // left click - skill roll
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
            if (item.type == "skill") {
                test = new DoDSkillTest(this.actor, item, options);
            } else if (item.type == "spell") {
                test = new DoDSpellTest(this.actor, item, options);
            } else if (item.type == "weapon") {
                test = new DoDWeaponTest(this.actor, item, options);
            }
            if (test) {
                await test.roll();
            }
        } else { // right click - edit item
            item.sheet.render(true);
        }
    }

    async _onDamageRoll(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
        const weapon = this.actor.items.get(itemId);
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

        DoDChat.inflictDamageMessage(damageData);
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

    _onConditionClick(event) {
        if (event.target.className == "condition-input") {
            return; // event has alrady been handled by input element
        }
        event.preventDefault();
        const elements = event.currentTarget.getElementsByClassName("condition-input");
        if (elements.length > 0) {
            let name = elements[0].name;
            name = name.replace("data.", "system.");
            this.actor.update({[name]: !getProperty(this.actor, name)});
        }
    }

    async _onDropTable(actor, _sheet, data) {
        if (data.type === "RollTable" && this.actor.isOwner && this.actor.type === "monster") {
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
            let result =  this._onSortItem(event, itemData);
            let dropTarget = event.target.closest(".item-list")?.dataset.droptarget;

            if (dropTarget) {
                if (dropTarget == "weapon" && itemData.type == "weapon")
                {
                    item.update({
                        ["system.worn"]: true,
                        ["system.memento"]: false
                    });
                }
                else if (dropTarget == "armor" && itemData.type == "armor") {
                    actorData.equippedArmor?.update({ ["system.worn"]: false});
                    item.update({
                        ["system.worn"]: true,
                        ["system.memento"]: false
                    });
                }
                else if (dropTarget == "helmet" && itemData.type == "helmet") {
                    actorData.equippedHelmet?.update({ ["system.worn"]: false});
                    item.update({
                        ["system.worn"]: true,
                        ["system.memento"]: false
                    });
                }
                else if (dropTarget == "memento") {
                    actorData.memento?.update({ ["system.memento"]: false });
                    item.update({ ["system.memento"]: true});
                }
                else if (dropTarget == "inventory" || dropTarget == "tiny") {
                    item.update({
                        ["system.worn"]: false,
                        ["system.memento"]: false
                    });
                }
            }
            return result;
        }

        // Remove kin and kin abilities
        if (itemData.type == "kin") {
            await this.actor.removeKin();
        }

        // Remove profession and profession abilities
        if (itemData.type == "profession") {
            await this.actor.removeProfession();
        }
        

        // Create the owned item
        let returnValue = await this._onDropItemCreate(itemData);

        // Update kin and kin abilities
        if (itemData.type == "kin") {
            await this.actor.updateKin();
        }

        // Update profession and profession abilities
        if (itemData.type == "profession") {
            let missingSkills = await this.actor.updateProfession();
            for (const skillName of missingSkills) {
                const skill = await DoD_Utility.findSkill(skillName);
                if (skill && (skill.system.skillType == "secondary" || skill.system.skillType == "magic")) {
                    await this._onDropItemCreate(skill.toObject());
                    DoD_Utility.INFO("DoD.INFO.professionSkillAdded", {skill: skillName});
                } else {
                    DoD_Utility.WARNING("DoD.WARNING.professionSkill", {skill: skillName});
                }
            }
        }

        // Equip weapons, armor and helmet
        if (itemData.type == "weapon" && !(actorData.equippedWeapons?.length >= 2) 
            || itemData.type == "armor" && !actorData.equippedArmor
            || itemData.type == "helmet" && !actorData.equippedHelmet )
        {
            let equipItem = returnValue[0];
            equipItem.update({ ["system.worn"]: true });
        }
        return returnValue;
    }
}