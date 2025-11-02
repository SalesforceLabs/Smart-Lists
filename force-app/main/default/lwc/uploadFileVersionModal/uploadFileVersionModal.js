import { LightningElement, api } from 'lwc';

import labelClose from '@salesforce/label/c.Close';
import labelCancel from '@salesforce/label/c.Cancel';
import labelUploadNewVersion from '@salesforce/label/c.UploadNewVersion';

export default class UploadFileVersionModal extends LightningElement {
    // LABELS
    labels = {
        labelClose,
        labelCancel,
        labelUploadNewVersion,
    }

    // Close/Cancel button has been clicked
    closeModal() {
        this.notifyParent("cancel");
    }

    // Notify parent of action results
    notifyParent(action, id, message) {
        this.dispatchEvent(new CustomEvent('close', { detail: { action: action, id: id, message: message } }));
    }
}