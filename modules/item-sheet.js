import DoD_Utility from "./utility.js";

// v12: ActorSheet --> v13: foundry.appv1.sheets.ActorSheet
const BaseItemSheet = (typeof foundry?.appv1?.sheets?.ItemSheet !== "undefined") ? foundry.appv1.sheets.ItemSheet : ItemSheet;

export default class DoDItemSheet extends BaseItemSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions,  {
            width: 560,
            dragDrop: [{ dragSelector: null, dropSelector: null}],
            classes: ["DoD", "sheet", "item"],
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "details" }]
        });
    }

    get template() {
        return `systems/dragonbane/templates/${this.item.type}-sheet.html`;
    }

    async getData() {
        const baseData = super.getData();
        const DoD = CONFIG.DoD;

        let sheetData = {
            owner: this.item.isOwner,
            editable: this.isEditable,
            item: baseData.item,
            system: baseData.data.system,
            effects: baseData.item.effects.contents,
            config: CONFIG.DoD
        };

        sheetData.system.description = await CONFIG.DoD.TextEditor.enrichHTML(sheetData.system.description, { async: true, secrets: game.user.isGM });

        if (this.item.type === "weapon") {
            let weaponFeatures = [];

            this.item.system.features.forEach( feature => {
                weaponFeatures.push({
                    name: DoD.weaponFeatureTypes[feature],
                    tooltip: DoD.weaponFeatureTypes[feature] + "Tooltip"
                })
            });
            sheetData.weaponFeatures = weaponFeatures;
        }

        if (this.item.type === "armor") {
            let armorBonuses = [];

            this.item.system.bonuses.forEach( damageType => {
                armorBonuses.push({
                    name: DoD.damageTypes[damageType],
                    tooltip: DoD.damageTypes[damageType] + "Tooltip"
                })
            });
            sheetData.armorBonuses = armorBonuses;
        }

        if (this.item.type === "spell") {
            switch(this.item.system.rangeType) {
                case "touch":
                case "personal":
                    sheetData.enableRange = false;
                    break;
                default:
                    sheetData.enableRange = true;
                    break;
            }
            if(!sheetData.enableRange) {
                sheetData.system.range = "";
            }
        }

        return sheetData;
    }

    activateListeners(html) {
        if (this.object.isOwner) {

            html.find(".effect-control").click(this._onEffectControl.bind(this));

            if (this.object.type === "spell") {
                html.find(".edit-school").change(this._onEditSchool.bind(this));
            }
            if (this.object.type === "weapon") {
                html.find(".edit-weapon-features").click(this._onEditWeaponFeatures.bind(this));
            }
            if (this.object.type === "armor") {
                html.find(".edit-armor-bonuses").click(this._onEditArmorBonuses.bind(this));
            }
            if (this.object.type === "profession") {
                html.find(".edit-profession-abilities").change(this._onEditProfessionAbilities.bind(this));
            }
            if (this.object.type === "kin") {
                html.find(".edit-kin-abilities").change(this._onEditKinAbilities.bind(this));
            }
            if (this.object.type === "item") {
                html.find(".edit-memento").change(this._onEditMemento.bind(this));
            }
        }
        super.activateListeners(html);
    }

    _onEffectControl(event) {
        event.preventDefault();
        const owner = this.item;
        const a = event.currentTarget;
        const tr = a.closest("tr");
        const effect = tr.dataset.effectId ? owner.effects.get(tr.dataset.effectId) : null;
        switch (a.dataset.action) {
            case "create":
                return owner.createEmbeddedDocuments("ActiveEffect", [{
                    label: game.i18n.localize("DoD.effect.new"),
                    name: game.i18n.localize("DoD.effect.new"),
                    icon: "icons/svg/aura.svg",
                    origin: owner.uuid,
                    disabled: false
                }]);
            case "edit":
                return effect.sheet.render(true);
            case "delete":
                return effect.delete();
        }
    }

    async _onEditMemento(event) {
        if (this.item.actor) {
            event.preventDefault();
            let newValue = event.currentTarget.checked;
            if (newValue) {
                const memento = this.item.actor.items.find(i => i.system.memento);
                if (memento) {
                    await memento.update({ ["system.memento"]: false});
                }
            }
            await this.item.update({ ["system.memento"]: newValue});
        };
    }

    async _onEditKinAbilities(event) {
        if (this.item.actor) {
            event.preventDefault();
            let newValue = event.currentTarget.value;
            await this.item.update({ ["system.abilities"]: newValue});
            await this.item.actor.updateKinAbilities();
        };
    }

    async _onEditProfessionAbilities(event) {
        if (this.item.actor) {
            event.preventDefault();
            let newValue = event.currentTarget.value;
            await this.item.update({ ["system.abilities"]: newValue});
            await this.item.actor.updateProfessionAbilities();
        };
    }

    _onEditSchool(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let field = element.dataset.field;
        let item = this.item;

        // replace input with localized string if it matches general school name
        let generalSchool = game.i18n.localize("DoD.spell.general");
        if (generalSchool === element.value) {
            element.value = "DoD.spell.general";
        }

        return item.update({ [field]: element.value});
    }

    async _onEditWeaponFeatures(event) {
        event.preventDefault();
        const DoD = CONFIG.DoD;

        // prepare weapon feature data
        let featureData = [];
        for (let feature in DoD.weaponFeatureTypes)
        {
            const name = DoD.weaponFeatureTypes[feature];
            const localizedName = game.i18n.localize(name);

            featureData.push( {
                name: name,
                localizedName: localizedName,
                tooltip: name + "Tooltip",
                id: feature,
                value: this.item.hasWeaponFeature(feature)
            });
        }
        featureData = featureData.sort((a, b) => { return a.localizedName < b.localizedName ? -1 : 1; });

        let dialogData = {features: featureData};

        const template = "systems/dragonbane/templates/partials/weapon-features-dialog.hbs";
        const html = await DoD_Utility.renderTemplate(template, dialogData);
        const labelOk = game.i18n.localize("DoD.ui.dialog.labelOk");
        //const labelCancel = game.i18n.localize("DoD.ui.dialog.labelCancel");


        return new Promise(
            resolve => {
                const data = {
                    item: this.item,
                    title: game.i18n.localize("DoD.ui.dialog.weaponFeatures"),
                    content: html,
                    buttons: {
                        ok: {
                            label: labelOk,
                            callback: html => resolve(this._processWeaponFeatures(html[0].querySelector("form")))
                        },
                        /*
                        cancel: {
                            label: labelCancel,
                            callback: html => resolve({cancelled: true})
                        }
                        */
                    },
                    default: "ok",
                    close: () => resolve({cancelled: true})
                };
                new Dialog(data, null).render(true);
            }
        );
    }

    _processWeaponFeatures(form) {
        let elements = form.getElementsByClassName("weapon-features");
        let element = elements ? elements[0] : null;
        let inputs = element?.getElementsByTagName("input");
        let features = [];

        for (let input of inputs) {
            if (input.type === "checkbox" && input.checked) {
                features.push(input.id);
            }
        }
        this.item.update({ ["system.features"]: features});
    }

    async _onEditArmorBonuses(event) {
        event.preventDefault();
        const DoD = CONFIG.DoD;

        // prepare weapon feature data
        let damageData = [];
        for (let damageType in DoD.damageTypes)
        {
            if (damageType !== "none") {
                damageData.push( {
                    name: DoD.damageTypes[damageType],
                    tooltip: DoD.damageTypes[damageType] + "Tooltip",
                    id: damageType,
                    value: this.item.hasDamageBonus(damageType)
                });
            }
        }

        let dialogData = {bonuses: damageData};

        const template = "systems/dragonbane/templates/partials/armor-bonuses-dialog.hbs";
        const html = await DoD_Utility.renderTemplate(template, dialogData);
        const labelOk = game.i18n.localize("DoD.ui.dialog.labelOk");
        //const labelCancel = game.i18n.localize("DoD.ui.dialog.labelCancel");


        return new Promise(
            resolve => {
                const data = {
                    item: this.item,
                    title: game.i18n.localize("DoD.armor.bonuses"),
                    content: html,
                    buttons: {
                        ok: {
                            label: labelOk,
                            callback: html => resolve(this._processDamageBonuses(html[0].querySelector("form")))
                        },
                        /*
                        cancel: {
                            label: labelCancel,
                            callback: html => resolve({cancelled: true})
                        }
                        */
                    },
                    default: "ok",
                    close: () => resolve({cancelled: true})
                };
                new Dialog(data, null).render(true);
            }
        );
    }

    _processDamageBonuses(form) {
        let elements = form.getElementsByClassName("armor-bonuses");
        let element = elements ? elements[0] : null;
        let inputs = element?.getElementsByTagName("input");
        let bonuses = [];

        for (let input of inputs) {
            if (input.type === "checkbox" && input.checked) {
                bonuses.push(input.id);
            }
        }
        this.item.update({ ["system.bonuses"]: bonuses});
    }

    async _onDrop(event) {

        if (this.item.type === "profession")
        {
            const data = CONFIG.DoD.TextEditor.getDragEventData(event);
            if (data.type === "Item") {
                const item = await Item.implementation.fromDropData(data);
                if (item.type === "ability") {
                    await this.item.update({ ["system.abilities"]: item.name});
                    await this.item.actor?.updateProfessionAbilities();
                }
            }
        }

        if (this.item.type === "kin")
        {
            const data = CONFIG.DoD.TextEditor.getDragEventData(event);
            if (data.type === "Item") {
                const item = await Item.implementation.fromDropData(data);
                if (item.type === "ability") {
                    await this.item.update({ ["system.abilities"]: item.name});
                    await this.item.actor?.updateKinAbilities();
                }
            }
        }

        super._onDrop(event);
    }
}