import { LightningElement, api } from 'lwc';

import labelDeleteRecordMessage from '@salesforce/label/c.DeleteRecordMessage';

export default class SmartList extends LightningElement {
    // LIST PARAMETERS
    @api listName;
    @api recordId;
    @api inRecordPage = false;
    @api inTab = false;
    @api flow = false;
    @api minRowSelected;
    @api get records() {
        return this.smartListShared.records;
    }
    @api get recordsCount() {
        return this.smartListShared.recordsCount;
    }
    @api get selectedRecord() {
        return this.smartListShared.selectedRecord;
    }
    @api get selectedRecords() {
        return this.smartListShared.selectedRecords;
    }
    @api get selectedRecordsCount() {
        return this.smartListShared.selectedRecordsCount;
    }
    // Deprecated properties
    @api canPreviewFiles;
    @api filePreviewUrl;

    // UI CONTROL
    newRecordAction;
    showEditRecordModal = false;

    // LIST DATA
    objectName;
    objectLabel;
    recordTypes = [];
    parentIdField;
    parentId;
    currentRecordId;
    currentRecordTypeId;

    // LIST REFERENCE
    get smartListShared() {
        return this.template.querySelector('c-smart-list-shared');
    }

    // smartListShared notification for requesting initialization data
    // - store list data
    // - setup standard actions
    handleInitialize(event) {
        let listDef = event.detail;
        this.objectName = listDef.objectName;
        this.objectLabel = listDef.objectLabel;
        this.recordTypes = listDef.recordTypes;
        this.parentIdField = listDef.parentIdField;
        this.parentId = listDef.parentId;
        // LIST ACTIONS
        for (let action of listDef.standardListActions) {
            if (action.key === 'std_new_record')
                this.newRecordAction = action;
        }
        this.smartListShared.parentInitialized(listDef);
    }

    // A viewer row action has been selected
    handleRowAction(event) {
        const key = event.detail.key;
        if (key === 'std_edit_record')
            this.handleEditRecord(event.detail.row.Id, event.detail.row.RecordTypeId);
        else if (key === 'std_delete_record')
            this.smartListShared.handleDeleteRecord(event.detail.row.Id, labelDeleteRecordMessage.replace('{0}', this.objectLabel.toLowerCase()));
        else
            console.log('SmartList - Unknown standard action ' + key);
    }

    // New record button clicked
    handleNewRecord() {
        this.currentRecordId = null;
        this.showEditRecordModal = true;
    }

    // Edit Record row action
    handleEditRecord(id, recordTypeId) {
        this.currentRecordId = id;
        this.currentRecordTypeId = recordTypeId;
        this.showEditRecordModal = true;
    }

    // Edit Record Modal has been closed
    handleCloseEditRecord(event) {
        this.showEditRecordModal = false;
        if (event.detail.action === 'success') {
            this.smartListShared.displaySuccess(null, event.detail.msg);
            if (event.detail.type === 'create') {
                //this.smartListShared.loadFirstPage();
                this.smartListShared.refreshRecord(event.detail.id, null);
            }
            else
                this.smartListShared.refreshRecord(this.currentRecordId, this.currentRecordId);
        }
        this.currentRecordId = null;
    }

    // Validate row selection in screenflows
    @api validate() {
        return this.smartListShared.validate();
    }
}