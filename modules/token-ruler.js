const BaseRuler = foundry.canvas.placeables?.tokens?.TokenRuler ?? class {};

export default class DoDTokenRuler extends BaseRuler {
    
    static WAYPOINT_LABEL_TEMPLATE = "systems/dragonbane/templates/partials/waypoint-label.hbs";

    static GRID_HIGHLIGHT_STYLES = {
        move: {color: 0x00604D},
        dash: {color: 0xaaaa00},
        outOfRange: {color: 0xE83031}
    };

    /** @override */
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

    /** @override */
    _getGridHighlightStyle(waypoint, offset) {
        if (!this.token.actor || waypoint.action === "blink") {
            return super._getGridHighlightStyle(waypoint, offset);
        }
        const movement = this.token.actor.system.movement.value;
        const cost = waypoint.measurement.cost;
        if (cost > 2 * movement) {
            return DoDTokenRuler.GRID_HIGHLIGHT_STYLES.outOfRange;
        } else if (cost <= movement) {
            return DoDTokenRuler.GRID_HIGHLIGHT_STYLES.move;
        } else {
            return DoDTokenRuler.GRID_HIGHLIGHT_STYLES.dash;
        }
    }
}
