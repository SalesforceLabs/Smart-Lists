import { LightningElement, api } from 'lwc';

import labelClose from '@salesforce/label/c.Close';

export default class ScreenFlowModal extends LightningElement {
    // API name of the screeen of the screenflow
    @api flowName;
    // Rows passed to the action
    @api rows = [];
    // Parent Id of the child list; empty for lists without parents
    @api parentId;
    // Optional height of the flow content div
    @api modalHeight;
    // Input variables for the flow
    inputVariables = [];

    labels = {
        labelClose,
    }
    // Flag for displaying a spinner while the flow is loading
    loadingFlow = true;

    // Initialize records input variable with selected rows
    connectedCallback() {
        let inputVariables = [{ name : "records", type : "SObject", value: this.rows }, { name: "parentId", type: "String", value: this.parentId ?? '' }];
        this.inputVariables = inputVariables;
    }

    // Set modal height if needed
    renderedCallback() {
        const flowDiv = this.template.querySelector('.flowcontent');
        if (flowDiv && this.modalHeight) {
            flowDiv.style.height = this.modalHeight + "px";
        }
    }

    // Handle flow status change
    onFlowStatusChange(event) {
        if (event.detail.status === 'STARTED' && this.loadingFlow)
            this.loadingFlow = false;
        else if (event.detail.status === 'FINISHED') {
            let successMsg;
            let errorMsg;
            for (let outputVar of event.detail.outputVariables) {
                if (outputVar['name'] === 'successMsg')
                    successMsg = outputVar['value'];
                else if (outputVar['name'] === 'errorMsg')
                    errorMsg = outputVar['value'];
            }
            this.notifyParent("done", { successMsg: successMsg, errorMsg: errorMsg });
        }
    }

    // Handle click on modal close button
    closeModal() {
        this.notifyParent("cancel");
    }

    // Notfiy parent smart list
    notifyParent(action, data) {
        this.dispatchEvent(new CustomEvent('close', { detail: { action: action, data: data } }));
    }
}