import { LightningElement, api } from 'lwc';

import { NavigationMixin } from "lightning/navigation";

import labelDownloadMenu from '@salesforce/label/c.DownloadMenu';
import labelDownloadLimit from '@salesforce/label/c.DownloadLimit';
import labelDeleteFileMessage from '@salesforce/label/c.DeleteFileMessage';
import labelFilesHasBeenUploaded from '@salesforce/label/c.FilesHasBeenUploaded';
import labelFile from '@salesforce/label/c.File';
import labelWasSaved from '@salesforce/label/c.WasSaved';

export default class SmartFilesList2 extends NavigationMixin(LightningElement) {
    // LIST PARAMETERS
    @api listName;
    @api recordId;
    @api inRecordPage = false;
    @api inTab = false;
    @api flow = false;
    @api minRowSelected;
    get hasNoRecords() {
        return this.smartListShared ? this.smartListShared.recordViewer.hasNoRecords : false;
    }
    @api get records() {
        return this.smartListShared.records;
    }
    @api get recordsCount() {
        return this.smartListShared.recordsCount;
    }
    get hasNoSelectedRecords() {
        return this.smartListShared.hasNoSelectedRecords;
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

    // LIST REFERENCE
    get smartListShared() {
        return this.template.querySelector('c-smart-list-shared');
    }

    // LABELS
    labels = {
        labelDownloadMenu,
        labelDownloadLimit,
        labelDeleteFileMessage,
        labelFilesHasBeenUploaded,
        labelFile,
        labelWasSaved
    }

    // UPLOAD FILES AND VERSION
    acceptedExtensions;
    acceptedExtensionsArr = [];
    get uploader() {
        return this.template.querySelector('.file-uploader');
    }
    file;

    // DOWNLOAD FILES
    maxFilesSize = 500;
    maxFilesCount = 100;
    filesSize;

    // FILE EDIT FORM
    editFields = [];
    fileTitle;
    canEditFileDetails;

    // ACTIONS DATA
    contentDocumentId;
    contentVersionId;

    // UI CONTROL
    uploadFilesAction;
    downloadAllFilesAction;
    downloadSelectedFilesAction;
    previewFilesAction;
    get fileUploadClass() {
        return this.flow ? 'sl-file-upload-flow' : 'sl-file-upload';
    }
    downloadFilesModal;
    editFileModal;
    uploadFileVersionModal;

    // LIST DATA
    parentId;
    namespace;

    // smartListShared notification for requesting initialization data
    // - store list data
    // - setup standard list actions
    // - determine file preview url based on the running context
    handleInitialize(event) {
        let listDef = event.detail;
        // store list data
        this.parentId = listDef.parentId;
        this.namespace = listDef.namespace;
        // build list of accepted extensions
        if (listDef.acceptedExtensions && !listDef.dontCheckFileExtension) {
            const extArr = listDef.acceptedExtensions.split(",");
            const acceptedExtensionsArr = [];
            for (let ext of extArr) {
                acceptedExtensionsArr.push('.' + ext.toLowerCase());
            }
            this.acceptedExtensionsArr = acceptedExtensionsArr;
            this.acceptedExtensions = acceptedExtensionsArr.join(',');
        }
        // setup standard list actions
        for (let action of listDef.standardListActions) {
            if (action.key === 'std_upload_files')
                this.uploadFilesAction = action;
            else if (action.key === 'std_download_all_files')
                this.downloadAllFilesAction = action;
            else if (action.key === 'std_download_selected_files')
                this.downloadSelectedFilesAction = action;
            else if (action.key === 'std_preview_selected_files')
                this.previewFilesAction = action;
        }
        // build the edit form: 2 fields per row
        let chunks = [];
        let chunk = [];
        const fields = listDef.fields;
        for (const fieldName of Object.getOwnPropertyNames(fields)) {
            const fieldDef = fields[fieldName];
            if (fieldDef.editField) {
                const editFieldDef = fieldDef;
                if (editFieldDef.editable) {
                    const required = editFieldDef.type !== 'BOOLEAN' && (editFieldDef.requiredOnEdit || (!editFieldDef.requiredOnEdit && editFieldDef.dbRequired));
                    const field = { name: editFieldDef.name, required: required };
                    chunk.push(field);
                    if (chunk.length === 2) {
                        chunks.push(chunk);
                        chunk = [];
                    }
                }
            }
        }
        if (chunk.length > 0)
            chunks.push(chunk);
        this.editFields = chunks;
        // determine if user can edit file details: needed for knowing if file edit form must be displayed after upload
        this.canEditFileDetails = false;
        let canViewFileDetails = false;
        const rowActions = listDef.rowActions;
        for (let action of rowActions) {
            if (action.key === 'std_edit_file_details') {
                if (this.editFields.length > 0)
                    this.canEditFileDetails = true;
                else
                    listDef.rowActions.splice(listDef.rowActions.indexOf(action), 1);
            }
            else if (action.key === 'std_view_file_details')
                canViewFileDetails = true;
        }
        listDef.canPreviewFiles =  (typeof this.previewFilesAction !== 'undefined');
        listDef.canViewFileDetails =  canViewFileDetails;
        this.smartListShared.parentInitialized(listDef);
    }

    // Files has been uploaded
    handleUploadFinished(event) {
        this.smartListShared.displaySuccess(this.labels.labelFilesHasBeenUploaded, null);
        const file = event.detail.files[0];
        this.smartListShared.refreshRecord(file.contentVersionId, null);
        if (this.canEditFileDetails) {
            this.handleEditFileDetails(file.contentVersionId, file.name);
        }
    }

    // A viewer row action has been selected
    handleRowAction(event) {
        const key = event.detail.key;
        if (key === 'std_preview_file')
            this.handlePreviewFile(event.detail.row.ContentDocumentId);
        else if (key === 'std_download_file')
            this.handleDownloadFiles(event.detail.row.Id);
        else if (key === 'std_view_file_details')
            this.handleViewFileDetails(event.detail.row.ContentDocumentId);
        else if (key === 'std_edit_file_details')
            this.handleEditFileDetails(event.detail.row.Id, event.detail.row.Title);
        else if (key === 'std_delete_file')
            this.smartListShared.handleDeleteRecord(event.detail.row.ContentDocumentId, this.labels.labelDeleteFileMessage);
        else if (key === 'std_upload_new_version')
            this.handleUploadNewVersion(event.detail.row.ContentDocumentId, event.detail.row.Id);
        else
            console.log('SmartFilesList - Unknown standard action ' + key);
    }

    // Download selected files button has been clicked
    handleDownloadSelectedFiles() {
        this.rowsToDownload = this.selectedRecords;
        this.startDownloadFiles();
    }

    // Download all files button has been clicked
    handleDownloadAllFiles() {
        this.rowsToDownload = this.smartListShared.recordViewer.records;
        this.startDownloadFiles();
    }

    // Check if can execute files download
    startDownloadFiles() {
        this.filesSize = (
            this.rowsToDownload.reduce(function (a, b) {
                return a + b.ContentSize;
            }, 0) / 1000000
        ).toFixed(2);
        if (this.filesSize > this.maxFilesSize || this.rowsToDownload.length > this.maxFilesCount) {
            let msg = this.labels.labelDownloadLimit.replace('{0}', this.maxFilesSize);
            this.smartListShared.displayWarning(msg.replace('{1}', this.maxFilesCount), null);
        } else {
            this.downloadFilesModal = true;
        }
    }

    // Download Files modal has been closed
    handleCloseDownloadFiles(event) {
        this.downloadFilesModal = false;
        if (event.detail.action === 'download') {
            const ids = this.rowsToDownload.map(file => file.Id).join("/");
            this.handleDownloadFiles(ids);
        }
        this.rowsToDownload = [];
    }    
    // Download a list of files: use by row and list actions
    handleDownloadFiles(ids) {
        const origin = window.location.origin;
        let downloadPrefixURL = '';
        if (this.community) {
            const parts = window.location.pathname.split("/");
            downloadPrefixURL = '/' + parts[1];
        }
        downloadPrefixURL += '/sfc/servlet.shepherd/version/download/';
        window.open(
            `${origin}${downloadPrefixURL}${ids}`,
            "_target"
        );
        window.history.replaceState({}, "", "");
    }
    
    // View File Details row action has been selected
    handleViewFileDetails(id) {
        this[NavigationMixin.Navigate]({
            type: "standard__recordPage",
            attributes: {
                recordId: id,
                actionName: "view"
            }
        });
    }

    // Preview  file row action has been clicked
    handlePreviewFile(id) {
        this.previewFiles(id);
    }

    // Preview selected files button has been clicked
    handlePreviewSelectedFiles() {
        const ids = this.selectedRecords.map(row => row.ContentDocumentId).join(",");
        this.previewFiles(ids);
    }

    // Preview a list of files
    previewFiles(ids) {
        this[NavigationMixin.Navigate]({
            type: "standard__namedPage",
            attributes: {
                pageName: "filePreview"
            },
            state: {
                recordIds: ids
            }
        });
    }

    // Edit File Details row action has been selected OR after file upload
    handleEditFileDetails(id, title) {
        this.contentVersionId = id;
        this.fileTitle = title;
        this.editFileModal = true;
    }

    // File Details modal has been closed
    // If success: The current page is updated with the updated data
    handleCloseEditFile(event) {
        this.editFileModal = false;
        if (event.detail.action === 'success') {
            this.smartListShared.refreshRecord(this.contentVersionId, this.contentVersionId);
            this.smartListShared.displaySuccess(this.labels.labelFile + ' "' + event.detail.fileTitle + '" ' + this.labels.labelWasSaved, null);
        }
    }

    // Upload new version row action has been selected
    handleUploadNewVersion(contentDocumentId, id) {
        this.contentDocumentId = contentDocumentId;
        this.contentVersionId = id;
        this.uploader.click();
    }

    // File selected in uploader input
    uploadNewVersionFileSelected(event) {
        const file = event.target.files[0];
        this.uploader.value = null; // Reset input to make sure the same file can be loaded again
        const fileParts = file.name.split('.');
        const extInput = '.' + fileParts[fileParts.length - 1].toLowerCase();
        let extError = true;
        if (this.acceptedExtensionsArr.length === 0) {
            extError = false;
        } else if (fileParts.length > 1) {
            for (let validExt of this.acceptedExtensionsArr) {
                if (extInput === validExt) {
                    extError = false;
                    break;
                }
            }
        }
        if (extError) {
            this.smartListShared.displayError(this.labels.labelErrorMsgInvalidExtension + extInput, null);
        } else {
            this.file = file;
            this.uploadFileVersionModal = true;
        }
    }

    // Upload File Version modal has been closed: return cancel, success or error
    handleCloseUploadFileVersion(event) {
        this.uploadFileVersionModal = false;
        if (event.detail.action === 'done') {
            if (event.detail.error)
                this.smartListShared.displayError(event.detail.error, null);
            else {
                this.smartListShared.refreshRecord(event.detail.id, this.contentVersionId);
                this.smartListShared.displaySuccess(this.labels.labelFilesHasBeenUploaded, null);
            }
        }
    }

    // Validate row selection in screenflows
    @api validate() {
        return this.smartListShared.validate();
    }
}