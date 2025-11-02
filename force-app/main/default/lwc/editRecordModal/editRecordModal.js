import { LightningElement, api } from 'lwc';

import labelNew from '@salesforce/label/c.New';
import labelEdit from '@salesforce/label/c.Edit';
import labelLoading from '@salesforce/label/c.Loading';
import labelSaving from '@salesforce/label/c.Saving';
import labelClose from '@salesforce/label/c.Close';
import labelNext from '@salesforce/label/c.Next';
import labelRequiredInformation from '@salesforce/label/c.RequiredInformation';
import labelCancel from '@salesforce/label/c.Cancel';
import labelSave from '@salesforce/label/c.Save';
import labelWasCreated from '@salesforce/label/c.WasCreated';
import labelWasSaved from '@salesforce/label/c.WasSaved';
import labelErrors from '@salesforce/label/c.Errors';
import labelReviewPageErrors from '@salesforce/label/c.ReviewPageErrors';
import labelReviewFieldsErrors from '@salesforce/label/c.ReviewFieldsErrors';

export default class EditRecordModal extends LightningElement {
    // ATTRIBUTES
    @api objectName;
    @api objectLabel;
    @api parentRecordField;
    @api parentRecordId;
    @api recordId;
    @api recordTypes = [];

    // DATA
    // Record type id selected for new record
    recordTypeId = null;
    // Control the display of the select record types forms
    showRecordTypes = false;
    // Title of the form
    title;
    // Spinner descriptive text + spinner displayed if not null
    spinnerState = null;
    // new record mode
    get newRecord() {
        return !this.recordId;
    }
    // Sections, Rows and fields for the form new/edit form
    sections = [];
    // Form errors initialized
    formErrorsInitialized = false;
    // List of form level errors to display in the popover
    formErrors = [];
    // True if has form errors
    get hasFormErrors() {
        return this.formErrors.length > 0;
    }
    // List of field level errors to display in the popover
    fieldErrors = [];
    // True if has field errors
    get hasFieldErrors() {
        return this.fieldErrors.length > 0;
    }
    // Errors button visibility status: visible / hidden 
    errorsButtonStatus = false;
    // Errors form visibility status: visible / hidden
    errorsFormStatus = false;

    // LABELS
    labels = {
        labelEdit,
        labelNew,
        labelLoading,
        labelSaving,
        labelClose,
        labelNext,
        labelRequiredInformation,
        labelSave,
        labelCancel,
        labelWasCreated,
        labelWasSaved,
        labelErrors,
        labelReviewPageErrors,
        labelReviewFieldsErrors
    }

    // Initialize record types and dialog title
    connectedCallback() {
        if (this.newRecord) {
            if (this.recordTypes && this.recordTypes.length > 0) {
                for (let recordType of this.recordTypes) {
                    if (recordType.isDefault) {
                        this.recordTypeId = recordType.value;
                        break;
                    }
                }
                if (!this.recordTypeId)
                    this.recordTypeId = this.recordTypes[0].value;
                if (this.recordTypes.length > 1) {
                    this.showRecordTypes = true;
                    this.setFormTitle();
                }
                else {
                    this.setFormTitle(this.getRecordTypeLabel(this.recordTypeId));
                    this.setLoadingState();
                }
            } else {
                this.setFormTitle();
                this.setLoadingState();
            }
        } else {
            this.setFormTitle();
            this.setLoadingState();
        }
    }

    // Get label of the selected record type
    getRecordTypeLabel(recordTypeId) {
        for (let recordType of this.recordTypes) {
            if (recordType.value === recordTypeId)
                return recordType.label;
        }
    }

    // Set the form label based on the action type and the optional label data
    setFormTitle(label) {
        let title;
        if (this.newRecord) {
            title = this.labels.labelNew + ' ' + this.objectLabel;
            if (label)
                title += ': ' + label;
        } else {
            title = this.labels.labelEdit;
            if (label)
                title += ' ' + label;
        }
        this.title = title;
    }

    // Set loading state in the entry form
    setLoadingState() {
        this.spinnerState = this.labels.labelLoading;
    }

    // Get object, record and layout data; triggered by RecordEditForm
    handleLoad(event) {
        const data = event.detail;
        //console.log('data ' + JSON.stringify(data));
        //console.log('ParentIdField ' + this.parentRecordField + ' ' + this.parentRecordId);
        const objectInfoFields = data.objectInfos[this.objectName].fields;
        const recordFields = this.newRecord ? data.record.fields : data.records[this.recordId].fields;
        let layout;
        if (this.newRecord)
            layout = data.layout;
        else {
            const base = data.layouts[this.objectName];
            layout = base[Object.keys(base)[0]].Full.View;
            // Update title with record name
            if (!this.newRecord) {
                const nameFields = data.objectInfos[this.objectName].nameFields;
                if (nameFields.length == 1 && recordFields[nameFields[0]])
                    this.setFormTitle(recordFields[nameFields[0]].value);
                else if (nameFields[0] === 'FirstName')
                    this.setFormTitle(recordFields[nameFields[0]].value + ' ' + recordFields[nameFields[1]].value);
            }
        }
        let sections = [];
        let sectionsCounters = 0;
        let rowsCounters = 0;
        for (let section of layout.sections) {
            const fieldClass = "slds-col slds-has-flexi-truncate slds-size_1-of-" + section.columns;
            const newSection = { label: section.heading, rows: [], fieldClass: fieldClass, id: sectionsCounters++ };
            for (let row of section.layoutRows) {
                let fieldsCounter = 0;
                const newRow = { items: [], id: rowsCounters++ }
                for (let item of row.layoutItems) {
                    if (item.layoutComponents[0].componentType === "Field") {
                        let apiName = item.layoutComponents[0].apiName;
                        if (apiName && Object.hasOwn(recordFields, apiName)) {
                            fieldsCounter++;
                            const editable = this.newRecord ?
                                item.editableForNew && objectInfoFields[apiName].createable :
                                item.editableForUpdate && objectInfoFields[apiName].updateable;
                            const label = item.label;
                            if (objectInfoFields[apiName].compoundFieldName)
                                apiName = objectInfoFields[apiName].compoundFieldName;
                            /*let fieldValue;
                            const compoundFieldName = objectInfoFields[apiName].compoundFieldName;
                            if (compoundFieldName) {
                                apiName = compoundFieldName;
                                fieldValue = {};
                                for (let comp of item.layoutComponents) {
                                    fieldValue[comp.apiName] = recordFields[comp.apiName].value;
                                }
                            }/* else {
                                // Pre-populate parent ID for child list
                                if (apiName === this.parentRecordField && this.newRecord && this.parentRecordField)
                                    fieldValue = this.parentRecordId;
                                else
                                    fieldValue = recordFields[apiName].value;
                            }*/
                            const required = (objectInfoFields[apiName].required || item.required) && objectInfoFields[apiName].dataType !== 'Boolean';
                            //console.log('PRF ' + (apiName === this.parentRecordField));
                            if (apiName === this.parentRecordField && this.newRecord && this.parentRecordField) {
                                newRow.items.push({
                                    apiName: apiName, label: label, value: this.parentRecordId,
                                    editable: editable, required: required, isField: true
                                })
                                //console.log('  ' + JSON.stringify(newRow.items));

                            } else {
                                newRow.items.push({
                                    apiName: apiName, label: label,
                                    editable: editable, required: required, isField: true
                                })
                            }
                        }
                    } else if (item.layoutComponents[0].componentType === "EmptySpace") {
                        newRow.items.push({ isEmptySpace: true });
                    }
                }
                if (fieldsCounter > 0 && newRow.items.length > 0)
                    newSection.rows.push(newRow);
            }
            if (newSection.rows.length > 0)
                sections.push(newSection);
        }
        this.sections = [...sections];
        //console.log('sections ' + JSON.stringify(this.sections));
        this.spinnerState = null;
    }

    // A record type has been selected
    handleRecordTypeSelected(event) {
        this.recordTypeId = event.detail.value;
    }

    // Next has been clicked on record types page
    handleNext() {
        this.showRecordTypes = false;
        this.setFormTitle(this.getRecordTypeLabel(this.recordTypeId));
        this.setLoadingState();
    }

    // Handle submit
    fieldErrors = [];
    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        fields[this.parentRecordField] = this.parentRecordId;
        //console.log('Submit fields ' + JSON.stringify(fields));
        // Hide errors form if needed
        if (this.errorsFormStatus)
            this.handleShowErrors();
        // Hide errors button if needed
        if (this.errorsButtonStatus)
            this.showErrorsButton();
        // Display spinner
        setTimeout(() => {
            this.spinnerState = this.labels.labelSaving;
        }, 0);
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    // Save action successful
    handleSuccess(event) {
        this.spinnerState = null;
        const actionLabel = this.recordId ? this.labels.labelWasSaved : this.labels.labelWasCreated;
        this.notifyParent("success", this.recordId ? "update" : "create", this.objectLabel + ' ' + actionLabel, event.detail.id);
    }

    // Save action unsuccessful: display errors
    handleError(event) {
        this.spinnerState = null;
        let formErrors = [];
        let fieldErrors = [];
        if (event.detail.output.errors) {
            let errorCounter = 0;
            for (const error of event.detail.output.errors) {
                formErrors.push({ id: errorCounter++, error: error.message});
            }
        }
        if (event.detail.output.fieldErrors) {
            let errorCounter = 0;
            Object.keys(event.detail.output.fieldErrors).forEach(function(key) {
                const field = event.detail.output.fieldErrors[key];
                fieldErrors.push({ id: errorCounter++, field: field[0].field, label: field[0].fieldLabel});
            });
        }
        if (formErrors.length > 0 || fieldErrors.length > 0) {
            this.formErrors = [...formErrors];
            this.fieldErrors = [...fieldErrors];
            this.showErrorsButton();
            this.handleShowErrors();
        }
    }

    // Show/hide errors button
    showErrorsButton() {
        this.errorsButtonStatus = !this.errorsButtonStatus;
        const errorButton = this.template.querySelector('.sl-form-errors-button');
        errorButton.classList.toggle("slds-hide");
    }

    // Show/hide form errors popover
    handleShowErrors() {
        this.errorsFormStatus = !this.errorsFormStatus;
        const popover = this.template.querySelector('.sl-errors-popover');
        popover.classList.toggle("slds-hide");
        if (!this.formErrorsInitialized) {
            const errorButton = this.template.querySelector('.sl-form-errors-button');
            const x = errorButton.getBoundingClientRect().left - 12;
            popover.style.left = x + "px";
            this.formErrorsInitialized = true;
        }
    }

    // Set the focus to a field with error
    handleFieldError(event) {
        this.handleShowErrors();
        const fieldError = event.target;
        const inputField = this.template.querySelector('[data-field="' + fieldError.dataset.field + '"]');
        inputField.scrollIntoView();
        inputField.focus();
    }

    // Close/Cancel modal
    closeModal() {
        this.notifyParent("cancel");
    }

    // Notify parent of the result of the action in the dialog
    notifyParent(action, type, msg, id) {
        this.dispatchEvent(new CustomEvent('close', { detail: { action: action, type: type, msg: msg, id: id } }));
    }
}