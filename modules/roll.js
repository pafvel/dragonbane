export default class DoDRoll extends Roll {

/**
   * The HTML template used to render an expanded Roll tooltip to the chat log
   * @type {string}
   */
static TOOLTIP_TEMPLATE = "systems/dragonbane/templates/partials/tooltip.hbs";

  /**
   * Render the tooltip HTML for a Roll instance
   * @return {Promise<string>}      The rendered HTML tooltip as a string
   */
  async getTooltip() {
    const parts = this.dice.map(d => d.getTooltipData());
    let options = {boons: Object.values(this.options.boons), banes: Object.values(this.options.banes)};
    if (this.options.extraBoons) {
        options.boons.push("+" + this.options.extraBoons);
    }
    if (this.options.extraBanes) {
        options.banes.push("+" + this.options.extraBanes);
    }
    return renderTemplate(this.constructor.TOOLTIP_TEMPLATE, { parts, options });
  }


}