import DoD_Utility from "./utility.js";

export default class DoDCharacterSheet extends ActorSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions,  {
            width: 600,
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
        const trainedSkills = [];
        
        for (let item of sheetData.actor.items.contents) {
            if (item.type === 'skill') {
                let skill = item;
                
                if (skill.system.skillType == 'core') {
                    coreSkills.push(skill);
                } else if (skill.system.skillType == 'secondary') {
                    secondarySkills.push(skill);
                } else if (skill.system.skillType == 'weapon') {
                    weaponSkills.push(skill);
                }
            }
        }

        sheetData.coreSkills = coreSkills; 
        sheetData.secondarySkills = secondarySkills; 
        sheetData.weaponSkills = weaponSkills; 
        
    }  

    activateListeners(html) {
        html.find(".inline-edit").change(this._onInlineEdit.bind(this));
        html.find(".item-edit").click(this._onItemEdit.bind(this));
        html.find(".item-delete").click(this._onItemDelete.bind(this));

        super.activateListeners(html);
    }

    _onInlineEdit(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);
        let field = element.dataset.field;
        let value = Number(element.value);

        return item.update({ [field]: value});
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

}