import DoDItemBaseSheet from "./item-base-sheet.js";
import DoD_Utility from "../../utility.js";

export default class DoDArmorSheet extends DoDItemBaseSheet {

    static type = 'armor';

    static DEFAULT_OPTIONS =  {
        classes: [this.type],
        actions: {
            editBonusArmor: this.#editBonusArmor,
        },
    };

    static PARTS = {
        header: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-header.hbs`},
        tabs: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-tabs.hbs`},
        details: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-armor.hbs' },
        description: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-description.hbs' },
        effects: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-effects.hbs' },
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        let armorBonuses = [];

        this.item.system.bonuses.forEach( damageType => {
            armorBonuses.push({
                name: CONFIG.DoD.damageTypes[damageType],
                tooltip: CONFIG.DoD.damageTypes[damageType] + "Tooltip"
            })
        });
        context.armorBonuses = armorBonuses;
        return context;
    }

    static async #editBonusArmor(event, _target) {
        event.preventDefault();

        // prepare weapon feature data
        let damageData = [];
        for (let damageType in CONFIG.DoD.damageTypes)
        {
            if (damageType !== "none") {
                damageData.push( {
                    name: CONFIG.DoD.damageTypes[damageType],
                    tooltip: CONFIG.DoD.damageTypes[damageType] + "Tooltip",
                    id: damageType,
                    value: this.item.hasDamageBonus(damageType)
                });
            }
        }

        // render dialog html
        let dialogData = {bonuses: damageData};
        const template = "systems/dragonbane/templates/partials/armor-bonuses-dialog.hbs";
        const html = await DoD_Utility.renderTemplate(template, dialogData);

        // show dialog
        foundry.applications.api.DialogV2.prompt({
            window: { title: game.i18n.localize("DoD.armor.bonuses") },
            content: html,
            ok: {
                callback: (_event, _button, dialog) => {
                    let elements = dialog.element.getElementsByClassName("armor-bonuses");
                    let element = elements ? elements[0] : null;
                    let inputs = element?.getElementsByTagName("input");
                    let bonuses = [];

                    for (let input of inputs) {
                        if (input.type === "checkbox" && input.checked) {
                            bonuses.push(input.id);
                        }
                    }
                    this.item.update({ ["system.bonuses"]: bonuses});
                }
            }           
        });        
    }
}