import DoDItemBaseSheet from "./item-base-sheet.js";
import DoD_Utility from "../../utility.js";

export default class DoDWeaponSheet extends DoDItemBaseSheet {

    static type = 'weapon';

    static DEFAULT_OPTIONS =  {
        classes: [this.type],
        actions: {
            editWeaponFeatures: this.#editWeaponFeatures,
        },
    };

    static PARTS = {
        header: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-header.hbs`},
        tabs: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-tabs.hbs`},
        details: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-weapon.hbs' },
        description: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-description.hbs' },
        effects: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-effects.hbs' },
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        let weaponFeatures = [];
        this.item.system.features.forEach( feature => {
            weaponFeatures.push({
                name: CONFIG.DoD.weaponFeatureTypes[feature],
                tooltip: CONFIG.DoD.weaponFeatureTypes[feature] + "Tooltip"
            })
        });
        context.weaponFeatures = weaponFeatures;

        return context;
    }

    static async #editWeaponFeatures(event, _target) {
        event.preventDefault();

        // prepare weapon feature data
        let featureData = [];
        for (let feature in CONFIG.DoD.weaponFeatureTypes)
        {
            const name = CONFIG.DoD.weaponFeatureTypes[feature];
            const localizedName = game.i18n.localize(name);

            featureData.push( {
                name: name,
                localizedName: localizedName,
                tooltip: name + "Tooltip",
                id: feature,
                value: this.item.hasWeaponFeature(feature)
            });
        }
        featureData = featureData.sort((a, b) => { return a.localizedName < b.localizedName ? -1 : 1; });

        // render dialog html
        let dialogData = {features: featureData};
        const template = "systems/dragonbane/templates/partials/weapon-features-dialog.hbs";
        const html = await DoD_Utility.renderTemplate(template, dialogData);

        // show dialog
        foundry.applications.api.DialogV2.prompt({
            window: { title: game.i18n.localize("DoD.ui.dialog.weaponFeatures") },
            content: html,
            ok: {
                callback: (_event, _button, dialog) => {
                    let elements = dialog.element.getElementsByClassName("weapon-features");
                    let element = elements ? elements[0] : null;
                    let inputs = element?.getElementsByTagName("input");
                    let features = [];

                    for (let input of inputs) {
                        if (input.type === "checkbox" && input.checked) {
                            features.push(input.id);
                        }
                    }
                    this.item.update({ ["system.features"]: features});
                }
            }           
        });        
    }
}