import { LightningElement, api } from 'lwc';

import { deleteRecord } from 'lightning/uiRecordApi';

import labelDeleteRecordTitle from '@salesforce/label/c.DeleteRecordTitle';
import labelDelete from '@salesforce/label/c.Delete';
import labelWasDeleted from '@salesforce/label/c.WasDeleted';
import labelClose from '@salesforce/label/c.Close';
import labelCancel from '@salesforce/label/c.Cancel';
import labelDeleting from '@salesforce/label/c.Deleting';

export default class DeleteRecordModal extends LightningElement {
  // ATTRIBUTES
  @api recordId;
  @api objectLabel;
  @api message;
  // DIALOG DATA
  title
  deleting = false;

  // LABELS
  labels = {
    labelDeleteRecordTitle,
    labelDelete,
    labelWasDeleted,
    labelClose,
    labelCancel,
    labelDeleting
  }

  // Initialize dialog title
  connectedCallback() {
    this.title = this.labels.labelDeleteRecordTitle.replace('{0}', this.objectLabel);
  }

  // Close/Cancel modal
  closeModal() {
    this.notifyParent("cancel");
  }

  // Delete button has been clicked
  handleDelete() {
    this.deleting = true;
    deleteRecord(this.recordId)
      .then(() => {
        this.notifyParent("success", this.objectLabel + ' ' + this.labels.labelWasDeleted);
      })
      .catch(error => {
        this.notifyParent("error", error.body ? error.body.message : error, "Error Deleting File");
      });
  }

  // Notify parent of the result of the action in the dialog
  notifyParent(action, msg, title) {
    this.dispatchEvent(new CustomEvent('close', { detail: { action: action, msg: msg, title: title } }));
  }
}