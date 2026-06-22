import DoDGearBaseSheet from "./gear-base-sheet.js";

export default class DoDHelmetSheet extends DoDGearBaseSheet {

    static type = 'helmet';

    static DEFAULT_OPTIONS =  {
        classes: [this.type],
    };

    static PARTS = {
        header: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-header.hbs`},
        tabs: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-tabs.hbs`},
        details: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-helmet.hbs' },
        description: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-description.hbs' },
        effects: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-effects.hbs' },
        enchantments: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-enchantments.hbs' },
    }
}