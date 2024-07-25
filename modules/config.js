export const DoD = {};

DoD.abilityTypes = {
    heroic: "DoD.abilityTypes.heroic",
    kin: "DoD.abilityTypes.kin",
    profession: "DoD.abilityTypes.profession"
};

DoD.ageTypes = {
    young: "DoD.ageTypes.young",
    adult: "DoD.ageTypes.adult",
    old: "DoD.ageTypes.old"
};

DoD.itemTypes = {
    item: "DoD.itemTypes.item",
    backpack: "DoD.itemTypes.backpack"
};

DoD.secondaryAttributeTypes = {
    none: "DoD.secondaryAttributeTypes.none",
    hitPoints: "DoD.secondaryAttributeTypes.hitPoints",
    willPoints: "DoD.secondaryAttributeTypes.willPoints",
    movement: "DoD.secondaryAttributeTypes.movement"
};

DoD.spellRangeTypes = {
    range: "DoD.spellRangeTypes.range",
    personal: "DoD.spellRangeTypes.personal",
    touch: "DoD.spellRangeTypes.touch",
    cone: "DoD.spellRangeTypes.cone",
    sphere: "DoD.spellRangeTypes.sphere"
};

DoD.areaOfEffectTypes = {
    none: "DoD.areaOfEffectTypes.none",
    cone: "DoD.areaOfEffectTypes.cone",
    sphere: "DoD.areaOfEffectTypes.sphere"
};

DoD.castingTimeTypes = {
    action: "DoD.castingTimeTypes.action",
    reaction: "DoD.castingTimeTypes.reaction",
    stretch: "DoD.castingTimeTypes.stretch",
    shift: "DoD.castingTimeTypes.shift"
};

DoD.dice = {
    none: "0",
    d4: "D4",
    d6: "D6",
    d8: "D8",
    d10: "D10",
    d12: "D12",
    d20: "D20"
};

DoD.damageTypes = {
    none: "DoD.damageTypes.none",
    bludgeoning: "DoD.damageTypes.bludgeoning",
    piercing: "DoD.damageTypes.piercing",
    slashing: "DoD.damageTypes.slashing"
};

DoD.gripTypes = {
    none: "DoD.gripTypes.none",
    grip1h: "DoD.gripTypes.grip1h",
    grip2h: "DoD.gripTypes.grip2h"
};

DoD.sizeTypes = {
    small: "DoD.sizeTypes.small",
    normal: "DoD.sizeTypes.normal",
    large: "DoD.sizeTypes.large",
    huge: "DoD.sizeTypes.huge",
    swarm: "DoD.sizeTypes.swarm"
};

DoD.skillTypes = {
    core: "DoD.skillTypes.core",
    weapon: "DoD.skillTypes.weapon",
    secondary: "DoD.skillTypes.secondary",
    magic: "DoD.skillTypes.magic"
};

DoD.skillMaximum = 18;

DoD.spellDurationTypes = {
    instant: "DoD.spellDurationTypes.instant",
    round: "DoD.spellDurationTypes.round",
    stretch: "DoD.spellDurationTypes.stretch",
    shift: "DoD.spellDurationTypes.shift",
    concentration: "DoD.spellDurationTypes.concentration",
    permanent: "DoD.spellDurationTypes.permanent",
};

DoD.supplyTypes = {
    common: "DoD.supplyTypes.common",
    uncommon: "DoD.supplyTypes.uncommon",
    rare: "DoD.supplyTypes.rare",
    unique: "DoD.supplyTypes.unique"
};

DoD.weaponFeatureTypes = {
    bludgeoning: "DoD.weaponFeatureTypes.bludgeoning",
    long: "DoD.weaponFeatureTypes.long",
    mounted: "DoD.weaponFeatureTypes.mounted",
    noDamageBonus: "DoD.weaponFeatureTypes.noDamageBonus",
    noparry: "DoD.weaponFeatureTypes.noparry",
    piercing: "DoD.weaponFeatureTypes.piercing",
    quiver: "DoD.weaponFeatureTypes.quiver",
    slashing: "DoD.weaponFeatureTypes.slashing",
    subtle: "DoD.weaponFeatureTypes.subtle",
    thrown: "DoD.weaponFeatureTypes.thrown",
    toppling: "DoD.weaponFeatureTypes.toppling",
    shield: "DoD.weaponFeatureTypes.shield",
    unarmed: "DoD.weaponFeatureTypes.unarmed",
    enchanted1: "DoD.weaponFeatureTypes.enchanted1",
    enchanted2: "DoD.weaponFeatureTypes.enchanted2",
    enchanted3: "DoD.weaponFeatureTypes.enchanted3"
};

DoD.attributes = {
    "str": "DoD.attributes.str",
    "con": "DoD.attributes.con",
    "agl": "DoD.attributes.agl",
    "int": "DoD.attributes.int",
    "wil": "DoD.attributes.wil",
    "cha": "DoD.attributes.cha"
};

DoD.activeEffectChanges = {
    "system.attributes.str.value" : "DoD.attributes.str",
    "system.attributes.con.value" : "DoD.attributes.con",
    "system.attributes.agl.value" : "DoD.attributes.agl",
    "system.attributes.int.value" : "DoD.attributes.int",
    "system.attributes.wil.value" : "DoD.attributes.wil",
    "system.attributes.cha.value" : "DoD.attributes.cha",
    "system.hitPoints.max" : "DoD.secondaryAttributeTypes.hitPoints",
    "system.willPoints.max" : "DoD.secondaryAttributeTypes.willPoints",
    "system.movement.value" : "DoD.ui.character-sheet.movement",
    "system.damageBonus.agl.value" : "DoD.ui.character-sheet.damageBonusAGL",
    "system.damageBonus.str.value" : "DoD.ui.character-sheet.damageBonusSTR",
    "system.ferocity.value" : "DoD.ui.character-sheet.ferocity",
    "system.maxEncumbrance.value" : "DoD.ui.character-sheet.max-encumbrance",
};