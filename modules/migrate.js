export async function ensureWorldMoneyItems() {
    // Ensure world money items exist (gold, silver, copper)
    const moneyItems = [
        {
            name: game.i18n.localize("DoD.currency.gold"),
            abbreviation: "gc",
            value: 100,
            weight: 0.01
        },
        {
            name: game.i18n.localize("DoD.currency.silver"),
            abbreviation: "sc",
            value: 10,
            weight: 0.01
        },
        {
            name: game.i18n.localize("DoD.currency.copper"),
            abbreviation: "cc",
            value: 1,
            weight: 0.01
        }
    ];

    for (const moneyItemData of moneyItems) {
        // Check if world item already exists
        const existingItem = game.items.find(
            item => item.type === "money" && item.system.abbreviation === moneyItemData.abbreviation
        );

        if (!existingItem) {
            // Create the world money item
            const itemData = {
                name: moneyItemData.name,
                type: "money",
                system: {
                    abbreviation: moneyItemData.abbreviation,
                    value: moneyItemData.value,
                    weight: moneyItemData.weight,
                    quantity: 1
                }
            };
            await Item.create(itemData);
            console.log(`Created world money item: ${moneyItemData.name}`);
        }
    }
        }

export async function migrateWorld() {
    console.log("Migrating World to newer version");

    // Ensure world money items exist before migration
    await ensureWorldMoneyItems();

    // Migrate World Items
    for (let item of game.items.contents) {
        try {
            let updateData = migrateItemData(item.toObject());
            if (!foundry.utils.isEmpty(updateData)) {
                console.log(`Migrating Item ${item.name}`);
                item.update(updateData);
            }
        } catch (err) {
            err.message = `Failed system migration for Item ${item.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate World Actors
    for (let actor of game.actors.contents) {
        try {
            const migrationResult = await migrateActorData(actor);
            if (migrationResult.updateData && !foundry.utils.isEmpty(migrationResult.updateData)) {
                console.log(`Migrating Actor ${actor.name}`);
                await actor.update(migrationResult.updateData);
            }
            // Create money items if needed
            if (migrationResult.moneyItemsToCreate && migrationResult.moneyItemsToCreate.length > 0) {
                await actor.createEmbeddedDocuments("Item", migrationResult.moneyItemsToCreate);
            }
        } catch (err) {
            err.message = `Failed system migration for Actor ${actor.name}: ${err.message}`;
            console.error(err);
        }
}

    // Migrate Scenes
    for (let scene of game.scenes.contents) {
        try {
            let updateData = await migrateSceneData(scene);
            if (!foundry.utils.isEmpty(updateData)) {
                console.log(`Migrating Scene ${scene.name}`);
                await scene.update(updateData);

                // Clear cached actor data
                scene.tokens.contents.forEach(t => t._actor = null);
            }
        } catch (err) {
            err.message = `Failed system migration for Scene ${scene.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate Compendiums
    for (let p of game.packs) {
        if (p.metadata.type === "Item" && p.metadata.packageType === "world") {
            await migrateCompendium(p);
        }
    }
    for (let p of game.packs) {
        if (p.metadata.type === "Actor" && p.metadata.packageType === "world") {
            await migrateCompendium(p);
        }
    }
    for (let p of game.packs) {
        if (p.metadata.type === "Scene" && p.metadata.packageType === "world") {
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
            const actorData = duplicate(t.delta);
            actorData.type = token.actor?.type;
            const migrationResult = await migrateActorData(actorData);
            if (migrationResult.updateData) {
                foundry.utils.mergeObject(t.delta, migrationResult.updateData);
            }
            // Note: money items for unlinked tokens will be created when token is updated
        }
        tokensUpdate.push(t);
    }
    return {tokens: tokensUpdate};
    }

async function migrateActorData(actor) {

    let updateData = {};
    let itemArray = [];
    let moneyItemsToCreate = [];

    // migrate from damageBonus.agi to damageBonus.agl
    if (actor?.system?.damageBonus?.agi) {
        updateData["system.damageBonus.agl"] = actor.system.damageBonus.agi;
        updateData["system.damageBonus.-=agi"] = null;
    }

    // Migrate currency to money items
    if (actor?.system?.currency) {
        const currency = actor.system.currency;
        const currencyTypes = [
            {field: "gc", abbreviation: "gc"},
            {field: "sc", abbreviation: "sc"},
            {field: "cc", abbreviation: "cc"}
        ];

        for (const currencyType of currencyTypes) {
            const amount = Number(currency[currencyType.field]) || 0;
            if (amount > 0) {
                // Find world money item by abbreviation
                const worldMoneyItem = game.items.find(
                    item => item.type === "money" && item.system.abbreviation === currencyType.abbreviation
                );

                if (worldMoneyItem) {
                    // Check if actor already has this money item
                    const existingMoneyItem = actor.items?.find(
                        item => item.type === "money" && item.system.abbreviation === currencyType.abbreviation
                    );

                    if (existingMoneyItem) {
                        // Update quantity of existing money item
                        const moneyItemUpdate = {
                            _id: existingMoneyItem.id,
                            "system.quantity": (existingMoneyItem.system.quantity || 0) + amount
                        };
                        itemArray.push(foundry.utils.expandObject(moneyItemUpdate));
                    } else {
                        // Create new money item from world item (will be created separately)
                        const moneyItemData = worldMoneyItem.toObject();
                        moneyItemData.system.quantity = amount;
                        delete moneyItemData._id;
                        moneyItemsToCreate.push(moneyItemData);
                    }
                }
            }
        }

        // Clear currency fields after migration
        updateData["system.currency.gc"] = 0;
        updateData["system.currency.sc"] = 0;
        updateData["system.currency.cc"] = 0;
    }

    // Migrate Owned Items
    if (actor?.items) {
        for (let item of actor.items) {
            // Skip money items as they're handled above
            if (item.type === "money") continue;

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
    return {updateData, moneyItemsToCreate};
}


function migrateItemData(item, name) {
    let updateData = {};
    if (item.type === "spell") {
        updateData = migrateSpellData(item, name);
    }
    return updateData;
}

function migrateSpellData(spell, _name) {
    let updateData = {};

    // Added field rangeType
    // - Deprecates field areaOfEffect
    if (!spell.system.rangeType) {
        switch (spell.system.areaOfEffect) {
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
    await pack.configure({locked: false});

    // Begin by requesting server-side data model migration and get the migrated content
    await pack.migrate();
    const documents = await pack.getDocuments();

    // Iterate over compendium entries - applying fine-tuned migration functions
    for (let doc of documents) {
        let updateData = {};
        try {
            switch (entityType) {
                case "Actor": {
                    const migrationResult = await migrateActorData(doc);
                    updateData = migrationResult.updateData || {};
                    // Create money items if needed
                    if (migrationResult.moneyItemsToCreate && migrationResult.moneyItemsToCreate.length > 0) {
                        await doc.createEmbeddedDocuments("Item", migrationResult.moneyItemsToCreate);
                    }
                    break;
                }
                case "Item":
                    updateData = migrateItemData(doc);
                    break;
                case "Scene":
                    updateData = await migrateSceneData(doc);
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
    await pack.configure({locked: wasLocked});
    console.log(`Migrated all ${document} entities from Compendium ${pack.collection}`);
};

export async function updateSpellsOnActors() {
    const worldSpells = game.items.filter(i => i.type === "spell");

    // World Actors
    for (let actor of game.actors.contents) {
        const actorSpells = actor.items.filter(i => i.type === "spell");
        for (const actorSpell of actorSpells) {
            const worldSpell = worldSpells.find(i => i.name === actorSpell.name);
            if (worldSpell) {
                let spellTemplate = duplicate(worldSpell.system);
                delete spellTemplate.memorized;
                delete spellTemplate.school; // General spells will not update correctly
                const template = {system: spellTemplate, img: ""};
                const diff = diffObject(filterObject(actorSpell, template), filterObject(worldSpell, template));
                if (!isEmpty(diff)) {
                    console.log("Updating spell in " + actor.name + " : " + actorSpell.name);
                    await actorSpell.update(diff);
                }
            } else {
                console.log("Could not find " + actorSpell.name + "(" + actor.name + ") in world.")
            }
        }
    }
}

export async function updateItemsOnActors() {
    const worldItems = game.items.filter(i => i.type === "item" || i.type === "weapon");

    // World Actors
    for (let actor of game.actors.contents) {
        const actorItems = actor.items.filter(i => (i.type === "item"));
        for (const actorItem of actorItems) {
            const worldItem = worldItems.find(i => i.name === actorItem.name);
            if (worldItem) {
                const template = {system: worldItem.system, img: ""};
                const diff = diffObject(filterObject(actorItem, template), filterObject(worldItem, template));
                // ignore quantity
                if (diff.system?.quantity && actorItem.system?.quantity != null && worldItem.system?.quantity != null) {
                    delete diff.system.quantity;
                    if (isEmpty(diff.system)) {
                        delete diff.system;
                    }
                }
                if (!isEmpty(diff)) {
                    console.log("Updating item in " + actor.name + " : " + actorItem.name);
                    console.log(diff);
                    await actorItem.update(diff);
                }
            } else {
                console.log("Could not find " + actorItem.name + "(" + actor.name + ") in world.")
            }
        }
    }
}

export async function updateSkillsOnActors() {
    const worldSkills = game.items.filter(i => i.type === "skill");

    // World Actors
    for (let actor of game.actors.contents) {
        const actorSkills = actor.items.filter(i => i.type === "skill");
        for (const actorSkill of actorSkills) {
            const worldSkill = worldSkills.find(i => i.name === actorSkill.name);
            if (worldSkill) {
                // only look for differences in system or img
                let template = {system: duplicate(worldSkill.system), img: ""};
                // these are set by the actor, ignore them
                delete template.system.advance;
                delete template.system.value;

                const diff = diffObject(filterObject(actorSkill, template), filterObject(worldSkill, template));
                if (!isEmpty(diff)) {
                    console.log("Updating skill in " + actor.name + " : " + actorSkill.name);
                    await actorSkill.update(diff);
                }
            } else {
                console.log("Could not find " + actorSkill.name + "(" + actor.name + ") in world.")
            }
        }
    }
}

export async function updateItemImagesOnActors() {
    // World Actors
    for (let actor of game.actors.contents) {
        for (const actorItem of actor.items) {
            const worldItem = game.items.find(i => i.type === actorItem.type && i.name === actorItem.name);
            if (worldItem && worldItem.img !== actorItem.img) {
                console.log("Updating item image in " + actor.name + " : " + actorItem.name);
                console.log(actorItem.img + " -> " + worldItem.img);
                await actorItem.update({img: worldItem.img});
            }
        }
    }
}
