import { DoD } from "./config.js";

const { FormDataExtended } = foundry.applications.ux;

export default class DoDActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

    static DEFAULT_OPTIONS = {
      classes: ["DoD"],
      window: { resizable: true },
      position: { width: 600 },
        actions: {
            deleteChange : this.#onDeleteChange,
        }
    };

    static PARTS = {
        header: {template: "systems/dragonbane/templates/parts/active-effect-header.hbs"},
        tabs: {template: "systems/dragonbane/templates/parts/active-effect-tabs.hbs"},
        details: {template: "systems/dragonbane/templates/parts/active-effect-details.hbs"},
        changes: {template: "systems/dragonbane/templates/parts/active-effect-changes.hbs"},
        footer: {template: "templates/generic/form-footer.hbs"}
    };

    static TABS = {
        primary: {
            tabs: [
                {id: "details", icon: "fa-solid fa-book", label: 'DoD.item-sheet.description', cssClass: 'details-tab'},
                {id: "changes", icon: "fa-solid fa-gears", label: 'EFFECT.TABS.changes', cssClass: 'changes-tab'}
            ],
            initial: "details"
        }
    };

    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      context.config = CONFIG.DoD;
      return context;
    }
    
    async _preparePartContext(partId, context) {
      const partContext = await super._preparePartContext(partId, context);
      const document = this.document;
      let submitData;
      let allowedKeys;

      switch ( partId ) {

        case "details":
          submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
          partContext.description = submitData.description ?? document.description;
          partContext.descriptionHTML = await CONFIG.DoD.TextEditor.enrichHTML(partContext.description, {secrets: document.isOwner});
          break;

        case "changes":
          // Prepare list of attributes for selection dropdown + custom option
          partContext.attributes = {
            ...Object.fromEntries(DoD.activeEffectAttributes.map(a => [a.key, a.label])),
            custom: "DoD.effect.custom"
          };

          // Prepare keys for existing changes.
          // If the key is in the list of attributes, use that. Otherwise, mark as custom.
          partContext.changes = foundry.utils.deepClone(document.system.changes ?? []);
          allowedKeys = new Set(DoD.activeEffectAttributes.map(a => a.key));
          for (const c of partContext.changes) {
            c.keyChoice = allowedKeys.has(c.key) ? c.key : "custom";
          }

          // Prepare change types for selection dropdown
          partContext.changeTypes = Object.entries(ActiveEffect.CHANGE_TYPES)
            .map(([type, { label }]) => ({ type, label: _loc(label) }))
            .sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang))
            .reduce((types, { type, label }) => {
              types[type] = label;
              return types;
            }, {});

          break;
      }
      return partContext;
    }

    _onChangeForm(formConfig, event) {

      if (foundry.utils.isElementInstanceOf(event.target, "select") && event.target.name.endsWith(".type")) {
        // Prevent processing due to uncaught reference error in parent class
        // The error occurs because the parent class assumes a different html form layput
        // It should be safe to skip, because this layout does not use priority which is the field that the parent class wants to modify
        // TODO: Report issue or change layout to conform to parent class expectations
        return;
      }      

      const el = event.target;

      // When changing the attribute selection, update the key field accordingly
      if (foundry.utils.isElementInstanceOf(el, "select") && el.name.endsWith(".keyChoice")) {
        const row = el.closest(".effect-change");
        if (!row) return;

        const keyInput = row.querySelector('td.key input[name$=".key"]');
        if (!keyInput) return;

        // Selected attribute or custom
        const choice = el.value;

        // If custom is selected, allow editing the key field.
        // Otherwise, set the key field to the selected attribute and make it read-only.
        if (choice === "custom") {
          keyInput.readOnly = false;
          keyInput.value = "";
        } else {
          keyInput.value = choice;
          keyInput.readOnly = true;
        }

        // Update tooltip
        keyInput.title = keyInput.value ?? "";
        // keyInput.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }

      if (foundry.utils.isElementInstanceOf(el, "input") 
          && (el.name.endsWith(".key") || el.name.endsWith(".value"))) {
        // Changed key or value, update tooltip
        el.title = el.value ?? "";
      }

      super._onChangeForm(formConfig, event);

      // Update editor context if description changes
      if ( event.target.name === "description") this.render({parts: ["details"]});
    }

    static async #onDeleteChange(event) {
      const submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
      const changes = Object.values(submitData.system.changes);
      const row = event.target.closest(".effect-change");
      const index = Number(row.dataset.index) || 0;
      changes.splice(index, 1);
      return this.submit({ updateData: { system: { changes } } });
    }
}
