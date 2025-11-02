import { LightningElement, api } from 'lwc';

import labelClose from '@salesforce/label/c.Close';
import labelLoading from '@salesforce/label/c.Loading';


export default class ScreenFlowModal extends LightningElement {
    // Flow action parameters
    @api action;
    // Rows passed to the action
    @api rows = [];
    // Parent Id of the child list; empty for lists without parents
    @api parentId;
    inputVariables = [];

    labels = {
        labelClose,
        labelLoading
    }
    // Flag for displaying a spinner while the flow is loading
    loadingFlow = true;

    // Initialize records input variable with selected rows
    connectedCallback() {
        let inputVariables = [{ name : "records", type : "SObject", value: this.rows }];
        if (this.parentId) 
            inputVariables.push({ name: "parentId", type: "String", value: this.parentId });
        this.inputVariables = inputVariables;
    }

    get modalContentClass() {
        let cls = 'slds-modal__content slds-is-relative slds-var-p-around_medium sl-modal-content';
        if (!this.action.showHeader)
            cls += ' slds-modal__content_headless';
        return cls;
    }
    // Set modal height if needed
    renderedCallback() {
        const flowDiv = this.template.querySelector('.sl-modal-content');
        if (flowDiv && this.action.modalHeight) {
            flowDiv.style.height = this.action.modalHeight + "px";
        }
    }

    // Handle flow status change
    onFlowStatusChange(event) {
        if (event.detail.status === 'STARTED' && this.loadingFlow)
            this.loadingFlow = false;
        else if (event.detail.status === 'FINISHED') {
            let successMsg;
            let errorMsg;
            if (event.detail.outputVariables) {
                for (let outputVar of event.detail.outputVariables) {
                    if (outputVar['name'] === 'successMsg')
                        successMsg = outputVar['value'];
                    else if (outputVar['name'] === 'errorMsg')
                        errorMsg = outputVar['value'];
                }
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