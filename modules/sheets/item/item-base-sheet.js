const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const { DragDrop } = foundry.applications.ux;

export default class DoDItemBaseSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

    static type = '';

    #dragDropHandler;

    static DEFAULT_OPTIONS =  {
        classes: ["DoD", "sheet", "item"],
        window: { resizable: true },
        form: { submitOnChange: true, closeOnSubmit: false },
        defaultTab : "details",
        actions: {
            createEffect: this.#createEffect,
            editEffect: this.#editEffect,
            deleteEffect: this.#deleteEffect
        },
    };

    static TABS = {
        primary: {
            tabs: [
            { id: 'details', group: 'primary', label: 'DoD.item-sheet.details', cssClass: 'details-tab' },
            { id: 'description', group: 'primary', label: 'DoD.item-sheet.description', cssClass: 'description-tab' },
            { id: 'effects', group: 'primary', label: 'DoD.item-sheet.effects', cssClass: 'effects-tab' },
            ],
            initial: 'details'
        }
    }    

    constructor(options = {}) {
        super(options);
        this.#dragDropHandler = this.#createDragDropHandlers();
    }

    #createDragDropHandlers() {
        return new DragDrop({
            permissions: {
                drop: this._canDragDrop.bind(this)
            },
            callbacks: {
                drop: this._onDrop.bind(this)
            }
        })
    }

    _onRender(_context, _options) {
        this.#dragDropHandler.bind(this.element);
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        let sheetData = {
            owner: this.item.isOwner,
            editable: this.isEditable,
            item: this.item,
            system: this.item.system,
            effects: this.item.effects.contents,
            config: CONFIG.DoD
        };
        sheetData.itemDescriptionHTML = await CONFIG.DoD.TextEditor.enrichHTML(sheetData.system.itemDescription, { async: true, secrets: this.item.isOwner });
        if (context.user.isGM) {
            sheetData.gmDescriptionHTML = await CONFIG.DoD.TextEditor.enrichHTML(sheetData.system.gmDescription, { async: true, secrets: true });
        }
        return {...context, ...sheetData};        
    }

    static async #createEffect(event, _target) {
        event.preventDefault();

        return this.item.createEmbeddedDocuments("ActiveEffect", [{
            label: game.i18n.localize("DoD.effect.new"),
            name: game.i18n.localize("DoD.effect.new"),
            icon: "icons/svg/aura.svg",
            origin: this.item.uuid,
            disabled: false,
        }]);
    }
    
    static async #editEffect(event, target) {
        event.preventDefault();

        const effectId = target.dataset.effectId;
        const effect = this.item.effects.get(effectId);
        return effect.sheet.render(true);
    }
    
    static async #deleteEffect(event, target) {
        event.preventDefault();

        const effectId = target.dataset.effectId;
        const effect = this.item.effects.get(effectId);
        return effect.delete();
    }

    _canDragDrop(_selector) {
        return this.document.isOwner && this.isEditable;
    }

    async _onDrop(event) {
        const data = CONFIG.DoD.TextEditor.getDragEventData(event);
        if (data.type === "Item") {
            const item = await Item.implementation.fromDropData(data);
            return this._onDropItem(event, item);
        }
    }

    async _onDropItem(_event, _item) {
        // Override in subclass
    }    
}