import DoDItemBaseSheet from "./item-base-sheet.js";
import DoDItemRef from "../../data/items/item-ref.js";

export default class DoDRecipeSheet extends DoDItemBaseSheet {

    static type = 'recipe';

    static DEFAULT_OPTIONS =  {
        classes: [this.type],
        actions: {
            addMaterial: this.#addMaterial,
            removeMaterial: this.#removeMaterial,
            editRecipeItem: this.#editRecipeItem,
            removeRecipeItem: this.#removeRecipeItem
        },
    };

    static TABS = {
        primary: {
            tabs: [
            { id: 'details', group: 'primary', label: 'DoD.item-sheet.details', cssClass: 'details-tab' },
            { id: 'formula', group: 'primary', label: 'DoD.item-sheet.formula', cssClass: 'formula-tab' },
            { id: 'description', group: 'primary', label: 'DoD.item-sheet.description', cssClass: 'description-tab' },
            { id: 'effects', group: 'primary', label: 'DoD.item-sheet.effects', cssClass: 'effects-tab' },
            ],
            initial: 'details'
        }
    }

    static PARTS = {
        header: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-header.hbs`},
        tabs: { scrollable: [''], template: `systems/dragonbane/templates/parts/item-sheet-tabs.hbs`},
        details: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-recipe.hbs' },
        formula: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-formula.hbs' },
        description: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-description.hbs' },
        effects: { scrollable: [''], template: 'systems/dragonbane/templates/parts/item-sheet-effects.hbs' },
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.materials = this.item.system.materials;
        context.materials?.forEach(material => material.resolve());
        context.recipeItem = this.item.system.item;
        context.recipeItem?.resolve();
        return context;
    }

    async _onDropItem(_event, item) {

        // Drop skill to update magic school
        if (item.type === "skill") {
            this.changeTab("details", "primary");
            await this.item.update({ ["system.school"]: item.name});
            return;
        }

        if (!item.isInventoryItem) return;

        // Determine drop target based on data attribute or item type if dropping outside drop targets
        let dropTarget = event.target.closest("[data-drop-target]")?.dataset?.dropTarget ;
        if (!dropTarget) {
            if (item.type === "material") {
                dropTarget = "material";
            } else if (item.type === "item" && !this.item.system.item?.uuid) {
                dropTarget = "item";
            }
        }

        // Handle drop based on target
        if (dropTarget === "material") {
            const material = new DoDItemRef({ uuid: item.uuid, name: item.name, img: item.img });
            const materials = this.item.system.materials || [];
            materials.push(material);
            this.changeTab("formula", "primary");
            await this.item.update({ ["system.materials"]: materials });
        } else if (dropTarget === "item") {
            this.changeTab("formula", "primary");
            await this.item.update({ ["system.item"]: { uuid: item.uuid, name: item.name, img: item.img }});
        }
    }    

    static async #addMaterial(event, _target) {
        event.stopPropagation();
        event.preventDefault();

        const materials = this.item.system.materials || [];
        materials.push({ name: "" });
        await this.item.update({ ["system.materials"]: materials });
   }

    static async #removeMaterial(event, target) {
        event.stopPropagation();
        event.preventDefault();

        const index = parseInt(target.dataset.materialIndex);
        const materials = this.item.system.materials;
        materials.splice(index, 1);
        await this.item.update({ ["system.materials"]: materials });
    }

    static async #editRecipeItem(event, target) {
        event.stopPropagation();
        event.preventDefault();

        const item = fromUuidSync(target.dataset.itemUuid);
        item?.sheet.render(true);
    }

    static async #removeRecipeItem(event, _target) {
        event.stopPropagation();
        event.preventDefault();
        await this.item.update({ ["system.item"]: null });
    }


    // Listen to updates on the recipe Item
    #updateHook;
    #deleteHook;

    async _onRender(context, options) {
        super._onRender(context, options);

        if (!this.#updateHook) {
            this.#updateHook = async (item, change) => {
                if ("name" in change || "img" in change) {
                    if (item.uuid === this.item.system.item?.uuid) {
                        await this.item.update({ ["system.item"]: { name: item.name, img: item.img } });
                        this.render(false);
                    } else {
                        const materials = this.item.system.materials || [];
                        const materialIndex = materials.findIndex(material => material.uuid === item.uuid);
                        if (materialIndex !== -1) {
                            materials[materialIndex] = { ...materials[materialIndex], name: item.name, img: item.img };
                            await this.item.update({ ["system.materials"]: materials });
                            this.render(false);
                        }
                    }
                }
            };
            Hooks.on("updateItem", this.#updateHook);
        }

        if (!this.#deleteHook) {
            this.#deleteHook = deleted => {
                if (deleted.uuid === this.item.system.item?.uuid
                    || this.item.system.materials?.some(material => material.uuid === deleted.uuid))
                {
                    this.render(false);
                }
            };
        }
        Hooks.on("deleteItem", this.#deleteHook);
    }

    async _tearDown(options) {
        if (this.#updateHook) {
            Hooks.off("updateItem", this.#updateHook);
            this.#updateHook = null;
        }
        if (this.#deleteHook) {
            Hooks.off("deleteItem", this.#deleteHook);
            this.#deleteHook = null;
        }

        return super._tearDown(options);
    }    
}