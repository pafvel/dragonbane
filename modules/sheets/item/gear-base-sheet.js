import DoDItemBaseSheet from "./item-base-sheet.js";

export default class DoDGearBaseSheet extends DoDItemBaseSheet {

    static type = '';

    static DEFAULT_OPTIONS =  {
        classes: [this.type],
        actions: {
            editEnchantment: this.#editEnchantment,
            toggleEnchantmentFree: this.#toggleFree,
            toggleEnchantmentCastable: this.#toggleCastable,
            deleteEnchantment: this.#deleteEnchantment,
        },
    };

    static TABS = {
        primary: {
            tabs: [
            { id: 'details', group: 'primary', label: 'DoD.item-sheet.details', cssClass: 'details-tab' },
            { id: 'description', group: 'primary', label: 'DoD.item-sheet.description', cssClass: 'description-tab' },
            { id: 'effects', group: 'primary', label: 'DoD.item-sheet.effects', cssClass: 'effects-tab' },
            { id: 'enchantments', group: 'primary', label: 'DoD.item-sheet.enchantments', cssClass: 'enchantments-tab' },
            ],
            initial: 'details'
        }
    }

    async _onRender(context, options) {
        await super._onRender(context, options);

        const html = $(this.element);

        if (this.isEditable) {
            html.find("[data-action='editEnchantmentPowerLevel']").change(this.onEditPowerLevel.bind(this));
        }
    }
      
    async onEditPowerLevel(event) {
        const target = event.currentTarget;
        const uuid = event.target.dataset.uuid;
        const spells = this.item.system.enchantments.spells;
        const enchantment = spells.find(e => e.uuid === uuid);

        if (enchantment) {
            const value = parseInt(target.value);
            if (!isNaN(value) && value >= 1 && enchantment.powerLevel !== value) {
                enchantment.powerLevel = value;
                await this.item.update({ ["system.enchantments.spells"]: spells });
            }
        }
    }

    static async #toggleFree(event, target) {
        event.stopPropagation();
        event.preventDefault();
        const uuid = target.dataset.uuid;
        const spells = this.item.system.enchantments.spells;
        const enchantment = spells.find(e => e.uuid === uuid);

        if (enchantment && enchantment.free !== target.checked) {
            enchantment.free = target.checked;
            await this.item.update({ ["system.enchantments.spells"]: spells });
        }
    }
    
    static async #toggleCastable(event, target) {
        event.stopPropagation();
        event.preventDefault();
        const uuid = target.dataset.uuid;
        const spells = this.item.system.enchantments.spells;
        const enchantment = spells.find(e => e.uuid === uuid);

        if (enchantment && enchantment.castable !== target.checked) {
            enchantment.castable = target.checked;
            await this.item.update({ ["system.enchantments.spells"]: spells });
        }
    }

    static async #editEnchantment(event, target) {
        event.stopPropagation();
        event.preventDefault();
        const item = fromUuidSync(target.dataset.uuid);
        item?.sheet.render(true);
    }


    static async #deleteEnchantment(event, target) {
        event.stopPropagation();
        event.preventDefault();
        const uuid = target.dataset.uuid;
        const spells = this.item.system.enchantments.spells.filter(e => e.uuid !== uuid);

        if (spells.length !== this.item.system.enchantments.spells.length) {

            const name = fromUuidSync(uuid)?.name ?? game.i18n.localize("DoD.enchantments.enchantment");
            const content = game.i18n.format("DoD.ui.dialog.deleteItemContent", { item: name });
            const title = game.i18n.format("DoD.ui.dialog.deleteItemTitle", { item: game.i18n.localize("DoD.enchantments.enchantment") });

            const ok = await foundry.applications.api.DialogV2.confirm({
                window: { title: title },
                content: content,
            });

            if (ok) {
                await this.item.update({ ["system.enchantments.spells"]: spells });
            }
        }
    }

    async _onDropItem(_event, item) {
        if (this.tabGroups.primary === "enchantments" && item.type === "spell") {
            const enchantments = this.item.system.enchantments;
            enchantments.spells.push({
                uuid: item.uuid,
                spellLevel: 1,
                castable: true,
                free: false,
            });
            await this.item.update({ ["system.enchantments"]: enchantments });
        }
    }

    async _preparePartContext(partId, context) {
        const partContext = await super._preparePartContext(partId, context);

        switch (partId) {
            case "enchantments":
                partContext.enchantments = this.item.system.enchantments.spells.map(enchantment => {
                    const spell = fromUuidSync(enchantment.uuid);
                    return {
                        uuid: enchantment.uuid,
                        name: spell.name,
                        img: spell.img,
                        powerLevel: enchantment.powerLevel,
                        castable: enchantment.castable,
                        free: enchantment.free,
                    };
                });
                break;
        }
        return partContext;
    }    
}