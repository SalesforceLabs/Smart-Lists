import { LightningElement, api } from 'lwc';

import labelEdit from '@salesforce/label/c.Edit';
import labelClose from '@salesforce/label/c.Close';
import labelSave from '@salesforce/label/c.Save';
import labelCancel from '@salesforce/label/c.Cancel';
import labelSaving from '@salesforce/label/c.Saving';

export default class EditFileModal extends LightningElement {
    @api recordId;
    @api fileTitle;
    @api fields = [];

    labels = {
        labelEdit,
        labelClose,
        labelSave,
        labelCancel,
        labelSaving
    }
    // UI CONTROL
    saving = false;

    closeModal() {
        this.notifyParent("cancel");
    }

    handleSubmit(event) {
        console.log('submit');
        event.preventDefault();
        // Display spinner
        setTimeout(() => {
            this.saving = true;
        }, 0);
        this.template.querySelector('lightning-record-edit-form').submit(event.detail.fields);
    }

    handleSaveSuccess(event) {
        this.notifyParent("success", event.detail.fields["Title"].value);
    }
    
    notifyParent(action, fileTitle) {
        this.dispatchEvent(new CustomEvent('close', {detail: {action: action, fileTitle: fileTitle}}));
    }
}