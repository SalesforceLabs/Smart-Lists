import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { FlowAttributeChangeEvent } from "lightning/flowSupport";

import labelShowActions from "@salesforce/label/c.ShowActions";
import labelNoItemsToDisplay from "@salesforce/label/c.NoItemsToDisplay";
import labelLoadMoreRecords from "@salesforce/label/c.LoadMoreRecords";
import labelAllRecordsLoaded from "@salesforce/label/c.AllRecordsLoaded";
import labelMaxRecordsLoaded from "@salesforce/label/c.MaxRecordsLoaded";
import labelLoadMore from "@salesforce/label/c.LoadMore";
import labelLoadAll from "@salesforce/label/c.LoadAll";
import labelLoading from "@salesforce/label/c.Loading";

import {
    getTypeFromApexDisplayType,
    FieldTypes
} from 'c/datatypeUtils';

export default class RecordViewer extends NavigationMixin(LightningElement) {
    // COMPONENT DATA
    displayMode;
    slds2;
    @api initializedContext;
    @api initDone;
    flow;
    community;
    userTimeZone;
    currencyCode;
    isMultiCurrency;
    // Trigger notify smartListShared when comp initialized and rendered
    mustTriggerReady = false;

    // LABELS
    labels = {
        labelShowActions,
        labelNoItemsToDisplay,
        labelLoadMoreRecords,
        labelAllRecordsLoaded,
        labelMaxRecordsLoaded,
        labelLoadMore,
        labelLoadAll,
        labelLoading,
    };

    // RECORDS MANAGEMENT
    @api pageSize;
    @api maxRecords;
    @api noPaging;
    recordsNbrPerPage = -1;

    // SORT DATA
    // List of sort fields used by the tiles sort fields selector
    @api sortFields;
    defaultSortDirection;
    // Sort nulls first or last for each sortable field
    sortNullsFirstFields = {};
    // Sort nulls first / last for the current sort field - Must be populated by get sortField for avoiding field name transform
    @api sortNullsFirst;
    _sortDirection;
    // Expose sortDirection for parent;
    @api get sortDirection() {
        return this._sortDirection;
    }
    set sortDirection(value) {
        this._sortDirection = value;
    }
    _sortField;
    // Expose sortField for parent
    @api get sortField() {
        // Populate here to avoid field name transform
        this.sortNullsFirst = this.sortNullsFirstFields[this._sortField];
        return this._sortField
            ? this._sortField.replace(this.hyperlinkFieldSuffix, '')
            : null;
    }
    set sortField(value) {
        this._sortField = value;
        for (let field of this.sortFields) {
            field.current = field.name == value;
            if (field.name == value) this._sortFieldLabel = field.label;
        }
    }
    _sortFieldLabel = '';
    // Expose sortFieldLable for parent
    @api get sortFieldLabel() {
        return this._sortFieldLabel;
    }
    @api rightFilters;
    @api filtersWidth;
    @api showFiltersPanel;
    // Viewer width
    _staticFiltersPanel = 'x';
    @api get staticFiltersPanel() {
        return this._staticFiltersPanel;
    }
    set staticFiltersPanel(value) {
        this._staticFiltersPanel = value;
    }
    _width = -1;
    @api get width() {
        return this._width;
    }
    set width(value) {
        if (value === this._width)
            return;
        this._width = value;
        this.setWidth();
    }
    setWidth() {
        if (this.viewer && this._width !== -2 && this.staticFiltersPanel !== 'x') {
            let width = this.staticFiltersPanel ? 'calc(' + (this.width-2) + 'px - ' + this.filterWidth + 'rem)' : this.width + 'px';
            this.viewer.style.width = width;
            if (!this.slds2)
                width--;
            this.mustUpdateWidth = false;
        }
    }
    setHeight() {
        let height;
        if (this.isTable) {
            if (this.tableHeight) 
                height = this.tableHeight;
            else if (this.recordsNbrPerPage >= 0 && this.datatable?.headerHeight !== null) {
                height = this.datatable.headerHeight;
                if (this.recordsNbrPerPage > 0)
                    height += this.datatable.rowHeight1;
                if (this.recordsNbrPerPage > 1)
                    height += ((this.recordsNbrPerPage - 1) * this.datatable.rowHeight2);
            }
        } else if (!this.dynamicTileHeight && this.recordsNbrPerPage)
            height = this.setTilePageHeight(this.recordsNbrPerPage, this.numberOfTilesPerRow);
        if (height) {
            this.viewer.style.height = height + 'px';
            this.mustSetInitHeight = false;
            // For table, check if height needs to be adjusted to include the horizontal scrollbar
            if (this.isTable) {
                setTimeout(() => {
                    if (this.datatable.scrollbarWidth > 0 && this.datatable.scrollbarHeight > 5) {
                        const height = parseFloat(getComputedStyle(this.viewer).getPropertyValue('height'));
                        this.viewer.style.height = 'calc(' + height + 'px + 1rem)';
                    }
                }, 10);
            }
        }
    }
    @api scrollLeft = 0;
    // Flag for showing/hidding Load All button
    showLoadAllButton = true;
    // Flag for triggering scroll to records page after click on Load More
    scrollAfterLoadMore = false;
    // Flag for triggering scroll to last records page after click on Load All
    scrollAfterLoadAll = false;

    // DATATABLE DATA
    mustSetInitHeight = true;
    @api mustUpdateWidth = false;
    columns = [];
    rowKey;
    datatableRecords = [];
    // Maximum number of selectable rows
    @api maxRowSelected;
    hideCheckboxColumm;
    hideTableHeader;
    showRowNumberColumn;
    rowNumberStart;
    wrapColumnHeaders;
    wrapMaxLines;
    tableHeight;
    @api isLoading = false;
    _canLoadData;
    @api get canLoadData() {
        return this._canLoadData;
    }
    set canLoadData(value) {
        this._canLoadData = value;
    }
    loadStatus;
    draftValues = [];
    saveBarDisplayed = false;
    errors;
    editedCells = new Map();
    get datatableClass() {
        let cls = 'sl-datatable-container';
        if (!this.slds2)
            cls += ' sl-viewer-border-top sl-viewer-border-bottom';
        return cls;
    }

    // TILES DATA
    dynamicTileHeight;
    tileRowHeight;
    tilesLoadMoreThreshold = 5;
    tilesRecords = [];
    numberOfTilesPerRow;
    numberOfColumnsPerTile;
    get tileRowClass() {
        return ('sl-tile-row slds-var-p-left_small slds-size_1-of-1 slds-medium-size_1-of-' + this.numberOfTilesPerRow);
    }
    get tileColumnsClass() {
        return ('slds-list_horizontal slds-wrap slds-size_1-of-' + this.numberOfColumnsPerTile);
    }

    // COMPONENTS AND SIZING
    _tilesBody;
    get tilesBody() {
        if (!this._tilesBody)
            this._tilesBody = this.template.querySelector('.sl-tile');
        return this._tilesBody;
    }
    _scroller;
    get scroller() {
        if (!this._scroller)
            this._scroller = this.template.querySelector('.sl-scroller');
        return this._scroller;
    }
    _datatableContainer;
    get datatableContainer() {
        if (!this._datatableContainer)
            this._datatableContainer = this.template.querySelector('.sl-datatable-container');
        return this._datatableContainer;
    }
    _datatable;
    get datatable() {
        if (!this._datatable)
            this._datatable = this.template.querySelector('c-sl-datatable');
        return this._datatable;
    }
    _tileContainer;
    get tileContainer() {
        if (!this._tileContainer)
            this._tileContainer = this.template.querySelector('.sl-tile-container');
        return this._tileContainer;
    }
    @api get parentTop() {
        return this.viewer ? this.viewer.getBoundingClientRect().top : null;
    }
    @api get parentLeft() {
        return this.viewer ? this.viewer.getBoundingClientRect().left : null;
    }
    @api get parentHeight() {
        return this.viewer ? this.viewer.getBoundingClientRect().height : null;
    }
    @api get parentWidth() {
        return this.viewer ? this.viewer.getBoundingClientRect().width : null;
    }
    _viewer;
    get viewer() {
        if (!this._viewer)
            this._viewer = this.isTable ? this.datatableContainer : this.tilesBody;
        return this._viewer;
    }

    // Display table or tiles
    get isTable() {
        return this.displayMode == 'Table';
    }

    // RECORDS DATA
    recordsMap = new Map();
    @api get records() {
        return this.isTable ? this.datatableRecords : this.tilesRecords;
    }
    set records(value) {
        if (this.isTable) this.datatableRecords = [...value];
        else this.tilesRecords = [...value];
    }
    @api get recordsCount() {
        return this.records.length;
    }
    @api get hasRecords() {
        return this.records.length > 0;
    }
    @api get hasNoRecords() {
        return !this.hasRecords;
    }
    @api hasRecord(id) {
        return this.recordsMap.has(id);
    }
    // RECORDS FORMATTING DATA
    // Suffix added to the field name in a datatable column for mapping to a hyperlink
    hyperlinkFieldSuffix = '$$URL';
    // Constant used as placeholder for the record Id in hyperlink links; the actual Id is set in formatRecord
    cidConst = '$CID$';
    // Hyperlink to record detail
    recordDetailUrl;
    // Hyperlink to file preview - File Preview in desktop / File record detail in community
    _filePreviewUrl;
    get filePreviewUrl() {
        return this.community ? this.recordDetailUrl : this._filePreviewUrl;
    }
    // List of field transformations for the records
    fieldsTransform = [];
    tileHeaderTemplate;
    tileBodyTemplate = [];

    // RECORDS SELECTION
    // Flag for indicating that row selection is allowed
    canSelectRows;
    // Flag for indicating that multi-row selection is allowed
    get isMultiSelect() {
        return this.maxRowSelected > 1;
    }
    // Selected records
    _selectedRecords = new Set();
    @api get selectedRecordsCount() {
        return this._selectedRecords.size;
    }
    @api get hasSelectedRecords() {
        return this.selectedRecordsCount > 0;
    }
    @api get hasNoSelectedRecords() {
        return !this.hasSelectedRecords;
    }
    // Returns first selected record for Screenflow
    @api get selectedRecord() {
        return this.hasSelectedRecords ? this.selectedRecords[0] : null;
    }
    // Returns selected records for Screenflow
    @api get selectedRecords() {
        return Array.from(this._selectedRecords);
    }
    // Programmatically selected records in the datatable
    // Can't use 1 variable because select boxes in datatable become read-only
    _selectedRecordsProgrammatic = [];
    @api get selectedRecordsProgrammatic() {
        return this._selectedRecordsProgrammatic;
    }
    set selectedRecordsProgrammatic(value) {
        this._selectedRecordsProgrammatic = value;
        this._selectedRecords = new Set(value);
    }

    // connectedCallback:
    // 1) retrieve URLs for record hyperlinks
    // 2) notify parent when done
    async connectedCallback() {
        let pageRef = {
            type: 'standard__recordPage',
            attributes: {
                recordId: this.cidConst,
                actionName: 'view',
            },
        };
        this.recordDetailUrl = decodeURIComponent(
            await this[NavigationMixin.GenerateUrl](pageRef)
        );
        pageRef = {
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview',
            },
            state: {
                recordIds: this.cidConst,
            },
        };
        this._filePreviewUrl = decodeURIComponent(
            await this[NavigationMixin.GenerateUrl](pageRef)
        );
        this.dispatchEvent(new CustomEvent('connected', {}));
    }

    renderedCallback() {
        // Set height on first render
        if (this.mustSetInitHeight)
            setTimeout(() => {
                this.setHeight();
            }, 10);
        if (this.mustUpdateWidth)
            setTimeout(() => {
                this.setWidth();
            }, 10);
        // Scroll to records if click Load More / Load All
        if (!this.isLoading) {
            // Scroll to added records
            if (this.scrollAfterLoadMore) {
                if (this.isTable)
                    this.datatable.scrollTo(this.allRecordsLoaded ? this.prevRecordsNbr : this.records.length);
                else {
                    this.cancelTileScroll = true;
                    this.tileContainer.scrollTop = this.getTileBaseHeight(!this.allRecordsLoaded ? this.prevRecordsNbr : this.records.length) - this.tilesLoadMoreThreshold;
                    setTimeout(() => {
                        this.cancelTileScroll = false;
                    }, 100);                    
                }
                this.scrollAfterLoadMore = false;
            }
            // Scroll to last records
            else if (this.scrollAfterLoadAll) {
                if (this.isTable)
                    this.datatable.scrollTo(this.records.length);
                else
                    this.tileContainer.scrollTop = this.tileRowHeight * this.records.length;
                this.scrollAfterLoadAll = false;
            }
            setTimeout(() => {
                this.firstLoad = false;
            }, 100);
        }
    }

    // Initialize datatable parameters and datatable columns
    @api initialize(listDef) {
        this.flow = listDef.flow;
        this.community = listDef.community;
        this.displayMode = listDef.displayMode;
        this.userTimeZone = listDef.userTimeZone;
        this.currencyCode = listDef.currencyCode;
        this.isMultiCurrency = listDef.isMultiCurrency;
        this.maxRecords = listDef.maxRecords;
        this.pageSize = listDef.pageSize;
        this.noPaging = listDef.noPaging;
        this.rowKey = listDef.rowKey;
        this.showLoadAllButton = !listDef.hideLoadAllButton;
        this.slds2 = listDef.slds2;
        this.isTable
            ? this.initializeDatatable(listDef)
            : this.initializeTilesViewer(listDef);
        const columns = [];
        const sortableFields = [];
        const isApex = listDef.dataSourceType.startsWith('Apex');
        const keys = Object.keys(listDef.fields);
        let lastFieldName = keys[keys.length-1];
        for (const fieldName of Object.getOwnPropertyNames(listDef.fields)) {
            const fieldDef = listDef.fields[fieldName];
            let fieldTransform = {};
            if (fieldDef.listField) {
                let urlField = '';
                const isRelatedField = fieldName.includes('.') && !isApex;
                const isRecordLink = this.isRecordLink(listDef, fieldDef);
                const isPreviewLink = this.isPreviewLink(listDef, fieldDef);
                if (isRecordLink || isPreviewLink) {
                    urlField = fieldName + this.hyperlinkFieldSuffix;
                    const url = isPreviewLink
                        ? this.filePreviewUrl
                        : this.recordDetailUrl;
                    fieldTransform.valueField = fieldName;
                    fieldTransform.hyperlink = {
                        field: urlField,
                        idFieldParts: fieldDef.hyperlinkIdField.split('.'),
                        url: url,
                    };
                } else if (fieldDef.displayType === 'LOCATION') {
                    fieldTransform.valueField = fieldName;
                    fieldTransform.location = true;
                } else if (fieldDef.displayType === 'TIME') {
                    fieldTransform.valueField = fieldName;
                    fieldTransform.time = true;
                }
                if (isRelatedField) {
                    fieldTransform.valueField = fieldName;
                    fieldTransform.relatedField = { parts: fieldName.split('.') };
                }
                if (Object.keys(fieldTransform).length > 0)
                    this.fieldsTransform.push(fieldTransform);
                if (fieldDef.sortable) {
                    sortableFields.push({ name: fieldName, label: fieldDef.label });
                    this.sortNullsFirstFields[fieldName] = fieldDef.nullsSortFirst;
                }
                if (this.isTable)
                    columns.push(
                        this.initalizeDatatableField(fieldDef, urlField, listDef, (lastFieldName === fieldName))
                    );
                else this.initializeTilesViewerField(fieldDef, urlField, listDef);
            }
        }
        if (this.isTable) {
            if (listDef.rowActions && listDef.rowActions.length > 0) {
                this.rowActions = listDef.rowActions;
                columns.push({
                    type: 'action',
                    typeAttributes: { rowActions: this.buildRowActions(listDef) },
                });
                this.hasRowActions = true;
            }
            this.columns = [...columns];
        }
        // Handle sort data
        const sortFields = [];
        sortableFields.sort(this.compareSortableFields).forEach(function (field) {
            const fieldName = field.name;
            sortFields.push({ name: fieldName, label: field.label, current: false });
        });
        this.sortFields = sortFields;
        this.sortDirection = listDef.sortDirection
            ? 'asc'
            : listDef.defaultSortDirection;
        this.sortField = listDef.defaultSortField;
        // Notifiy smartListShared that initialized
        this.mustTriggerReady = true;
    }

    // Compare sortable fields
    compareSortableFields(f1, f2) {
        return f1.label.localeCompare(f2.label);
    }

    // tiles viewer parameters
    initializeTilesViewer(listDef) {
        this.numberOfTilesPerRow = listDef.numberOfTilesPerRow;
        this.numberOfColumnsPerTile = listDef.numberOfColumnsPerTile;
        this.canSelectRows = listDef.selectableRows;
        this.maxRowSelected = listDef.maxRowSelected;
        if (!this.tileHeaderTemplate)
            this.tileHeaderTemplate = { hasUrl: false, fields: [], actions: [] };
        this.tileHeaderTemplate.actions = this.buildRowActions(listDef);
    }

    // Build the list of row actions for datatable and tile
    buildRowActions(listDef) {
        const actions = [];
        for (const action of listDef.rowActions) {
            actions.push({ label: action.label, key: action.key });
        }
        return actions;
    }

    // Create tiles fields
    initializeTilesViewerField(fieldDef, urlField, listDef) {
        if (fieldDef.numberOfColumns > this.numberOfColumnsPerTile)
            fieldDef.numberOfColumns = this.numberOfColumnsPerTile;
        let fieldTemplate = {
            nameInViewer: urlField,
            name: fieldDef.name,
            label: fieldDef.label,
            class: 'slds-list_horizontal slds-wrap slds-size_' + fieldDef.numberOfColumns + '-of-' + this.numberOfColumnsPerTile
        };
        if (fieldDef.tileHeader) {
            if (!this.tileHeaderTemplate)
                this.tileHeaderTemplate = { hasUrl: false, fields: [] };
            if (fieldDef.displayAsBadge) {
                this.tileHeaderTemplate.badgeField = {
                    name: fieldDef.name,
                    styleField: fieldDef.badgeStyleField,
                };
            } else {
                if (
                    this.isRecordLink(listDef, fieldDef) &&
                    this.tileHeaderTemplate.fields.length == 0
                ) {
                    this.tileHeaderTemplate.hasUrl = true;
                    this.tileHeaderTemplate.urlField = urlField;
                } else if (
                    this.isPreviewLink(listDef, fieldDef) &&
                    this.tileHeaderTemplate.fields.length == 0
                ) {
                    this.tileHeaderTemplate.hasUrl = true;
                    this.tileHeaderTemplate.urlField = urlField;
                }
                this.tileHeaderTemplate.fields.push(fieldTemplate);
            }
        } else {
            fieldTemplate.data = this.getFieldTypeData(listDef, fieldDef, urlField);
            this.tileBodyTemplate.push(fieldTemplate);
        }
    }

    // Initialize datatable parameters and datatable columns
    initializeDatatable(listDef) {
        this.defaultSortDirection = listDef.defaultSortDirection;
        this.maxRowSelected = listDef.maxRowSelected;
        this.hideCheckboxColumm = !listDef.selectableRows;
        this.hideTableHeader = !listDef.showListHeader;
        this.showRowNumberColumn = listDef.showRowNumberColumn;
        this.rowNumberStart = listDef.rowNumberStart;
        this.wrapColumnHeaders = listDef.wrapColumnHeaders;
        this.wrapMaxLines = listDef.wrapMaxLines;
        this.tableHeight = listDef.tableHeight;
    }

    // Create datatable fields
    initalizeDatatableField(fieldDef, urlField, listDef, isLastField) {
        let column = {
            label: fieldDef.label,
            fieldName: fieldDef.name,
            editable: fieldDef.editable,
            sortable: fieldDef.sortable,
            wrapText: fieldDef.wrap,
            type: 'cell',
        };
        if (fieldDef.fieldAlignment)
            column.cellAttributes = { alignment: fieldDef.fieldAlignment.toLowerCase() }; 
        if (fieldDef.columnWidth) 
            column.initialWidth = fieldDef.columnWidth;
        column.typeAttributes = this.getFieldTypeData(listDef, fieldDef, urlField);
        column.typeAttributes.type.wrapMaxLines = listDef.wrapMaxLines;
        column.typeAttributes.type.hasExtraPadding = isLastField && listDef.rowActions.length === 0;
        return column;
    }

    // Check if field is hyperlink and can be displayed in the context
    canDisplaySalesforceLink(listDef) {
        return !listDef.flow;
    }
    canDisplayFilePreview(listDef) {
        return this.canDisplaySalesforceLink(listDef) && ((listDef.canPreviewFiles && !listDef.community) ||
            listDef.canViewFileDetails);
    }
    isRecordLink(listDef, fieldDef) {
        return fieldDef.displayType === FieldTypes.HYPERLINK_DETAIL && this.canDisplaySalesforceLink(listDef);
    }
    isPreviewLink(listDef, fieldDef) {
        return fieldDef.displayType === FieldTypes.FILE_PREVIEW && this.canDisplayFilePreview(listDef);
    }

    // Get data for field viewer
    getFieldTypeData(listDef, fieldDef, urlField) {
        // Determine type from display type & field type
        let viewType = fieldDef.displayType;
        let sfdcHyperlink = false;
        let currencyConverted = false;
        if (viewType === FieldTypes.HYPERLINK_DETAIL) {
            if (this.canDisplaySalesforceLink(listDef)) {
                viewType = FieldTypes.URL_LABEL;
                sfdcHyperlink = true;
            }
            else
                viewType = FieldTypes.TEXT;
        } else if (viewType === FieldTypes.FILE_PREVIEW) {
            if (this.canDisplayFilePreview(listDef)) {
                viewType = FieldTypes.URL_LABEL;
                sfdcHyperlink = true;
            } else
                viewType = FieldTypes.TEXT;
        } else if (viewType == FieldTypes.CURRENCY_CONVERTED) {
            currencyConverted = true;
            viewType = FieldTypes.CURRENCY;
        } else
            viewType = getTypeFromApexDisplayType(fieldDef.displayType);
        const editType = getTypeFromApexDisplayType(fieldDef.editType);
        let fieldData = {};
        // Need to pass required twice 
        // - in typeAttributes for displaying the red star in the edit panel
        // - typeAttributes.type for getting it in the component
        const required = (fieldDef.displayType === FieldTypes.BOOLEAN) ? false : fieldDef.required;
        fieldData.required = required;
        fieldData.type = { displayType: viewType, editType: editType, required: required, timeZone: this.userTimeZone }
        if (fieldDef.fieldAlignment)
            fieldData.type.alignment = fieldDef.fieldAlignment.toLowerCase();
        if (viewType === FieldTypes.NUMBER || viewType === FieldTypes.PERCENT)
            fieldData.type.fractionDigits =  fieldDef.fractionDigits;
        else if (viewType === FieldTypes.CURRENCY) {
            fieldData.type.fractionDigits = fieldDef.fractionDigits;
            fieldData.type.isMultiCurrency = this.isMultiCurrency;
            fieldData.currencyCode =  (this.isMultiCurrency && !currencyConverted) ? {fieldName: 'CurrencyIsoCode' } : this.currencyCode;
        } else if (viewType === FieldTypes.MULTIPICKLIST || viewType === FieldTypes.PICKLIST) {
            fieldData.type.objectName = listDef.objectName;
            fieldData.recordTypeId =
                    listDef.recordTypes.length > 0
                        ? { fieldName: 'RecordTypeId' }
                        : '012000000000000AAA';
            fieldData.type.apiName = fieldDef.name;
            fieldData.recordId = { fieldName: listDef.rowKey };
        } else if (sfdcHyperlink) {
            fieldData.type.target = '_self';
            fieldData.url = { fieldName: urlField};
            fieldData.isHyperlink;
        } else if (viewType === FieldTypes.URL_LABEL) {
            fieldData.type.target = fieldDef.urlTarget ? fieldDef.urlTarget : '_blank';
            fieldData.url = { fieldName: fieldDef.urlValue}
        }  else if (viewType === FieldTypes.CLICK2DIAL) {
            fieldData.recordId = { fieldName: listDef.rowKey };
        }
        if (viewType === FieldTypes.LOOKUP || editType === FieldTypes.LOOKUP) {
            fieldData.type.lookup = fieldDef.lookups[0];
            fieldData.type.apiName = fieldDef.name;
            fieldData.type.relatedIdField = fieldDef.relatedIdField;
            fieldData.relatedRecordId = { fieldName: fieldDef.relatedIdField };
            fieldData.recordId = { fieldName: listDef.rowKey };
        }
        if (fieldDef.styleField)
            fieldData.fieldStyle = { fieldName: fieldDef.styleField }
        return fieldData;
    }

    // Sort button has been clicked in the viewer
    handleSort(event) {
        this.sortField = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        // notify parent
        this.dispatchEvent(new CustomEvent('viewersort', {}));
    }

    // Set a page records in the viewer
    // replace = true -> replace the existing records otherwise, append new records
    @api setRecordsPage(
        pageRecords,
        replaceRecords,
        maxRecordsLoaded,
        allRecordsLoaded
    ) {
        //console.log('recordViewer.setRecordsPage initial records\n ' + JSON.stringify(pageRecords));
        // If first load
        if (replaceRecords) {
            this.clearSelection();
            this.recordsMap = new Map();
            this.recordsNbrPerPage = this.noPaging ? Math.min(this.pageSize, pageRecords.length) : pageRecords.length;
            this.firstLoad = true;
            this.selectAllFlag = false;
        }
        // Store previous number of records for scroll after Load More click 
        this.prevRecordsNbr = this.records.length;
        if (replaceRecords && pageRecords.length == 0) {
            this.records = [];
        } else {
            const newRecords = [];
            for (const record of pageRecords) {
                // LoadMore/LoadAll -> Don't add a record which has already been added by New
                if (replaceRecords || (!replaceRecords && !this.hasRecord(record[this.rowKey])))
                    newRecords.push(this.formatRecord(record, !replaceRecords && this._selectedRecords.size === this.maxRowSelected));
            }
            this.records = replaceRecords
                ? [...newRecords]
                : [...this.records.concat(newRecords)];
        }
        if (maxRecordsLoaded) {
            this.canLoadData = false;
            this.loadStatus = this.labels.labelMaxRecordsLoaded.replace(
                '{0}',
                this.maxRecords
            );
        } else if (allRecordsLoaded) {
            this.canLoadData = false;
            this.loadStatus = this.labels.labelAllRecordsLoaded;
        } else {
            this.canLoadData = true;
            this.loadStatus = this.labels.labelLoadMoreRecords;
        }
        // Reset flag for preventing resizing after datatable scroll
        this.afterTableScrollMore = false;
        //console.log('recordViewer.setRecordsPage formatted records\n' + JSON.stringify(this.records));
    }

    // Refresh a record in the records list
    @api refreshRecord(refreshedRecord, newId, oldId) {
        const newRecord = this.formatRecord(refreshedRecord, false);
        let records = [];
        // New record: insert record at the top the list
        if (!oldId) {
            records = [...this.records];
            records.unshift(newRecord);
            if (this.isTable && !this.tableHeight && this.records.length < this.pageSize)
                this.setHeight(records.length);
        }
        // Updated record: replace record with updated version
        else {
            for (const record of this.records) {
                records.push(record.Id === oldId ? newRecord : record);
            }
        }
        this.records = records;
    }

    getRelatedValue(record, parts) {
        return parts.reduce((accumulator, currentValue) => accumulator?.[currentValue], record);
    }

    // Format Record: add url field for hyperlinks + flatten relationships fields
    @api formatRecord(record, tileDisabled) {
        // Add to record map for keeping original records: tile and selected records for flow
        this.recordsMap.set(record[this.rowKey], record);
        const propsForDeletion = new Set();
        for (const fieldTransform of this.fieldsTransform) {
            let fieldValue;
            let field = fieldTransform.valueField;
            if (fieldTransform.relatedField) {
                fieldValue = this.getRelatedValue(record, fieldTransform.relatedField.parts);
                record[field] = fieldValue !== 'undefined' ? fieldValue : null;
                propsForDeletion.add(fieldTransform.relatedField.parts[0]);
            } else
                fieldValue = record[field];
            if (fieldTransform.location && !fieldValue)
                record[field] = { latitude: '', longitude: '' };
            else if (fieldValue) {
                if (fieldTransform.time)
                    record[field] = new Date(fieldValue).toISOString().substring(11);
                if (fieldTransform.hyperlink) {
                    record[fieldTransform.hyperlink.field] =
                        fieldTransform.hyperlink.url.replace(
                            this.cidConst, this.getRelatedValue(record, fieldTransform.hyperlink.idFieldParts)
                        );
                }
            }
        }
        for (const prop of propsForDeletion) {
            delete record[prop];
        }
        if (this.isTable) return record;
        else {
            // Add record rowKey for retrieving record in record action: edit, delete, refresh...
            let tileRecord = {
                Id: record[this.rowKey],
                fields: [],
                timeZone: this.userTimeZone,
                currencyCode: this.currencyCode,
                disabled: tileDisabled,
            };
            if (this.tileHeaderTemplate) {
                const headerTemplate = this.tileHeaderTemplate;
                tileRecord.header = {
                    isUrl: headerTemplate.hasUrl,
                    value: '',
                    canSelectRows: this.canSelectRows,
                    isMultiSelect: this.isMultiSelect,
                };
                if (headerTemplate.hasUrl)
                    tileRecord.header.url = record[headerTemplate.urlField];
                for (const field of this.tileHeaderTemplate.fields) {
                    const val = record[field.name];
                    if (val) {
                        tileRecord.header.value +=
                            tileRecord.header.value.length > 0 ? ' • ' : '';
                        tileRecord.header.value += record[field.name];
                    }
                }
                if (headerTemplate.badgeField) {
                    const badgeField = headerTemplate.badgeField;
                    let style = record[badgeField.styleField];
                    if (style.includes('bc:') && style.includes('tc:')) {
                        style = style.replace('bc', 'background-color');
                        style = style.replace('tc', 'color');
                    } else style = 'background-color: blue; color: white';
                    const value = record[badgeField.name];
                    tileRecord.header.badgeField = { value: value, style };
                }
                if (headerTemplate.actions.length > 0)
                    tileRecord.header.actions = [...headerTemplate.actions];
                for (const field of this.tileBodyTemplate) {
                    const tileField = {
                        label: field.label,
                        name: field.nameInViewer,
                        value: record[field.name],
                        type: field.data.type,
                        url: field.data.url ? record[field.data.url.fieldName] : '',
                        fieldStyle: field.data.fieldStyle ? record[field.data.fieldStyle.fieldName] :  '',
                        class: field.class
                    };
                    tileRecord.fields.push(tileField);
                }
            }
            //console.log('record ' + JSON.stringify(tileRecord));
            return tileRecord;
        }
    }

    // Scroll in datatable OR datatable autoload of 2nd page
    handleLoadMore() {
        if (this.firstLoad)
            return;
        this.afterTableScrollMore = false;
        this.loadMore();
    }

    // Load More button has been clicked
    handleLoadMoreClick() {
        this.scrollAfterLoadMore = true;
        this.loadMore();
    }
    loadMore() {
        this.dispatchEvent(new CustomEvent('loadmore'));
    }

    // Load All button has been clicked
    handleLoadAll() {
        this.scrollAfterLoadAll = true;
        this.dispatchEvent(new CustomEvent('loadall'));
    }

    // Tile base height for a number of records
    getTileBaseHeight(numRecs) {
        return this.tileRowHeight * Math.ceil(numRecs / this.numberOfTilesPerRow);
    }

    // Set tile page height: used for enabling y scrolling in the tile
    setTilePageHeight(numRecs) {
        const li = this.template.querySelector('li.sl-tile-row');
        if (li) {
            const listyle = getComputedStyle(li);
            this.tileRowHeight = parseFloat(listyle.getPropertyValue('height'));
            const ulstyle = getComputedStyle(this.tileContainer);
            const paddingBottom = parseInt(ulstyle.getPropertyValue('padding-bottom'));
            // Substract tilesLoadMoreThreshold (10) for infinite scrolling -> display scrollbar after first load
            this.dynamicTileHeight = this.getTileBaseHeight(numRecs) + paddingBottom - this.tilesLoadMoreThreshold;
            return this.dynamicTileHeight;
        }
    }

    handleTileScroll(event) {
        event.stopPropagation();
        if (this.cancelTileScroll || this.isLoading)
            return;
        if (this.canLoadData && (event.target.scrollTop + event.target.clientHeight + this.tilesLoadMoreThreshold >= event.target.scrollHeight))
            this.loadMore();
    }

    // A datatable row action has been selected
    handleDatatableRowAction(event) {
        this.handleRowAction(event.detail.action.key, event.detail.row.Id);
    }

    // A tile row action has been selected
    handleTileRowAction(event) {
        this.handleRowAction(event.detail.value, event.target.dataset.id);
    }

    // Notify parent that a row action must be exected
    handleRowAction(key, id) {
        const row = this.recordsMap.get(id);
        this.dispatchEvent(
            new CustomEvent('rowaction', { detail: { key: key, row } })
        );
    }

    // Notify parent flow of row selection changes
    rowSelectionChanged() {
        this.dispatchEvent(
            new FlowAttributeChangeEvent('selectedRecords', this.selectedRecords)
        );
        this.dispatchEvent(
            new FlowAttributeChangeEvent('selectedRecord', this.selectedRecord)
        );
        this.dispatchEvent(
            new FlowAttributeChangeEvent('selectedRecordsCount', this.selectedRecordsCount)
        );
    }

    // Rows has been selected in the datatable
    handleDatatableRowSelection(event) {
        this._selectedRecords = new Set(event.detail.selectedRows);
        if (this.flow) this.rowSelectionChanged();
    }

    selectAllFlag = false;
    // Click on Select All for tiles -> called from smartListShared
    @api selectAll() {
        // Toggle select all flag
        this.selectAllFlag = !this.selectAllFlag;
        if (!this.selectAllFlag && this.hasNoSelectedRecords)
            this.selectAllFlag = true;
        // States flags
        let checkedFlag = this.selectAllFlag;
        let disabledFlag = false;
        const selectedRecords = new Set();
        for (let radio of this.template.querySelectorAll('.sl-row-selector')) {
            radio.checked = checkedFlag;
            radio.disabled = disabledFlag;
            // if selection, add to select set
            if (checkedFlag) 
                selectedRecords.add(this.recordsMap.get(radio.dataset.id));
            // If selectAll checked -> uncheck and disable checkboxes > maxRowSelected
            if (this.selectAllFlag && selectedRecords.size == this.maxRowSelected) {
                checkedFlag = false;
                disabledFlag = true;
            }
        }
        // Refresh selection set
        this._selectedRecords = new Set(selectedRecords);
        if (this.flow) this.rowSelectionChanged();
    }

    // Row has been selected in a tile
    handleTileRowSelection(event) {
        // If not multiselect: uncheck previous selection
        if (!this.isMultiSelect) {
            for (let radio of this.template.querySelectorAll('.sl-radio')) {
                if (radio.dataset.id != event.target.dataset.id && radio.checked)
                    radio.checked = false;
            }
            this._selectedRecords = new Set();
        }
        const row = this.recordsMap.get(event.target.dataset.id);
        const selectedRecords = new Set(this._selectedRecords);
        const checked = event.target.checked;
        if (checked) selectedRecords.add(row);
        else selectedRecords.delete(row);
        this._selectedRecords = selectedRecords;
        // Disable row selection if max has been reached with multi-select mode
        if (this.isMultiSelect) {
            if (checked && this.selectedRecordsCount == this.maxRowSelected)
                this.disableRowSelection(true);
            // Re-enable row selection if no longer max
            else if (!checked && this.selectedRecordsCount == this.maxRowSelected - 1)
                this.disableRowSelection(false);
        }
        if (this.flow) this.rowSelectionChanged();
    }

    // Enable/disable row selection in tile
    disableRowSelection(disable) {
        const selectedIds = new Set();
        for (const record of this._selectedRecords) {
            selectedIds.add(record[this.rowKey]);
        }
        for (let selector of this.template.querySelectorAll('.sl-row-selector')) {
            if (!selectedIds.has(selector.dataset.id)) selector.disabled = disable;
        }
    }

    // Programatically clear selected rows
    @api clearSelection() {
        this.selectedRecordsProgrammatic = [];
        if (!this.isTable) {
            this._selectedRecords = new Set();
            for (let selector of this.template.querySelectorAll('.sl-row-selector')) {
                selector.checked = false;
                selector.disabled = false; // Make sure row selection is re-enabled in case it was disabled
            }
        }
        if (this.flow) this.rowSelectionChanged();
    }

    // Store the inline edit value for ield editors providing value & label (lookup & picklist only)
    handleCellEdited(event) {
        event.stopPropagation();
        const data = event.detail;
        //console.log('cellEdited ' + JSON.stringify(data));
        let record;
        if (this.editedCells.has(data.recordId))
            record = this.editedCells.get(data.recordId);
        else {
            record = {};
            this.editedCells.set(data.recordId, record);
        }
        record[data.fieldName] = { value: data.value, relatedIdField: data.relatedIdField };
    }

    // Standard datatable event sent when cells have been edited
    // Adjust datatable to display save bar the 1st time a cell is edited with inline edit
    handleCellChange(event) {
        const draftValues = event.detail.draftValues;
        //console.log('cellChange ' + JSON.stringify(draftValues));
        // Add values to editedCells for custom datatypes with edit on selected rows
        if (draftValues.length > 1) {
            const editedCellId = draftValues[0].Id;
            const editedCell = this.editedCells.get(editedCellId);
            // Need to loop within the properties because fieldName index can change in values sent by the datatable
            let fieldName;
            for (const prop of Object.keys(draftValues[0])) {
                if (prop !== 'Id') {
                    fieldName = prop;
                    break;
                }
            }
            // Check if edited field name is part of editedCell  -> 
            // Data set in handleCellEdited
            if (editedCell && editedCell.hasOwnProperty(fieldName)) {
                for (const value of draftValues) {
                    if (value.Id !== editedCellId) {
                        let currentCell = this.editedCells.get(value.Id);
                        if (!currentCell) {
                            currentCell = {};
                            this.editedCells.set(value.Id, currentCell);
                        }
                        currentCell[fieldName] = { value: editedCell[fieldName].value, relatedIdField: editedCell[fieldName].relatedIdField};
                    }
                }
            }
        }
    }

    // Notify parent that inline edit values must be saved
    handleDatatableSave(event) {
        // Convert datatable draft values into record objects
        const records = [];
        //console.log('save ' + JSON.stringify(event.detail.draftValues));
        for (let draftValue of event.detail.draftValues) {
            const editedCell = this.editedCells.get(draftValue.Id);
            const value = {};
            for (const key of Object.keys(draftValue)) {
                // Replace display value returned by custom editor by actual value or set standard values for other fields
                if (editedCell && editedCell[key]) {
                    const editedValue = editedCell[key];
                    value[editedValue.relatedIdField ? editedValue.relatedIdField : key] =
                        editedValue.value ? editedValue.value : null;
                }
                else 
                    value[key] = draftValue[key];
            }
            records.push({ fields: value });
        }
        this.dispatchEvent(
            new CustomEvent('recordsupdated', { detail: { records: records } })
        );
    }

    // Inline edit values have been saved by parent
    // Hide save bar if no errors
    // Display errors otherwise
    @api afterDatatableSave(hasErrors, errors) {
        this.errors = errors;
        if (!hasErrors) {
            // Required for hiding Cancel / Save buttons
            this.draftValues = [];
            this.editedCells.clear();
        }
    }

    // TOOLTIP DATA
    tooltipValue;
    tooltipCurrencyCode;
    tooltipTypeData;
    tooltipContainerRect;
    tooltipCellRect;
    showTooltip
    _tooltip;
    get tooltip() {
        if (!this._tooltip)
            this._tooltip = this.template.querySelector('.sl-tooltip');
        return this._tooltip;
    }

    // Show/hide table cell tooltip
    handleTooltip(event) {
        if (event.detail.show) {
            const data = event.detail;
            this.tooltipValue = data.value;
            this.tooltipCurrencyCode = data.currencyCode;
            this.tooltipTypeData = data.typeData;
            const tooltipContainerRect = this.isTable ?
                this.datatableContainer.getBoundingClientRect() : this.tilesBody.getBoundingClientRect();
            this.tooltipContainerRect = {left: tooltipContainerRect.left, right: tooltipContainerRect.right, top: tooltipContainerRect.top,
                bottom: tooltipContainerRect.bottom, width: tooltipContainerRect.width, heigh: tooltipContainerRect.width };
            this.tooltipCellRect = {...event.detail.cellRect};
            this.tooltipCellRect.left -= this.scrollLeft;
            if (this.showFiltersPanel && !this.rightFilters) {
                const fontSize = parseFloat(getComputedStyle(this.datatableContainer).getPropertyValue('font-size')) / .8125;
                const filtersPanelsWidth = fontSize * 21; // 21 rem
                this.tooltipCellRect.left = this.tooltipCellRect.left + filtersPanelsWidth;
            }
            this.showTooltip = true;
            this.tooltip.classList.remove('slds-hide');
        } else {
            this.showTooltip = false;
            this.tooltip.classList.add('slds-hide');
        }
    }
}