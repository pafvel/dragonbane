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
            data: baseData.data.system,
            config: CONFIG.DoD
        };
        return sheetData;
    }

    activateListeners(html) {
        html.find(".edit-school").change(this._onSchoolEdit.bind(this));

        super.activateListeners(html);
    }

    _onSchoolEdit(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let field = element.dataset.field;
        let item = this.item;

        // replace input with localized string if it matches general school name
        let generalSchool = game.i18n.localize("DoD.spell.general");
        if (generalSchool == element.value) {
            element.value = "DoD.spell.general";
        }

        return item.update({ [field]: element.value});
    }

}