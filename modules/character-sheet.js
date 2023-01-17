import DoD_Utility from "./utility.js";

export default class DoDCharacterSheet extends ActorSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions,  {
            width: 680,
            height: 640,
            classes: ["DoD", "sheet", "character"],
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
        });
    }

    get template() {
        return `systems/dragonbane/templates/character-sheet.html`;
    }

    getData() {
        const baseData = super.getData();

        let sheetData = {
            actor: baseData.actor,
            data: baseData.data.system,
        };

        // Prepare character data and items.
        if (sheetData.actor.type == 'character') {
            this._prepareItems(sheetData);
        }        

        return sheetData;
    }

    _prepareItems(sheetData) {

        const coreSkills = [];
        const secondarySkills = [];
        const weaponSkills = [];
        const magicSkills = [];
        const trainedSkills = [];
        const heroicAbilities = [];
        const kinAbilities = [];
        const professionAbilities = [];
        const spells = [];
        const schools = {};
        
        for (let item of sheetData.actor.items.contents) {
            if (item.type == 'skill') {
                let skill = item;
                
                if (skill.system.skillType == 'core') {
                    coreSkills.push(skill);
                }  else if (skill.system.skillType == 'weapon') {
                    weaponSkills.push(skill);
                } else if (skill.system.skillType == 'magic') {
                    // schools of magic are secondary skills
                    magicSkills.push(skill);
                    secondarySkills.push(skill);
                } else {
                    secondarySkills.push(skill);
                }
            }
            else if (item.type == 'ability') {
                let ability = item;

                if (ability.system.abilityType == 'kin') {
                    kinAbilities.push(ability);
                } else if (ability.system.abilityType == 'profession') {
                    professionAbilities.push(ability);
                } else {
                    heroicAbilities.push(ability);
                }
            }
            else if (item.type == 'spell')
            {
                let spell = item;

                spells.push(spell);
                
                if (!schools[spell.system.school]) {
                    schools[spell.system.school] = [];
                }
                schools[spell.system.school].push(spell);
            }
        }

        sheetData.coreSkills = coreSkills.sort(DoD_Utility.nameSorter);
        sheetData.magicSkills = magicSkills.sort(DoD_Utility.nameSorter); 
        sheetData.secondarySkills = secondarySkills.sort(DoD_Utility.nameSorter); 
        sheetData.weaponSkills = weaponSkills.sort(DoD_Utility.nameSorter);

        sheetData.heroicAbilities = heroicAbilities.sort(DoD_Utility.nameSorter);
        sheetData.kinAbilities = kinAbilities.sort(DoD_Utility.nameSorter);
        sheetData.professionAbilities = professionAbilities.sort(DoD_Utility.nameSorter);

        sheetData.spells = spells.sort(DoD_Utility.nameSorter);
    }  

    activateListeners(html) {
        html.find(".inline-edit").change(this._onInlineEdit.bind(this));
        html.find(".item-edit").click(this._onItemEdit.bind(this));
        html.find(".item-delete").click(this._onItemDelete.bind(this));

        html.find(".rollable-attribute").click(this._onAttributeRoll.bind(this));
        html.find(".rollable-skill").click(this._onSkillRoll.bind(this));

        super.activateListeners(html);
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
}