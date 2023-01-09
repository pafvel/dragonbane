export default class DoDItemSheet extends ItemSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions,  {
            width: 530,
            height: 340,
            classes: ["DoD", "sheet", "character"]
        });
    }

    get template() {
        return `systems/dragonbane/templates/character-sheet.html`;
    }

    getData() {
        const baseData = super.getData();
   
        let sheetData = {
            owner: this.item.isOwner,
            editable: this.isEditable,
            item: baseData.item,
            data: baseData.data.system,
            config: CONFIG.DoD
        };
        return sheetData;
    }
}