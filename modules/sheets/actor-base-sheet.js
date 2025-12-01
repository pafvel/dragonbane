import DoD_Utility from "../utility.js";
import * as DoDChat from "../chat.js";
import DoDSkillTest from "../tests/skill-test.js";
import DoDSpellTest from "../tests/spell-test.js";
import DoDWeaponTest from "../tests/weapon-test.js";
import DoDOptionalRuleSettings from "../apps/optional-rule-settings.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class DoDActorBaseSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
    
    #keydownListener = null; // Keydown listener to handle delete/backspace key
    #focusElement = null; // Element that has focus and can be deleted with delete/backspace key

    constructor(options={}, ...args) {
        super(options, ...args);
        this.#focusElement = null;
    }

    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        this.#keydownListener = this.#onKeydown.bind(this);
        document.addEventListener("keydown", this.#keydownListener);
    }

    async _preClose(options) {
        if (this.#keydownListener) document.removeEventListener("keydown", this.#keydownListener);
        this.#keydownListener = null;
        await super._preClose(options);
    }

    #onKeydown(event) {
        if ((event.code === "Delete" || event.code === "Backspace") && this.#focusElement) {
            // Don't delete items if an input element has focus
            if (event.currentTarget?.activeElement.nodeName.toLowerCase() === "input") {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            const itemId = this.#focusElement.dataset.itemId;
            const item = this.actor.items.get(itemId);

            this.#focusElement = null;

            if (item.type === "skill") {
                return item.update({ ["system.value"]: 0});
            } else {
                return this._onDeleteItem(item, itemId);
            }
        }
    }    

    async _onDeleteItem(item, itemId) {
        let flavor = "";
        if (item.isKinAbility) {
            flavor = game.i18n.localize("DoD.ui.dialog.deleteKinAbility");
        } else if (item.isProfessionAbility) {
            flavor = game.i18n.localize("DoD.ui.dialog.deleteProfessionAbility");
        }

        const ok = await this._itemDeleteDialog(item, flavor);
        if (!ok) {
            return;
        }
        
        if (item.isKinAbility) {
            await item.actor.kin?.removeAbility(item.name);
        } else if (item.isProfessionAbility) {
            await item.actor.profession?.removeAbility(item.name);
        }

        return this.actor.deleteEmbeddedDocuments("Item", [itemId]);
    }

    async _itemDeleteDialog(item, flavor = "") {
        const content = (flavor ? "<p>" + flavor + "</p>" : "") + game.i18n.format("DoD.ui.dialog.deleteItemContent", {item: item.name});
        const itemType = item.documentName === "ActiveEffect" ? game.i18n.localize("DoD.ui.character-sheet.effect") : game.i18n.localize("TYPES.Item." + item.type);
        const title = game.i18n.format("DoD.ui.dialog.deleteItemTitle", {item: itemType});

        return await foundry.applications.api.DialogV2.confirm({
            window: { title: title },
            content: content,
        });
    }

    _formatActiveEffectProperties() {
        // Format property if affected by active effects
        const elements = this.element.querySelectorAll(".active-effect-property");
        for (const e of elements) {
            const propertyName = e.dataset.property;
            if (!propertyName) {
                continue;
            }
            let value = foundry.utils.getProperty(this.actor, propertyName + ".value");
            let max =  foundry.utils.getProperty(this.actor, propertyName + ".max");
            let base =  foundry.utils.getProperty(this.actor, propertyName + ".base");

            // Style if affected by active effect
            // If the property has a max value, then use it to compare with base ("value" is the current value)
            if (max) {
                value = max;
            }

            if (value === base) continue;

            // Set title
            let title = $(e).attr("title");
            if (title == undefined) {
                title = "";
            } else {
                title += "\r";
            }
            title += game.i18n.format("DoD.ui.character-sheet.baseValue", {value: base});
            $(e).attr("title", title);
            
            // Prepare strings
            if (typeof value === "string" || value instanceof String) {
                value = value.toLowerCase();
            }
            if (typeof base === "string" || base instanceof String) {
                base = base.toLowerCase();
            }

            // Hande damage bonus special case
            if (propertyName.startsWith("system.damageBonus")) {
                const entries = Object.entries(CONFIG.DoD.dice);
                value = entries.findIndex(e => e[0] == value);
                base = entries.findIndex(e => e[0] == base);
            }

            // Apply styling
            if(value > base) {
                $(e).addClass("value-increased");
            } else if (value < base) {
                $(e).addClass("value-decreased");
            }
        }
    }    

    async _onRender(context, options) {
        await super._onRender(context, options);

        this._formatActiveEffectProperties();

        const html = $(this.element);

        // Open item for editing/viewing
        html.find(".item-edit").on("click contextmenu", this._onItemEdit.bind(this));

        if (this.actor.isOwner) {
            // Elements need focus for the keydown event to to work
            html.find(".item-delete-key").mouseenter(event => { this.#focusElement = event.currentTarget; });
            html.find(".item-delete-key").mouseleave(_event => { this.#focusElement = null; });

            // Create & Delete item buttons
            html.find(".item-create").click(this._onItemCreate.bind(this));
            html.find(".item-delete").click(this._onItemDelete.bind(this));


            // Attributes with .base and .value must be handled separately
            html.find(".attribute-input").change(this._onEditAttribute.bind(this));
            html.find(".attribute-input").focus(this._onFocusAttribute.bind(this));
            html.find(".attribute-input").blur(this._onBlurAttribute.bind(this));

            // Hit points
            html.find(".hit-points-max-label").focus(this._onFocusResource.bind(this));
            html.find(".hit-points-max-label").blur(this._onBlurResource.bind(this));
            html.find(".hit-points-max-label").change(this._onEditResource.bind(this));
            html.find(".hit-points-current-label").change(this._onEditCurrentHp.bind(this));
            html.find(".hit-points-box").on("click contextmenu", this._onHitPointClick.bind(this));

            // Will points
            html.find(".will-points-max-label").focus(this._onFocusResource.bind(this));
            html.find(".will-points-max-label").blur(this._onBlurResource.bind(this));
            html.find(".will-points-max-label").change(this._onEditResource.bind(this));
            html.find(".will-points-current-label").change(this._onEditCurrentWp.bind(this));
            html.find(".will-points-box").on("click contextmenu", this._onWillPointClick.bind(this));

            // Inline editing
            html.find(".inline-edit").change(this._onInlineEdit.bind(this));

            // Skills, abilities & weapon damage
            html.find(".rollable-skill").on("click contextmenu", this._onSkillRoll.bind(this));
            html.find(".use-ability").on("click contextmenu", this._onUseAbility.bind(this));
            html.find(".rollable-damage").on("click contextmenu", this._onDamageRoll.bind(this));

            // Effects & injuries
            html.find(".effect-edit").on("click contextmenu", this._onEffectEdit.bind(this));
            html.find(".effect-delete").click(this._onEffectDelete.bind(this));
            html.find(".rollable-healingTime").on("click contextmenu", this._onHealingTimeRoll.bind(this));
        }
        else if (this.actor.isObserver) {
            // Enable right-clicking skills and abilities
            html.find(".rollable-skill").on("contextmenu", this._onSkillRoll.bind(this));
            html.find(".use-ability").on("contextmenu", this._onUseAbility.bind(this));
        }

     }

    async enrich(html) {
        if (html) {
            return await CONFIG.DoD.TextEditor.enrichHTML(html, {
                secrets: this.actor.isOwner,
                relativeTo: this.document,
                async: true
            });
        } else {
            return html;
        }
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.owner = this.actor.isOwner;
        context.observer = this.actor.isObserver;
        context.actor = this.actor;
        context.system = this.actor.system;
        context.config = CONFIG.DoD;

        // Enriched text fields
        context.descriptionHTML = await this.enrich(context.system.description);

        // HP widget data
        context.maxHP = this.actor.system.hitPoints.max;
        context.currentHP = this.actor.system.hitPoints.value;
        context.lostHP = context.maxHP - context.currentHP;
        context.fillHP = context.maxHP < 11 ? 11 - context.maxHP : 0; // needed for layout
        context.largeHP = context.maxHP > 40; // switch to large hp widget

        // WP widget data
        if (this.actor.system.willPoints !== undefined) {
            context.hasWillpower = this.actor.system.willPoints.max > 0 || context.abilities?.length > 0 || context.spells?.length > 0 || !game.settings.get("dragonbane", "hideNpcWpWidget");
            if (context.hasWillpower) {
                context.maxWP = this.actor.system.willPoints.max;
                context.currentWP = this.actor.system.willPoints.value;
                context.lostWP = context.maxWP - context.currentWP;
                context.fillWP = context.maxWP < 11 ? 11 - context.maxWP : 0; // needed for layout
                context.largeWP = context.maxWP > 40; // switch to large wp widget
            }
        }

        this._prepareItems(context);
        this._prepareEncumbrance(context);
        this._prepareEffects(context);

        return context;        
    }

    // Increase quantity when dropped item already exists in inventory
    _findItemStack(item) {
        const hasQuantity = item?.system?.quantity !== undefined;
        const isItem = item?.type === "item";
        const isEquippable = ["weapon", "armor", "helmet"].includes(item?.type);
        const isWorn = !!item?.system?.worn;
        let stack = null;
        if (hasQuantity && (isItem || (isEquippable && !isWorn))) {
            stack = this.actor.items.find(i => {
                // Stack exists if it is the same type, has the same name
                // and has the same system data properties (except quantity)
                if (i.type === item.type && i.name === item.name && i.id != item.id) {
                    let itemTemplate = item.system.toObject();
                    item.system.constructor.cleanData(itemTemplate);
                    delete itemTemplate.quantity;
                    return foundry.utils.objectsEqual(foundry.utils.filterObject(i.system.toObject(), itemTemplate), itemTemplate);
                }
                return false;
            });
        }
        return stack;
    };

    #dragSource = null;
    async _onDragStart(event) {
        super._onDragStart(event);
        this.#dragSource = event.currentTarget;
    }

    async _onDropItem(event, item)
    {
        if ( !this.actor.isOwner ) return false;

        // Handle item sorting within the same Actor
        if ( this.actor.uuid === item.parent?.uuid ) {
            let dropTarget = event.target.closest(".item-list")?.dataset.droptarget;
            let dragSource = this.#dragSource.closest(".item-list")?.dataset.droptarget;

            if (dropTarget) {
                if (dropTarget === "weapon" && item.type === "weapon")
                {
                    const worn = item.system.worn || this.actor.canEquipWeapon() || item.hasWeaponFeature("unarmed");
                    if(!worn) {
                        DoD_Utility.WARNING("DoD.WARNING.maxWeaponsEquipped");
                        return;
                    }
                }
                if (dropTarget === "weapon" && item.type === "weapon"
                    || dropTarget === "armor" && item.type === "armor"
                    || dropTarget === "helmet" && item.type === "helmet" )
                {
                    // Un-requip previous armor/helmet in the same slot
                    if (dropTarget === "armor") {
                        await this.actor.system.equippedArmor?.update({ ["system.worn"]: false});
                    }
                    else if (dropTarget === "helmet") {
                        await this.actor.system.equippedHelmet?.update({ ["system.worn"]: false});
                    }

                    if (item.system.quantity > 1) {
                        // If it's a stack, just equip one item
                        const itemData = item.toObject();
                        itemData.system.quantity = 1;
                        itemData.system.worn = true;
                        await this.actor.createEmbeddedDocuments("Item", [itemData]);
                        return await item.update({["system.quantity"]: item.system.quantity - 1 });
                    } else {
                        await item.update({
                            ["system.worn"]: true,
                        });
                    }
                }
                else if (dropTarget === "memento") {
                    const memento = this.actor.items.contents.find(i => i.system.memento);
                    await memento?.update({ ["system.memento"]: false });
                    await item.update({ ["system.memento"]: true});
                }
                else if (dropTarget === "inventory" || dropTarget === "tiny") {
                    // Update item first so that stack can be found
                    if (dragSource === "memento") {
                        // Drag from memento -> Clear memento flag
                        await item.update({
                            ["system.worn"]: false,
                            ["system.memento"]: false});
                    } else {
                        await item.update({["system.worn"]: false});
                    }
                    const stack = this._findItemStack(item);
                    if (stack) {
                        // Item already exists in inventory, increase quantity and delete the original item
                        const itemQuantity = item.system.quantity + stack.system.quantity;
                        await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
                        return await stack.update({["system.quantity"]: itemQuantity});
                    }
                }
            }
            return this._onSortItem(event, item);
        }       
   
        // Remove kin and kin abilities
        if (item.type === "kin") {
            await this.actor.removeKin();
        }

        // Remove profession and profession abilities
        if (item.type === "profession") {
            await this.actor.removeProfession();
        }

        const stack = this._findItemStack(item);
        if (stack) {
            // Item already exists in inventory, increase quantity
            const itemQuantity = item.system.quantity + stack.system.quantity;
            return await stack.update({["system.quantity"]: itemQuantity});
        }

        // Create the owned item
        const createdItem = await super._onDropItem(event, item);

        // If there are available slots, equip weapons, armor and helmet
        if (createdItem.system.quantity === 1 && ["weapon", "armor", "helmet"].includes(createdItem.type)) {
            const worn = createdItem.type === "weapon" && (this.actor.canEquipWeapon() || item.hasWeaponFeature("unarmed"))
                        || createdItem.type === "armor" && !this.actor.system.equippedArmor
                        || createdItem.type === "helmet" && !this.actor.system.equippedHelmet;
            if (worn != createdItem.system.worn) {
                await createdItem.update({ ["system.worn"]: worn});
            }
        }

        // Update kin and kin abilities
        if (item.type === "kin") {
            await this.actor.updateKinAbilities();
        }

        // Update profession and profession abilities
        if (item.type === "profession") {
            let missingSkills = await this.actor.updateProfession();
            for (const skillName of missingSkills) {
                const skill = await DoD_Utility.findSkill(skillName);
                if (skill && (skill.system.skillType === "secondary" || skill.system.skillType === "magic")) {
                    await this.actor.createEmbeddedDocuments("Item", [skill.toObject()]);
                    DoD_Utility.INFO("DoD.INFO.professionSkillAdded", {skill: skillName});
                } else {
                    DoD_Utility.WARNING("DoD.WARNING.professionSkill", {skill: skillName});
                }
            }
        }
        return createdItem;
    }

    _onItemEdit(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);

        item?.sheet.render(true);
    }

    async _onItemCreate(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const type = element.dataset.type;

        // Create effect
        if (type === "effect") {
            return this.actor.createEmbeddedDocuments("ActiveEffect", [{
                label: game.i18n.localize("DoD.effect.new"),
                name: game.i18n.localize("DoD.effect.new"),
                icon: "icons/svg/aura.svg",
                origin: this.actor.uuid,
                disabled: false
            }]);
        }

        // Create item
        let itemData = {
            name: game.i18n.localize(`DoD.${type}.new`),
            type: element.dataset.type
        };

        // If there are available slots, equip weapons, armor and helmet
        if (type === "weapon" || type === "armor" || type === "helmet") {
            itemData.system = {};
            itemData.system.worn =
                itemData.type === "weapon" && this.actor.canEquipWeapon()
                || itemData.type === "armor" && !this.actor.system.equippedArmor
                || itemData.type === "helmet" && !this.actor.system.equippedHelmet;
        }

        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    async _onItemDelete(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);
        return await this._onDeleteItem(item, itemId);
    }

    _onFocusAttribute(event) {
        // Edit base
        const element = event.currentTarget;
        const propertyBase = element.dataset.property + ".base";
        const valueBase = foundry.utils.getProperty(this.actor, propertyBase);
        element.value = valueBase;
    }

    _onBlurAttribute(event) {
        // Show value
        const element = event.currentTarget;
        const propertyValue = element.dataset.property + ".value";
        element.value = foundry.utils.getProperty(this.actor, propertyValue); 
    }

    async _onEditAttribute(event) {

        const element = event.currentTarget;
        const newValue = element.dataset.dtype == "Number" ? Number(element.value) : element.value;

        event.preventDefault();
        event.currentTarget.blur();

        // get the property
        const propertyBase = element.dataset.property + ".base";
        const fieldName = propertyBase.substring(String("system.").length);

        // validate the value
        const field = this.actor.system.schema.getField(fieldName);
        const failure = field.validate(newValue);

        if (failure) {
            DoD_Utility.WARNING(failure.message);
            return;
        }

        // set new value
        await this.actor.update({[propertyBase]: newValue});
    }

    _onFocusResource(event) {
        // Edit base
        const property = event.currentTarget.dataset.property;
        const propertyBase = property + ".base";
        const valueBase = foundry.utils.getProperty(this.actor, propertyBase);
        event.currentTarget.value = valueBase;
    }
    
    _onBlurResource(event) {
        // Show value
        const property = event.currentTarget.dataset.property;
        const propertyMax = property + ".max";
        event.currentTarget.value = foundry.utils.getProperty(this.actor, propertyMax); 
    }

    _onEditResource(event) {

        const inputValue = event.currentTarget.value;

        if (isNaN(inputValue)) {
            return;
        }
        
        event.preventDefault();
        event.currentTarget.blur();

        const property = event.currentTarget.dataset.property;
        const propertyBase = property + ".base";
        const propertyValue = property + ".value";

        const currentBase = foundry.utils.getProperty(this.actor, propertyBase);
        const currentValue = foundry.utils.getProperty(this.actor, propertyValue);
        const currentDelta = Math.max(0, currentBase - currentValue);

        const newBase = Math.max(0, Math.floor(inputValue));
        const newValue = Math.max(0, newBase - currentDelta);

        return this.actor.update({
            [propertyBase]: newBase,
            [propertyValue]: newValue
        });
    }

    _onEditCurrentHp(event) {
        event.preventDefault();
        event.currentTarget.blur();

        const newValue = DoD_Utility.clamp(event.currentTarget.value, 0, this.actor.system.hitPoints.max);

        event.currentTarget.value = newValue;
        return this.actor.update({
            ["system.hitPoints.value"]: newValue
        });
    }

    _onEditWp(event) {
        event.preventDefault();
        event.currentTarget.blur();

        const newMax = Math.max(0, Math.floor(event.currentTarget.value));
        const currentDamage = Math.max(0, this.actor.system.willPoints.max - this.actor.system.willPoints.value);
        const newValue = Math.max(0, newMax - currentDamage);

        return this.actor.update({
            ["system.willPoints.max"]: newMax,
            ["system.willPoints.value"]: newValue
        });
    }
    _onEditCurrentWp(event) {
        event.preventDefault();
        event.currentTarget.blur();

        const newValue = DoD_Utility.clamp(event.currentTarget.value, 0, this.actor.system.willPoints.max);

        return this.actor.update({
            ["system.willPoints.value"]: newValue
        });
    }

    _onHitPointClick(event) {
        event.preventDefault();

        let hp = this.actor.system.hitPoints;
        if (event.type === "click") { // left click
            if (hp.value > 0) {
                return this.actor.update({ ["system.hitPoints.value"]: hp.value-1});
            }
        } else { // right click
            if (hp.value < hp.max) {
                return this.actor.update({ ["system.hitPoints.value"]: hp.value+1});
            }
        }
    }

    _onWillPointClick(event) {
        event.preventDefault();

        let wp = this.actor.system.willPoints;
        if (event.type === "click") { // left click
            if (wp.value > 0) {
                return this.actor.update({ ["system.willPoints.value"]: wp.value-1});
            }
        } else { // right click
            if (wp.value < wp.max) {
                return this.actor.update({ ["system.willPoints.value"]: wp.value+1});
            }
        }
    }

    async _onInlineEdit(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);
        let field = element.dataset.field;

        event.currentTarget.blur();

        if (element.type === "checkbox") {

            // Handle wearing/un-wearing armor, helmet and weapons
            if (field === "system.worn" && ["weapon", "armor", "helmet"].includes(item.type)) {
                if (element.checked) {
                    if (item.type === "weapon" && !item.hasWeaponFeature("unarmed")) {
                        if (!this.actor.canEquipWeapon()) {
                            element.checked = false;
                            DoD_Utility.WARNING("DoD.WARNING.maxWeaponsEquipped");
                            return;
                        }
                    } else if (item.type==="armor" && this.actor.system.equippedArmor) {
                        await this.actor.system.equippedArmor.update({
                            ["system.worn"]: true,
                        });
                    } else if (item.type==="helmet" && this.actor.system.equippedHelmet) {
                        await this.actor.system.equippedHelmet.update({
                            ["system.worn"]: true,
                        });
                    }
                    // If item is a weapon, armor or helmet and quantity > 1, split stack
                    if (item.system.quantity > 1) {
                        const itemData = item.toObject();
                        itemData.system.quantity = 1;
                        itemData.system.worn = true;
                        element.checked = false;
                        await this.actor.createEmbeddedDocuments("Item", [itemData]);
                        await item.update({ ["system.quantity"]: item.system.quantity - 1});
                    }
                } else {
                    // Handle un-wearing armor, helmet and weapons
                    // Update item first so that stack can be found
                    await item.update({
                        ["system.worn"]: false,
                    });
                    const stack = this._findItemStack(item);
                    if (stack) {
                        // Item already exists in inventory, increase quantity and delete the original item
                        const itemQuantity = item.system.quantity + stack.system.quantity;
                        await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
                        return await stack.update({["system.quantity"]: itemQuantity});
                    }
                }
            }

            // Handle equipping & unequipping weapons
            if (field === "system.mainHand" || field === "system.offHand") {
                const twoHanded = item.system.grip.value === "grip2h";
                if (element.checked) {
                    // Un-equip weapons in same hand or both hands if equipping 2-handed weapon
                    for (let actorItem of this.actor.items) {
                        if (actorItem.type === "weapon") {
                            if (actorItem.uuid !== item.uuid) {
                                // Equipping a different weapon
                                // Un-eqiup weapon in same hand or if any of the weapons is two-handed
                                if (twoHanded || actorItem.system.grip.value === "grip2h") {
                                    actorItem.update({["system.mainHand"]: false, ["system.offHand"]: false});
                                } else {
                                    actorItem.update({[field]: false});
                                }
                            }
                        }
                    }
                }
                // Equip/Unequip 2-handed weapon
                if (twoHanded) {
                    return item.update({["system.mainHand"]: element.checked, "system.offHand": element.checked});
                }
            }

            // Handle enable/disable effect
            if (field === "effect.disabled") {
                const effectUuid = element.closest(".sheet-table-data").dataset.effectUuid;
                const effects = Array.from(this.actor.allApplicableEffects());
                let effect = effects.find((e) => e.uuid === effectUuid);
                return await effect.update({ ["disabled"]: element.checked });
            }
            return await item.update({ [field]: element.checked });
        }

        let result = await item.update({ [field]: Number(element.value) });

        // Skill values may reset to their base chance.
        let value = foundry.utils.getProperty(item, field);
        element.value = value;
        return result;
    }

    async _onSkillRoll(event) {
        event.preventDefault();

        let itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
        let item = this.actor.items.get(itemId);

        if (event.type === "click") { // left click - skill roll
            let test = null;
            let options = {};
            if (event.shiftKey || event.ctrlKey) {
                options = {
                    noBanesBoons: event.shiftKey,
                    defaultBanesBoons: event.ctrlKey
                };
            }
            if (game.user.targets.size > 0) {
                options.targets = Array.from(game.user.targets);
            }
            if (item.type === "skill") {
                test = new DoDSkillTest(this.actor, item, options);
            } else if (item.type === "spell") {
                if (item.system.rank > 0) {
                    if (this.actor.type === "monster") {
                        options.autoSuccess = true;
                    }
                    test = new DoDSpellTest(this.actor, item, options);
                } else {

                    const use = await foundry.applications.api.DialogV2.confirm({
                        window: { title: game.i18n.localize("DoD.ui.dialog.castMagicTrickTitle") },
                        content: game.i18n.format("DoD.ui.dialog.castMagicTrickContent", {spell: item.name}),
                    });

                    if (use) {
                        if (this.actor.type !== "monster" && this.actor.system.willPoints.value < 1) {
                            DoD_Utility.WARNING("DoD.WARNING.notEnoughWPForSpell");
                            return;
                        } else {
                            let content = "<p>" + game.i18n.format("DoD.ui.chat.castMagicTrick", {
                                actor: this.actor.name,
                                spell: item.name,
                                uuid: item.uuid
                            }) + "</p>";
                            if (this.actor.type !== "monster") {
                                const oldWP = this.actor.system.willPoints.value;
                                const newWP = oldWP - 1;
                                await this.actor.update({"system.willPoints.value": newWP});
                                content +=
                                `<div class="damage-details permission-observer" data-actor-id="${this.actor.uuid}">
                                    <i class="fa-solid fa-circle-info"></i>
                                    <div class="expandable" style="text-align: left; margin-left: 0.5em">
                                        <b>${game.i18n.localize("DoD.ui.character-sheet.wp")}:</b> ${oldWP} <i class="fa-solid fa-arrow-right"></i> ${newWP}<br>
                                    </div>
                                </div>`;
                            }

                            ChatMessage.create({
                                user: game.user.id,
                                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                                content: content,
                            });
                            }
                    }
                }
            } else if (item.type === "weapon") {
                test = new DoDWeaponTest(this.actor, item, options);
            }
            if (test) {
                await test.roll();
            }
        } else { // right click - edit item
            item.sheet.render(true);
        }
    }

    async _onUseAbility(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
        const item = this.actor.items.get(itemId);

        if (event.type === "click") { // left click - use item
            if (item.type === "ability") {
                this.actor.useAbility(item);
            }
        } else { // right click - edit item
            item.sheet.render(true);
        }
    }

    async _onDamageRoll(event) {
        event.preventDefault();
        const DoD = CONFIG.DoD;

        const itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
        const weapon = this.actor.items.get(itemId);

        if (event.type === "click") { // left click - roll damage

            const weaponDamage = weapon.system.damage;
            const skill = this.actor.findSkill(weapon.system.skill.name);
            const attribute = skill?.system.attribute;
            const damageBonus = this.actor.getDamageBonus(attribute);
            const damage = damageBonus ? weaponDamage + "+" + damageBonus : weaponDamage;
            let damageType = DoD.damageTypes.none;

            if (DoDOptionalRuleSettings.damageTypes) {
                if (weapon.hasWeaponFeature("bludgeoning")) {
                    damageType = DoD.damageTypes.bludgeoning;
                } else if (weapon.hasWeaponFeature("slashing")) {
                    damageType = DoD.damageTypes.slashing;
                } else if (weapon.hasWeaponFeature("piercing")) {
                    damageType = DoD.damageTypes.piercing;
                }
            }
            
            const damageData = {
                actor: this.actor,
                weapon: weapon,
                damage: damage,
                damageType: damageType
            };

            const targets = Array.from(game.user.targets)
            if (targets.length > 0) {
                for (const target of targets) {
                    damageData.target = target.actor;
                    await DoDChat.inflictDamageMessage(damageData);
                }
            } else {
                await DoDChat.inflictDamageMessage(damageData);
            }
        } else { // right click - edit item
            weapon.sheet.render(true);
        }
    }

    async _onEffectEdit(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const effectUuid = element.closest(".sheet-table-data").dataset.effectUuid;
        const effect = Array.from(this.actor.allApplicableEffects()).find(e => e.uuid === effectUuid);
        
        effect?.sheet.render(true);
    }

    async _onEffectDelete(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let effectUuid = element.closest(".sheet-table-data").dataset.effectUuid;
        let effect = fromUuidSync(effectUuid);

        const ok = await this._itemDeleteDialog(effect);
        if (!ok) {
            return;
        }
        return effect.delete();
    }

    async _onHealingTimeRoll(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
        const injury = this.actor.items.get(itemId);
        const healingTime = injury.system.healingTime;

        if (event.type === "click") { // left click    
            if (isNaN(healingTime)) {
                // Roll healing time
                try {
                    const roll = await new Roll(healingTime).roll({});
                    const flavor = game.i18n.format("DoD.injury.healingTimeRollFlavor", {injury: injury.name, days: roll.total});
                    await roll.toMessage({
                        user: game.user.id,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        flavor,
                    });
                    await injury.update({"system.healingTime": roll.total});
                } catch {
                    console.log("invalid formula");    
                }
            } else {
                // reduce healing time
                return await injury.reduceHealingTime({silent: true});
            }
        } else { // right click
            if (!isNaN(healingTime)) {
                // increase healing time
                return await injury.increaseHealingTime({silent: true});
            }
        }
    }

    _prepareAbility(ability, context) {
        if (ability.system.abilityType === 'kin') {
            context.kinAbilities.push(ability);
        } else if (ability.system.abilityType === 'profession') {
            context.professionAbilities.push(ability);
        } else {
            context.heroicAbilities.push(ability);
        }
    }

    _prepareSpell(spell, context) {
        if (spell.system.rank > 0) {
            context.spells.push(spell);
        } else {
            context.tricks.push(spell);
        }
        
        if (!context.schools[spell.system.school]) {
            context.schools[spell.system.school] = [];
        }
        context.schools[spell.system.school].push(spell);
    }

    _prepareWeapon(weapon, context) {
        if (weapon.system.worn) {
            context.equippedWeapons.push(weapon);
        } else {
            context.inventory.push(weapon);
        }
    }

    _prepareArmor(armor, context) {
        if (!armor.system.worn) {
            context.inventory.push(armor);
        }
    }

    _prepareHelmet(helmet, context) {
        if (!helmet.system.worn) {
            context.inventory.push(helmet);
        }
    }

    _prepareItem(item, context) {
        context.inventory.push(item);
    }

    _prepareInjury(injury, context) {
        let tooltip = DoD_Utility.removeEnrichment(injury.system.description);
        injury.system.tooltip = DoD_Utility.removeHtml(tooltip);
        if (isNaN(injury.system.healingTime)) {
            injury.system.healingTimeTooltip = game.i18n.localize("DoD.injury.rollHealingTime");
        } else {
            injury.system.healingTimeTooltip = game.i18n.localize("DoD.injury.clickHealingTime");
        }
        context.injuries.push(injury);
    }

    _prepareItemContext(item, context) {
        switch (item.type) {
            case 'ability':
                this._prepareAbility(item, context);
                break;
            case 'armor':
                this._prepareArmor(item, context);
                break;
            case 'helmet':
                this._prepareHelmet(item, context);
                break;
            case 'injury':
                this._prepareInjury(item, context);
                break;
            case 'item':
                this._prepareItem(item, context);
                break;
            case 'spell':
                this._prepareSpell(item, context);
                break;
            case 'weapon':
                this._prepareWeapon(item, context);
                break;
            case 'kin':
            case 'profession':
            case 'skill':
                break;
            default:
                DoD_Utility.WARNING(`DoDActorBaseSheet._prepareItemContext: Unknown item type ${item.type}`);
        }
    }

    _prepareItems(context) {

        context.heroicAbilities = [];
        context.kinAbilities = [];
        context.professionAbilities = [];
        context.spells = [];
        context.tricks = [];
        context.schools = {};
        context.inventory = [];
        context.equippedWeapons = [];
        context.injuries = [];

        context.equippedArmor = this.actor.system.equippedArmor;
        context.equippedHelmet = this.actor.system.equippedHelmet;

        for (let item of this.actor.items.contents) {
            this._prepareItemContext(item, context);
        }

        // Kin and Profession
        context.kin = this.actor.system.kin;
        context.kinName = context.kin?.name;
        context.profession = this.actor.system.profession;
        context.professionName = context.profession?.name;

        // Skills
        context.coreSkills = this.actor.system.coreSkills?.sort(DoD_Utility.nameSorter);
        context.magicSkills = this.actor.system.magicSkills?.sort(DoD_Utility.nameSorter);
        context.secondarySkills = this.actor.system.secondarySkills?.sort(DoD_Utility.nameSorter);
        context.weaponSkills = this.actor.system.weaponSkills?.sort(DoD_Utility.nameSorter);
        context.trainedSkills = this.actor.system.trainedSkills?.sort(DoD_Utility.nameSorter).filter(s => s.system.hideTrained === false);

        // Abilities
        context.heroicAbilities = context.heroicAbilities.sort(DoD_Utility.nameSorter);
        context.kinAbilities = context.kinAbilities.sort(DoD_Utility.nameSorter);
        context.professionAbilities = context.professionAbilities.sort(DoD_Utility.nameSorter);
        context.abilities = context.heroicAbilities.concat(context.kinAbilities, context.professionAbilities).sort(DoD_Utility.nameSorter);

        // Format abilities - merge duplicates
        let formattedAbilities = [];
        for (let i=0, j; i < context.abilities.length; i=j) {
            let count = 1;
            // count number of abilities with same name and skip duplicates
            for (j = i+1; j < context.abilities.length; j++) {
                if (context.abilities[i].name === context.abilities[j].name) {
                    count++;
                } else {
                    break;
                }
            }
            // Push first unique ability. Add ability count in parenthesis (if multiple)
            formattedAbilities.push({
                id: context.abilities[i].id,
                name: count === 1 ? context.abilities[i].name : context.abilities[i].name + " (" + count + ")"
            });
        }
        context.abilities = formattedAbilities;

        // Spells
        context.spells = context.spells?.sort(DoD_Utility.nameSorter);
        context.hasSpells = context.spells.length > 0;
        context.memorizedSpells = context.spells?.filter(s => s.system.memorized);

        // Tricks
        context.tricks = context.tricks?.sort(DoD_Utility.nameSorter);
        context.hasTricks = context.tricks.length > 0;
        context.hasSpellsOrTricks = context.hasSpells || context.hasTricks;

        // Inventory
        context.inventory = context.inventory?.sort(DoD_Utility.itemSorter);

        // Weapons and Armor
        context.equippedWeapons = context.equippedWeapons?.sort(DoD_Utility.itemSorter);
        context.canEquipWeapon = context.equippedWeapons ? context.equippedWeapons.filter(w => !w.hasWeaponFeature("unarmed")).length < 3 : true;
        context.hasArmor = context.equippedArmor || context.equippedHelmet;

        // Injuries
        context.injuries = context.injuries?.sort(DoD_Utility.itemSorter);

        // Flags
        context.canEquipItems = game.settings.get("dragonbane", "canEquipItems2");
    }

    _prepareEncumbrance(context) {
        // Maximum 2 decimals
        context.encumbrance = Math.round(100 * this.actor.system.encumbrance.value) / 100;

        if (this.actor.system.maxEncumbrance !== undefined) {
            context.overEncumbered = context.encumbrance > this.actor.system.maxEncumbrance.value;
        }
    }

    _prepareEffects(context) {
        // Don't show conditions as effects
        context.effects = Array.from(this.actor.allApplicableEffects()).filter((effect) => !effect.isCondition);
    }
}
