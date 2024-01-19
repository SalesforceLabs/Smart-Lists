import { LightningElement, api, wire } from 'lwc';
import labelNoneValue from "@salesforce/label/c.NoneValue";
import { getPicklistValuesByRecordType } from "lightning/uiObjectInfoApi";

export default class PicklistEditor extends LightningElement {
    @api value; // Label of the value -> datatable is expecting the display value in a variable called value
    @api comboValue;
    @api options;
    @api required;
    @api fieldName;
    @api objectName;
    @api recordTypeId;
    @api recordId;
    optionsMap = new Map();
    rendered = false;

    @wire(getPicklistValuesByRecordType, { objectApiName: '$objectName', recordTypeId: '$recordTypeId' })
    wiredRecordDefaults({ data, error }) {
        if (data) {
            const fieldValues = data.picklistFieldValues[this.fieldName];
            if (!fieldValues)
                console.log('values not found: ' + this.objectName + '.' + this.fieldName);
            else {
                if (!this.required) {
                    this.optionsMap.set("", { label: labelNoneValue, value: "" });
                    if (!this.value)
                        this.comboValue = "";
                }
                for (const value of fieldValues.values) {
                    this.optionsMap.set( value.value, { label: value.label, value: value.value});
                    // Set combobox value from label (ToLabel) returned by Apex Controller
                    if (this.value === value.label)
                        this.comboValue = value.value;
                }
                this.options = Array.from(this.optionsMap.values());
            }
        } else if (error) {
            console.log("Picklist Editor Error : " + JSON.stringify(error));
        }
    }

    
    renderedCallback() {
        if (!this.rendered) {
            this.template.querySelector('lightning-combobox').focus();
            this.rendered = true;
        }
    }

    handleChange(e) {
        e.stopPropagation();
        this.comboValue = e.detail.value;
        this.value = this.optionsMap.get(this.comboValue).label;
        this.editedValue = this.value;
        const detail = { value: this.comboValue, label: this.value, fieldName: this.fieldName, recordId: this.recordId };
        this.dispatchEvent(new CustomEvent('celledited', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: detail
        }));
    }

    @api get validity() {
        return this.template.querySelector('lightning-combobox').validity;
    }

    @api showHelpMessageIfInvalid() {
        this.template.querySelector('lightning-combobox').showHelpMessageIfInvalid();
    }
}