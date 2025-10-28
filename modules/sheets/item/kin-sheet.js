import DoDItemBaseSheet from "./item-base-sheet.js";

export default class DoDKinSheet extends DoDItemBaseSheet {

    static type = 'kin';

    static DEFAULT_OPTIONS =  {
        classes: [this.type],
    };

    static PARTS = {
        header: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-header.hbs`},
        tabs: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-tabs.hbs`},
        details: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-kin.hbs' },
        description: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-description.hbs' },
        effects: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-effects.hbs' },
    }

    async _onRender(context, options) {
        await super._onRender(context, options);
        if (this.item.isOwner) {
            $(this.element).find(".edit-kin-abilities").change(this._onEditKinAbilities.bind(this));
        }
    }

    async _onEditKinAbilities(event) {
        if (this.item.actor) {
            event.preventDefault();
            let newValue = event.currentTarget.value;
            await this.item.update({ ["system.abilities"]: newValue});
            await this.item.actor.updateKinAbilities();
        };
    }

    async _onDropItem(_event, item) {
        if (item.type === "ability") {
            await this.item.update({ ["system.abilities"]: item.name});
            await this.item.actor?.updateKinAbilities();
        }
    }    
}