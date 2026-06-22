/**
 * Returns a comparator for sorting spells by the given priority list.
 * Only the explicitly listed keys are compared; equal entries fall back
 * to natural order via JavaScript's stable sort.
 *
 * @param {Array<{key: string, direction?: "asc"|"desc"}>} priority
 * @returns {(a: Item, b: Item) => number}
 */
export function compareSpellsByPriority(priority) {
    const lang = game.i18n.lang;

    return function(a, b) {
        for (const { key, direction } of priority) {
            const desc = direction === "desc";
            let cmp;
            if (key === "rank") {
                cmp = a.system.rank - b.system.rank;
            } else {
                const aRaw = key === "school" ? a.system.school : a.name;
                const bRaw = key === "school" ? b.system.school : b.name;
                cmp = game.i18n.localize(aRaw).localeCompare(game.i18n.localize(bRaw), lang, { sensitivity: "accent" });
            }
            if (cmp !== 0) return desc ? -cmp : cmp;
        }
        return 0;
    };
}

/**
 * Returns actor spells (rank > 0, types spell and recipe) sorted by priority.
 * Empty priority returns spells in their natural item.sort order.
 *
 * @param {Actor} actor
 * @param {Array<{key: string, direction?: "asc"|"desc"}>} priority
 * @returns {Item[]}
 */
export function getSortedSpells(actor, priority) {
    const spells = actor.items.filter(i => i.isSpellType && i.system.rank > 0);
    if (priority.length === 0) return spells;
    return spells.sort(compareSpellsByPriority(priority));
}

