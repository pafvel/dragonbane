const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ApplicationV2 } = foundry.applications.api;

export default class DoDCombatSettings extends HandlebarsApplicationMixin(ApplicationV2)
{
    static DEFAULT_OPTIONS = {
        id: "combat-settings",
        tag: "form",
        window: {
            title: "DoD.SETTINGS.combatSettings",
            contentClasses: ["dragonbane", "standard-form", "combat-settings"],
            resizable : true,
            icon: "fa-solid fa-swords",
        },
        position : {
            width: 550
        },
        form: {
            closeOnSubmit: true,
            handler: this._onSubmit
        }
    };

    /** @override */
    static PARTS = {
        body: {
            template: "systems/dragonbane/templates/apps/combat-settings.hbs",
            scrollable: [""],
            root: true
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    };

    static #permissionLevels = {
        [CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE]: "OWNERSHIP.NONE",
        [CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED]: "OWNERSHIP.LIMITED",
        [CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER]: "OWNERSHIP.OBSERVER",
        [CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER]: "OWNERSHIP.OWNER"
    };

    static #schema = new foundry.data.fields.SchemaField({
        monsterAttackDialogIsDefault: new foundry.data.fields.BooleanField({
            label : "DoD.SETTINGS.monsterAttackDialogIsDefault",
            hint : "DoD.SETTINGS.monsterAttackDialogIsDefaultHint" }),

        allowDealDamageOnSelected: new foundry.data.fields.BooleanField({
            label : "DoD.SETTINGS.allowDealDamageOnSelected",
            hint : "DoD.SETTINGS.allowDealDamageOnSelectedHint" }),
            
        viewDamagePermission: new foundry.data.fields.StringField({
            label: "DoD.SETTINGS.viewDamagePermission",
            hint: "DoD.SETTINGS.viewDamagePermissionHint",
            required: true,
            blank: true,
            initial: "observer",
            choices: this.#permissionLevels }),
    });

    static get schema()
    {
        return this.#schema
    }

    static registerSettings() {

        game.settings.registerMenu("dragonbane", "combatSettingsMenu", {
            name: "DoD.SETTINGS.combatSettings",
            label: "DoD.SETTINGS.combatSettings",
            hint: "DoD.SETTINGS.combatSettingsHint",
            icon: "fa-solid fa-swords",
            type: DoDCombatSettings,
            restricted: true
        });

        // If true, showing the "Select Monster Attack" dialog is default when making a monster attack.
        game.settings.register("dragonbane", "monsterAttackDialogIsDefault", {
            name: "DoD.SETTINGS.monsterAttackDialogIsDefault",
            hint: "DoD.SETTINGS.monsterAttackDialogIsDefaultHint",
            scope: "world",
            config: false,
            default: true,
            type: Boolean
        });

        // If true, allows dealing damage using the selection method
        game.settings.register("dragonbane", "allowDealDamageOnSelected", {
            name: "DoD.SETTINGS.allowDealDamageOnSelected",
            hint: "DoD.SETTINGS.allowDealDamageOnSelectedHint",
            scope: "world",
            config: false,
            default: false,
            type: Boolean
        });

        // Minimum level to view damage applied in messages
        game.settings.register("dragonbane", "viewDamagePermission", {
            name: "DoD.SETTINGS.viewDamagePermission",
            hint: "DoD.SETTINGS.viewDamagePermissionHint",
            scope: "world",
            config: false,
            default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
            type: Number,
            choices: this.#permissionLevels
        });

    }

    async _prepareContext(options) {
        let context = await super._prepareContext(options);
        
        context.schema = this.constructor.schema;
        
        context.source = {};
        context.source.monsterAttackDialogIsDefault = game.settings.get("dragonbane", "monsterAttackDialogIsDefault");
        context.source.allowDealDamageOnSelected = game.settings.get("dragonbane", "allowDealDamageOnSelected");
        context.source.viewDamagePermission = game.settings.get("dragonbane", "viewDamagePermission");

        context.buttons = [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "SETTINGS.Save" }];

        return context;
    }


    static async _onSubmit(event, form, formData) 
    {
        game.settings.set("dragonbane", "monsterAttackDialogIsDefault", formData.object.monsterAttackDialogIsDefault);
        game.settings.set("dragonbane", "allowDealDamageOnSelected", formData.object.allowDealDamageOnSelected);
        game.settings.set("dragonbane", "viewDamagePermission", formData.object.viewDamagePermission);
    }
}
