export default class DoDActiveEffectConfig extends DocumentSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions,  {
            classes: ["DoD", "sheet", "active-effect-sheet"],
            width: 600,
            height: "auto",
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    get template() {
        if (game.release.generation < 13) {
            return "systems/dragonbane/templates/active-effect-config-v12.html";    
        }
        return "systems/dragonbane/templates/active-effect-config.html";
    }

    /** @override */
    async getData(options={}) {
      const context = await super.getData(options);
      context.descriptionHTML = await CONFIG.DoD.TextEditor.enrichHTML(this.object.description, {secrets: this.object.isOwner});
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
          label: game.i18n.localize(s.name ?? /** @deprecated since v12 */ s.label),
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
  
    /* ----------------------------------------- */
  
    /** @override */
    activateListeners(html) {
      super.activateListeners(html);
      html.find(".effect-control").click(this._onEffectControl.bind(this));
    }
  
    /* ----------------------------------------- */
  
    /**
     * Provide centralized handling of mouse clicks on control buttons.
     * Delegate responsibility out to action-specific handlers depending on the button action.
     * @param {MouseEvent} event      The originating click event
     * @private
     */
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
  
    /* ----------------------------------------- */
  
    /**
     * Handle adding a new change to the changes array.
     * @private
     */
    async _addEffectChange() {
      const idx = this.document.changes.length;
      return this.submit({preventClose: true, updateData: {
        [`changes.${idx}`]: {key: "", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: ""}
      }});
    }
  
    /* ----------------------------------------- */
  
    /** @inheritdoc */
    _getSubmitData(updateData={}) {
      const fd = new FormDataExtended(this.form, {editors: this.editors});
      let data = foundry.utils.expandObject(fd.object);
      if ( updateData ) foundry.utils.mergeObject(data, updateData);
      data.changes = Array.from(Object.values(data.changes || {}));
      data.statuses ??= [];
      return data;
    }    
}
