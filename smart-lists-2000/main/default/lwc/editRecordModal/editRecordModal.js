import { LightningElement, api } from 'lwc';

import labelNew from '@salesforce/label/c.New';
import labelEdit from '@salesforce/label/c.Edit';
import labelCancel from '@salesforce/label/c.Cancel';
import labelNext from '@salesforce/label/c.Next';
import labelWasCreated from '@salesforce/label/c.WasCreated';
import labelWasSaved from '@salesforce/label/c.WasSaved';

export default class EditRecordModal extends LightningElement {
    // ATTRIBUTES
    @api objectName;
    @api objectLabel;
    @api parentRecordField;
    @api parentRecordId;
    @api recordId;
    @api recordTypes = [];

    // DATA
    recordTypeId = null;
    showRecordTypes = false;
    title;

    // LABELS
    labels = {
        labelEdit,
        labelNew,
        labelCancel,
        labelNext,
        labelWasCreated,
        labelWasSaved
    }

    // Initialize record types and dialog title
    connectedCallback() {
        if (!this.recordId && this.recordTypes && this.recordTypes.length > 0) {
            for (let recordType of this.recordTypes) {
                if (recordType.isDefault) {
                    this.recordTypeId = recordType.value;
                    break;
                }
            }
            if (!this.recordTypeId)
                this.recordTypeId = this.recordTypes[0].value;
            if (this.recordTypes.length > 1)
                this.showRecordTypes = true;
        }
        this.title = (this.recordId ? this.labels.labelEdit : this.labels.labelNew) + ' ' + this.objectLabel;
    }

    // A record type has been selected
    handleSelectRecordType(event) {
        this.recordTypeId = event.detail.value;
    }

    // Next has been clicked on record types page
    handleNext() {
        this.showRecordTypes = false;
    }

    // Save have been clicked
    handleSubmit(event) {
        event.preventDefault(); // prevent default submit behavior
        const fields = event.detail.fields;
        // Add parent id field for child lists
        if (this.parentRecordField)
            fields[this.parentRecordField] = this.parentRecordId;
        this.template.querySelector('lightning-record-form').submit(fields);
    }

    // Save action succesful
    handleSuccess(event) {
        const actionLabel = this.recordId ? this.labels.labelWasSaved : this.labels.labelWasCreated;
        this.notifyParent("success", this.recordId ? "update" : "create", this.objectLabel + ' ' + actionLabel, event.detail.id);
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