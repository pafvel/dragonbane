const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ApplicationV2 } = foundry.applications.api;

export default class DoDAutomationSettings extends HandlebarsApplicationMixin(ApplicationV2)
{
    static DEFAULT_OPTIONS = {
        id: "automation-settings",
        tag: "form",
        window: {
            title: "DoD.SETTINGS.automationSettings",
            contentClasses: ["dragonbane", "standard-form", "automation-settings"],
            resizable : true,
            icon: "fa-solid fa-gears",
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
            template: "systems/dragonbane/templates/apps/automation-settings.hbs",
            scrollable: [""],
            root: true
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    };

    static #schema = new foundry.data.fields.SchemaField({
        characterDeath: new foundry.data.fields.BooleanField({label : "DoD.SETTINGS.automateCharacterDeath", hint : "DoD.SETTINGS.automateCharacterDeathHint"}),
        npcDeath: new foundry.data.fields.BooleanField({label : "DoD.SETTINGS.automateNpcDeath", hint : "DoD.SETTINGS.automateNpcDeathHint"}),
        monsterDeath: new foundry.data.fields.BooleanField({label : "DoD.SETTINGS.automateMonsterDeath", hint : "DoD.SETTINGS.automateMonsterDeathHint"}),
        skillAdvancementMark: new foundry.data.fields.BooleanField({label : "DoD.SETTINGS.automaticSkillAdvancementMark", hint : "DoD.SETTINGS.automaticSkillAdvancementMarkHint"}),
        skillIntensiveTraining: new foundry.data.fields.BooleanField({label : "DoD.SETTINGS.automaticSkillIntensiveTraining", hint : "DoD.SETTINGS.automaticSkillIntensiveTrainingHint"}),
    });

    static get schema()
    {
        return this.#schema
    }

    static registerSettings() {

        game.settings.registerMenu("dragonbane", "automationSettingsMenu", {
            name: "DoD.SETTINGS.automationSettings",
            label: "DoD.SETTINGS.automationSettings",
            hint: "DoD.SETTINGS.automationSettingsHint",
            icon: "fa-solid fa-gears",
            type: DoDAutomationSettings,
            restricted: true
        });

        // If true, autmatically marks Characters as dead when they fail 3 death rolls or get instantly killed
        game.settings.register("dragonbane", "automateCharacterDeath", {
            name: "DoD.SETTINGS.automateCharacterDeath",
            hint: "DoD.SETTINGS.automateCharacterDeathHint",
            scope: "world",
            config: false,
            default: true,
            type: Boolean
        });

        // If true, autmatically marks NPCs as dead when the reach 0 HP
        game.settings.register("dragonbane", "automateNpcDeath", {
            name: "DoD.SETTINGS.automateNpcDeath",
            hint: "DoD.SETTINGS.automateNpcDeathHint",
            scope: "world",
            config: false,
            default: true,
            type: Boolean
        });

        // If true, autmatically marks Monsters as dead when the reach 0 HP
        game.settings.register("dragonbane", "automateMonsterDeath", {
            name: "DoD.SETTINGS.automateMonsterDeath",
            hint: "DoD.SETTINGS.automateMonsterDeathHint",
            scope: "world",
            config: false,
            default: true,
            type: Boolean
        });

        // If true, automatically set skill advancement mark on a Dragon or Demon roll
        game.settings.register("dragonbane", "automaticSkillAdvancementMark", {
            name: "DoD.SETTINGS.automaticSkillAdvancementMark",
            hint: "DoD.SETTINGS.automaticSkillAdvancementMarkHint",
            scope: "world",
            config: false,
            default: true,
            type: Boolean
        });

        // If true, support intensive training with a teacher
        game.settings.register("dragonbane", "automaticSkillIntensiveTraining", {
            name: "DoD.SETTINGS.automaticSkillIntensiveTraining",
            hint: "DoD.SETTINGS.automaticSkillIntensiveTrainingHint",
            scope: "world",
            config: true,
            default: false,
            type: Boolean
        });

    }

    async _prepareContext(options) {
        let context = await super._prepareContext(options);

        context.schema = this.constructor.schema;

        context.source = {};
        context.source.characterDeath = game.settings.get("dragonbane", "automateCharacterDeath");
        context.source.npcDeath = game.settings.get("dragonbane", "automateNpcDeath");
        context.source.monsterDeath = game.settings.get("dragonbane", "automateMonsterDeath");
        context.source.skillAdvancementMark = game.settings.get("dragonbane", "automaticSkillAdvancementMark");
        context.source.skillIntensiveTraining = game.settings.get("dragonbane", "automaticSkillIntensiveTraining");

        context.buttons = [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "SETTINGS.Save" }];

        return context;
    }


    static async _onSubmit(event, form, formData)
    {
        game.settings.set("dragonbane", "automateCharacterDeath", formData.object.characterDeath);
        game.settings.set("dragonbane", "automateNpcDeath", formData.object.npcDeath);
        game.settings.set("dragonbane", "automateMonsterDeath", formData.object.monsterDeath);
        game.settings.set("dragonbane", "automateMonsterDeath", formData.object.monsterDeath);
        game.settings.set("dragonbane", "automaticSkillAdvancementMark", formData.object.skillAdvancementMark);
        game.settings.set("dragonbane", "automaticSkillIntensiveTraining", formData.object.skillIntensiveTraining);
    }
}
