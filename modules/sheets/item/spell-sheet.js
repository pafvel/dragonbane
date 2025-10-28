import DoDItemBaseSheet from "./item-base-sheet.js";

export default class DoDSpellSheet extends DoDItemBaseSheet {

    static type = 'spell';

    static DEFAULT_OPTIONS =  {
        classes: [this.type],
    };

    static PARTS = {
        header: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-header.hbs`},
        tabs: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-tabs.hbs`},
        details: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-spell.hbs' },
        description: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-description.hbs' },
        effects: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-effects.hbs' },
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.enableRange = !["touch", "personal"].includes(this.item.system.rangeType);
        if(!context.enableRange) {
            context.system.range = "";
        }
        return context;
    }

    async _onRender(context, options) {
        await super._onRender(context, options);

        if (this.item.isOwner) {
           $(this.element).find(".edit-school").change(this._onEditSchool.bind(this));
        }
    }

    _onEditSchool(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let field = element.dataset.field;
        let item = this.item;

        // replace input with localized string if it matches registered general school name
        const settingSchool = game.settings.get("dragonbane", "generalMagicSchoolName");
        if ( settingSchool === element.value) {
            element.value = "DoD.spell.general";
            return item.update({ [field]: settingSchool});
        }
        // replace input with localized string if it matches localized general school name
        const localizedSchool = game.i18n.localize("DoD.spell.general");
        if (localizedSchool === element.value) {
            element.value = "DoD.spell.general";
            return item.update({ [field]: localizedSchool});
        }
        return item.update({ [field]: element.value});
    }
}