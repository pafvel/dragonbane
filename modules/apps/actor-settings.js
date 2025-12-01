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
            template: "systems/dragonbane/templates/apps/actor-settings.hbs",
            scrollable: [""],
            root: true
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    };

    static #schema = new foundry.data.fields.SchemaField({
        useWorldSkills: new foundry.data.fields.BooleanField({label : "DoD.SETTINGS.useWorldSkillsOnCreateActor", hint : "DoD.SETTINGS.useWorldSkillsOnCreateActorHint"}),
        canEquipItems: new foundry.data.fields.BooleanField({label : "DoD.SETTINGS.canEquipItems", hint : "DoD.SETTINGS.canEquipItemsHint"}),
        hideNpcWpWidget: new foundry.data.fields.BooleanField({label : "DoD.SETTINGS.hideNpcWpWidget", hint : "DoD.SETTINGS.hideNpcWpWidgetHint"}),
    });

    static get schema()
    {
        return this.#schema
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

        // If true, looks for skills in the world instead of the module when creating a new Actor.
        game.settings.register("dragonbane", "useWorldSkillsOnCreateActor", {
            name: "DoD.SETTINGS.useWorldSkillsOnCreateActor",
            hint: "DoD.SETTINGS.useWorldSkillsOnCreateActorHint",
            scope: "world",
            config: false,
            default: false,
            type: Boolean
        });

        // canEquipItems2 replaces canEquipItems to ensure the new default value
        game.settings.register("dragonbane", "canEquipItems2", {
            name: "DoD.SETTINGS.canEquipItems",
            hint: "DoD.SETTINGS.canEquipItemsHint",
            scope: "world",
            config: false,
            default: true,
            type: Boolean
        });

        // If true, hides WP gadget if NPC has 0 WP and no spells or abilities
        game.settings.register("dragonbane", "hideNpcWpWidget", {
            name: "DoD.SETTINGS.hideNpcWpWidget",
            hint: "DoD.SETTINGS.hideNpcWpWidgetHint",
            scope: "world",
            config: false,
            default: true,
            type: Boolean
        });
    }

    async _prepareContext(options) {
        let context = await super._prepareContext(options);
        
        context.schema = this.constructor.schema;
        
        context.source = {};
        context.source.useWorldSkills = game.settings.get("dragonbane", "useWorldSkillsOnCreateActor");
        context.source.canEquipItems = game.settings.get("dragonbane", "canEquipItems2");
        context.source.hideNpcWpWidget = game.settings.get("dragonbane", "hideNpcWpWidget");

        context.buttons = [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "SETTINGS.Save" }];

        return context;
    }


    static async _onSubmit(event, form, formData) 
    {
        game.settings.set("dragonbane", "useWorldSkillsOnCreateActor", formData.object.useWorldSkills);
        game.settings.set("dragonbane", "canEquipItems2", formData.object.canEquipItems);
        game.settings.set("dragonbane", "hideNpcWpWidget", formData.object.hideNpcWpWidget);
    }
}
