import DoDItemBaseSheet from "./item-base-sheet.js";

export default class DoDSkillSheet extends DoDItemBaseSheet {

    static type = 'skill';

    static DEFAULT_OPTIONS =  {
        classes: [this.type],
    };

    static PARTS = {
        header: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-header.hbs`},
        tabs: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-tabs.hbs`},
        details: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-skill.hbs' },
        description: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-description.hbs' },
        effects: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-effects.hbs' },
    }
}