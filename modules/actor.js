import DoD_Utility from "./utility.js";
import DoDSkillTest from "./tests/skill-test.js";
import DoDRoll from "./roll.js";
import DoDActiveEffect from "./active-effect.js";

export class DoDActor extends Actor {

    /** @override */
    async deleteDialog(options={}) {
        // Warn if there are tokens referring to this actor
        let scenes = [];
        for (let scene of game.scenes.contents) {
            let t = scene.tokens.find(t=>t.actorId === this.id);
            if (t) scenes.push(scene.name);
        }
        let tokenMessage = "";
        if (scenes.length > 0){
            tokenMessage = `<blockquote class="info"><p>${game.i18n.localize("DoD.ui.dialog.deleteActorTokenOnScene")}:</p><ul>`;
            for (let scene of scenes) {
                tokenMessage += `<li>${scene}</li>`;
            }
            tokenMessage += "</ul></blockquote>";
        }

        const type = game.i18n.localize(this.constructor.metadata.label);
        return Dialog.confirm({
          title: `${game.i18n.format("DOCUMENT.Delete", {type})}: ${this.name}`,
          content: `<h4>${game.i18n.localize("AreYouSure")}</h4><p>${game.i18n.format("SIDEBAR.DeleteWarning", {type})}</p>${tokenMessage}`,
          yes: this.delete.bind(this),
          options: options
        });
    }

    /** @override */
    async _preCreate(data, options, user) {

        await super._preCreate(data, options, user);

        // If the created actor has items (only applicable to duplicated actors) bypass the new actor creation logic
        if (!data.items?.length)
        {
            if (this.type !== "monster") {
                let baseSkills = await DoD_Utility.getBaseSkills();
                if (baseSkills) {
                    data.items = baseSkills;
                    this.updateSource(data);
                }
            }
            switch (this.type) {
                case "character":
                    await this.updateSource({
                        "system.age": data.system ? data.system.age : "adult",
                        "prototypeToken.actorLink": true,
                        "prototypeToken.disposition": 1, // Friendly
                        "prototypeToken.bar1.attribute": "hitPoints",
                        "prototypeToken.bar2.attribute": "willPoints",
                        "prototypeToken.displayBars": 30, // Hovered by Anyone
                        "prototypeToken.sight.enabled": true, // Vision enabled
                    });
                    break;
                case "npc":
                    await this.updateSource({
                        "prototypeToken.disposition": 0, // Neutral
                        "prototypeToken.bar1.attribute": "hitPoints",
                        "prototypeToken.displayBars": 20, // Hovered by Owner
                    });
                    break;
                case "monster":
                    await this.updateSource({
                        "system.size": data.system ? data.system.size : "normal",
                        "prototypeToken.disposition": -1, // Hostile
                        "prototypeToken.bar1.attribute": "hitPoints",
                        "prototypeToken.displayBars": 20, // Hovered by Owner
                    });
                    break;
            }
        }
    }
    static onPreUpdateActorEvent(actor, data, _options, _userId) {
        console.log("onUpdateActorEvent", actor);

        if (foundry.utils.hasProperty(data, "system.hitPoints.value")) {
            const options = {
                anchor: CONST.TEXT_ANCHOR_POINTS.LEFT,
                fill: "0xFF0000"
            };
            actor._displayScrollingText(foundry.utils.getProperty(data, "system.hitPoints.value") - actor.system.hitPoints.value, options);
        }
        if (foundry.utils.hasProperty(data, "system.willPoints.value")) {
            const options = {
                anchor: CONST.TEXT_ANCHOR_POINTS.RIGHT,
                fill: "0x00FF00"
            };
            actor._displayScrollingText(foundry.utils.getProperty(data, "system.willPoints.value") - actor.system.willPoints.value, options);
        }

    }

    /** @override */
    async _preUpdate(data, options, user) {
        await super._preUpdate(data, options, user);

        if (foundry.utils.hasProperty(data, "system.hitPoints.value")) {
            options._deltaHP = foundry.utils.getProperty(data, "system.hitPoints.value") - this.system.hitPoints.value;
        }
        if (foundry.utils.hasProperty(data, "system.willPoints.value")) {
            options._deltaWP = foundry.utils.getProperty(data, "system.willPoints.value") - this.system.willPoints.value, options;
        }
    }

    /** @override */
    async _onUpdate(data, options, user) {
        await super._onUpdate(data, options, user);

        const hasPermission = this.testUserPermission(game.user, DoD_Utility.getViewDamagePermission());

        if (!hasPermission) return;

        if (options._deltaHP) {
            this._displayScrollingText(options._deltaHP, {
                anchor: CONST.TEXT_ANCHOR_POINTS.LEFT,
                fill: "0xFF0000",
                hidden: !hasPermission
            });
        }
        if (options._deltaWP) {
            this._displayScrollingText(options._deltaWP, {
                anchor: CONST.TEXT_ANCHOR_POINTS.RIGHT,
                fill: "0x00FF00",
                hidden: !hasPermission
            });
        }
        if (data?.system?.size) {
            let size;
            let scale;
            switch (data.system.size) {
                case "small":
                    size = 1;
                    scale = 0.8;
                    break;
                case "large":
                    size = 2;
                    scale = 1;
                    break;
                case "huge":
                    size = 4;
                    scale = 1;
                    break;
                default:
                    size = 1;
                    scale = 1;
                    break;
            }
            await this.update({
                "prototypeToken.height": size,
                "prototypeToken.width": size,
                "prototypeToken.texture.scaleX": scale,
                "prototypeToken.texture.scaleY": scale
            });
        }
    }

    _displayScrollingText(change, options = {}) {
        if (!change) return;
        const tokens = this.isToken ? [this.token?.object] : this.getActiveTokens(true);
        const defaultOptions = {
            anchor: (change<0) ? CONST.TEXT_ANCHOR_POINTS.BOTTOM: CONST.TEXT_ANCHOR_POINTS.TOP,
            direction: (change<0) ? 1: 2,
            fontSize: 30,
            fill: change < 0 ? "0xFF0000" : "0x00FF00",
            stroke: 0x000000,
            strokeThickness: 4,
            jitter: 0.25
        };
        const scrollOptions = {...defaultOptions, ...options};
        const scrollingText = options.hidden ? "???" : change.signedString();

        for (let t of tokens) {
            if (t) {
                canvas.interface.createScrollingText(t.center, scrollingText, scrollOptions);
            }
        }
    }

    /** @override */
    prepareData() {
        // Prepare data for the actor. Calling the super version of this executes
        // the following, in order: data reset (to clear active effects),
        // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
        // prepareDerivedData().
        super.prepareData();
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        // reset attributes
        for (const attribute in this.system.attributes) {
            this.system.attributes[attribute].value = this.system.attributes[attribute].base;
        }
        // reset ferocity
        if (this.system.ferocity) {
            this.system.ferocity.value = this.system.ferocity.base;
        }

        // prepare skills
        this._prepareSkills();
        this._prepareBaseChances();
        this._prepareKin();
        this._prepareProfession();

    }

    prepareEmbeddedDocuments() {
        super.prepareEmbeddedDocuments();

        switch(this.type)
        {
            case "character":
                this._prepareEquippedItems();
                break;
            case "npc":
                this._prepareEquippedItems();
                break;
            case "monster":
                this._prepareEquippedItems();
                break;
            default:
                break;
        }

    }

    prepareDerivedData() {
        super.prepareDerivedData();

        switch(this.type)
        {
            case "character":
                this._prepareCharacterData();
                break;
            case "npc":
                this._prepareNpcData();
                break;
            case "monster":
                this._prepareMonsterData();
                break;
            default:
                break;
        }
        DoDActiveEffect.applyDeferredChanges(this);
        if (this.system.hitPoints?.value) {
            this.system.hitPoints.value = DoD_Utility.clamp(this.system.hitPoints.value, 0, this.system.hitPoints.max);
        }
        if (this.system.willPoints?.value) {
            this.system.willPoints.value = DoD_Utility.clamp(this.system.willPoints.value, 0, this.system.willPoints.max);
        }
    }

    getSkill(name) {
        let a = name.toLowerCase();
        return this.system.skills?.find(skill => skill.name.toLowerCase() === a);
    }

    _prepareCharacterData() {
        this._prepareActorStats();
        this._prepareCharacterBaseStats();
        this._prepareCharacterStats();
        this._prepareSpellValues();
    }

    _prepareNpcData() {
        this._prepareActorStats();
        this._prepareCharacterBaseStats();
        this._prepareNpcStats();
        this._prepareSpellValues();
    }

    _prepareMonsterData() {
        this._prepareActorStats();

        // Clean ferocity value after active effects
        const ferocityValueField = this.system.schema.getField("ferocity.value");
        if (ferocityValueField) {
            this.system.ferocity.value = ferocityValueField.clean(this.system.ferocity.value);
        }
    }

    _prepareEquippedItems() {
        let armor = null;
        let helmet = null;

        for (let item of this.items.contents) {
            if (item.type === 'armor' && item.system.worn) {
                if (armor) {
                    // Already wearing armor
                    item.update({ ["system.worn"]: false });
                } else {
                    armor = item;
                }
            }
            if (item.type === 'helmet' && item.system.worn) {
                if (helmet) {
                    // Already wearing helmet
                    item.update({ ["system.worn"]: false });
                } else {
                    helmet = item;
                }
            }
        }
        this.system.equippedArmor = armor;
        this.system.equippedHelmet = helmet;
    }

    _prepareSkills() {

        this.system.skills = [];
        this.system.coreSkills = [];
        this.system.weaponSkills = [];
        this.system.magicSkills = [];
        this.system.secondarySkills = [];
        this.system.trainedSkills = [];

        for (let item of this.items.contents) {
            if (item.type === 'skill') {
                let skill = item;
                skill.system.isProfessionSkill = false;
                this.system.skills.push(skill);
                if (skill.system.skillType === 'core') {
                    this.system.coreSkills.push(skill);
                    if(skill.system.value > this._getBaseChance(skill)) {
                        this.system.trainedSkills.push(skill);
                    }
                }  else if (skill.system.skillType === 'weapon') {
                    this.system.weaponSkills.push(skill);
                    if(skill.system.value > this._getBaseChance(skill)) {
                        this.system.trainedSkills.push(skill);
                    }
                } else if (skill.system.skillType === 'magic') {
                    // schools of magic are secondary skills
                    this.system.magicSkills.push(skill);
                    this.system.secondarySkills.push(skill);
                    this.system.trainedSkills.push(skill);
                } else {
                    this.system.secondarySkills.push(skill);
                    this.system.trainedSkills.push(skill);
                }
            }
        }
    }

    _prepareCharacterStats() {
        // Clamp attributes
        this.system.attributes.str.value = DoD_Utility.clamp(this.system.attributes.str.value, 3, 18);
        this.system.attributes.con.value = DoD_Utility.clamp(this.system.attributes.con.value, 3, 18);
        this.system.attributes.agl.value = DoD_Utility.clamp(this.system.attributes.agl.value, 3, 18);
        this.system.attributes.int.value = DoD_Utility.clamp(this.system.attributes.int.value, 3, 18);
        this.system.attributes.wil.value = DoD_Utility.clamp(this.system.attributes.wil.value, 3, 18);
        this.system.attributes.cha.value = DoD_Utility.clamp(this.system.attributes.cha.value, 3, 18);

        // Damage Bonus AGL
        let damageBonusAgl = DoD_Utility.calculateDamageBonus(this.system.attributes.agl.value);
        this.system.damageBonus.agl.base = game.i18n.localize(damageBonusAgl);
        this.system.damageBonus.agl.value = this.system.damageBonus.agl.base;

        // Damage Bonus STR
        let damageBonusStr = DoD_Utility.calculateDamageBonus(this.system.attributes.str.value);
        this.system.damageBonus.str.base = game.i18n.localize(damageBonusStr);
        this.system.damageBonus.str.value = this.system.damageBonus.str.base;

        // Will Points
        let maxWillPoints = this.system.attributes.wil.value;
        const wpBonuses = this.items.filter(i => i.type === "ability" && i.system.secondaryAttribute === "willPoints").length;
        maxWillPoints += 2 * wpBonuses;

        if (this.system.willPoints.max !== maxWillPoints) {
            // Attribute changed - keep spent amount (damage) and update max value
            let damage = this.system.willPoints.max - this.system.willPoints.value;
            if (damage < 0) {
                damage = 0;
            } else if (damage > maxWillPoints) {
                damage = maxWillPoints;
            }
            this.update({
                ["system.willPoints.max"]: maxWillPoints,
                ["system.willPoints.value"]: maxWillPoints - damage });
        }

        // Hit Points
        let maxHitPoints = this.system.attributes.con.value;
        const hpBonuses = this.items.filter(i => i.type === "ability" && i.system.secondaryAttribute === "hitPoints").length;
        maxHitPoints += 2 * hpBonuses;

        if (this.system.hitPoints.max !== maxHitPoints) {
            // Attribute changed - keep damage and update max value
            let damage = this.system.hitPoints.max - this.system.hitPoints.value;
            if (damage < 0) {
                damage = 0;
            } else if (damage > maxHitPoints) {
                damage = maxHitPoints;
            }
            this.update({
                ["system.hitPoints.base"]: maxHitPoints,
                ["system.hitPoints.max"]: maxHitPoints,
                ["system.hitPoints.value"]: maxHitPoints - damage });
        }

        // Movement
        this.system.movement.base = Number(this.system.kin ? this.system.kin.system.movement : 10);
        const movementModifier =  DoD_Utility.calculateMovementModifier(this.system.attributes.agl.value);
        const moveBonuses = this.items.filter(i => i.type === "ability" && i.system.secondaryAttribute === "movement").length;

        this.system.movement.value = this.system.movement.base + movementModifier + 2 * moveBonuses;
    }

    _prepareActorStats() {
        // Movement
        const moveBonuses = this.items.filter(i => i.type === "ability" && i.system.secondaryAttribute === "movement").length;
        this.system.movement.value = this.system.movement.base + 2 * moveBonuses;

        // Hit Points
        this.system.hitPoints.max = this.system.hitPoints.base;
    }

    _prepareCharacterBaseStats() {
        // Will Points
        if (!this.system.willPoints || !Number.isInteger(this.system.willPoints.max)) {
            this.update({
                ["system.willPoints.max"]: 10,
                ["system.willPoints.value"]: 10 });
        }
    }

    _prepareNpcStats() {
        // Damage Bonus
        this.system.damageBonus.agl.value = this.system.damageBonus.agl.base;
        this.system.damageBonus.str.value = this.system.damageBonus.str.base;
    }

    _getBaseChance(skill) {
        switch (this.type) {
            case "character":
                {
                    const value = this._getAttributeValueFromName(skill.system.attribute);
                    return DoD_Utility.calculateBaseChance(value);    
                }
            case "npc":
                return 5;
            case "monster":
                return 0;
            default:
                return 0;
        }
    }

    _getAttributeValueFromName(name) {
        let attribute = this.system.attributes[name.toLowerCase()];
        if (attribute) return attribute.value;
        return 0;
    }

    _prepareBaseChances() {
        for (const item of this.items.contents) {
            if (item.type === "skill") {
                const skill = item;
                const baseChance = this._getBaseChance(skill);
                if ((skill.system.skillType === "core" || skill.system.skillType === "weapon") && skill.system.value < 1) {
                    skill.system.value = baseChance;
                }
            }
        }
    }

    get isCharacter() {
        return this.type === "character";
    }

    get isNpc() {
        return this.type === "npc";
    }

    get isMonster() {
        return this.type === "monster";
    }

    get isObserver() {
        return this.testUserPermission(game.user, "OBSERVER");
    }

    get isLimited() {
        return this.testUserPermission(game.user, "LIMITED");
    }

    get hasAbilities() {
        return this.items.find(i => i.type === "ability") != null;
    }

    get hasSpells() {
        return this.items.find(i => i.type === "spell") != null;
    }

    get hasSkills() {
        return this.system.trainedSkills.length > 0;
    }

    getEquippedWeapons() {
        return this.items.filter(i => i.type === "weapon" && i.system.worn === true);
    }

    getArmorValue(damageType) {
        let armorValue = 0;
        if (this.system.equippedArmor) {
            armorValue += this.system.equippedArmor.getArmorValue(damageType);
        }
        if (this.system.equippedHelmet) {
            armorValue += this.system.equippedHelmet.getArmorValue(damageType);
        }
        if (this.type === "monster") {
            armorValue += this.system.armor;
        }
        return armorValue;
    }

    getDamageBonus(attribute) {
        if (attribute && this.system.damageBonus && this.system.damageBonus[attribute] && this.system.damageBonus[attribute].value !== "none") {
            return this.system.damageBonus[attribute].value;
        } else {
            return "";
        }
    }

    async applyDamage(damage) {
        let value = this.system.hitPoints.value;
        let max = this.system.hitPoints.max;
        let newValue = DoD_Utility.clamp(value - damage, 0, max);

        // Update HP
        if (value !== newValue) {
            await this.update({["system.hitPoints.value"]: newValue});
        }
        return newValue;
    }

    findAbility(abilityName) {
        let name = abilityName.toLowerCase();
        return this.items.find(item => item.type === "ability" && item.name.toLowerCase() === name);
    }

    async useAbility(ability) {
        let wp = Number(ability.system.wp);
        wp = isNaN(wp) ? 0 : wp;

        const use = await new Promise(
            resolve => {
                const data = {
                    title: game.i18n.localize("DoD.ui.dialog.useAbility"),
                    content: wp > 0 ? game.i18n.format("DoD.ui.dialog.useAbilityWithWP", {wp: wp, ability: ability.name}) : game.i18n.format("DoD.ui.dialog.useAbilityWithoutWP", {ability: ability.name}),
                    buttons: {
                        ok: {
                            icon: '<i class="fas fa-check"></i>',
                            label: game.i18n.localize("Yes"),
                            callback: () => resolve(true)
                        },
                        cancel: {
                            icon: '<i class="fas fa-times"></i>',
                            label: game.i18n.localize("No"),
                            callback: _html => resolve(false)
                        }
                    },
                    default: "cancel",
                    close: () => resolve(false)
                };
                new Dialog(data, null).render(true);
            }
        );
        if (use) {
            let content;
            if (wp > 0) {
                const oldWP = this.system.willPoints.value;
                if (oldWP < wp) {
                    DoD_Utility.WARNING("DoD.WARNING.notEnoughWPForAbility");
                    return;
                } else {
                    const newWP = oldWP - wp;
                    this.update({"system.willPoints.value": newWP});
                    content = `
                    <div>
                        <p class="ability-use" data-ability-id="${ability.id}">${game.i18n.format("DoD.ability.useWithWP", {actor: this.name, uuid: ability.uuid, wp: wp})}</p>
                    </div>
                    <div class="damage-details permission-observer" data-actor-id="${this.uuid}">
                        <i class="fa-solid fa-circle-info"></i>
                        <div class="expandable" style="text-align: left; margin-left: 0.5em">
                            <b>${game.i18n.localize("DoD.ui.character-sheet.wp")}:</b> ${oldWP} <i class="fa-solid fa-arrow-right"></i> ${newWP}<br>
                        </div>
                    </div>`;
                }
            } else {
                content = `
                <div>
                    <p class="ability-use" data-ability-id="${ability.id}">${game.i18n.format("DoD.ability.useWithoutWP", {actor: this.name, uuid: ability.uuid})}</p>
                </div>`;
            }
            ChatMessage.create({
                content: content,
            });
        }
    }

    findSkill(skillName) {
        let name = skillName.toLowerCase();
        return this.items.find(item => item.type === "skill" && item.name.toLowerCase() === name);
    }

    testSkill(skillName, options = {defaultBanesBoons: true}) {
        const skill = this.findSkill(skillName);
        if(!skill) {
            console.log("Could not find skill: " + skillName);
            return;
        }
        const test = new DoDSkillTest(this, skill, options);
        return test.roll();
    }

    findMagicSkill(schoolName) {
        if (schoolName === "DoD.spell.general") {
            // find magic skill with highest skill value
            let bestSkill = null;
            for (let item of this.items.contents) {
                if (item.type === "skill" && item.system.skillType === "magic") {
                    if (!bestSkill || bestSkill.system.value < item.system.value) {
                        bestSkill = item;
                    }
                }
            }
            return bestSkill;
        } else {
            return this.findSkill(schoolName);
        }
    }

    findSpell(spellName) {
        let name = spellName.toLowerCase();
        return this.items.find(item => item.type === "spell" && item.name.toLowerCase() === name);
    }

    hasCondition(attributeName) {
        return this.system.conditions ? this.system.conditions[attributeName].value : false;
    }

    updateCondition(attributeName, value) {
        const field = "system.conditions." + attributeName + ".value";
        this.update({[field]: value})
    }

    async removeKin() {
        let ids = [];
        //  kin items
        this.items.contents.forEach(i => {
            if (i.type === "kin") ids.push(i.id)
        });
        //  kin ability items
        this.items.contents.forEach(i => {
            if (i.type === "ability" && i.system.abilityType === "kin") ids.push(i.id)
        });
        // delete items and clear kin
        await this.deleteEmbeddedDocuments("Item", ids);
        this.system.kin = null;
    }

    async removeProfession() {
        let ids = [];
        //  profession items
        this.items.contents.forEach(i => {
            if ((i.type === "profession")
            || (i.type === "ability" && i.system.abilityType === "profession")
            || (i.type === "skill" && (i.system.skillType === "secondary" || i.system.skillType === "magic") && i.system.value === 0))
            {
                ids.push(i.id)
            }
        });

        // delete items and clear profession
        await this.deleteEmbeddedDocuments("Item", ids);
        this.system.profession = null;
    }

    async updateKinAbilities() {
        // Character's abilities
        const abilities = this.items.filter(item => item.type === "ability");

        // Ability names defined in the current kin
        const kinAbilityNames =
            (this.system.kin && this.system.kin.system.abilities.length)
                ? DoD_Utility.splitAndTrimString(this.system.kin.system.abilities) : [];


        // Remove kin abilities not in current kin
        let removeAbilityIds = [];
        for (const ability of abilities) {
            if (ability.system.abilityType === "kin" && !kinAbilityNames.find(name => name === ability.name)) {
                removeAbilityIds.push(ability.id);
            }
        }
        if (removeAbilityIds.length) {
            await this.deleteEmbeddedDocuments("Item", removeAbilityIds);
        }

        // add missing kin abilities from current kin
        let createItemData = [];
        for(const kinAbilityName of kinAbilityNames) {
            let kinAbility = this.findAbility(kinAbilityName);
            if (!kinAbility) {
                const foundAbility = await DoD_Utility.findAbility(kinAbilityName);
                if (foundAbility) {
                    const abilityData = foundAbility.toObject();
                    abilityData.system.abilityType = "kin";
                    createItemData.push(abilityData);
                } else {
                    DoD_Utility.WARNING("DoD.WARNING.kinAbility", {ability: kinAbilityName});
                }
            }
        }
        if (createItemData.length) {
            await this.createEmbeddedDocuments("Item", createItemData);
        }
    }

    async updateProfessionAbilities() {
        // Character's abilities
        const abilities = this.items.filter(item => item.type === "ability");

        // Ability names defined in the current profession
        const proAbilityNames =
            (this.system.profession && this.system.profession.system.abilities.length)
                ? DoD_Utility.splitAndTrimString(this.system.profession.system.abilities) : [];


        // Remove profession abilities not in current profession
        let removeAbilityIds = [];
        for (const ability of abilities) {
            if (ability.system.abilityType === "profession" && !proAbilityNames.find(name => name === ability.name)) {
                removeAbilityIds.push(ability.id);
            }
        }
        if (removeAbilityIds.length) {
            await this.deleteEmbeddedDocuments("Item", removeAbilityIds);
        }

        // add missing profession abilities from current profession
        let createItemData = [];
        for(const proAbilityName of proAbilityNames) {
            let professionAbility = this.findAbility(proAbilityName);
            if (!professionAbility) {
                const foundAbility = await DoD_Utility.findAbility(proAbilityName);
                if (foundAbility) {
                    const abilityData = foundAbility.toObject();
                    abilityData.system.abilityType = "profession";
                    createItemData.push(abilityData);
                } else {
                    DoD_Utility.WARNING("DoD.WARNING.professionAbility", {ability: proAbilityName});
                }
            }
        }
        if (createItemData.length) {
            await this.createEmbeddedDocuments("Item", createItemData);
        }
    }

    updateProfessionSkills() {
        this.system.professionSkills = [];
        let missingSkills = [];

        // update profession skills
        if (this.system.profession) {
            let professionSkillNames = DoD_Utility.splitAndTrimString(this.system.profession.system.skills);
            for (const skillName of professionSkillNames) {
                let skill = this.findSkill(skillName);
                if (skill) {
                    skill.system.isProfessionSkill = true;
                } else {
                    missingSkills.push(skillName);
                }
            }
        }
        return missingSkills;
    }

    async updateProfession()
    {
        await this.updateProfessionAbilities();
        return this.updateProfessionSkills();
    }

    async drawMonsterAttack(t, tableResult = null) {
        const table = t || (this.system.attackTable ? fromUuidSync(this.system.attackTable) : null);
        if (!table) return null;

        let draw = null;
        let results = null;
        let roll = null;

        if (tableResult) {
            // Create a roll with the desired result
            roll = DoDRoll.create(t.formula);

            // Check range
            const minOption = game.release.generation < 12 ? {minimize: true, async: true} : {minimize: true};
            const minRoll = (await roll.reroll(minOption)).total;
            const maxOption = game.release.generation < 12 ? {maximize: true, async: true} : {maximize: true};
            const maxRoll = (await roll.reroll(maxOption)).total;
            if ( (tableResult.range[0] > maxRoll) || (tableResult.range[1] < minRoll) ) {
                // Create a roll that guarantees the result
                roll = DoDRoll.create(tableResult.range[0].toString());
            }

            // Continue rolling until the desired result is rolled
            // This is preferred if the roll is shown
            roll = await roll.reroll(game.release.generation < 12 ? {async: true} : {});
            let iter = 0;
            while ( !(tableResult.range[0] <= roll.total && roll.total <= tableResult.range[1]) ) {
                if ( iter >= 100 ) {
                    // Stop rolling and create a roll that guarantees the result
                    roll = DoDRoll.create(tableResult.range[0].toString());
                    break;
                }
                roll = await roll.reroll(game.release.generation < 12 ? {async: true} : {});
                iter++;
            }

            // Recursive roll if the result is a table
            results = await DoD_Utility.expandTableResult(tableResult);

            // Draw from table
            draw = await table.draw({roll, displayChat: false, results});

        } else {
            draw = await table.draw({displayChat: false});
        }
        results = draw.results;
        roll = draw.roll;

        if (results[0]) {
            // Monsters never draw the same attack twice in a row - if that happens pick next attack in the table
            let newResult = null;
            let found = false;
            if (!tableResult && results[0].uuid === this.system.previousMonsterAttack) {
                // Find next attack
                for (let tableResult of table.results)
                {
                    // initialize newResult with first result, used when matching attack is the last one
                    if (!newResult) {
                        newResult = tableResult;
                    }
                    // matched attack last iteration, this is the next attack
                    if (found) {
                        newResult = tableResult;
                        break;
                    }
                    found = results[0].uuid === tableResult.uuid;
                }
                // Recursive roll if the result is a table
                draw = await table.draw({displayChat: false, results: await DoD_Utility.expandTableResult(newResult)});
                results = draw.results;
            }
            await this.update({["system.previousMonsterAttack"]: results[0].uuid});
        }
        return {results, roll};
    }

    _prepareKin() {
        this.system.kin = this.items.find(item => item.type === "kin");
    }

    _prepareProfession() {
        this.system.profession = this.items.find(item => item.type === "profession");
        this.updateProfessionSkills();
    }

    _prepareSpellValues() {
        let magicSchools = new Map;
        let maxValue = 0;

        // find skill values for schools of magic
        for (let item of this.items.contents) {
            if (item.type === "skill" && item.system.skillType === "magic") {
                let skill = item;
                magicSchools.set(skill.name, skill.system.value);
                if (skill.system.value > maxValue) {
                    maxValue = skill.system.value;
                }
            }
        }

        // set the skill value of general spells to max of all magic schools
        let generalSchool = "DoD.spell.general";
        magicSchools.set(generalSchool, maxValue);

        let generalSchoolLocalized = game.i18n.localize(generalSchool);

        for (let item of this.items.contents) {
            if (item.type === "spell") {
                let spell = item;

                // replace general spells school name with localized string if it matches
                if (spell.system.school === generalSchoolLocalized) {
                    spell.system.school = generalSchool;
                    spell.update({ ["system.school"]: generalSchool});
                }

                // set skill values for spell corresponding to school
                if (magicSchools.has(spell.system.school)) {
                    spell.system.skillValue = magicSchools.get(spell.system.school);
                } else {
                    spell.system.skillValue = 0;
                }
            }
        }
    }

    async restRound() {

        await this.update({["system.canRestRound"]: false});

        const roll = await new Roll("D6").roll(game.release.generation < 12 ? {async: true} : {});

        if (game.dice3d) {
            // Green for WP
            roll.dice[0].options.appearance = {
                name: 'inline green',
                foreground: '#ffffff',
                background: '#00a000',
                edge: '#00a000',
            };
        }

        const currentWP = this.system.willPoints.value;
        const maxWP = this.system.willPoints.max;
        const newWP = Math.min(maxWP, currentWP + roll.total);

        let formula = `
        <i class="fa-solid fa-circle-info"></i>
        <div class="permission-observer dice-tooltip" data-actor-id="${this.uuid}" style="text-align: left; margin-left: 0.5em">`;
        if (newWP !== currentWP) {
            formula += `<b>${game.i18n.localize("DoD.ui.character-sheet.wp")}:</b> ${currentWP} <i class="fa-solid fa-arrow-right"></i> ${newWP}<br>`;
        }
        formula += "</div>";

        // Render message
        const context =  {
            formula: formula,
            user: game.user.id,
            tooltip: await roll.getTooltip()
        };
        const template = "systems/dragonbane/templates/partials/roll-no-total.hbs";
        const content = await renderTemplate(template, context);
        const msg = await roll.toMessage({
            user: game.user.id,
            actor: this,
            flavor: game.i18n.format("DoD.ui.character-sheet.restRound", {actor: this.name, wp: newWP - currentWP}),
            content: content
        });

        if (game.dice3d) {
            game.dice3d.waitFor3DAnimationByMessageID(msg.id).then(
                () => this.update({["system.willPoints.value"]: newWP })
            );
        } else {
            await this.update({["system.willPoints.value"]: newWP });
        }
    }

    async restStretch() {

        await this.update({["system.canRestStretch"]: false});

        // Make roll
        const roll = await new Roll(`D6[${game.i18n.localize("DoD.secondaryAttributeTypes.hitPoints")}] + D6[${game.i18n.localize("DoD.secondaryAttributeTypes.willPoints")}]`).roll(game.release.generation < 12 ? {async: true} : {});

        if (game.dice3d) {
            // Red for HP
            roll.dice[0].options.appearance = {
                name: 'inline red',
                foreground: '#ffffff',
                background: '#6F0000',
                edge: '#6F0000',
            };
            // Green for WP
            roll.dice[1].options.appearance = {
                name: 'inline green',
                foreground: '#ffffff',
                background: '#00a000',
                edge: '#00a000',
            };
        }

        // Calc HP
        const currentHP = this.system.hitPoints.value;
        const maxHP = this.system.hitPoints.max;
        const newHP = Math.min(maxHP, currentHP + Number(roll.terms[0].total));

        // Calc WP
        const currentWP = this.system.willPoints.value;
        const maxWP = this.system.willPoints.max;
        const newWP = Math.min(maxWP, currentWP + Number(roll.terms[2].total));

        let formula = `
        <i class="fa-solid fa-circle-info"></i>
        <div class="permission-observer dice-tooltip" data-actor-id="${this.uuid}" style="text-align: left; margin-left: 0.5em">`;
        if (newHP !== currentHP) {
            formula += `<b>${game.i18n.localize("DoD.ui.character-sheet.hp")}:</b> ${currentHP} <i class="fa-solid fa-arrow-right"></i> ${newHP}<br>`;
        }
        if (newWP !== currentWP) {
            formula += `<b>${game.i18n.localize("DoD.ui.character-sheet.wp")}:</b> ${currentWP} <i class="fa-solid fa-arrow-right"></i> ${newWP}<br>`;
        }
        formula += "</div>";

        // Render message
        const context =  {
            formula: formula,
            user: game.user.id,
            tooltip: await roll.getTooltip()
        };
        const template = "systems/dragonbane/templates/partials/roll-no-total.hbs";
        const content = await renderTemplate(template, context);
        const msg = await roll.toMessage({
            user: game.user.id,
            actor: this,
            flavor: game.i18n.format("DoD.ui.character-sheet.restStretch", {actor: this.name, hp: newHP - currentHP, wp: newWP - currentWP}),
            content: content
        });

        // Wait for dice and update actor
        if (game.dice3d) {
            game.dice3d.waitFor3DAnimationByMessageID(msg.id).then(
                () => this.update({
                    ["system.hitPoints.value"]: newHP,
                    ["system.willPoints.value"]: newWP
                })
            );
        } else {
            await this.update({
                ["system.hitPoints.value"]: newHP,
                ["system.willPoints.value"]: newWP
            });
        }
    }

    async restShift() {

        await this.update({
            ["system.canRestRound"]: true,
            ["system.canRestStretch"]: true
        });

        // Calc HP
        const currentHP = this.system.hitPoints.value;
        const maxHP = this.system.hitPoints.max;
        const newHP = maxHP;

        // Calc WP
        const currentWP = this.system.willPoints.value;
        const maxWP = this.system.willPoints.max;
        const newWP = maxWP;

        // Prepare chat message
        const msg = `
            <div class="damage-details permission-observer" data-actor-id="${this.uuid}">
                <i class="fa-solid fa-circle-info"></i>
                <div class="expandable" style="text-align: left; margin-left: 0.5em">
                <b>${game.i18n.localize("DoD.ui.character-sheet.hp")}:</b> ${currentHP} <i class="fa-solid fa-arrow-right"></i> ${newHP}<br>
                <b>${game.i18n.localize("DoD.ui.character-sheet.wp")}:</b> ${currentWP} <i class="fa-solid fa-arrow-right"></i> ${newWP}<br>
                </div>
            </div>`;

        ChatMessage.create({
            user: game.user.id,
            flavor: game.i18n.format("DoD.ui.character-sheet.restShift", {actor: this.name, hp: newHP - currentHP, wp: newWP - currentWP}),
            content: msg
        });

        this.update({
            ["system.hitPoints.value"]: newHP,
            ["system.willPoints.value"]: newWP,
            ["system.conditions.str.value"]: false,
            ["system.conditions.con.value"]: false,
            ["system.conditions.agl.value"]: false,
            ["system.conditions.int.value"]: false,
            ["system.conditions.wil.value"]: false,
            ["system.conditions.cha.value"]: false
        });

        await this.healInjuriesDialog();
    }

    async restReset() {

        await this.update({
            ["system.canRestRound"]: true,
            ["system.canRestStretch"]: true
        });

        ChatMessage.create({
            user: game.user.id,
            flavor: game.i18n.format("DoD.ui.character-sheet.restReset", {actor: this.name})
        });

       await this.healInjuriesDialog();
    }

    async healInjuriesDialog() {
        const healingInjuries = this.items.filter(i => i.type === "injury" && i.system.healingTime != "" && !isNaN(i.system.healingTime));
        if (healingInjuries.length > 0) {
            const heal = await new Promise(
                resolve => {
                    const data = {
                        title: game.i18n.localize("DoD.ui.dialog.healInjuriesTitle"),
                        content: game.i18n.format("DoD.ui.dialog.healInjuriesMessage"),
                        buttons: {
                            ok: {
                                icon: '<i class="fas fa-check"></i>',
                                label: game.i18n.localize("Yes"),
                                callback: () => resolve(true)
                            },
                            cancel: {
                                icon: '<i class="fas fa-times"></i>',
                                label: game.i18n.localize("No"),
                                callback: _html => resolve(false)
                            }
                        },
                        default: "cancel",
                        close: () => resolve(false)
                    };
                    new Dialog(data, null).render(true);
                }
            );
            if (heal) {
                for (let injury of healingInjuries) {
                    injury.reduceHealingTime();
                }
            }    
        }        
    }

    async deleteItemDialog(item, flavor = "") {
        let content = flavor ? "<p>" + flavor + "</p>" : "";
        content += game.i18n.format("DoD.ui.dialog.deleteItemContent", {item: item.name});

        const ok = await new Promise(
            resolve => {
                const data = {
                    title: game.i18n.format("DoD.ui.dialog.deleteItemTitle",
                        {item: game.i18n.localize("TYPES.Item." + item.type)}),
                    content: content,
                    buttons: {
                        ok: {
                            icon: '<i class="fas fa-check"></i>',
                            label: game.i18n.localize("Yes"),
                            callback: () => resolve(true)
                        },
                        cancel: {
                            icon: '<i class="fas fa-times"></i>',
                            label: game.i18n.localize("No"),
                            callback: _html => resolve(false)
                        }
                    },
                    default: "cancel",
                    close: () => resolve(false)
                };
                new Dialog(data, null).render(true);
            }
        );
        if (ok) {
            await this.deleteEmbeddedDocuments("Item", [item.id])
        }
    }
}