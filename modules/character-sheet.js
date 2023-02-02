import DoD_Utility from "./utility.js";

export default class DoDCharacterSheet extends ActorSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions,  {
            width: 680,
            height: 750,
            classes: ["DoD", "sheet", "character"],
            dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null}],
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
        });
    }

    get template() {
        return `systems/dragonbane/templates/character-sheet.html`;
    }

    getData() {
        const baseData = super.getData();

        let sheetData = {
            owner: true,
            editable: this.isEditable,
            actor: baseData.actor,
            data: baseData.data.system,
            config: CONFIG.DoD
        };

        // Prepare character data and items.
        if (sheetData.actor.type == 'character') {
            this._prepareItems(sheetData);
        }        

        return sheetData;
    }

    _prepareItems(sheetData) {

        const trainedSkills = [];
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
            if (item.system.memento) {
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
            
            if (item.type == "weapon" || item.type == "shield") {
                if (item.system.worn) {
                    // TODO limit 3
                    equippedWeapons.push(item);
                } else {
                    inventory.push(item);
                }
                // weapons can be mementos
                if (item.system.memento) {
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
                if (item.system.weight == 0)
                {
                    smallItems.push(item);
                    continue;
                }
                inventory.push(item);
                continue;
            }
        }

        // Kin and Profession
        sheetData.kinName = sheetData.actor.system.kin?.name;

        // Items (skills, abilities, spells)
        sheetData.coreSkills = sheetData.actor.system.coreSkills.sort(DoD_Utility.nameSorter);;
        sheetData.magicSkills = sheetData.actor.system.magicSkills.sort(DoD_Utility.nameSorter); 
        sheetData.secondarySkills = sheetData.actor.system.secondarySkills.sort(DoD_Utility.nameSorter); 
        sheetData.weaponSkills = sheetData.actor.system.weaponSkills.sort(DoD_Utility.nameSorter);

        sheetData.heroicAbilities = heroicAbilities.sort(DoD_Utility.itemSorter);
        sheetData.kinAbilities = kinAbilities.sort(DoD_Utility.itemSorter);
        sheetData.professionAbilities = professionAbilities.sort(DoD_Utility.itemSorter);

        sheetData.spells = spells.sort(DoD_Utility.itemSorter);
        sheetData.hasSpells = spells.length > 0;

        sheetData.inventory = inventory.sort(DoD_Utility.itemSorter);
        sheetData.equippedWeapons = equippedWeapons.sort(DoD_Utility.itemSorter);
        sheetData.equippedArmor = equippedArmor;
        sheetData.equippedHelmet = equippedHelmet;
        sheetData.smallItems = smallItems.sort(DoD_Utility.itemSorter);
        sheetData.memento = memento;

        this._updateEncumbrance(sheetData);

        // HP widget data
        sheetData.maxHP = sheetData.actor.system.hitPoints.max;
        sheetData.currentHP = sheetData.actor.system.hitPoints.value;
        sheetData.lostHP = sheetData.maxHP - sheetData.currentHP;
        sheetData.fillHP = sheetData.maxHP < 11 ? 11 - sheetData.maxHP : 0; // needed for layout

        // WP widget data
        sheetData.maxWP = sheetData.actor.system.willPoints.max;
        sheetData.currentWP = sheetData.actor.system.willPoints.value;
        sheetData.lostWP = sheetData.maxWP - sheetData.currentWP;
        sheetData.fillWP = sheetData.maxWP < 11 ? 11 - sheetData.maxWP : 0; // needed for layout
    }  

    _updateEncumbrance(sheetData) {
        sheetData.maxEncumbrance = Math.ceil(0.5 * this.actor.system.attributes.str.value);
        sheetData.encumbrance = 0;
        if (sheetData.inventory) {
            sheetData.inventory.forEach(item => sheetData.encumbrance += item.totalWeight);
        }
        let coins = sheetData.actor.system.currency.gc + sheetData.actor.system.currency.sc + sheetData.actor.system.currency.cc;
        sheetData.encumbrance += Math.floor(coins/100);
        
        sheetData.overEncumbered = sheetData.encumbrance > sheetData.maxEncumbrance;
    }

    activateListeners(html) {
        html.find(".inline-edit").change(this._onInlineEdit.bind(this));
        html.find(".kin-edit").change(this._onKinEdit.bind(this));
        html.find(".item-edit").click(this._onItemEdit.bind(this));
        html.find(".item-delete").click(this._onItemDelete.bind(this));

        html.find(".rollable-attribute").click(this._onAttributeRoll.bind(this));
        html.find(".rollable-skill").click(this._onSkillRoll.bind(this));

        html.find(".hit-points-box").on("click contextmenu", this._onHitPointClick.bind(this));
        html.find(".will-points-box").on("click contextmenu", this._onWillPointClick.bind(this));

        super.activateListeners(html);
    }

    _onHitPointClick(event) {
        event.preventDefault();

        let hp = this.actor.system.hitPoints; 
        if (event.type == "click") { // left click
            if (hp.value < hp.max) {
                return this.actor.update({ ["system.hitPoints.value"]: hp.value+1});
            }
        } else { // right click
            if (hp.value > 0) {
                return this.actor.update({ ["system.hitPoints.value"]: hp.value-1});
            }
        }
    }

    _onWillPointClick(event) {
        event.preventDefault();

        let wp = this.actor.system.willPoints; 
        if (event.type == "click") { // left click
            if (wp.value < wp.max) {
                return this.actor.update({ ["system.willPoints.value"]: wp.value+1});
            }
        } else { // right click
            if (wp.value > 0) {
                return this.actor.update({ ["system.willPoints.value"]: wp.value-1});
            }
        }
    }

    _onInlineEdit(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);
        let field = element.dataset.field;

        if (element.type == "checkbox"){
            return item.update({ [field]: element.checked});
        }        
        return item.update({ [field]: Number(element.value)});
    }

    async _onKinEdit(event) {
        event.preventDefault();
        let kinName = event.currentTarget.value;
        let kin = await DoD_Utility.findKin(kinName);
        if (!kin) {
            await this.actor.removeKin();
            DoD_Utility.WARNING("DoD.WARNING.kin", {kin: kinName});
        } else {
            await this.actor.removeKin();
            await this.actor.createEmbeddedDocuments("Item", [kin.toObject()]);
            await this.actor.addKinAbilities();
        }
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

    _getRollString(attributeName) {
        let condition = DoD_Utility.getConditionByAttributeName(this.actor, attributeName);

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

    async _onSkillRoll(event) {
        event.preventDefault();

        let itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
        let skill = this.actor.items.get(itemId);
        let rollString = this._getRollString(skill.system.attribute);
        let roll = await new Roll(rollString).roll({async: true});
        let result = this._getRollResult(roll, skill.system.value);      
        let label = game.i18n.format(game.i18n.localize("DoD.roll.skillRoll"), {skill: skill.name, result: result});

        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label
        });                 
    }

    _onAttributeRoll(event) {
        event.preventDefault();

        let attributeName = event.currentTarget.dataset.attribute;
        let attribute = this.actor.system.attributes[attributeName];
        let rollString = this._getRollString(attributeName);
        let roll = new Roll(rollString).roll({async: false});
        let result = this._getRollResult(roll, attribute.value);      
        let localizedName = game.i18n.localize("DoD.attributes." + attributeName);
        let label = game.i18n.format(game.i18n.localize("DoD.roll.attributeRoll"), {attribute: localizedName, result: result});

        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label
        });        
    }

    async _onDropItem(event, data)
    {
        if ( !this.actor.isOwner ) return false;
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();
    
        // Handle item sorting within the same Actor
        if ( this.actor.uuid === item.parent?.uuid ) {
            let result =  this._onSortItem(event, itemData);
            let dropTarget = event.target.closest(".item-list").dataset.droptarget;

            if (dropTarget) {
                if (dropTarget == "weapon")
                {
                    item.update({
                        ["system.worn"]: true,
                        ["system.memento"]: false
                    });
                }
                else if (dropTarget == "armor") {
                    this.getData().equippedArmor?.update({ ["system.worn"]: false});
                    item.update({
                        ["system.worn"]: true,
                        ["system.memento"]: false
                    });
                }
                else if (dropTarget == "helmet") {
                    this.getData().equippedHelmet?.update({ ["system.worn"]: false});
                    item.update({
                        ["system.worn"]: true,
                        ["system.memento"]: false
                    });
                }
                else if (dropTarget == "memento") {
                    this.getData().memento?.update({ ["system.memento"]: false });
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

        // Create the owned item
        let returnValue = await this._onDropItemCreate(itemData);

        // Add new Kin abilities
        if (itemData.type == "kin") {
            await this.actor.addKinAbilities();
        }

        return returnValue;
    }
}