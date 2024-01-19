import { LightningElement, api } from 'lwc';

export default class DatatablePercentViewer extends LightningElement {
    @api value;
    @api fractionDigits;
    displayValue;

    _value;

    get value() {
        return this._value;
    }
    /**
     * @param {any} val
     */
    set value(val) {
        this._value = val;
        if (val)
            this.displayValue = this._value / 100;
        else
            this.displayValue = null;
    }
}