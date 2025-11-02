import { LightningElement, api, wire } from 'lwc';
import labelNoneValue from "@salesforce/label/c.NoneValue";
import { getPicklistValuesByRecordType } from "lightning/uiObjectInfoApi";

import {
    Datatype
} from 'c/datatypeUtils';

export default class DatatableCellEditor extends LightningElement {
    // COMPONENT PROPERTIES
    @api internalTabIndex;
    @api value;
    _typeData;
    @api get typeData() {
        return this._typeData;
    }
    set typeData(val) {
        this._typeData = val;
        this.datatype = new Datatype(val.editType);
        this.required = val.required;
        this.lookup = val.lookup;
        this.apiName = val.apiName;
        this.objectName = val.objectName;
        this.relatedIdField = val.relatedIdField;
    }
    // Picklist & Lookup properties
    @api recordId;
    // Picklist properties
    @api recordTypeId;
    // Lookup properties
    @api relatedRecordId;

    // COMPONENT VARIABLES
    editedValue;
    datatype;
    type;
    required;
    // Picklist & Lookup variables
    objectName;
    apiName;
    // Picklist variables
    @api comboValue;
    COMBO_NONE = 'none';
    // Lookup variables
    objectIcon;
    objectLabel;
    titleField;
    subtitleField;
    targetField;
    soqlFilter;

    // Lookup properties
    lookupObjects = [];
    lookupValue;
    // Picklist properties
    comboOptions;
    // Rich Text Area properties
    rtaFormats = [
        'font',
        'size',
        'bold',
        'italic',
        'underline',
        'strike',
        'list',
        'indent',
        'align',
        'link',
        'image',
        'clean',
        'table',
        'header',
        'color',
    ];

    // Initialize the properties for the editor type
    connectedCallback() {
        this.typeData = this.typeData;
        this.editedValue = this.value;
        if (this.datatype.isLookup) {
            this.lookupObjects = [this.lookup];
            this.lookupValue = this.relatedRecordId && this.value !== ' '  && this.value ?
                { title: this.value, id: this.relatedRecordId, icon: this.lookup.iconName } : {};
        }
    }

    // Input functions
    handleInputChange(event) {
        this.value = event.detail.value;
    }

    // Lookup functions
    handleLookupChange(event) {
        const value = event.detail.value;
        const detail = {
            value: value.id, label: value.title, fieldName: this.apiName,
            relatedIdField: this.relatedIdField, recordId: this.recordId
        };
        this.dispatchEvent(new CustomEvent('celledited', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: detail
        }));
        this.value = value.id ? value.title : ' ';
    }

    // Picklist functions
    @wire(getPicklistValuesByRecordType, { objectApiName: '$objectName', recordTypeId: '$recordTypeId' })
    wiredRecordDefaults({ data, error }) {
        if (data) {
            const fieldValues = data.picklistFieldValues[this.apiName];
            if (!fieldValues)
                console.log('Picklist Editor - values not found: ' + this.objectName + '.' + this.apiName);
            else {
                const comboOptions = [];
                const comboValues = [];
                if (!this.value && this.datatype.isPicklist) {
                    this.value = this.COMBO_NONE;
                    comboValues.push(this.COMBO_NONE);
                }
                const values = this.value ? this.value.split(';') : [];
                comboOptions.push({ label: labelNoneValue, value: this.COMBO_NONE });
                const isCurrencyCode = this.apiName === 'CurrencyIsoCode';
                for (const value of fieldValues.values) {
                    const label = this.datatype.isPicklist && isCurrencyCode ? value.value : value.label;
                    comboOptions.push( { label: label, value: value.value});
                    // Set combobox value from label (ToLabel) returned by Apex Controller (except for CurrencyIsoCode)
                    if (values.includes(label))
                        comboValues.push(value.value);
                }
                this.comboOptions = [...comboOptions];
                this.comboValue = comboValues.join(';');
            }
        } else if (error) {
            console.log("Picklist Editor Error : " + JSON.stringify(error));
        }
    }

    handleComboChange(e) {
        //e.stopPropagation();
        if (e.detail.value === this.COMBO_NONE) {
            this.comboValue = null;
            this.value = null;

        } else {
            this.comboValue = e.detail.value;
            this.value = e.detail.label;
        }
        const detail = { value: this.comboValue, label: this.value, fieldName: this.apiName, recordId: this.recordId };
        this.dispatchEvent(new CustomEvent('celledited', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: detail
        }));
    }

    // Checkbox functions
    handleCheckboxChange(event) {
        this.value = event.target.checked;
    }

    handleRTAKeyDown(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    // Focus Management
    handleComponentFocus() {
        this.dispatchEvent(new CustomEvent('focus'));
    }

    handleComponentBlur() {
        if (this.datatype.isPicklist && this.value === this.COMBO_NONE) {
            this.value = undefined;
            this.comboValue = null;
         } else if (this.datatype.isLookup && (!this.value || this.value.length === 0))
            this.value = undefined;
        this.dispatchEvent(new CustomEvent('blur'));
    }

    // Editor functions
    @api get validity() {
        if (this.datatype.isRichText)
            return { valid: true};
        else
            return this.template.querySelector(".sl-editor").validity;
    }

    @api showHelpMessageIfInvalid() {
        if ((!this.datatype.isBoolean && !this.datatype.isRichText)) {
            this.template.querySelector(".sl-editor").showHelpMessageIfInvalid();
        }
    }

    @api focus() {
        this.template.querySelector(".sl-editor").focus();
    }
}