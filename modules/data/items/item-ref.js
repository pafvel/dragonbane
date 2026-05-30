//import DragonbaneDataModel from "../DragonbaneDataModel.js";

export default class DoDItemRef extends foundry.abstract.DataModel {

    static defineSchema() {
        const { fields } = foundry.data;
        return {
            uuid: new fields.StringField({ required: true, initial: "" }),
            name: new fields.StringField({ required: true, initial: "" }),
            img: new fields.StringField({ required: true, initial: "" }),
        };
    }

    refresh() {
        if (this.item) {
            this.name = this.item.name;
            this.img = this.item.img;
        }
    }

    resolve() {
        this.item = fromUuidSync(this.uuid);
        this.refresh();
        return this.item;
    }

    async resolveAsync() {
        this.item = await fromUuid(this.uuid);
        this.refresh();
        return this.item;
    }

    toObject() {
        return { uuid: this.uuid, name: this.name, img: this.img };
    }

    static fromObject(data) {
        return new this({
            uuid: data.uuid,
            name: data.name,
            img: data.img
        });
    }

    get label() {
        return this.name ?? this.uuid;
    }

    get isResolved() {
        return !!this.item;
    }

    /*
    get isResolvable() {
        return this.resolve() !== null;
    }
    */

    get cssClass() {
        return this.isResolved ? "fa-solid fa-link" : "fa-solid fa-link-slash";
    }
}
