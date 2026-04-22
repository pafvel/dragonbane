import { DoD } from "../../config.js";
import DoD_Utility from "../../utility.js";

export default class StepDiceField extends foundry.data.fields.StringField {

    constructor(options, context) {
        super(options, context);
        this.choices = Object.keys(DoD.dice);
    }

    clean(value, options, state) {
        let dice = super.clean(value, options, state);
        for (const [k, v] of Object.entries(DoD.dice)) {
            if (dice === v || dice === k) return k;
        }
        return this.choices[0];
    }

    #applyChangeAddSub(value, delta) {
        const v = this.clean(value);
        let index = this.choices.findIndex(e => e == v);
        if (index == -1) return value;
        index = DoD_Utility.clamp(index + delta, 0, this.choices.length-1);
        return this.choices[index];
    }

    _applyChangeAdd(value, _delta, _model, change) {
        let i = parseInt(change.value);
        if(!isNaN(i)) {
            return this.#applyChangeAddSub(value, i);
        }
        return value;
    }

    _applyChangeSubtract(value, _delta, _model, change) {
        let i = parseInt(change.value);
        if(!isNaN(i)) {
            return this.#applyChangeAddSub(value, -i);
        }
        return value;
    }

    _applyChangeUpgrade(value, _delta, _model, change) {
        const v = this.clean(value);
        const d = this.clean(change.value);
        const vi  = this.choices.findIndex(e => e == v);
        const di  = this.choices.findIndex(e => e == d);
        const index = DoD_Utility.clamp(Math.max(vi, di), 0, this.choices.length-1);
        return this.choices[index];
    }

    _applyChangeDowngrade(value, _delta, _model, change) {
        const v = this.clean(value);
        const d = this.clean(change.value);
        const vi  = this.choices.findIndex(e => e == v);
        const di  = this.choices.findIndex(e => e == d);
        const index = DoD_Utility.clamp(Math.min(vi, di), 0, this.choices.length-1);
        return this.choices[index];
    }
}
