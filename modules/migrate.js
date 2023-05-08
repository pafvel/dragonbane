import { DoD } from "./config.js";
import DoD_Utility from "./utility.js";


export async function migrateWorld() {
    console.log("Migrating World to newer version");

    // Migrate World Items
    for (let item of game.items.contents) {
        try {
            let updateData = migrateItemData(item.toObject());
            if (!foundry.utils.isEmpty(updateData)) {
                console.log(`Migrating Item ${item.name}`);
                await item.update(updateData);
            }
        } catch (err) {
            err.message = `Failed system migration for Item ${item.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate World Actors
    for (let actor of game.actors.contents) {
        try {
          let updateData = await migrateActorData(actor);
          if (!foundry.utils.isEmpty(updateData)) {
            console.log(`Migrating Actor ${actor.name}`);
            await actor.update(updateData);
          }
        } catch (err) {
          err.message = `Failed system migration for Actor ${actor.name}: ${err.message}`;
          console.error(err);
        }
      }
 
    // Migrate Scenes
    for (let scene of game.scenes.contents) {
        try {
            let updateData = migrateSceneData(scene);
            if (!foundry.utils.isEmpty(updateData)) {
                console.log(`Migrating Scene ${scene.name}`);
                await scene.update(updateData);
                
                // Clear cached actor data
                scene.tokens.contents.forEach(t => t._actor = null);
            }
        } catch (err) {
            err.message = `Failed system migration for Scene ${s.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate Compendiums
    for (let p of game.packs) {
        if (p.metadata.type == "Item" && p.metadata.packageType == "world") {
            await migrateCompendium(p);
        }
    }
    for (let p of game.packs) {
        if (p.metadata.type == "Actor" && p.metadata.packageType == "world") {
            await migrateCompendium(p);
        }
    }
    for (let p of game.packs) {
        if (p.metadata.type == "Scene" && p.metadata.packageType == "world") {
            await migrateCompendium(p);
        }
    }

    console.log("Migration completed");
}

async function migrateSceneData(scene) {
    let tokensUpdate = [];

    for (let token of scene.tokens) {
        const t = token.toJSON();
        if (!t.actorLink) {
            // Migrate unlinked actors
            const actor = duplicate(t.actorData);
            actor.type = t.actor?.type;
            const actorUpdate = migrateActorData(actor);
            mergeObject(t.actorData, actorUpdate);
        }
        tokensUpdate.push(t);
    }
    return { tokens: tokensUpdate };
}

async function migrateActorData(actor) {

    let updateData = {};
    let itemArray = [];

    // Migrate Owned Items
    if (actor.items) {
        for (let item of actor.items) {
            let itemUpdateData = migrateItemData(item, actor.name);
            if (!foundry.utils.isEmpty(itemUpdateData)) {
                itemUpdateData._id = item.id;
                itemArray.push(foundry.utils.expandObject(itemUpdateData));     
            }
        }
    }
    if (itemArray.length > 0) {
        updateData.items = itemArray;
    }
    return updateData;
}


function migrateItemData(item, name) {
    let updateData = {};
    if (item.type == "spell") {
        updateData = migrateSpellData(item, name);
    }
    return updateData;
}

function migrateSpellData(spell, name) {
    let updateData = {};

    // Added field rangeType
    // - Deprecates field areaOfEffect
    if (!spell.system.rangeType) {
        switch(spell.system.areaOfEffect) {
            case "cone":
                updateData["system.rangeType"] = "cone";
                break;
            case "sphere":
                updateData["system.rangeType"] = "sphere";
                break;
            default:
                if (spell.system.range > 0) {
                    updateData["system.rangeType"] = "range";
                }
                break;
        }
    }
    return updateData;
}

async function migrateCompendium(pack) {
    const entityType = pack.metadata.type;
    if (!["Actor", "Item", "Scene"].includes(entityType)) return;

    // Unlock the pack for editing
    const wasLocked = pack.locked;
    await pack.configure({ locked: false });

    // Begin by requesting server-side data model migration and get the migrated content
    await pack.migrate();
    const documents = await pack.getDocuments();

    // Iterate over compendium entries - applying fine-tuned migration functions
    for (let doc of documents) {
      let updateData = {};
      try {
        switch (entityType) {
          case "Actor":
            updateData = migrateActorData(doc);
            break;
          case "Item":
            updateData = migrateItemData(doc);
            break;
          case "Scene":
            updateData = migrateSceneData(doc);
            break;
        }

        // Save the entry, if data was changed
        if (foundry.utils.isEmpty(updateData)) continue;
        await doc.update(updateData);
        console.log(`Migrated ${entityType} ${doc.name} in Compendium ${pack.collection}`);
      }

      // Handle migration failures
      catch (err) {
        err.message = `Failed system migration for ${entityType}  ${doc.name} in pack ${pack.collection}: ${err.message}`;
        console.error(err);
      }
    }

    // Apply the original locked status for the pack
    await pack.configure({ locked: wasLocked });
    console.log(`Migrated all ${document} entities from Compendium ${pack.collection}`);
  };
