import DoD_Utility from "./utility.js";
import { DoD } from "./config.js";

export class DoDActor extends Actor {

    /** @override */
    /*
    getData() {
        const context = super.getData();
        const gear = [];

        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            gear.push(i);
        }
        context.gear = gear;

        return context;
    }
    */

    /** @override */
    
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
        // prepare skills
        this._prepareSkills();
        this._prepareBaseChances();
    }

    prepareDerivedData() {
        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        this._prepareCharacterData();
        this._prepareNpcData();
        this._prepareMonsterData();
    }

    getSkill(name) {
        let a = name.toLowerCase();
        return this.system.skills?.find(skill => skill.name.toLowerCase() === a);
    }

    _prepareCharacterData() {
        if (this.type !== 'character') return;
        this._prepareActorStats();
        this._prepareCharacterStats();
        this._prepareSpellValues();
    }

    _prepareNpcData() {
        if (this.type !== 'npc') return;
    }

    _prepareMonsterData() {
        if (this.type !== 'monster') return;
    }

    _prepareSkills() {

        this.system.skills = [];
        this.system.coreSkills = [];
        this.system.weaponSkills = [];
        this.system.magicSkills = [];
        this.system.secondarySkills = [];
        
        for (let item of this.items.contents) {
            if (item.type == 'skill') {
                let skill = item;
                this.system.skills.push(skill);
                if (skill.system.skillType == 'core') {
                    this.system.coreSkills.push(skill);
                }  else if (skill.system.skillType == 'weapon') {
                    this.system.weaponSkills.push(skill);
                } else if (skill.system.skillType == 'magic') {
                    // schools of magic are secondary skills
                    this.system.magicSkills.push(skill);
                    this.system.secondarySkills.push(skill);
                } else {
                    this.system.secondarySkills.push(skill);
                }
            }
        }
    }

    _prepareCharacterStats() {
        // Damage Bonus
        let damageBonusAGL = DoD_Utility.calculateDamageBonus(this.system.attributes.agl.value);
        let damageBonusSTR = DoD_Utility.calculateDamageBonus(this.system.attributes.str.value);
        this.update({ 
            ["system.damageBonus.agl"]: damageBonusAGL,
            ["system.damageBonus.str"]: damageBonusSTR });

        // Will Points
        let maxWillPoints = this.system.attributes.wil.value;
        if (this.system.willPoints.max != maxWillPoints) {
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
        if (this.system.hitPoints.max != maxHitPoints) {
            // Attribute changed - keep damage and update max value
            let damage = this.system.hitPoints.max - this.system.hitPoints.value;
            if (damage < 0) {
                damage = 0;
            } else if (damage > maxHitPoints) {
                damage = maxHitPoints;
            }
            this.update({
                ["system.hitPoints.max"]: maxHitPoints,
                ["system.hitPoints.value"]: maxHitPoints - damage });
        }

        // Movement
        let movement =  DoD_Utility.calculateMovement(this.system.attributes.agl.value);
        // TODO - Kin modifier
        this.update({ ["system.movement"]: movement });
    }

    _prepareActorStats() {

    }

    _getAttributeValueFromName(name) {
        let attribute = this.system.attributes[name.toLowerCase()];
        if (attribute) return attribute.value;
        return 0;
    }

    _prepareBaseChances() {
        for (let item of this.items.contents) {
            if (item.type == "skill") {
                let skill = item;
                let name = skill.system.attribute;
                let value = this._getAttributeValueFromName(name);
                skill.baseChance = DoD_Utility.calculateBaseChance(value);
                if ((skill.system.skillType == "core" || skill.system.skillType == "weapon") && skill.system.value < skill.baseChance) {
                    skill.system.value = skill.baseChance;
                }
            }
        }
    }

    _prepareSpellValues() {
        let magicSchools = new Map;
        let maxValue = 0;

        // find skill values for schools of magic
        for (let item of this.items.contents) {
            if (item.type == "skill" && item.system.skillType == "magic") {
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
            if (item.type == "spell") {
                let spell = item;

                // replace general spells school name with localized string if it matches
                if (spell.system.school == generalSchoolLocalized) {
                    spell.system.school = generalSchool;
                    spell.update({ ["system.school"]: generalSchool});
                }

                // set skill values for spell corresponding to school
                if (magicSchools.has(spell.system.school)) {
                    spell.value = magicSchools.get(spell.system.school);
                } else {
                    spell.value = 0;
                }
            }
        }
    }
}