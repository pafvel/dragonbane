const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ApplicationV2 } = foundry.applications.api;

export default class DoDCoreSettings extends HandlebarsApplicationMixin(ApplicationV2)
{
    static DEFAULT_OPTIONS = {
        id: "core-settings",
        tag: "form",
        window: {
            title: "DoD.SETTINGS.coreSettingOverrides",
            contentClasses: ["dragonbane", "standard-form", "core-settings"],
            resizable : true,
            icon: "fa-solid fa-th-list",
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
        magicMishapTable: new foundry.data.fields.StringField({ label : "DoD.SETTINGS.magicMishapTable", hint : "DoD.SETTINGS.magicMishapTableHint"}),
        meleeMishapTable: new foundry.data.fields.StringField({ label : "DoD.SETTINGS.meleeMishapTable", hint : "DoD.SETTINGS.meleeMishapTableHint"}),
        rangedMishapTable: new foundry.data.fields.StringField({ label : "DoD.SETTINGS.rangedMishapTable", hint : "DoD.SETTINGS.rangedMishapTableHint"}),
        treasureTable: new foundry.data.fields.StringField({ label : "DoD.SETTINGS.treasureTable", hint : "DoD.SETTINGS.treasureTableHint"}),
    });

    static get schema()
    {
        return this.#schema
    }

    // Define getters for each schema field
    static {
        for (const key of Object.keys(this.#schema.fields)) {
            Object.defineProperty(this, key, {
                get() {
                    const override = game.settings.get("dragonbane", "coreSettingOverrides")[key];
                    return override || game.settings.get("dragonbane", key);
                },
                enumerable: true,
            });
        }
    }

    static registerSettings() {

        game.settings.registerMenu("dragonbane", "coreSettingOverridesMenu", {
            name: "DoD.SETTINGS.coreSettingOverrides",
            label: "DoD.SETTINGS.coreSettingOverrides",
            hint: "DoD.SETTINGS.coreSettingOverridesHint",
            icon: "fa-solid fa-th-list",
            type: DoDCoreSettings,
            restricted: true
        });

        game.settings.register("dragonbane", "coreSettingOverrides", {
            name: "DoD.SETTINGS.coreSettingOverrides",
            hint: "DoD.SETTINGS.coreSettingOverridesHint",
            scope: "world",
            config: false,
            type: DoDCoreSettings.schema
        });

        // The core module registers itself here, could be different language versions.
        game.settings.register("dragonbane", "coreModuleCompendium", {
            config: false,
            scope: "world",
            type: String,
            default: ""
        });

        game.settings.register("dragonbane", "magicMishapTable", {
            config: false,
            scope: "world",
            type: String,
            default: ""
        });

        game.settings.register("dragonbane", "meleeMishapTable", {
            config: false,
            scope: "world",
            type: String,
            default: ""
        });

        game.settings.register("dragonbane", "rangedMishapTable", {
            config: false,
            scope: "world",
            type: String,
            default: ""
        });

        game.settings.register("dragonbane", "treasureTable", {
            config: false,
            scope: "world",
            type: String,
            default: ""
        });

        game.settings.register("dragonbane", "generalMagicSchoolName", {
            config: false,
            scope: "world",
            type: String,
            default: "General"
        });
    }

    async _prepareContext(options) {
        let context = await super._prepareContext(options);
        context.schema = this.constructor.schema;
        context.source = game.settings.get("dragonbane", "coreSettingOverrides");
        context.buttons = [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "SETTINGS.Save" }];
        return context;
    }

    static async _onSubmit(event, form, formData) 
    {
        game.settings.set("dragonbane", "coreSettingOverrides", formData.object);
    }
}
