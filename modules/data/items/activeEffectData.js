export default class DoDActiveEffectData extends foundry.data.ActiveEffectTypeDataModel {

    static mergeSchema(target, source) {
        Object.assign(target, source);
        return target;
    }
        
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
             applyOnlyWhenEquipped: new fields.BooleanField({ required: true, blank: true, initial: false }),
        });
    }
}