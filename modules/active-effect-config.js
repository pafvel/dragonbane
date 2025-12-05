const { FormDataExtended } = foundry.applications.ux;

export default class DoDActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

    static DEFAULT_OPTIONS = {
        classes: ["DoD"],
        position: {width: 600},
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

      switch ( partId ) {
        case "details":
          submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
          partContext.description = submitData.description ?? document.description;
          partContext.descriptionHTML = await CONFIG.DoD.TextEditor.enrichHTML(partContext.description, {secrets: document.isOwner});
          break;
      }
      return partContext;
    }

    _onChangeForm(formConfig, event) {

      if ( event.target instanceof HTMLSelectElement && event.target.name.endsWith(".mode") ) {
        // Prevent processing due to uncaught reference error in parent class
        // The error occurs because the parent class assumes a different html form layput
        // It should be safe to skip, because this layout does not use priority which is the field that the parent class wants to modify
        // TODO: Report issue or change layout to conform to parent class expectations
        return;
      }      

      super._onChangeForm(formConfig, event);

      // Update editor context if description changes
      if ( event.target.name === "description") this.render({parts: ["details"]});
    }

    static async #onDeleteChange(event) {
      const submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
      const changes = Object.values(submitData.changes);
      const row = event.target.closest(".effect-change");
      const index = Number(row.dataset.index) || 0;
      changes.splice(index, 1);
      return this.submit({updateData: {changes}});
    }
}
