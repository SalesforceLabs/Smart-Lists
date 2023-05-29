import { LightningElement, api } from 'lwc';

import labelEdit from '@salesforce/label/c.Edit';
import labelClose from '@salesforce/label/c.Close';
import labelSave from '@salesforce/label/c.Save';
import labelCancel from '@salesforce/label/c.Cancel';

export default class EditFileModal extends LightningElement {
    @api recordId;
    @api fileTitle;
    @api fields = [];

    labels = {
        labelEdit,
        labelClose,
        labelSave,
        labelCancel
    }

    closeModal() {
        this.notifyParent("cancel");
    }

    handleSaveSuccess(event) {
        this.notifyParent("success", event.detail.fields["Title"].value);
    }
    
    notifyParent(action, fileTitle) {
        this.dispatchEvent(new CustomEvent('close', {detail: {action: action, fileTitle: fileTitle}}));
    }
}