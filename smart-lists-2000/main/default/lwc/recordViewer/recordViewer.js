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
    @api initializedContext;
    flow;
    community;
    userTimeZone;
    currencyCode;
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

    // SORT DATA
    // List of sort fields used by the tiles sort fields selector
    @api sortFields;
    defaultSortDirection;
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
        return this._sortField
            ? this._sortField.replace(this.hyperlinkFieldSuffix, "")
            : null;
    }
    set sortField(value) {
        this._sortField = value;
        for (let field of this.sortFields) {
            field.current = field.name == value;
            if (field.name == value) this._sortFieldLabel = field.label;
        }
    }
    _sortFieldLabel = "";
    // Expose sortFieldLable for parent
    @api get sortFieldLabel() {
        return this._sortFieldLabel;
    }
    @api rightFilters;
    @api showFiltersPanel;
    // Viewer width
    _staticFiltersPanel;
    @api get staticFiltersPanel() {
        return this._staticFiltersPanel;
    }
    set staticFiltersPanel(value) {
        this._staticFiltersPanel = value;
    }
    get canSetWidth() {
        return this.viewer && this.width && typeof this.staticFiltersPanel !== 'undefined'; 
    }
    _width;
    @api get width() {
        return this._width;
    }
    set width(value) {
        this._width = value;
        if (this.canSetWidth)
            this.setWidth();
    }
    setWidth() {
        this.viewer.style.width = this.staticFiltersPanel ? 'calc(' + this.width + 'px - 21rem)' : this.width + 'px';
    }
    setHeight(height) {
        this.viewer.style.height = height + "px";
    }

    // DATATABLE DATA
    columns = [];
    rowKey;
    datatableRecords = [];
    @api maxRowSelected;
    hideCheckboxColumm;
    hideTableHeader;
    showRowNumberColumn;
    rowNumberStart;
    columnWidthsMode;
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

    // TILES DATA
    tilesHeight;
    scrollMore = 20;
    tilesRecords = [];
    numberOfTilesPerRow;
    numberOfColumnsPerTile;
    get tileRowClass() {
        return (
            "slds-var-p-left_small slds-size_1-of-1 slds-medium-size_1-of-" +
            this.numberOfTilesPerRow
        );
    }
    get tileColumnsClass() {
        return (
            "slds-list_horizontal slds-wrap slds-size_1-of-" +
            this.numberOfColumnsPerTile
        );
    }

    // COMPONENTS AND SIZING
    _tiles;
    get tiles() {
        if (!this._tiles) this._tiles = this.template.querySelector(".sl-tile");
        return this._tiles;
    }
    _tilesBody;
    get tilesBody() {
        if (!this._tilesBody)
            this._tilesBody = this.template.querySelector(".sl-tile");
        return this._tilesBody;
    }
    _scroller;
    get scroller() {
        if (!this._scroller)
            this._scroller = this.template.querySelector(".sl-scroller");
        return this._scroller;
    }
    _datatableContainer;
    get datatableContainer() {
        if (!this._datatableContainer)
            this._datatableContainer = this.template.querySelector(
                ".sl-datatable-container"
            );
        return this._datatableContainer;
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
        return this.displayMode == "Table";
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
    hyperlinkFieldSuffix = "$$URL";
    // Constant used as placeholder for the record Id in hyperlink links; the actual Id is set in formatRecord
    cidConst = "$CID$";
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
    // Maximum number of selectable rows
    maxRowSelected;
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
            type: "standard__recordPage",
            attributes: {
                recordId: this.cidConst,
                actionName: "view",
            },
        };
        this.recordDetailUrl = decodeURIComponent(
            await this[NavigationMixin.GenerateUrl](pageRef)
        );
        pageRef = {
            type: "standard__namedPage",
            attributes: {
                pageName: "filePreview",
            },
            state: {
                recordIds: this.cidConst,
            },
        };
        this._filePreviewUrl = decodeURIComponent(
            await this[NavigationMixin.GenerateUrl](pageRef)
        );
        this.dispatchEvent(new CustomEvent("connected", {}));
    }

    renderedCallback() {
        if (this.canSetWidth)
            this.setWidth();
        if (this.isTable && this.tableHeight)
            this.setHeight(this.tableHeight);
    }

    // Initialize datatable parameters and datatable columns
    @api initialize(listDef) {
        this.flow = listDef.flow;
        this.community = listDef.community;
        this.displayMode = listDef.displayMode;
        this.userTimeZone = listDef.userTimeZone;
        this.currencyCode = listDef.currencyCode;
        this.maxRecords = listDef.maxRecords;
        this.pageSize = listDef.pageSize;
        this.noPaging = listDef.noPaging;
        this.rowKey = listDef.rowKey;

        this.isTable
            ? this.initializeDatatable(listDef)
            : this.initializeTilesViewer(listDef);
        const columns = [];
        const sortableFields = [];
        const isApex = listDef.dataSourceType.startsWith("Apex");
        for (const fieldName of Object.getOwnPropertyNames(listDef.fields)) {
            const fieldDef = listDef.fields[fieldName];
            let fieldTransform = {};
            if (fieldDef.listField) {
                let urlField = "";
                const isRelatedField = fieldName.includes(".") && !isApex;
                const isRecordLink = this.isRecordLink(listDef, fieldDef);
                const isPreviewLink = this.isPreviewLink(listDef, fieldDef);
                if (isRecordLink || isPreviewLink) {
                    urlField = fieldName + this.hyperlinkFieldSuffix;
                    const idField = isRelatedField
                        ? fieldDef.hyperlinkIdField.substring(
                            fieldDef.hyperlinkIdField.lastIndexOf(".") + 1
                        )
                        : fieldDef.hyperlinkIdField;
                    const url = isPreviewLink
                        ? this.filePreviewUrl
                        : this.recordDetailUrl;
                    fieldTransform.valueField = fieldName;
                    fieldTransform.hyperlink = {
                        field: urlField,
                        idField: idField,
                        url: url,
                    };
                } else if (fieldDef.displayType === "LOCATION") {
                    fieldTransform.valueField = fieldName;
                    fieldTransform.location = true;
                } else if (fieldDef.displayType === "TIME") {
                    fieldTransform.valueField = fieldName;
                    fieldTransform.time = true;
                }
                if (isRelatedField) {
                    const lastDot = fieldName.lastIndexOf(".");
                    fieldTransform.valueField = fieldName;
                    fieldTransform.relatedField = {
                        accessParts: fieldName.substring(0, lastDot).split("."),
                        fieldPart: fieldName.substring(lastDot + 1),
                    };
                }
                if (Object.keys(fieldTransform).length > 0)
                    this.fieldsTransform.push(fieldTransform);
                if (fieldDef.sortable)
                    sortableFields.push({ name: fieldName, label: fieldDef.label });
                if (this.isTable)
                    columns.push(
                        this.initalizeDatatableField(fieldDef, urlField, listDef)
                    );
                else this.initializeTilesViewerField(fieldDef, urlField, listDef);
            }
        }
        if (this.isTable) {
            if (listDef.rowActions && listDef.rowActions.length > 0) {
                columns.push({
                    type: "action",
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
            ? "asc"
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
            class: "slds-list_horizontal slds-wrap slds-size_" + fieldDef.numberOfColumns + "-of-" + this.numberOfColumnsPerTile
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
        this.columnWidthsMode = listDef.columnWidthsMode;
    }

    // Create datatable fields
    initalizeDatatableField(fieldDef, urlField, listDef) {
        let column = {
            label: fieldDef.label,
            fieldName: fieldDef.name,
            editable: fieldDef.editable,
            sortable: fieldDef.sortable,
            wrapText: fieldDef.wrap,
            type: "cell",
        };
        if (fieldDef.fieldAlignment)
            column.cellAttributes = { alignment: fieldDef.fieldAlignment.toLowerCase() }; 
        if (fieldDef.columnWidth) 
            column.initialWidth = fieldDef.columnWidth;
        column.typeAttributes = this.getFieldTypeData(listDef, fieldDef, urlField);
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
        } else
            viewType = getTypeFromApexDisplayType(fieldDef.displayType);
        const editType = getTypeFromApexDisplayType(fieldDef.editType);
        let fieldData = {};
        // Need to pass required twice 
        // - in typeAttributes for displaying the red star in the edit panel
        // - typeAttributes.type for getting it in the component
        const required = (fieldDef.displayType === FieldTypes.BOOLEAN) ? false : fieldDef.required;
        fieldData.required = required;
        fieldData.type = { displayType: viewType, editType: editType, required: required }
        if (fieldDef.fieldAlignment)
            fieldData.type.alignment = fieldDef.fieldAlignment.toLowerCase();
        if (viewType === FieldTypes.NUMBER || viewType === FieldTypes.PERCENT)
            fieldData.type.fractionDigits =  fieldDef.fractionDigits;
        else if (viewType === FieldTypes.CURRENCY) {
            fieldData.type.fractionDigits = fieldDef.fractionDigits;
            fieldData.type.currencyCode =  this.currencyCode;
        }  else if (viewType === FieldTypes.PICKLIST) {
            fieldData.type.objectName = listDef.objectName;
            fieldData.recordTypeId =
                    listDef.recordTypes.length > 0
                        ? { fieldName: "RecordTypeId" }
                        : "012000000000000AAA";
            fieldData.type.apiName = fieldDef.name;
            fieldData.recordId = { fieldName: listDef.rowKey };
        } else if (sfdcHyperlink) {
            fieldData.type.target = "_self";
            fieldData.url = { fieldName: urlField};
            fieldData.isHyperlink;
        } else if (viewType === FieldTypes.URL_LABEL) {
            fieldData.type.target = fieldDef.urlTarget ? fieldDef.urlTarget : "_blank";
            fieldData.url = { fieldName: fieldDef.urlValue}
        }
        if (viewType === FieldTypes.LOOKUP || editType === FieldTypes.LOOKUP) {
            fieldData.type.objectName = fieldDef.lookups[0].value;
            fieldData.type.titleField =fieldDef.lookups[0].titleField;
            fieldData.type.subtitleField = fieldDef.lookups[0].subtitleField;
            fieldData.type.objectLabel = fieldDef.lookups[0].label;
            fieldData.type.objectIcon = fieldDef.lookups[0].iconName;
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
        this.dispatchEvent(new CustomEvent("viewersort", {}));
    }

    // Set a page records in the viewer
    // replace = true -> replace the existing records otherwise, append new records
    @api setRecordsPage(
        pageRecords,
        replaceRecords,
        maxRecordsLoaded,
        allRecordsLoaded
    ) {
        //console.log("setRecordsPage initial records\n " + JSON.stringify(pageRecords));
        // If first load, set div size and display
        if (replaceRecords) {
            this.clearSelection();
            this.recordsMap = new Map();
            if (this.isTable && !this.tableHeight)
                this.setPageHeight(
                    this.noPaging
                        ? Math.min(this.pageSize, pageRecords.length)
                        : pageRecords.length
                );
        }
        if (replaceRecords && pageRecords.length == 0) {
            this.records = [];
            this.tilesHeight = 0;
        } else {
            const newRecords = [];
            for (const record of pageRecords) {
                // Don't add a record which has already been added by New
                if (!this.hasRecord(record[this.rowKey]))
                    newRecords.push(this.formatRecord(record));
            }
            this.records = replaceRecords
                ? [...newRecords]
                : [...this.records.concat(newRecords)];
        }
        if (maxRecordsLoaded) {
            this.canLoadData = false;
            this.loadStatus = this.labels.labelMaxRecordsLoaded.replace(
                "{0}",
                this.maxRecords
            );
        } else if (allRecordsLoaded) {
            this.canLoadData = false;
            this.loadStatus = this.labels.labelAllRecordsLoaded;
        } else {
            this.canLoadData = true;
            this.loadStatus = this.labels.labelLoadMoreRecords;
        }
        //console.log('setRecordsPage formatted records\n' + JSON.stringify(this.records));
    }

    // Refresh a record in the records list
    @api refreshRecord(refreshedRecord, newId, oldId) {
        const newRecord = this.formatRecord(refreshedRecord);
        let records = [];
        // New record: insert record at the top the list
        if (!oldId) {
            records = [...this.records];
            records.unshift(newRecord);
            if (this.isTable && !this.tableHeight && this.records.length < this.pageSize)
                this.setPageHeight(records.length);
        }
        // Updated record: replace record with updated version
        else {
            for (const record of this.records) {
                records.push(record.Id === oldId ? newRecord : record);
            }
        }
        this.records = records;
    }

    // Format Record: add url field for hyperlinks + flatten relationships fields
    @api formatRecord(record) {
        // Add to record map for keeping original records: tile and selected records for flow
        this.recordsMap.set(record[this.rowKey], record);
        for (const fieldTransform of this.fieldsTransform) {
            let data = record;
            let parentData = record;
            let field = fieldTransform.valueField;
            if (fieldTransform.relatedField) {
                for (const accessPart of fieldTransform.relatedField.accessParts) {
                    parentData = data;
                    data = data[accessPart];
                    if (!data) break;
                }
                if (data && data[fieldTransform.relatedField.fieldPart]) {
                    field = fieldTransform.relatedField.fieldPart;
                    record[fieldTransform.valueField] = data[field];
                }
            }
            if (data && fieldTransform.location && !data[field])
                data[field] = { latitude: '', longitude: '' };
            else if (data && data[field]) {
                if (fieldTransform.time)
                    data[field] = new Date(data[field]).toISOString().substring(11);
                if (fieldTransform.hyperlink) {
                    record[fieldTransform.hyperlink.field] =
                        fieldTransform.hyperlink.url.replace(
                            this.cidConst,
                            parentData[fieldTransform.hyperlink.idField]
                        );
                }
            }
        }
        if (this.isTable) return record;
        else {
            // Add record rowKey for retrieving record in record action: edit, delete, refresh...
            let tileRecord = {
                Id: record[this.rowKey],
                fields: [],
                timeZone: this.userTimeZone,
                currencyCode: this.currencyCode,
            };
            if (this.tileHeaderTemplate) {
                const headerTemplate = this.tileHeaderTemplate;
                tileRecord.header = {
                    isUrl: headerTemplate.hasUrl,
                    value: "",
                    canSelectRows: this.canSelectRows,
                    isMultiSelect: this.isMultiSelect,
                };
                if (headerTemplate.hasUrl)
                    tileRecord.header.url = record[headerTemplate.urlField];
                for (const field of this.tileHeaderTemplate.fields) {
                    tileRecord.header.value +=
                        tileRecord.header.value.length > 0 ? " • " : "";
                    tileRecord.header.value += record[field.name];
                }
                if (headerTemplate.badgeField) {
                    const badgeField = headerTemplate.badgeField;
                    let style = record[badgeField.styleField];
                    if (style.includes("bc:") && style.includes("tc:")) {
                        style = style.replace("bc", "background-color");
                        style = style.replace("tc", "color");
                    } else style = "background-color: blue; color: white";
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

    // Load More button has been clicked OR scroll in datatable
    handleLoadMore() {
        this.dispatchEvent(new CustomEvent("loadmore"));
    }

    // Load All button has been clicked
    handleLoadAll() {
        this.dispatchEvent(new CustomEvent("loadall"));
    }

    // Set page height: used for enabling y scrolling in the datatable
    @api setPageHeight(numRecs) {
        const container = this.datatableContainer;
        const style = getComputedStyle(container);
        const fontSize = parseFloat(style.getPropertyValue('font-size'));
        const lineHeight = parseFloat(style.getPropertyValue('line-height'));
        const rem =  fontSize / .8125; // container font size: .8125 of default font size
        let rowHeight;
        let padding = this.flow ? 1: this.community ? 1 : .5;
        if (this.hasRowActions) {
            // Button:
            // - web client 
            //    - content:  lineHeight
            //    - border top + border bottom : 1px x 2
            // - other:  rem * 1.5  (x-small button)
            // Padding top + padding bottom = .25/.5rem x 2
            if (this.flow || this.community)
                rowHeight =  (rem  * 1.25) + (padding * rem);
            else
                rowHeight = lineHeight + 2 + (padding * rem);
        } else {
            // Text = lineHeight
            // Padding top + padding bottom = .25/.5rem x 2
            rowHeight = lineHeight + (padding * rem);
        }
        // rowHeight
        // - height of the rows: numRecs * rowHeight
        // - 1px of top border for all rows but the 1st one: (numRecs - 1)
        // - 40px: header height (max-height)
        // - 1rem: hscrollheight
        let height = (numRecs * rowHeight) + (numRecs - 1) + 40 + rem;
        container.style.height = height + "px";
        // Remove edit mode
        this.draftValues = [];
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
            new CustomEvent("rowaction", { detail: { key: key, row } })
        );
    }

    // Notify parent flow of row selection changes
    rowSelectionChanged() {
        this.dispatchEvent(
            new FlowAttributeChangeEvent("selectedRecords", this.selectedRecords)
        );
        this.dispatchEvent(
            new FlowAttributeChangeEvent("selectedRecord", this.selectedRecord)
        );
        this.dispatchEvent(
            new FlowAttributeChangeEvent(
                "selectedRecordsCount",
                this.selectedRecordsCount
            )
        );
    }

    // Rows has been selected in the datatable
    handleDatatableRowSelection(event) {
        this._selectedRecords = new Set(event.detail.selectedRows);
        if (this.flow) this.rowSelectionChanged();
    }

    // Row has been selected in a tile
    handleTileRowSelection(event) {
        // If not multiselect: uncheck previous selection
        if (!this.isMultiSelect) {
            for (let radio of this.template.querySelectorAll(".sl-radio")) {
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
        for (let selector of this.template.querySelectorAll(".sl-row-selector")) {
            if (!selectedIds.has(selector.dataset.id)) selector.disabled = disable;
        }
    }

    // Programatically clear selected rows
    @api clearSelection() {
        this.selectedRecordsProgrammatic = [];
        if (!this.isTable) {
            for (let selector of this.template.querySelectorAll(".sl-row-selector")) {
                selector.checked = false;
                selector.disabled = false; // Make sure row selection is re-enabled in case it was disabled
            }
        }
        if (this.flow) this.rowSelectionChanged();
    }

    // Adjust datatable height for inline edit save displayed/hidden
    adjustDatatableHeigh(add) {
        const height =
            Number(this.datatableContainer.style.height.replace("px", "")) +
            (add ? 50 : -50);
        this.datatableContainer.style.height = height + "px";
        this.saveBarDisplayed = add;
    }

    // Store the inline edit value of a custom editor such as lookup
    handleCellEdited(event) {
        event.stopPropagation();
        const data = event.detail;
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
        // Add values to editedCells for custom datatypes with edit on selected rows
        if (draftValues.length > 1) {
            const editedCellId = draftValues[0].Id;
            const editedCell = this.editedCells.get(editedCellId);
            if (editedCell) {
                for (const value of draftValues) {
                    if (value.Id !== editedCellId) {
                        let currentCell = this.editedCells.get(value.Id);
                        if (!currentCell) {
                            currentCell = {};
                            this.editedCells.set(value.Id, currentCell);
                        }
                        const field = Object.keys(value)[0];
                        currentCell[field] = { value: editedCell[field].value, relatedIdField: editedCell[field].relatedIdField};
                    }
                }
            }
        }
        if (!this.saveBarDisplayed) 
            this.adjustDatatableHeigh(true);
    }

    // The inline edit mode has been cancelled: hide save bar
    handleDatatableCancel() {
        this.adjustDatatableHeigh(false);
    }

    // Notify parent that inline edit values must be saved
    handleDatatableSave(event) {
        // Convert datatable draft values into record objects
        const records = [];
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
            new CustomEvent("recordsupdated", { detail: { records: records } })
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
            this.adjustDatatableHeigh(false);
        }
    }

    // TOOLTIP DATA
    tooltipValue;
    tooltipTypeData;
    tooltipContainerRect;
    tooltipCellRect;
    showTooltip
    _tooltip;
    get tooltip() {
        if (!this._tooltip)
            this._tooltip = this.template.querySelector(".sl-tooltip");
        return this._tooltip;
    }

    // Show/hide table cell tooltip
    handleTooltip(event) {
        if (event.detail.show) {
            const data = event.detail;
            this.tooltipValue = data.value;
            this.tooltipTypeData = data.typeData;
            this.tooltipCellRect = event.detail.cellRect;
            if (this.showFiltersPanel && !this.rightFilters) {
                const fontSize = parseFloat(getComputedStyle(this.datatableContainer).getPropertyValue('font-size')) / .8125;
                const filtersPanelsWidth = fontSize * 21; // 21 rem
                this.tooltipCellRect.left = this.tooltipCellRect.left + filtersPanelsWidth ;
            }
            this.tooltipContainerRect = this.isTable ?
                this.datatableContainer.getBoundingClientRect() : this.tilesBody.getBoundingClientRect();
            this.showTooltip = true;
            this.tooltip.classList.remove("slds-hide");
        } else {
            this.showTooltip = false;
            this.tooltip.classList.add("slds-hide");
        }
    }
}