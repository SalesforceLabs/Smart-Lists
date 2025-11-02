import { LightningElement, api } from "lwc";

import labelClose from '@salesforce/label/c.Close';
import labelDownloadFiles from '@salesforce/label/c.DownloadFiles';
import labelDownload from '@salesforce/label/c.Download';
import labelDownloadConfirm from '@salesforce/label/c.DownloadConfirm';
import labelCancel from '@salesforce/label/c.Cancel';

export default class DownloadFilesModal extends LightningElement
{
  @api filesSize;
  @api filesCount;


  labels = {
    labelClose,
    labelDownloadFiles,
    labelDownload,
    labelCancel
  };
  labelDownloadConfirmFmt = labelDownloadConfirm;

  connectedCallback() {
    this.labelDownloadConfirmFmt = this.labelDownloadConfirmFmt.replace('{0}', this.filesCount);
    this.labelDownloadConfirmFmt = this.labelDownloadConfirmFmt.replace('{1}', this.filesSize);
  }

  closeModal() {
    this.notifyParent("cancel");
  }

  downloadFiles() {
    this.notifyParent("download");
  }
  
  notifyParent(action) {
    this.dispatchEvent(new CustomEvent('close', {detail: {action: action}}));
  }
}