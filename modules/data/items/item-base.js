import DragonbaneDataModel from "../DragonbaneDataModel.js";

export class DoDItemBaseData extends DragonbaneDataModel {
    static defineSchema() {
        const { fields } = foundry.data;
        return this.mergeSchema(super.defineSchema(), {
            // Remove old description field and replace with itemDescription + gmDescription
            // description: new fields.StringField({ required: true, initial: "" }),
            itemDescription: new fields.StringField({ required: true, initial: "" }),
            gmDescription: new fields.StringField({ required: true, initial: "" }),
        });
    };

    static migrateData(source) {
        // Migrate old description field to new fields
        if (source.itemDescription === undefined && source.description !== undefined) {
            // Put unrevealed secrets in gmDescription and the rest in itemDescription
            if (source.gmDescription === undefined) {
                source.gmDescription = "";
            }
            const html = document.createElement("div");
            html.innerHTML = String(source.description || "");
            const secrets = html.querySelectorAll("section.secret:not(.revealed)");
            if (secrets.length > 0) {
                for (const secret of secrets) {
                    // Remove warning text from content being moved
                    const enString = "section will be visible to players if they edit the item description";
                    const seString = "text är synlig för spelare om de redigerar föremålets beskrivning";
                    for (const section of secret.children) {
                        if (!(section.outerHTML.includes(enString) || section.outerHTML.includes(seString))) {
                            source.gmDescription += section.outerHTML;
                        }
                    }
                    secret.remove();
                }
                source.itemDescription = html.innerHTML;
            } else {
                source.itemDescription = source.description;
           }
            delete source.description;
        }
        return super.migrateData(source);
    }
}


