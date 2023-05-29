import { LightningElement, api } from 'lwc';

import labelApply from '@salesforce/label/c.Apply';
import labelClose from '@salesforce/label/c.Close';
import labelCancel from '@salesforce/label/c.Cancel';
import labelAvailable from '@salesforce/label/c.Available';
import labelSelections from '@salesforce/label/c.Selections';


export default class FilterPanelPicklistModal extends LightningElement {
    @api context;

    // LABELS
    labels = {
        labelApply,
        labelClose,
        labelCancel,
        labelAvailable,
        labelSelections
    }

    // ARRAY OF SELECTED VALUES IN THE DUAL SELECTOR
    selections;

    // Selection has changed
    handleChange(e) {
        this.selections = e.detail.value;
    }
    // Close/Cancel modal
    closeModal() {
        this.notifyParent("cancel");
    }

    // Apply button has been clicked
    handleApply() {
        this.notifyParent("apply");
    }

    // Notify parent of the result of the action in the dialog
    notifyParent(action) {
        this.dispatchEvent(new CustomEvent('close', { detail: { action: action, field: this.context.field, selections: this.selections } }));
    }
}