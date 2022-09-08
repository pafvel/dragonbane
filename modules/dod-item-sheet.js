export default class DoDItemSheet extends ItemSheet {
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions,  {
            width: 530,
            height: 340,
            classes: ["DoD", "sheet", "item"]
        });
    }

    get template() {
        return `systems/dragonbane/templates/${this.item.type}-sheet.html`;
    }

    getData() {
        const baseData = super.getData();
   
        let sheetData = {
            owner: this.item.isOwner,
            editable: this.isEditable,
            item: baseData.item,
            data: baseData.data.data,
            config: CONFIG.DoD
        };
        return sheetData;
    }
}