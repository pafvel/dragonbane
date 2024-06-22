export default class DragonbaneDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {};
    }

    static mergeSchema(target, source) {
        Object.assign(target, source);
        return target;
    }

    static migrateData(source) {
        return super.migrateData(source);
    }
}
