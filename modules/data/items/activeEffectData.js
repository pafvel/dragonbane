import DragonbaneDataModel from "../DragonbaneDataModel.js";

export default class DoDActiveEffectData extends DragonbaneDataModel {

    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
             applyOnlyWhenEquipped: new fields.BooleanField({ required: true, blank: true, initial: false }),
        });
    }
}