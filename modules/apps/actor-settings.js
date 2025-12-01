const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ApplicationV2 } = foundry.applications.api;

export default class DoDActorSettings extends HandlebarsApplicationMixin(ApplicationV2)
{
    static DEFAULT_OPTIONS = {
        id: "actor-settings",
        tag: "form",
        window: {
            title: "DoD.SETTINGS.actorSettings",
            contentClasses: ["dragonbane", "standard-form", "actor-settings"],
            resizable : true,
            icon: "fa-solid fa-user",
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
        canEquipItems: new foundry.data.fields.BooleanField({ initial: true, label : "DoD.SETTINGS.canEquipItems", hint : "DoD.SETTINGS.canEquipItemsHint"}),
        coinEncumbrance: new foundry.data.fields.BooleanField({ initial: true, label : "DoD.SETTINGS.coinEncumbrance", hint : "DoD.SETTINGS.coinEncumbranceHint"}),
        hideNpcWpWidget: new foundry.data.fields.BooleanField({ initial: true, label : "DoD.SETTINGS.hideNpcWpWidget", hint : "DoD.SETTINGS.hideNpcWpWidgetHint"}),
        useWorldSkills: new foundry.data.fields.BooleanField({ initial: false, label : "DoD.SETTINGS.useWorldSkillsOnCreateActor", hint : "DoD.SETTINGS.useWorldSkillsOnCreateActorHint"}),
    });

    static get schema()
    {
        return this.#schema
    }

    // Define getters for each schema field
    static {
        for (const key of Object.keys(this.#schema.fields)) {
            Object.defineProperty(this, key, {
                get() { return game.settings.get("dragonbane", "actorSettings")[key]; },
                enumerable: true,
            });
        }
    }

    static registerSettings() {

        game.settings.registerMenu("dragonbane", "actorSettingsMenu", {
            name: "DoD.SETTINGS.actorSettings",
            label: "DoD.SETTINGS.actorSettings",
            hint: "DoD.SETTINGS.actorSettingsHint",
            icon: "fa-solid fa-user",
            type: DoDActorSettings,
            restricted: true
        });

        game.settings.register("dragonbane", "actorSettings", {
            name: "DoD.SETTINGS.actorSettings",
            hint: "DoD.SETTINGS.actorSettingsHint",
            scope: "world",
            config: false,
            type: DoDActorSettings.schema
        });
    }

    async _prepareContext(options) {
        let context = await super._prepareContext(options);
        context.schema = this.constructor.schema;
        context.source = game.settings.get("dragonbane", "actorSettings");
        context.buttons = [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "SETTINGS.Save" }];
        return context;
    }

    static async _onSubmit(event, form, formData) 
    {
        // Check if reload is needed
        let reload = false;
        if (game.settings.get("dragonbane", "actorSettings").coinEncumbrance != formData.object.coinEncumbrance) {
            reload = true;
        }

        // Save settings
        game.settings.set("dragonbane", "actorSettings", formData.object);
       
        // Reload
        if (reload) {
            foundry.applications.settings.SettingsConfig.reloadConfirm({ world: true });
        }
    }
}
