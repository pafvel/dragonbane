import DragonbaneDataModel from "../DragonbaneDataModel.js";

export class DoDItemBaseData extends DragonbaneDataModel {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            description: new fields.StringField({ required: true, initial: "" }),
        });
    };

    static migrateData(source) {
        return super.migrateData(source);
    }
}


