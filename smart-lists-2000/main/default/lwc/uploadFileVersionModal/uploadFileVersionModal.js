import { LightningElement, api } from 'lwc';

import labelClose from '@salesforce/label/c.Close';
import labelCancel from '@salesforce/label/c.Cancel';
import labelUpload from '@salesforce/label/c.Upload';
import labelUploadNewVersion from '@salesforce/label/c.UploadNewVersion';
import labelUploadNewVersionReason from '@salesforce/label/c.UploadNewVersionReason';
import labelLoading from "@salesforce/label/c.Loading";

export default class UploadFileVersionModal extends LightningElement {
    // DIALOG PARAMETERS
    @api contentDocumentId;
    @api acceptedExtensions;
    @api file;
    @api namespace;

    // LABELS
    labels = {
        labelClose,
        labelCancel,
        labelUpload,
        labelUploadNewVersion,
        labelUploadNewVersionReason,
        labelLoading,
    }

    // DIALOG DATA
    fileName;
    reason;

    // UI CONTROL
    uploading = false;
    rendered = false;

    // Add event listener for VF page
    connectedCallback() {
        this.fileName = this.file.name;
        // Binding EventListener here when Data received from VF
        window.addEventListener("message", this.handleVFMessage.bind(this));
    }

    // Adjust VF Iframe url with namespace dev/package
    renderedCallback() {
        if (!this.rendered) {
            // Adjust url with namespace dev/package
            //console.log(this.namespace);
            const vfpage = '/apex/' + (this.namespace ? this.namespace : '') + 'SmartListFileUploader';
            this.template.querySelector('iframe').src = vfpage;
            this.rendered = true;
        }
    }

    // Reason Change field updated in form    
    onReasonChange(event) {
        this.reason = event.detail.value;
    }

    // Close/Cancel button has been clicked
    closeModal() {
        this.notifyParent("cancel");
    }

    // Upload button has been clicked
    handleUpload() {
        // Disable form buttons
        this.uploading = true;
        let message = {};
        message.fileMetadata = { "ContentDocumentId": this.contentDocumentId, "ReasonForChange": this.reason, "PathOnClient": this.fileName };
        message.file = this.file;
        // Request upload new version to vfpage
        const iframe = this.template.querySelector("iframe").contentWindow;
        iframe.postMessage(message, "*");
    }

    // Handle messages sent by VF page
    handleVFMessage(event) {
        const host = window.location.hostname.split('.');
        if (event.origin.includes(host[0])) {
            this.notifyParent("done", event.data.id, event.data.error);
        } else
            console.log('Invalid VF origin ' + event.origin);
    }

    // Notify parent of action results
    notifyParent(action, id, message) {
        this.dispatchEvent(new CustomEvent('close', { detail: { action: action, id: id, message: message } }));
    }
}