import DoDActorBaseSheet from "./actor-base-sheet.js";

export default class DoDNpcSheet extends DoDActorBaseSheet {

    static DEFAULT_OPTIONS =  {
        classes: ["DoD", "sheet", "character"],
        position: { width: 580, height: 640 },
        window: { resizable: true, title: 'DoD.NpcSheetTitle' },
        form: {
            submitOnChange: true,
            closeOnSubmit: false
        },
          actions: {  
        }
    };

    static TABS = {
        primary: {
            tabs: [
            { id: 'main', group: 'primary', label: 'DoD.ui.character-sheet.main' },
            { id: 'skills', group: 'primary', label: 'DoD.ui.character-sheet.skills' },
            { id: 'inventory', group: 'primary', label: 'DoD.ui.character-sheet.inventory' },
            { id: 'effects', group: 'primary', label: 'DoD.ui.character-sheet.effects' },
            ],
            initial: 'main'
        }
    };

    static PARTS = {
        header: { scrollable: [''], template: `systems/dragonbane/templates/parts/npc-sheet-header.hbs`},
        tabs: { scrollable: [''], template: `systems/dragonbane/templates/parts/npc-sheet-tabs.hbs`},
        main: { scrollable: [''], template: 'systems/dragonbane/templates/parts/npc-sheet-main.hbs' },
        skills: { scrollable: [''], template: 'systems/dragonbane/templates/parts/npc-sheet-skills.hbs' },
        inventory: { scrollable: [''], template: 'systems/dragonbane/templates/parts/npc-sheet-inventory.hbs' },
        effects: { scrollable: [''], template: 'systems/dragonbane/templates/parts/character-sheet-effects.hbs' },
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.traitsHTML = await this.enrich(context.system.traits);

        return context;        
    }

}