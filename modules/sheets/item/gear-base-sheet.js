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
        const index = parseInt(target.dataset.index);
        const spells = this.item.system.enchantments.spells;
        const enchantment = spells[index];

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

        const index = parseInt(target.dataset.index);
        const spells = this.item.system.enchantments.spells;
        const enchantment = spells[index];

        if (enchantment && enchantment.free !== target.checked) {
            enchantment.free = target.checked;
            await this.item.update({ ["system.enchantments.spells"]: spells });
        }
    }
    
    static async #toggleCastable(event, target) {
        event.stopPropagation();
        event.preventDefault();

        const index = parseInt(target.dataset.index);
        const spells = this.item.system.enchantments.spells;
        const enchantment = spells[index];

        if (enchantment && enchantment.castable !== target.checked) {
            enchantment.castable = target.checked;
            await this.item.update({ ["system.enchantments.spells"]: spells });
        }
    }

    static async #editEnchantment(event, target) {
        event.stopPropagation();
        event.preventDefault();

        const item = await fromUuid(target.dataset.uuid);
        item?.sheet.render(true);
    }


    static async #deleteEnchantment(event, target) {
        event.stopPropagation();
        event.preventDefault();

        const uuid = target.dataset.uuid;
        const index = parseInt(target.dataset.index);

        const name = await fromUuid(uuid)?.name ?? game.i18n.localize("DoD.enchantments.enchantment");
        const content = game.i18n.format("DoD.ui.dialog.deleteItemContent", { item: name });
        const title = game.i18n.format("DoD.ui.dialog.deleteItemTitle", { item: game.i18n.localize("DoD.enchantments.enchantment") });

        const ok = await foundry.applications.api.DialogV2.confirm({
            window: { title: title },
            content: content,
        });

        if (ok) {
            this.item.system.enchantments.spells.splice(index, 1);
            await this.item.update({ ["system.enchantments.spells"]: this.item.system.enchantments.spells });
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
                partContext.enchantments = await Promise.all(
                    this.item.system.enchantments.spells.map(async enchantment => {
                        const spell = await fromUuid(enchantment.uuid);
                        return {
                            uuid: enchantment.uuid,
                            name: spell.name,
                            img: spell.img,
                            powerLevel: spell.system.rank > 0 ? enchantment.powerLevel : null,
                            castable: enchantment.castable,
                            free: enchantment.free,
                        };
                    })
                );
                break;
        }
        return partContext;
    }    
}