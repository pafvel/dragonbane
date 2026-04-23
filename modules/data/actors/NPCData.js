import DoDCharacterBaseData from "./character-base.js";

export default class DoDNPCData extends DoDCharacterBaseData {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            traits: new fields.StringField({ required: true, initial: "" }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
    prepareDerivedData() {
        super.prepareDerivedData();
        this.checkHA();
      }

        checkHA() {
            const abilitys = this.parent.items.filter(i => i.type === "ability");
            abilitys.forEach(ability => {
                if(ability.system.secondaryAttribute === "hitPoints") {
                    this.hitPoints.max += 2;
                    this.hitPoints.value += 2;
                    this.hitPoints.base += 2;
                }
                if(ability.system.secondaryAttribute === "willPoints") {
                    this.willPoints.max += 2;
                    this.willPoints.value += 2;
                    this.willPoints.base += 2;
                }
            });
        }
}