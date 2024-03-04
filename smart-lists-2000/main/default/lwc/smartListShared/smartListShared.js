import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { updateRecord } from "lightning/uiRecordApi";

import getListParameters from "@salesforce/apex/SmartListController.getListParameters";
import getPage from "@salesforce/apex/SmartListController.getPage";
import getRecord from "@salesforce/apex/SmartListController.getRecord";
import runFlow from "@salesforce/apex/SmartListController.runFlow";

import labelRefresh from "@salesforce/label/c.Refresh";
import labelShowQuickFilters from "@salesforce/label/c.ShowQuickFilters";
import labelHideQuickFilters from "@salesforce/label/c.HideQuickFilters";
import labelItemSingular from "@salesforce/label/c.ItemSingular";
import labelItemPlural from "@salesforce/label/c.ItemPlural";
import labelSelectedSingular from "@salesforce/label/c.SelectedSingular";
import labelSelectedPlural from "@salesforce/label/c.SelectedPlural";
import labelSortedBy from "@salesforce/label/c.SortedBy";
import labelFilteredBy from "@salesforce/label/c.FilteredBy";
import labelLoading from "@salesforce/label/c.Loading";
import labelMinRowSelectionError from "@salesforce/label/c.MinRowSelectionError";
import labelFilterSelection from "@salesforce/label/c.FilterSelection";
import labelVisibilityFilterSelection from "@salesforce/label/c.VisibilityFilterSelection";
import labelSortFieldSelection from "@salesforce/label/c.SortFieldSelection";
import labelSortAscending from "@salesforce/label/c.SortAscending";
import labelSortDescending from "@salesforce/label/c.SortDescending";
import labelFilterSOSLSearchTooShortError from "@salesforce/label/c.FilterSOSLSearchTooShortError";
import labelSearchBoxPlaceholder from "@salesforce/label/c.SearchBoxPlaceholder";
import labelSearchBoxLabel from "@salesforce/label/c.SearchBoxLabel";
import labelSavedChanges from "@salesforce/label/c.SavedChanges";
import labelErrors from "@salesforce/label/c.Errors";

export default class SmartListShared extends LightningElement {
    // PARAMETERS FROM LWC
    // Id of the parent record 
    @api recordId;

    // LIST PARAMETERS DEFINED IN THE UI (AppBuilder, Flow...)
    // List Definition name
    @api listName;
    @api inRecordPage = false;
    @api inTab = false;
    @api flow = false;
    // Min row selected for Screenflow
    @api minRowSelected;
    community;

    // LIST HEADER
    icon;
    get iconSize() {
        return this.inRecordPage ? "small" : "medium";
    }
    title;
    errorMsg;
    // ITEMS SECTION
    get itemsCount() {
        if (this.hasSelectedRecords)
            return this.recordViewer.selectedRecordsCount;
        else
            return this.recordViewer.recordsCount + (this.recordViewer.canLoadData || this.maxRecordsLoaded ? '+' : '');
    }
    get itemsLabel() {
        if (this.recordViewer.selectedRecordsCount == 1)
            return this.labels.labelItemSingular + ' ' + this.labels.labelSelectedSingular;
        else if (this.hasSelectedRecords)
            return this.labels.labelItemPlural + " " + this.labels.labelSelectedPlural;
        else
            return this.recordViewer.recordsCount == 1 ? this.labels.labelItemSingular : this.labels.labelItemPlural;
    }
    // Object containing the labels of the sortable fields
    sortFieldsLabels;
    // Label of the sort field
    sortFieldLabel;
    // Labels of the fields used in the filter
    filterByFields;
    // True if max records loaded
    maxRecordsLoaded;

    // LABELS
    labels = {
        labelRefresh,
        labelShowQuickFilters,
        labelHideQuickFilters,
        labelItemSingular,
        labelItemPlural,
        labelSelectedSingular,
        labelSelectedPlural,
        labelSortedBy,
        labelFilteredBy,
        labelLoading,
        labelMinRowSelectionError,
        labelFilterSelection,
        labelVisibilityFilterSelection,
        labelSortFieldSelection,
        labelSortAscending,
        labelSortDescending,
        labelFilterSOSLSearchTooShortError,
        labelSearchBoxPlaceholder,
        labelSearchBoxLabel,
        labelSavedChanges,
        labelErrors
    };

    // GET RECORDS VARIABLES
    objectName;
    nameField;
    parentId;
    parentIdField;
    queryFields;
    filterFields = "";
    filterEntries = [];
    filterEntriesPanel = [];
    currentListFilter;
    currentSoqlScope;

    // VIEWER DATA
    displayMode;
    isLoading = false;

    // FILTERS DATA
    // List of filters for UI
    listFilters = [];
    // List of SOQL scopes for UI
    soqlScopes = [];

    // ACTIONS
    // List of standard list actions for UI
    standardListActions = [];
    // List of custom list actions for UI
    customListActions = [];
    // List of row actions for UI
    rowActions = [];
    // Custom actions dictionary: retrieve action data from action key in action handlers
    custActionsDict = {};
    // Object label for record actions
    objectLabel;
    // Records types for New record
    recordTypes = [];
    // Current Screenflow Action: parm for ScreenFlowModal and used for endFlow
    currentFlowAction;
    // Rows used by the flow action: row for row actions, selected rows for list actions
    flowRows;

    // RECORDS
    @api get records() {
        return this.recordViewer.records;
    }
    @api get recordsCount() {
        return this.recordViewer.recordsCount;
    }

    // ROW SELECTION
    // Returns if true if selected records in viewer
    @api get hasSelectedRecords() {
        return this.recordViewer.hasSelectedRecords;
    }
    @api get hasNoSelectedRecords() {
        return this.recordViewer.hasNoSelectedRecords;
    }
    // Returns first selected record for Screenflow
    @api get selectedRecord() {
        return this.recordViewer.selectedRecord;
    }
    // Returns selected records for Screenflow
    @api get selectedRecords() {
        return this.recordViewer.selectedRecords;
    }
    // Returns selected records for Screenflow
    @api get selectedRecordsCount() {
        return this.recordViewer.selectedRecordsCount;
    }

    // FILTERS PANEL
    // Title of the Filters Panel toggle button: dynamic label displayed/not displayed
    filtersPanelTitle = this.labels.labelShowQuickFilters;
    // If false, Filters Panel can't be closed: displayed all the time
    canCloseFiltersPanel = false;
    // Max Height of the filters display window
    filtersMaxHeight;
    // Filters Panel displayed on the left
    leftFilters = true;
    // Filters Panel displayed on the right
    rightFilters = true;

    // SORT DATA
    get sortDirectionIcon() {
        return this.recordViewer.sortDirection == 'asc' ? 'utility:arrowup' : 'utility:arrowdown';
    }
    get sortDirectionTitle() {
        return this.recordViewer.sortDirection == 'asc' ? this.labels.labelSortAscending : this.labels.labelSortDescending;
    }


    // UI CONTROL
    // Maximum of the viewer
    viewerMaxWidth = 0;
    // Filters Panel state: displayed/Hidden
    showFiltersPanel = false;
    // Spinner is displayed: initialization and auto-launched flow action execution
    showSpinner = false;
    // List of SOQL scope displayed/hidden
    showScopes = false;
    // List of filters displayed/hidden
    showFilters = false;
    // Sort menu displayed/hidden
    showSort = false;
    // Show/hide Delete Record modal 
    showDeleteRecordModal = false;
    // Show/hide Screenflow modal 
    showScreenFlowModal = false;
    // Initialization flags 
    @api initializedContext = false;
    get initializationContext() {
        return !this.initializedContext;
    }

    // STYLING
    get viewerContainerClass() {
        return this.showFiltersPanel && !this.displayFiltersPanelAllTheTime ? "slds-col slds-no-space sl-viewer-container-with-filters" : "slds-col slds-no-space";
    }
    get articleClass() {
        let cls = "slds-card slds-card_boundary sl-component-container";
        return this.flow ? cls += " sl-flow-context" : this.community ? cls += " sl-community-context" : cls += " sl-app-context";
    }
    get pageHeaderClass() {
        let cls = "slds-page-header";
        return this.flow ? cls += " sl-flow-context" : this.community ? cls += " sl-community-context" : cls;
    }
    get filtersPanelDivClass() {
        return (this.showFiltersPanel) ? 'slds-col slds-no-flex' : 'slds-col slds-no-flex slds-hide';
    }

    // GET UI COMPONENTS
    _componentContainer;
    get componentContainer() {
        if (!this._componentContainer)
            this._componentContainer = this.template.querySelector(".sl-component-container");
        return this._componentContainer;
    }
    _viewerPanel;
    get viewerPanel() {
        if (!this._viewerPanel)
            this._viewerPanel = this.template.querySelector(".sl-viewer-panel");
        return this._viewerPanel;
    }
    _recordViewer;
    @api get recordViewer() {
        if (!this._recordViewer)
            this._recordViewer = this.template.querySelector('c-record-viewer');
        return this._recordViewer;
    }
    _filtersPanel;
    get filtersPanel() {
        if (!this._filtersPanel) {
            const comps = this.template.querySelectorAll('c-filter-panel');
            this._filtersPanel = this.rightFilters ? comps[1] : comps[0];
        }
        return this._filtersPanel;
    }
    _soslSearchTooltip
    get soslSearchTooltip() {
        if (!this._soslSearchTooltip)
            this._soslSearchTooltip = this.template.querySelector('.sl-tooltip');
        return this._soslSearchTooltip;
    }

    // COMPONENT INITIALIZATION FLOW
    // - recordViewer send ready notification at the end of connectedCallback
    // - initialize: 
    //      - Perform initialization from list definition
    //      - Notify parent SmartList that parent initialization is needed
    // - parentInitialized: 
    //      - invoked by parent for completing initialization
    //      - initialize record viewer with data provided by parent
    handleViewerConnected(event) {
        this.initialize();
    }

    // Initialize: 
    //      - Read list parameters & store parameters; notify parent
    //      - Initialize Filters Panel 
    //      - Prepare data for row/list actions
    initialize() {
        this.showSpinner = true;
        // Retrieve list parameters from custom metadata
        getListParameters({ listName: this.listName, recordId: this.recordId, flow: this.flow })
            .then((result) => {
                const listDef = JSON.parse(result);
                this.icon = listDef.listIcon;
                this.title = listDef.listLabel;
                this.dataSourceType = listDef.dataSourceType;
                this.dataProviderClass = listDef.dataProviderClass;
                this.displayMode = listDef.displayMode;
                this.objectName = listDef.objectName;
                this.objectLabel = listDef.objectLabel;
                this.nameField = listDef.nameField;
                this.recordTypes = listDef.recordTypes;
                this.parentId = listDef.parentId;
                this.parentIdField = listDef.parentIdField;
                this.community = listDef.community;
                this.currentSoqlScope = listDef.defaultSoqlScope;
                this.soqlScopes = listDef.soqlScopes;
                this.showScopes = this.soqlScopes.length > 1;
                const filters = listDef.filters;
                if (filters.length > 0) {
                    this.currentListFilter = filters[0].value;
                    if (filters.length > 1) {
                        for (let filter of filters) {
                            if (filter.defaultFilter) {
                                this.currentListFilter = filter.value;
                                break;
                            }
                        }
                        this.listFilters = filters.sort(function (a, b) {
                            if (a.label < b.label) return -1;
                            else if (a.label > b.label) return 1;
                            else return 0;
                        });
                        this.showFilters = true;
                    }
                }
                if (listDef.customListActions) {
                    const listActions = [];
                    for (let action of listDef.customListActions) {
                        this.custActionsDict[action.key] = action;
                        listActions.push(action);
                    }
                    this.customListActions = listActions;
                }
                if (listDef.rowActions) {
                    for (const action of listDef.rowActions) {
                        if (action.key.startsWith('cust_'))
                            this.custActionsDict[action.key] = action;
                    }
                    this.rowActions = listDef.rowActions;
                }
                this.queryFields = listDef.queryFields;
                this.maxRowSelected = listDef.maxRowSelected;
                // Add smartListShared properties to listDef which are needed by initialization process
                listDef.flow = this.flow;
                this.displayFiltersPanelAllTheTime = listDef.displayFiltersPanelAllTheTime;
                this.rightFilters = listDef.filtersPosition === 'right';
                this.leftFilters = !this.rightFilters;
                this.filtersMaxHeight = listDef.filtersMaxHeight;
                // Build Filters Panel model and initialize values
                this.filtersPanel.buildFilterModel(listDef.fields, listDef.showSOSLSearchInFiltersPanel, listDef.dataSourceType);
                this.staticFiltersPanel = this.filtersPanel.hasFilters && listDef.displayFiltersPanelAllTheTime;
                this.canCloseFiltersPanel = !this.staticFiltersPanel;
                this.showFiltersPanel = this.staticFiltersPanel;
                /*if (this.filtersPanel.hasFilters) {
                    // Display Filters Panel button when it's not displayed all the time
                    this.canCloseFiltersPanel = !listDef.displayFiltersPanelAllTheTime;
                    // Display Filters Panel if it must be displayed all the time
                    this.showFiltersPanel = listDef.displayFiltersPanelAllTheTime;
                }
                else
                    this.canCloseFiltersPanel = false;*/
                this.showSOSLSearch = (listDef.showSOSLSearchInComponent && this.filtersPanel.hasSearchableFields);
                // Request initialization data from parent 
                this.dispatchEvent(
                    new CustomEvent("initialize", { detail: listDef }));
            })
            .catch((error) => {
                this.showSpinner = false;
                this.displayErrorInList(error);
            });
    }

    // parentInitialized: invoked by parent for completing initialization
    //      - store parameters initialized by parent
    //      - initialize viewer
    //      - load first page of records
    @api parentInitialized(listDef) {
        this.recordViewer.initialize(listDef);
        // Load first page of records with sort order
        if (!listDef.noAutoload)
            this.loadFirstPage();
        this.showSpinner = false;
        this.showSort = this.displayMode == 'Tiles' && this.recordViewer.sortFields.length > 0;
        this.initializedContext = true;
    }

    isRendered = false;
    // Set the maximum width of the viewer the 1st time the comp is rendered
    renderedCallback() {
        // Add resize listener for resizing the list when the window is resized
        if (!this.isRendered && this.initializedContext) {
            window.addEventListener("resize", this.handleResizeWindow.bind(this));
            this.isRendered = true;
        }
        this.setListWidth();
    }

    // Adjust the list max width when the window is resized
    handleResizeWindow() {
        this.setListWidth();
    }

    borders;
    setListWidth() {
        const componentContainer = this.componentContainer;
        if (componentContainer && componentContainer.offsetWidth > 0) {
            if (!this.borders) {
                const style = getComputedStyle(componentContainer);
                this.borders = parseFloat(style.borderLeftWidth) || 0;
                this.borders += parseFloat(style.borderRightWidth) || 0;
            }
            const rect = componentContainer.getBoundingClientRect();
            if (this.viewerMaxWidth !== rect.width - this.borders) {
                this.viewerMaxWidth = rect.width - this.borders;
                this.viewerPanel.style.width = this.viewerMaxWidth + 'px';
                this.recordViewer.width = this.viewerMaxWidth;
            }
        }
    }

    // Load the first page of the datatable
    @api loadFirstPage() {
        this.recordViewer.canLoadData = false;
        this.loadPage(true, false);
    }

    // Handle load all records event
    handleLoadAll() {
       this.loadPage(false, true);
    }

    // Load the next page of the datatable: infinite scrolling
    handleLoadMore() {
        this.loadPage(false, false);
    }

    // Load a datatable page
    loadPage(replaceRecords, loadAll) {
        //Display a spinner to signal that data is being loaded
        this.isLoading = true;
        this.showSpinner = true;
        const offset = replaceRecords ? 0 : this.recordViewer.recordsCount;
        const pageSize = this.recordViewer.noPaging ? this.recordViewer.maxRecords : this.recordViewer.pageSize;
        const maxRecords = this.recordViewer.maxRecords;
        const truncatePage = !loadAll && (offset + pageSize > maxRecords); 
        const pageRecs = (loadAll || truncatePage) ? maxRecords - offset : pageSize;
        getPage({
            dataSourceType: this.dataSourceType,
            dataProviderClass: this.dataProviderClass,
            objectName: this.objectName,
            listFilter: this.currentListFilter,
            soqlScope: this.currentSoqlScope,
            filterEntries: this.filterEntries,
            parentIdField: this.parentIdField,
            parentId: this.parentId,
            queryFields: this.queryFields,
            sortField: this.recordViewer.sortField,
            sortDirection: this.recordViewer.sortDirection,
            offset: offset,
            pageSize: pageRecs
        })
            .then((result) => {
                const pageRecords = result;
                //console.log("getPage " + JSON.stringify(result));
                //console.log("relFields " +JSON.stringify(this.relFields) + '\n');
                const loadedRecords = pageRecords.length;
                const allRecordsLoaded = (!loadAll && loadedRecords < pageRecs) || (loadAll && (offset + loadedRecords < maxRecords));
                this.maxRecordsLoaded = !allRecordsLoaded && ((!loadAll && truncatePage) || (loadAll && (offset + loadedRecords == maxRecords)));
                this.recordViewer.setRecordsPage(pageRecords, replaceRecords, this.maxRecordsLoaded, allRecordsLoaded);
                this.isLoading = false;
                this.showSpinner = false;
            })
            .catch((error) => {
                this.displayErrorInList(error);
            });
    }

    // Sort updated in datatable
    handleSortUpdate() {
        this.loadFirstPage();
    }

    // Sort field updated in component
    handleSortField(event) {
        this.recordViewer.sortField = event.detail.value;
        this.loadFirstPage();
    }

    // Sort direction updated in component
    handleSortDirection() {
        this.recordViewer.sortDirection = this.recordViewer.sortDirection == 'asc' ? 'desc' : 'asc';
        this.loadFirstPage();
    }

    // New filter selected in filters combobox
    handleChangeFilter(event) {
        this.currentListFilter = event.detail.value;
        this.loadFirstPage();
    }

    // New scope selected in scopes combobox
    handleChangeScope(event) {
        this.currentSoqlScope = event.detail.value;
        this.loadFirstPage();
    }

    // Refresh button has been clicked
    handleRefresh() {
        this.loadFirstPage();
    }

    // Show/Hide Filters Panel
    handleShowFiltersPanel() {
        this.showFiltersPanel = !this.showFiltersPanel;
        this.filtersPanelTitle = this.showFiltersPanel
            ? this.labels.labelHideQuickFilters
            : this.labels.labelShowQuickFilters;
    }

    // Apply filter defined in Filters Panel
    handleApplyFilter(event) {
        this.filterEntriesPanel = event.detail.filterEntries;
        this.filterByFields = event.detail.filterByFields;
        this.applyFilter();
    }

    // Update SOSL search if entry is valid
    handleSOSLSearchKeyup(event) {
        if (event.keyCode === 13) {
            const value = event.target.value;
            if (value && value.length === 1)
                	this.displayError(this.labels.labelFilterSOSLSearchTooShortError, null)
            else {
                this.soslSearch = value;
                this.applyFilter();
            }
        }
    }

    // The SOSL search input got the focus: display the searchable fields if needed
    handleSOSLSearchFocus() {
        if (this.filtersPanel.nonSearchableFields)
            this.updateSOSLSearchTooltip(true);
    }
    // The SOSL search input lost the focus: check value validity
    handleSOSLSearchBlur() {
        if (this.filtersPanel.nonSearchableFields)
            this.updateSOSLSearchTooltip(false);
    }

    // Toggle visibility of the SOSL Search tooltip
    updateSOSLSearchTooltip(flag) {
        this.soslSearchTooltip.style.visibility = flag ? 'visible' : 'hidden';
    }

    // Reload page with new filter if search data updated in Filters widget or SOSL search
    applyFilter() {
        const filterEntries = this.filterEntriesPanel && this.filterEntriesPanel.length > 0 ? this.filterEntriesPanel : [];
        if (this.showSOSLSearch && this.soslSearch)
            filterEntries.push({"fieldName":this.filtersPanel.SOSL_SEARCH_FIELD_NAME,"values":[this.soslSearch],"type":"Text"})
        this.filterEntries = [...filterEntries];
        this.loadFirstPage();
    }

    // A datatable row action has been selected
    handleRowAction(event) {
        const key = event.detail.key;
        if (key.startsWith('std_'))
            this.dispatchEvent(new CustomEvent('rowaction', event));
        else if (key.startsWith('cust_')) {
            const action = this.custActionsDict[key];
            if (action) {
                let rows = [];
                rows.push(event.detail.row);
                this.executeFlowAction(action, rows);
            }
        }
    }

    // A list action has been selected
    handleListAction(event) {
        const action = this.custActionsDict[event.target.name];
        if (action)
            this.executeFlowAction(action, action.availabilitySelected ? this.selectedRecords : this.records);
    }

    // Execute flow list/row action
    executeFlowAction(action, rows) {
        this.currentFlowAction = action;
        this.flowRows = rows;
        if (action.category === 'Screen Flow') {
            this.showScreenFlowModal = true;
        } else {
            this.showSpinner = true;
            runFlow({ flowName: action.flowName, records: rows, parentId: this.recordId }).then(result => {
                this.endFlow(result);
            }).catch((error) => {
                this.displayError(error);
            });
        }
    }

    // Screenflow Modal has been closed
    handleCloseScreenFlow(event) {
        this.showScreenFlowModal = false;
        if (event.detail.action === 'done')
            this.endFlow(event.detail.data);
    }

    // Flow has been executed
    endFlow(result) {
        this.showSpinner = false;
        if (result.successMsg)
            this.displaySuccess(null, result.successMsg);
        else if (result.errorMsg)
            this.displayError(result.errorMsg);
        // Clear selection in viewer in case they are no longer displayed after the action because of filter
        if (this.currentFlowAction.refreshList) {
            this.recordViewer.clearSelection();
            this.loadFirstPage();
        }
        else if (this.currentFlowAction.refreshRow)
            this.refreshRecord(this.flowRows[0].Id, this.flowRows[0].Id);
    }

    // Delete Record or File row action has been selected
    // In Shared because used for Record and File
    @api handleDeleteRecord(id, message) {
        this.currentRecordId = id;
        this.deleteRecordMessage = message;
        this.showDeleteRecordModal = true;
    }

    // Delete Record Modal has been closed
    handleCloseDeleteRecord(event) {
        this.showDeleteRecordModal = false;
        this.currentRecordId = null;
        if (event.detail.action === 'success') {
            this.loadFirstPage();
            this.displaySuccess(null, event.detail.msg);
        } else if (event.detail.action === 'error')
            this.displayError(event.detail.msg, event.detail.title);
    }

    // Update records from datatable inline edit
    async handleRecordsUpdated(event) {
        let errors = { table: {}, rows: {} };
        const tableError = { title: this.labels.labelErrors, messages: [] };
        let hasErrors = false;
        const refreshIds = [];
        for (const record of event.detail.records) {
            let recId = record.fields['Id'];
            // Update all records in parallel thanks to the UI API
            await updateRecord(record).then(() => {
                refreshIds.push(recId);
            }).catch((error) => {
                hasErrors = true;
                this.draftValues = event.detail.draftValues;
                // Validation errors found
                if (error.body.output) {
                    const tableErrors = error.body.output.errors;
                    if (tableErrors.length > 0) {
                        for (const error of Object.getOwnPropertyNames(tableErrors)) {
                            if (tableErrors[error].message)
                                tableError.messages.push(tableErrors[error].message);
                        }
                    }
                    const fieldErrors = error.body.output.fieldErrors;
                    for (const fieldName of Object.getOwnPropertyNames(fieldErrors)) {
                        const fieldError = fieldErrors[fieldName];
                        const error = { title: this.labels.labelErrors, messages: [], fieldNames: [] }
                        for (const fieldErrorDetail of fieldError) {
                            error.messages.push(fieldErrorDetail.message);
                            error.fieldNames.push(fieldErrorDetail.field);
                            tableError.messages.push(fieldErrorDetail.message);
                        }
                        errors.rows[recId] = error;
                    }                
                }
                // Other error
                else {
                    tableError.messages.push(error.body.message);
                }
            });
        }
        if (tableError.messages.length > 0)
            errors.table = tableError;
        for (const id of refreshIds) {
            this.refreshRecord(id, id);
        }
        this.recordViewer.afterDatatableSave(hasErrors, errors);
        if (!hasErrors)
            this.displaySuccess(null, this.labels.labelSavedChanges);
        this.showSpinner = false;
    }

    // Refresh a record from the database
    @api refreshRecord(newId, oldId) {
        getRecord({
            dataSourceType: this.dataSourceType, dataProviderClass: this.dataProviderClass, id: newId, objectName: this.objectName, queryFields: this.queryFields
        }).then((result) => {
            this.recordViewer.refreshRecord(result[0], newId, oldId);
        }).catch((error) => {
            this.displayErrorInList(error);
        });
    }

    // Validate row selection in screenflows
    @api
    validate() {
        if (!this.minRowSelected || this.selectedRecords.length >= this.minRowSelected) {
            return { isValid: true };
        }
        else {
            return {
                isValid: false,
                errorMessage: this.labels.labelMinRowSelectionError.replace('{0}', this.minRowSelected)
            };
        }
    }

    displayErrorInList(msg) {
        console.log('InitError ' + JSON.stringify(msg));
        let errorMsg = this.parseError(msg);
        console.log(errorMsg);
        if (errorMsg && errorMsg.includes("###")) {
            const parts = errorMsg.split("###");
            errorMsg = parts[0];
        }
        this.errorMsg = errorMsg;
    }

    // Display success or error message
    displayMessage(variant, msg, title) {
        this.dispatchEvent(
            new ShowToastEvent({ title: title ? title : variant.toUpperCase(), message: msg, variant: variant })
        );
    }

    // Display success message
    @api displaySuccess(msg, title) {
        this.displayMessage("success", msg, title);
    }

    // Display waring message
    @api displayWarning(msg, title) {
        this.displayMessage("warning", msg, title);
    }

    // Display error message
    @api displayError(error, title) {
        this.displayMessage("error", this.parseError(error), title);
    }

    // Parse error
    parseError(error) {
        let msg = '';
        if (error.body && error.body.output) {
            msg = error.body.message;
            if (error.body.output.errors.length > 0)
                msg += "\n" + error.body.output.errors[0].message;
            msg += "\nOutput " + JSON.stringify(error.body.output);
        } else if (Array.isArray(error.body) && error.body.length > 0) {
            msg = error.body[0].message;
            msg += "\n" + error.body[0].errorCode;
        } else if (error.body && error.body.message) {
            msg = error.body.message;
        } else if (error.body && error.body.error) {
            msg = error.body.error;
        } else if (error.body) {
            msg = error.body;
        } else if (error.statusText) {
            msg.error = error.statusText;
        } else if (error.message) {
            msg = error.message;
        } else {
            msg = error;
        }
        return msg;
    }
}