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


  /*

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions,  {
            classes: ["DoD", "sheet", "active-effect-sheet"],
            width: 600,
            height: "auto",
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    get template() {
        return "systems/dragonbane/templates/active-effect-config.html";
    }

    // @override
    async getData(options={}) {
      const context = await super.getData(options);
      context.descriptionHTML = await CONFIG.DoD.TextEditor.enrichHTML(this.object.system.description, {secrets: this.object.isOwner});
      const legacyTransfer = CONFIG.ActiveEffect.legacyTransferral;
      const labels = {
        transfer: {
          name: game.i18n.localize(`EFFECT.Transfer${legacyTransfer ? "Legacy" : ""}`),
          hint: game.i18n.localize(`EFFECT.TransferHint${legacyTransfer ? "Legacy" : ""}`)
        }
      };
     
      // Status Conditions
      const statuses = CONFIG.statusEffects.map(s => {
        return {
          id: s.id,
          label: game.i18n.localize(s.name ?? s.label), // @deprecated since v12
          selected: context.data.statuses.includes(s.id) ? "selected" : ""
        };
      });
  
      // Return rendering context
      const sheetData = foundry.utils.mergeObject(context, {
        labels,
        effect: this.object, // Backwards compatibility
        data: this.object,
        isActorEffect: this.object.parent.documentName === "Actor",
        isItemEffect: this.object.parent.documentName === "Item",
        submitText: "EFFECT.Submit",
        statuses,
        modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
          obj[e[1]] = game.i18n.localize(`EFFECT.MODE_${e[0]}`);
          return obj;
        }, {})
      });
      sheetData.config = CONFIG.DoD;
      return sheetData;
    }
  
    // @override
    activateListeners(html) {
      super.activateListeners(html);
      html.find(".effect-control").click(this._onEffectControl.bind(this));
    }
  
 
     // Provide centralized handling of mouse clicks on control buttons.
     // Delegate responsibility out to action-specific handlers depending on the button action.
     // @param {MouseEvent} event      The originating click event
     // @private
    _onEffectControl(event) {
      event.preventDefault();
      const button = event.currentTarget;
      switch ( button.dataset.action ) {
        case "add":
          return this._addEffectChange();
        case "delete":
          button.closest(".effect-change").remove();
          return this.submit({preventClose: true}).then(() => this.render());
      }
    }
  
    // Handle adding a new change to the changes array.
    // @private
    async _addEffectChange() {
      const idx = this.document.changes.length;
      return this.submit({preventClose: true, updateData: {
        [`changes.${idx}`]: {key: "", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: ""}
      }});
    }
  
    // @inheritdoc
    _getSubmitData(updateData={}) {
      const fd = new FormDataExtended(this.form, {editors: this.editors});
      let data = foundry.utils.expandObject(fd.object);
      if ( updateData ) foundry.utils.mergeObject(data, updateData);
      data.changes = Array.from(Object.values(data.changes || {}));
      data.statuses ??= [];
      return data;
    }    
  }
  */
}
