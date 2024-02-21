import { LightningElement, api, wire } from 'lwc';
import labelNoneValue from "@salesforce/label/c.NoneValue";
import { getPicklistValuesByRecordType } from "lightning/uiObjectInfoApi";

import {
    FieldTypes
} from 'c/datatypeUtils';

export default class DatatableCellEditor extends LightningElement {
    // COMPONENT PROPERTIES
    @api value;
    _typeData;
    @api get typeData() {
        return this._typeData;
    }
    set typeData(val) {
        this._typeData = val;
        this.editType = val.editType;
        this.required = val.required;
        this.objectName = val.objectName;
        this.apiName = val.apiName;
        this.objectIcon = val.objectIcon;
        this.objectLabel = val.objectLabel;
        this.titleField = val.titleField;
        this.subtitleField = val.subtitleField;
        this.relatedIdField = val.relatedIdField;
    }
    // Picklist & Lookup properties
    @api recordId;
    // Picklist properties
    @api recordTypeId;
    // Lookup properties
    @api relatedRecordId;

    // COMPONENT VARIABLES
    type;
    required;
    // Picklist & Lookup variables
    objectName;
    apiName;
    // Picklist variables
    @api comboValue;
    // Lookup variables
    objectIcon;
    objectLabel;
    titleField;
    subtitleField;
    targetField;

    // Type of lightning-input
    inputType;
    // Type of editor
    isBoolean;
    isLookup;
    isNumber;
    isPercent;
    isRichText;
    isTextArea;
    // Type of control for validity and focus functions
    controlType;
    // Lookup properties
    lookupObjects = [];
    lookupValue;
    // Picklist properties
    comboOptions;
    comboOptionsMap = new Map();

    // Initialize the properties for the editor type
    connectedCallback() {
        if (this.editType === FieldTypes.BOOLEAN) {
            this.isBoolean = true;
        } else if (this.editType === FieldTypes.PICKLIST) {
            this.isPicklist = true;
        } else if (this.editType === FieldTypes.LOOKUP) {
            this.isLookup = true;
            this.lookupObjects = [{
                value: this.objectName, titleField: this.titleField, subtitleField: this.subtitleField,
                label: this.objectLabel, iconName: this.objectIcon
            }];
            this.lookupValue = this.relatedRecordId && this.value !== ' '  && this.value ?
                { title: this.value, id: this.relatedRecordId, icon: this.objectIcon } : {};
        } else if (this.editType === FieldTypes.NUMBER || this.editType === FieldTypes.CURRENCY) {
            this.isNumber = true;
        } else if (this.editType === FieldTypes.PERCENT) {
            this.isPercent = true;
        } else if (this.editType === FieldTypes.TEXTAREA || this.editType === FieldTypes.LONG_TEXTAREA) {
            this.isTextArea = true;
        } else if (this.editType === FieldTypes.RICH_TEXT) {
            this.isRichText = true;
        } else {
            if (this.editType === FieldTypes.DATE)
                this.inputType = "date";
            else if (this.editType === FieldTypes.DATETIME)
                this.inputType = "datetime";
            else if (this.editType === FieldTypes.TIME) {
                this.inputType = "time";
            }
            else if (this.editType === FieldTypes.PHONE)
                this.inputType = "tel";
            else if (this.editType === FieldTypes.EMAIL)
                this.inputType = "email";
            else
                this.inputType = "text";
        }
    }

    // Input functions
    handleInputChange(event) {
        event.stopPropagation();
        this.value = event.detail.value;
    }

    // Lookup functions
    handleLookupChange(event) {
        const value = event.detail;
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
                if (!this.required) {
                    this.comboOptionsMap.set("", { label: labelNoneValue, value: "" });
                    if (!this.value)
                        this.comboValue = "";
                }
                for (const value of fieldValues.values) {
                    this.comboOptionsMap.set( value.value, { label: value.label, value: value.value});
                    // Set combobox value from label (ToLabel) returned by Apex Controller
                    if (this.value === value.label)
                        this.comboValue = value.value;
                }
                this.comboOptions = Array.from(this.comboOptionsMap.values());
            }
        } else if (error) {
            console.log("Picklist Editor Error : " + JSON.stringify(error));
        }
    }

    handleComboChange(e) {
        e.stopPropagation();
        this.comboValue = e.detail.value;
        this.value = this.comboOptionsMap.get(this.comboValue).label;
        const detail = { value: this.comboValue, label: this.value, fieldName: this.apiName, recordId: this.recordId };
        this.dispatchEvent(new CustomEvent('celledited', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: detail
        }));
    }

    // Prevent close of picklist editor when several values are selected
    handleComboMouseDown(e) {
        e.preventDefault();
    }

    // Checkbox functions
    handleCheckboxClick(event) {
        this.value = event.target.checked;
        this.template.querySelector(".sl-editor").click();
    }

    // Editor functions
    @api get validity() {
        return this.template.querySelector(".sl-editor").validity;
    }

    @api showHelpMessageIfInvalid() {
        this.template.querySelector(".sl-editor").showHelpMessageIfInvalid();
    }

    @api focus() {
        this.template.querySelector(".sl-editor").focus();
    }
}