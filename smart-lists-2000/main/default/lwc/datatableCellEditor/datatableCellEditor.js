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
    editedValue;
    datatype;
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

    // Lookup properties
    lookupObjects = [];
    lookupValue;
    // Picklist properties
    comboOptions;
    comboOptionsMap = new Map();
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
        this.editedValue = this.value;
        if (this.datatype.isLookup) {
            this.lookupObjects = [{
                value: this.objectName, titleField: this.titleField, subtitleField: this.subtitleField,
                label: this.objectLabel, iconName: this.objectIcon
            }];
            this.lookupValue = this.relatedRecordId && this.value !== ' '  && this.value ?
                { title: this.value, id: this.relatedRecordId, icon: this.objectIcon } : {};
        }
    }

    // Input functions
    handleInputChange(event) {
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
        //e.stopPropagation();
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