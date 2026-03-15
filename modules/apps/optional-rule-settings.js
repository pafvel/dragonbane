const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ApplicationV2 } = foundry.applications.api;

export default class DoDOptionalRuleSettings extends HandlebarsApplicationMixin(ApplicationV2)
{
    static DEFAULT_OPTIONS = {
        id: "optional-rule-settings",
        tag: "form",
        window: {
            title: "DoD.SETTINGS.optionalRuleSettings",
            contentClasses: ["dragonbane", "standard-form", "dragonbane-settings", "optional-rule-settings"],
            resizable : true,
            icon: "fa-solid fa-check-square",
        },
        position : {
            width: 480
        },
        form: {
            closeOnSubmit: true,
            handler: this._onSubmit
        }
    };

    /** @override */
    static PARTS = {
        body: {
            template: "systems/dragonbane/templates/apps/generic-settings.hbs",
            scrollable: [""],
            root: true
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    };

    static #schema = new foundry.data.fields.SchemaField({
        damageTypes: new foundry.data.fields.BooleanField({ label : "DoD.SETTINGS.damageTypes", hint : "DoD.SETTINGS.damageTypesHint", initial: true }),
    });

    static get schema()
    {
        return this.#schema
    }

    static registerSettings() {

        game.settings.registerMenu("dragonbane", "optionalRuleSettingsMenu", {
            name: "DoD.SETTINGS.optionalRuleSettings",
            label: "DoD.SETTINGS.optionalRuleSettings",
            hint: "DoD.SETTINGS.optionalRuleSettingsHint",
            icon: "fa-solid fa-check-square",
            type: DoDOptionalRuleSettings,
            restricted: true
        });

        game.settings.register("dragonbane", "optionalRules", {
            name: "DoD.SETTINGS.optionalRules",
            hint: "DoD.SETTINGS.optionalRulesHint",
            scope: "world",
            config: false,
            type: DoDOptionalRuleSettings.schema
        });
    }

    static get damageTypes() {
        return game.settings.get("dragonbane", "optionalRules").damageTypes;
    }
    
    async _prepareContext(options) {
        let context = await super._prepareContext(options);
        
        context.source = game.settings.get("dragonbane", "optionalRules");
        context.schema = this.constructor.schema;
        context.buttons = [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "SETTINGS.Save" }];
        
        return context;
    }

    static async _onSubmit(event, form, formData) 
    {
        game.settings.set("dragonbane", "optionalRules", formData.object);
    }
}
