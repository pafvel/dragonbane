export default class DoDActiveEffect extends ActiveEffect {
    apply(actor, change) {
        let key = change.key.split(".");
        if (key[0] == "damageBonus") {
            if (key[1] == "agl") {
                if (!actor.system.damageBonus.aglModifiers) {
                    actor.system.damageBonus.aglModifiers = [];
                }
                actor.system.damageBonus.aglModifiers.push(change);
            } else if (key[1] == "str") {
                if (!actor.system.damageBonus.strModifiers) {
                    actor.system.damageBonus.strModifiers = [];
                }
                actor.system.damageBonus.strModifiers.push(change);
            }
            return;
        }
        super.apply(actor, change);
    }
}