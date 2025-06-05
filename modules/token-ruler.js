const BaseRuler = foundry.canvas.placeables?.tokens?.TokenRuler ?? class {};

export default class DoDTokenRuler extends BaseRuler {
    
    static WAYPOINT_LABEL_TEMPLATE = "systems/dragonbane/templates/partials/waypoint-label.hbs";

    _getWaypointLabelContext(waypoint, state) {
        const context = super._getWaypointLabelContext(waypoint, state);
        if (context?.cost?.units === "m") {
            const movement = this.token?.actor?.system.movement.value;
            const total = Number(context.cost.total);
            if (total > 2 * movement) {
                context.rangeClass = "out-of-range";
            } else if (total <= movement) {
                context.rangeClass = "move-range";
            } else {
                context.rangeClass = "dash-range";
            }
        }
        return context;
    }
}