import DoDE_Utility from "./utility.js";
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
        // add localization support for characteristics
        /*
        for (let [key, ch] of Object.entries(this.data.data.characteristics)) {
            ch.name = "dode.characteristics." + key;
            ch.shortName = "dode.char." + key;
        }
        */

        // prepare skills
        /*
        this.data.data.skills = this.data.items.filter(i => i.type == "skill");
        this.data.data.skills.sort(DoDE_Utility.nameSorter);
        */
    }

    prepareDerivedData() {
        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        this._prepareCharacterData();
        this._prepareNpcData();
        this._prepareMonsterData();
    }

    _prepareCharacterData() {
        if (this.type !== 'character') return;
        this._prepareActorStats();
        this._prepareCharacterStats();
        this._prepareBaseChances();
        this._prepareSpellValues();
    }

    _prepareNpcData() {
        if (this.type !== 'npc') return;
    }

    _prepareMonsterData() {
        if (this.type !== 'monster') return;
    }

    _prepareCharacterStats() {
        // Damage Bonus

        // Will Points
        let maxWillPoints = this.system.attributes.wil.value;
        if (this.system.willPoints.max != maxWillPoints) {
            let damage = this.system.willPoints.max - this.system.willPoints.value;
            if (damage < 0) {
                damage = 0;
            } else if (damage > maxWillPoints) {
                damage = maxWillPoints;
            }
            this.update({ ["system.willPoints.max"]: maxWillPoints});
            this.update({ ["system.willPoints.value"]: maxWillPoints - damage});
        }
    }

    _prepareActorStats() {
        // Movement

        // Hit Points
        let maxHitPoints = this.system.attributes.con.value;
        if (this.system.hitPoints.max != maxHitPoints) {
            let damage = this.system.hitPoints.max - this.system.hitPoints.value;
            if (damage < 0) {
                damage = 0;
            } else if (damage > maxHitPoints) {
                damage = maxHitPoints;
            }
            this.update({ ["system.hitPoints.max"]: maxHitPoints});
            this.update({ ["system.hitPoints.value"]: maxHitPoints - damage});
        }
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
                skill.baseChance = DoDE_Utility.calculateBaseChance(value);
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