import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { updateRecord } from "lightning/uiRecordApi";

import getParentId from "@salesforce/apex/SmartListController.getParentId";
import getListParameters from "@salesforce/apex/SmartListController.getListParameters";
import getPage from "@salesforce/apex/SmartListController.getPage";
import getRecord from "@salesforce/apex/SmartListController.getRecord";
import runFlow from "@salesforce/apex/SmartListController.runFlow";

import labelExportToCSV from '@salesforce/label/c.ExportToCSV';
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
import labelSelectAll from "@salesforce/label/c.SelectAll";

// Import message service features required for subscribing and the message channel
import { subscribe, MessageContext } from 'lightning/messageService';
import SMARTLIST_CHANNEL from '@salesforce/messageChannel/SmartList__c';

export default class SmartListShared extends LightningElement {
    // PARAMETERS FROM LWC
    // Id of the parent record 
    _recordId = null;
    @api get recordId() {
        return this._recordId;
    }
    set recordId(value) {
        if (this.initializedContext) {
            this._recordId = value;
            this.showSpinner = true;
            getParentId({
                context: null,
                recordId: this.recordId,
                listName: this.listName
            })
                .then((result) => {
                    this.showSpinner = false;
                    this.parentId = result;
                    this.handleRefresh();
                })
                .catch((error) => {
                    this.displayErrorInList(error);
                });
            
        } else
            this._recordId = value;
    }

    // LIST PARAMETERS DEFINED IN THE UI (AppBuilder, Flow...)
    // List Definition name
    @api listName;
    @api inRecordPage = false;
    @api inTab = false;
    @api flow = false;
    // Min row selected for Screenflow
    @api minRowSelected;
    community;

    // GLOBAL PARAMETERS
    slds2;
    // LIST HEADER
    icon;
    get iconSize() {
        return this.inRecordPage ? 'small' : 'medium';
    }
    get titleClass() {
        return this.inRecordPage ?
            'slds-card__header-title slds-var-p-right_xx-small slds-truncate' :
            'slds-page-header__title slds-var-p-right_x-small slds-truncate';
    }
    _title;
    get title() {
        return this._title + ' (' + this.recordsCountLabel + ')';
    }
    get recordsCountLabel() {
        return this.recordsCount + (this.recordViewer.canLoadData || this.maxRecordsLoaded ? '+' : '');
    }
    errorMsg;
    // ITEMS SECTION
    get itemsCountLabel() {
        if (this.hasSelectedRecords)
            return this.selectedRecordsCount;
        else
            return this.recordsCountLabel;
    }
    get itemsLabel() {
        if (this.selectedRecordsCount == 1)
            return this.labels.labelItemSingular + ' ' + this.labels.labelSelectedSingular;
        else if (this.hasSelectedRecords)
            return this.labels.labelItemPlural + ' ' + this.labels.labelSelectedPlural;
        else
            return this.recordsCount == 1 ? this.labels.labelItemSingular : this.labels.labelItemPlural;
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
        labelExportToCSV,
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
        labelErrors,
        labelSelectAll
    };

    // GET RECORDS VARIABLES
    objectName;
    nameField;
    parentId;
    parentIdField;
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
    // Filters panel columns
    filtersColumns = 1;
    // Filters panel width in rem
    filtersWidth = 22;
    // Filters Panel state: displayed/Hidden
    showFiltersPanel = false;
    // Spinner is displayed: initialization and auto-launched flow action execution
    showSpinner = false;
    // List of SOQL scope displayed/hidden
    showScopes = false;
    // Filters panel displayed/hidden
    showFilters = false;
    // Select All button displayed/hidden
    showSelectAll = false;
    // Sort menu displayed/hidden (for tiles)
    showSort = false;
    // Display Export to CSV button
    exportToCSV;
    // Check Add Record Id by default in Export to CSV Modal
    exportToCSVAddRecordId;
    // Show/hide Export Records modal
    showExportToCSVModal = false;
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
        return this.showFiltersPanel && !this.displayFiltersPanelAllTheTime ? "slds-col slds-no-space sl-viewer-container sl-viewer-container-with-filters" : "slds-col slds-no-space sl-viewer-container";
    }
    get articleClass() {
        /*let cls = "slds-card slds-card_boundary sl-component-container";
        return this.flow ? cls += " sl-flow-context" : this.community ? cls += " sl-community-context" : cls += " sl-app-context";*/
        let cls = "slds-card slds-card_boundary sl-component-container";
        if (this.flow)
            cls += " sl-flow-context";
        else if (this.community)
            cls += " sl-community-context"
        else if (this.recordId)
            cls += " slds-card_related-list-fix";
        return cls;
    }
    get pageHeaderClass() {
        let cls = 'slds-page-header';
        return this.flow ? cls += ' sl-flow-context' : this.community ? cls += ' sl-community-context' : cls + ' slds-page-header--object-home';
    }

    get pageHeaderRow1Class() {
        let cls = 'slds-page-header__row'
        return this.dataSourceType === 'Files' ? cls += ' sl-page-header-row1' : cls;
    }
    get filtersPanelDivClass() {
        return (this.showFiltersPanel) ? 'slds-col slds-no-flex sl-filters-panel' : 'slds-col slds-no-flex slds-hide sl-filters-panel';
    }

    // GET UI COMPONENTS
    _componentContainer;
    get componentContainer() {
        if (!this._componentContainer)
            this._componentContainer = this.template.querySelector('.sl-component-container');
        return this._componentContainer;
    }
    _viewerPanel;
    get viewerPanel() {
        if (!this._viewerPanel)
            this._viewerPanel = this.template.querySelector('.sl-viewer-panel');
        return this._viewerPanel;
    }
    _viewerContainer;
    get viewerContainer() {
        if (!this._viewerContainer)
            this._viewerContainer = this.template.querySelector('.sl-viewer-container-with-filters');
        return this._viewerContainer;
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

    // By using the MessageContext @wire adapter, unsubscribe will be called
    // implicitly during the component descruction lifecycle.
    @wire(MessageContext)
    messageContext;

    // Encapsulate logic for LMS subscribe.
    subscribeToMessageChannel() {
        this.subscription = subscribe(
            this.messageContext,
            SMARTLIST_CHANNEL,
            (message) => this.handleMessage(message)
        );
    }

    // Handler for message received by component
    handleMessage(message) {
        if (message.list === '*' || message.list.toLowerCase() === this.listName.toLowerCase()) {
            if (message.action.type === 'REFRESH')
                this.handleRefresh();
            else if (message.action.type === 'FILTER') {
                const filter = message.action.filter;
                for (const filterOption of this.listFilters) {
                    if (filterOption.value === filter) {
                        this.handleChangeFilter({detail: {value: filterOption.value}});
                        break;
                    }
                }
            } else if  (message.action.type === 'SCOPE') {
                const scope = message.action.scope;
                for (const scopeOption of this.soqlScopes) {
                    if (scopeOption.value === scope) {
                        this.handleChangeScope({detail: {value: scopeOption.value}});
                        break;
                    }
                }
            }
        }
    }

    // Standard lifecycle hooks used to sub/unsub to message channel
    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    // COMPONENT INITIALIZATION FLOW
    // - recordViewer send ready notification at the end of connectedCallback
    // - initialize: 
    //      - Perform initialization from list definition
    //      - Notify parent SmartList that parent initialization is needed
    // - parentInitialized: 
    //      - invoked by parent for completing initialization
    //      - initialize record viewer with data provided by parent
    initDone = false;
    handleViewerConnected(event) {
        if (!this.initDone) {
            this.initialize();
            this.initDone = true;
        }
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
                this.slds2 = listDef.slds2;
                this.icon = listDef.listIcon;
                this._title = listDef.listLabel;
                this.dataSourceType = listDef.dataSourceType;
                this.displayMode = listDef.displayMode;
                this.exportToCSV = listDef.exportToCSV;
                this.exportToCSVAddRecordId = listDef.exportToCSVAddRecordId;
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
                this.showSelectAll = listDef.displayMode == 'Tiles' && listDef.selectableRows && (listDef.maxRowSelected > 1);
                this.fields = listDef.fields;
                this.rowKey = listDef.rowKey;
                this.isMultiCurrency = listDef.isMultiCurrency;
                const filters = listDef.filters;
                if (filters.length > 0) {
                    this.currentListFilter = filters[0];
                    if (filters.length > 1) {
                        for (let filter of filters) {
                            if (filter.defaultFilter) {
                                this.currentListFilter = filter;
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
                this.maxRowSelected = listDef.maxRowSelected;
                // Add smartListShared properties to listDef which are needed by initialization process
                listDef.flow = this.flow;
                this.displayFiltersPanelAllTheTime = listDef.displayFiltersPanelAllTheTime;
                // Hack: Display panel so that code available for building filters -> long term solution move buildFilterModel to library
                this.rightFilters = listDef.filtersPosition === 'right';
                this.leftFilters = !this.rightFilters;
                this.filtersMaxHeight = listDef.filtersMaxHeight;
                // Build Filters Panel model and initialize values
                this.filtersPanel.buildFilterModel(listDef.fields, listDef.showSOSLSearchInFiltersPanel, listDef.dataSourceType);
                const hasFilters = this.filtersPanel.hasFilters;
                this.staticFiltersPanel = hasFilters && listDef.displayFiltersPanelAllTheTime;
                this.canCloseFiltersPanel = !this.staticFiltersPanel && hasFilters;
                this.showFiltersPanel = this.staticFiltersPanel;
                this.filtersColumns = listDef.filtersColumns;
                this.filtersWidth = this.filtersColumns === 1 ? 22 : this.filtersColumns * 20;
                this.showSOSLSearch = (listDef.showSOSLSearchInComponent && this.filtersPanel.hasSearchableFields);
                // Request initialization data from parent 
                this.dispatchEvent(
                    new CustomEvent('initialize', { detail: listDef }));
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
        if (listDef.noAutoload)
            this.recordViewer.initDone = true;
    }

    isRendered = false;
    // Set the maximum width of the viewer the 1st time the comp is rendered
    renderedCallback() {
        // Add resize listener for resizing the list when the window is resized
        if (!this.isRendered && this.initializedContext) {
            this.template.host.style.setProperty('--sl-filters-panel-width', this.filtersWidth + 'rem');
            this.setListWidth();
            //this.isRendered = true;
            window.addEventListener('resize', this.handleResizeWindow.bind(this));
        }
    }

    // Adjust the list max width when the window is resized
    handleResizeWindow() {
        this.setListWidth();
    }

    borders = -1;
    setListWidth() {
        const componentContainer = this.componentContainer;
        if (componentContainer && componentContainer.offsetWidth > 0) {
            if (this.borders < 0) {
                const style = getComputedStyle(componentContainer);
                this.borders = parseFloat(style.borderLeftWidth) || 0;
                this.borders += parseFloat(style.borderRightWidth) || 0;
            }
            const rect = componentContainer.getBoundingClientRect();
            if (this.viewerMaxWidth !== rect.width - this.borders) {
                this.viewerMaxWidth = Math.floor(rect.width - this.borders);
                this.viewerPanel.style.width = this.viewerMaxWidth + 'px';
                this.recordViewer.mustUpdateWidth = true;
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
    async loadPage(replaceRecords, loadAll) {
        //Display spinner while data is loaded
        this.isLoading = true;
        this.showSpinner = true;
        /* Use cases
            !loaAll & !replaceRecords:
            - offset
                recordsCounts <= 2000 -> recordsCount
                recordsCounts > 2000 -> 0
            - limit
                recordsCounts <= 2000 -> min(offset + pageSize, maxRecords)
                recordsCounts > 2000 -> maxRecords
            replaceRecords: 
            - offset = 0
            - limit
                noPaging -> maxRecords
                !noPaging -> pageSize
            loadAll:
            - offset
                recordsCounts <= 2000 -> recordsCount
                recordsCounts > 2000 -> 0
            - limit
                recordsCounts <= 2000 -> maxRecords - recordsCount
                recordsCounts > 2000 -> maxRecords
        */ 
        const maxRecords = this.recordViewer.maxRecords;
        const pageSize = this.recordViewer.pageSize;
        const recordsCount = this.recordViewer.recordsCount;
        let offset;
        let pageRecs;
        let loadMax = false;
        if (replaceRecords) {
            offset = 0;
            pageRecs = this.recordViewer.noPaging ? maxRecords : pageSize
            loadMax = this.recordViewer.noPaging;
        } else if (loadAll) {
            offset = recordsCount > 2000 ? 0 : recordsCount;
            pageRecs = recordsCount > 2000 ?  maxRecords : maxRecords - recordsCount;
            loadMax = true;
        } else {
            offset = recordsCount > 2000 ? 0 : recordsCount;
            pageRecs = recordsCount > 2000 ?  maxRecords : Math.min(maxRecords - offset, pageSize);
            loadMax = recordsCount > 2000;
        }
        //console.log('smartListShared.loadPage ' + offset + ' ' + pageRecs + ' ' + loadMax);
        const parms = this.getPageParameters();
        await getPage({
            listName: this.listName,
            listFilter: parms.listFilter,
            soqlScope: parms.soqlScope,
            filterEntries: parms.filterEntries,
            parentId: parms.parentId,
            sortField: parms.sortField,
            sortDirection: parms.sortDirection,
            offset: offset,
            pageSize: pageRecs
        }).then((result) => {
            const pageRecords = result;
            //console.log("getPage " + JSON.stringify(result));
            //console.log("relFields " +JSON.stringify(this.relFields) + '\n');
            const loadedRecords = pageRecords.length;
            const allRecordsLoaded = loadMax || (loadedRecords < pageRecs);
            this.maxRecordsLoaded = recordsCount + loadedRecords == maxRecords;
            this.recordViewer.setRecordsPage(pageRecords, replaceRecords, this.maxRecordsLoaded, allRecordsLoaded);
            this.isLoading = false;
            this.showSpinner = false;
            this.recordViewer.initDone = true;
        }).catch((error) => {
            this.displayErrorInList(error);
        });
    }

    // Get page parameters for getPage and exportToCSV
    getPageParameters() {
        const parms = {
            listFilter: this.currentListFilter?.filter,
            soqlScope: this.currentSoqlScope,
            filterEntries: this.filterEntries,
            parentId: this.parentId,
            sortField: this.recordViewer.sortField,
            sortDirection: this.recordViewer.sortDirection + ' nulls ' + (this.recordViewer.sortNullsFirst ? 'first' : 'last')
        }
        return parms;
    }

    // Handle select all in tile
    handleSelectAll() {
        console.log('selectAll');
        this.recordViewer.selectAll();
    }

    // Sort updated in datatable
    handleSortUpdate() {
        this.loadFirstPage();
    }

    // Sort field updated in tiles
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
        for (const filter of this.listFilters) {
            if (filter.value === event.detail.value) {
                this.currentListFilter = filter;
                break;
            }
        }
        this.loadFirstPage();
    }

    // New scope selected in scopes combobox
    handleChangeScope(event) {
        this.currentSoqlScope = event.detail.value;
        this.loadFirstPage();
    }

    // Export to CSV button has been clicked
    handleExportToCSV() {
        const parms = this.getPageParameters();
        parms['pageSize'] = this.recordViewer.maxRecords;
        this.exportToCSVParms = parms;
        this.showExportToCSVModal = true;
    }

    // Export to CSV Modal has been closed
    handleCloseExportToCSV(event) {
        if (event.detail.action === 'error')
            this.displayErrorInList(event.detail.error);
        else
            this.showExportToCSVModal = false;
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
            let valueForCheck = value.replaceAll(/(\*|\?)/gi, '');
            if (value && valueForCheck.length < 2)
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
            runFlow({ flowName: action.flowName, records: rows, parentId: this.parentId }).then(result => {
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
        if (result && result.successMsg)
            this.displaySuccess(null, result.successMsg);
        else if (result && result.errorMsg)
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
        this.showSpinner = true;
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
        this.showSpinner = false;
        this.recordViewer.afterDatatableSave(hasErrors, errors);
        if (!hasErrors)
            this.displaySuccess(null, this.labels.labelSavedChanges);
    }

    // Handle scroll of viewer container: send the horz scroll position to recordViewer for displaying tooltips 
    handleViewerScroll(event) {
        this.recordViewer.scrollLeft = this.viewerContainer.scrollLeft;
    }

    // Refresh a record from the database
    @api refreshRecord(newId, oldId) {
        getRecord({
            listName: this.listName, id: newId
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
        this.displayMessage("error", this.parseError(error), title ? title : this.labels.labelErrors);
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