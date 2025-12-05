import DoDItemBaseSheet from "./item-base-sheet.js";

export default class DoDItemSheet extends DoDItemBaseSheet {

    static type = 'item';

    static DEFAULT_OPTIONS =  {
        classes: [this.type],
        actions: {
            toggleMemento: this.#toggleMemento,
        },
    };

    static PARTS = {
        header: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-header.hbs`},
        tabs: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-tabs.hbs`},
        details: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-item.hbs' },
        description: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-description.hbs' },
        effects: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-effects.hbs' },
    }

    static async #toggleMemento(event, target) {
        event.preventDefault();
        const checked = target.checked;
        if (checked) {
            // clear existing memento
            const memento = this.item.actor?.items.find(i => i.system.memento);
            if (memento) {
                await memento.update({ ["system.memento"]: false});
            }
        }
        await this.item.update({ ["system.memento"]: checked});
    }
}