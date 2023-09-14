import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

import labelShowActions from "@salesforce/label/c.ShowActions";
import labelNoItemsToDisplay from "@salesforce/label/c.NoItemsToDisplay";
import labelLoadMoreRecords from "@salesforce/label/c.LoadMoreRecords";
import labelAllRecordsLoaded from "@salesforce/label/c.AllRecordsLoaded";
import labelMaxRecordsLoaded from "@salesforce/label/c.MaxRecordsLoaded";
import labelLoadMore from "@salesforce/label/c.LoadMore";
import labelLoadAll from "@salesforce/label/c.LoadAll";
import labelLoading from "@salesforce/label/c.Loading";

export default class RecordViewer extends NavigationMixin(LightningElement) {
    // COMPONENT DATA
    displayMode;
    @api initializedContext;
    flow;
    community;
    userTimeZone;
    currencyCode;

    // LABELS
    labels = {
        labelShowActions,
        labelNoItemsToDisplay,
        labelLoadMoreRecords,
        labelAllRecordsLoaded,
        labelMaxRecordsLoaded,
        labelLoadMore,
        labelLoadAll,
        labelLoading
    };

    // RECORDS MANAGEMENT
    @api pageSize;
    @api maxRecords;
    @api noPaging;

    // SORT DATA
    // List of sort fields used by the tiles sort fields selector
    @api sortFields;
    defaultSortDirection;    // Expose sortDirection for parent;
    _sortDirection;
    @api get sortDirection() {
        return this._sortDirection;
    }
    set sortDirection(value) {
        this._sortDirection = value;
    }
    _sortField;
    // Expose sortField for parent
    @api get sortField() {
        return this._sortField ? this._sortField.replace(this.hyperlinkFieldSuffix, "") : null;
    }
    set sortField(value) {
        this._sortField = value;
        for (let field of this.sortFields) {
            field.current = field.name == value;
            if (field.name == value)
                this._sortFieldLabel = field.label;
        }
    }
    _sortFieldLabel = "";
    @api get sortFieldLabel() {
        return this._sortFieldLabel;
    }
    _viewerWidth;
    @api get width() {
        return this._viewerWidth;
    }
    mustSetWidth = false;
    set width(value) {
        if (this._viewerWidth != value) {
            this._viewerWidth = value;
            if (!this.viewer)
                this.mustSetWidth = true;
            else
                this.setWidth();
        }
    }
    setWidth() {
        this.viewer.style.width = this._viewerWidth + 'px';
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
    wrapTextMaxLines
    @api isLoading = false;
    _canLoadData;
    @api get canLoadData() {
        return this._canLoadData;
    }
    set canLoadData(value) {
        this._canLoadData = value;
    }
    loadStatus;

    // TILES DATA
    tilesHeight;
    scrollMore = 20;
    tilesRecords = [];
    numberOfTilesPerRow;
    numberOfColumnsPerTile;
    get tileRowClass() {
        return 'slds-var-p-left_small slds-size_1-of-1 slds-medium-size_1-of-' + this.numberOfTilesPerRow;
    }
    get tileColumnsClass() {
        return 'slds-list_horizontal slds-wrap slds-size_1-of-' + this.numberOfColumnsPerTile;
    }
    _tiles;
    get tiles() {
        if (!this._tiles)
            this._tiles = this.template.querySelector('.sl-tile');
        return this._tiles;
    }
    _tilesBody;
    get tilesBody() {
        if (!this._tilesBody)
            this._tilesBody = this.template.querySelector('.sl-tile-body');
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
        if (this.isTable)
            this.datatableRecords = [...value];
        else
            this.tilesRecords = [...value];
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

    async connectedCallback() {
        let pageRef = {
            type: "standard__recordPage",
            attributes: {
                recordId: this.cidConst,
                actionName: "view",
            },
        };
        this.recordDetailUrl = decodeURIComponent(await this[NavigationMixin.GenerateUrl](pageRef));
        pageRef = {
            type: "standard__namedPage",
            attributes: {
                pageName: "filePreview"
            },
            state: {
                recordIds: this.cidConst
            }
        }
        this._filePreviewUrl = decodeURIComponent(await this[NavigationMixin.GenerateUrl](pageRef));
        // Notify smartListShared that the viewer is ready so that the initialization flow can start
        this.dispatchEvent(
            new CustomEvent("ready", {})
        );
    }

    renderedCallback() {
        if (this.viewer && this.mustSetWidth) {
            this.setWidth();
            this.mustSetWidth = false;
        }
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

        this.isTable ? this.initializeDatatable(listDef) : this.initializeTilesViewer(listDef);
        const sortableFields = [];
        const isApex = listDef.dataSourceType.startsWith("Apex");
        for (const fieldName of Object.getOwnPropertyNames(listDef.fields)) {
            const fieldDef = listDef.fields[fieldName];
            let fieldTransform = {};
            if (fieldDef.listField) {
                let fieldNameInViewer = fieldName;
                const isRelatedField = fieldName.includes('.') && !isApex;
                const isRecordLink = this.isRecordLink(listDef, fieldDef);
                const isPreviewLink = this.isPreviewLink(listDef, fieldDef);
                if (isRecordLink || isPreviewLink) {
                    fieldNameInViewer = fieldName + this.hyperlinkFieldSuffix;
                    const idField = isRelatedField ? fieldDef.hyperlinkIdField.substring(fieldDef.hyperlinkIdField.lastIndexOf('.') + 1) : fieldDef.hyperlinkIdField;
                    const url = isPreviewLink ? this.filePreviewUrl : this.recordDetailUrl;
                    fieldTransform.valueField = fieldName;
                    fieldTransform.hyperlink = { field: fieldNameInViewer, idField: idField, url: url };
                    // Special handling for sort on hyperlink field: need to add the hyperlink suffix which is used in the table
                    // Default sort field must be adjusted
                    if (fieldDef.name === listDef.defaultSortField)
                        listDef.defaultSortField = fieldNameInViewer;
                }
                else if (fieldDef.displayType === "PERCENT") {
                    fieldTransform.valueField = fieldName;
                    fieldTransform.percent = true;
                }
                if (isRelatedField) {
                    const lastDot = fieldName.lastIndexOf(".");
                    fieldTransform.valueField = fieldName;
                    fieldTransform.relatedField = {
                        accessParts: fieldName.substring(0, lastDot).split('.'),
                        fieldPart: fieldName.substring(lastDot + 1)
                    };
                }
                if (Object.keys(fieldTransform).length > 0)
                    this.fieldsTransform.push(fieldTransform);
                if (fieldDef.sortable)
                    sortableFields.push({name: fieldNameInViewer, label: fieldDef.label});
                this.isTable ? this.initalizeDatatableField(fieldDef, fieldNameInViewer, listDef) :
                    this.initializeTilesViewerField(fieldDef, fieldNameInViewer, listDef);
            }
        }
        if (this.isTable) {
            if (listDef.rowActions && listDef.rowActions.length > 0) {
                this.columns.push({
                    type: "action",
                    typeAttributes: { rowActions: this.buildRowActions(listDef) },
                });
            }
        }
        // Handle sort data
        const sortFields = [];
        sortableFields.sort(this.compareSortableFields).forEach(function (field) {
            const fieldName = field.name;
            sortFields.push({name: fieldName, label: field.label, current: false});
        });
        this.sortFields = sortFields;
        this.sortDirection = listDef.sortDirection ? 'asc' : listDef.defaultSortDirection;
        this.sortField = listDef.defaultSortField;
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
            this.tileHeaderTemplate = { hasUrl: false, fields: [], actions: [] }
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

    initializeTilesViewerField(fieldDef, fieldNameInViewer, listDef) {
        let fieldTemplate = { nameInViewer: fieldNameInViewer, name: fieldDef.name, label: fieldDef.label };
        if (fieldDef.tileHeader) {
            if (!this.tileHeaderTemplate)
                this.tileHeaderTemplate = { hasUrl: false, fields: [] };
            if (fieldDef.displayAsBadge) {
                this.tileHeaderTemplate.badgeField = { name: fieldDef.name, styleField: fieldDef.badgeStyleField }
            } else {
                if (this.isRecordLink(listDef, fieldDef) && this.tileHeaderTemplate.fields.length == 0) {
                    this.tileHeaderTemplate.hasUrl = true;
                    this.tileHeaderTemplate.urlField = fieldNameInViewer
                }
                else if (this.isPreviewLink(listDef, fieldDef) && this.tileHeaderTemplate.fields.length == 0) {
                    this.tileHeaderTemplate.hasUrl = true;
                    this.tileHeaderTemplate.urlField = fieldNameInViewer;
                }
                this.tileHeaderTemplate.fields.push(fieldTemplate);
            }
        } else {
            if (this.isRecordLink(listDef, fieldDef) || this.isPreviewLink(listDef, fieldDef))
                fieldTemplate.isHyperlink = true;
            else if (fieldDef.displayType === "BOOLEAN")
                fieldTemplate.isBoolean = true;
            else if (fieldDef.displayType === "DATETIME")
                fieldTemplate.isDateTime = true;
            else if (fieldDef.displayType === "DATE")
                fieldTemplate.isDate = true;
            else if (fieldDef.displayType === "TIME")
                fieldTemplate.isTime = true;
            else if (fieldDef.displayType === "DOUBLE" || fieldDef.displayType === "DECIMAL" || fieldDef.displayType == "NUMBER" || fieldDef.displayType === "INTEGER" || fieldDef.displayType === "LONG") {
                fieldTemplate.isNumber = true;
                fieldTemplate.fractionDigits = fieldDef.fractionDigits;
            }
            else if (fieldDef.displayType === "CURRENCY") {
                fieldTemplate.isCurrency = true;
                fieldTemplate.fractionDigits = fieldDef.fractionDigits;
            }
            else if (fieldDef.displayType === "PERCENT") {
                fieldTemplate.isPercent = true;
                fieldTemplate.fractionDigits = fieldDef.fractionDigits;
            }
            else if (fieldDef.displayType === "PHONE")
                fieldTemplate.isPhone = true;
            else if (fieldDef.displayType === "HTML")
                fieldTemplate.isHtml = true;
            else if (fieldDef.displayType === "EMAIL")
                fieldTemplate.isEmail = true;
            else if (fieldDef.displayType === "LOCATION")
                fieldTemplate.isLocation = true;
            else if (fieldDef.displayType === "URL")
                fieldTemplate.isUrl = true;
            else if (fieldDef.displayType === "URL_LABEL") {
                fieldTemplate.isUrlLabel = true;
                fieldTemplate.urlValue = fieldDef.urlValue;
            }
            else
                fieldTemplate.isText = true;
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
        this.wrapTextMaxLines = listDef.wrapTextMaxLines;
        this.columnWidthsMode = listDef.columnWidthsMode;
    }

    initalizeDatatableField(fieldDef, fieldNameInViewer, listDef) {
        let column = {
            label: fieldDef.label,
            fieldName: fieldNameInViewer,
            editable: false,
            sortable: fieldDef.sortable,
            wrapText: fieldDef.wrapText,
            hideDefaultActions: false,
            type: 'text'
        };
        if (fieldDef.columnWidth) column.initialWidth = fieldDef.columnWidth;
        if (this.isRecordLink(listDef, fieldDef) || this.isPreviewLink(listDef, fieldDef)) {
            // Parameters for url fields
            // fieldName: fieldName + suffix for URL
            // typeAttribute.label: name in DB - Displayed as label of the value in the table
            //
            // In formatRecord, a new field is added for fieldName + suffix for URL with the value of the corresponding url
            column.type = "url";
            column.typeAttributes = {
                label: {
                    fieldName: fieldDef.name,
                },
                tooltip: {
                    fieldName: fieldDef.name,
                },
            };
        }  else if (fieldDef.displayType === "URL_LABEL") {
            column.type = "url";
            column.fieldName = fieldDef.urlValue;
            column.typeAttributes = {
                label: {
                    fieldName: fieldDef.name,
                },
                tooltip: {
                    fieldName: fieldDef.name,
                },
            };
        } else if (fieldDef.displayType === "DATETIME") {
            column.type = "date";
            column.typeAttributes = {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: this.userTimeZone
            };
        } else if (fieldDef.displayType === "DATE") {
            column.type = "date-local";
            column.typeAttributes = {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            };
        } else if (fieldDef.displayType === "TIME") {
            column.type = "date";
            column.typeAttributes = {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC"
            };
        } else if (
            fieldDef.displayType === "DOUBLE" ||
            fieldDef.displayType === "DECIMAL" ||
            fieldDef.displayType === "INTEGER" ||
            fieldDef.displayType === "LONG" ||
            fieldDef.displayType == "NUMBER"
        ) {
            column.type = "number";
            column.typeAttributes = {
                minimumFractionDigits: fieldDef.fractionDigits
            };
        } else if (fieldDef.displayType === "CURRENCY") {
            column.type = "currency";
            column.typeAttributes = {
                currencyCode: this.currencyCode,
                minimumFractionDigits: fieldDef.fractionDigits

            };
        } else if (fieldDef.displayType === "PERCENT") {
            column.type = "percent";
            column.typeAttributes = {
                minimumFractionDigits: fieldDef.fractionDigits,
            };
        } else if (fieldDef.displayType === "BOOLEAN") {
            column.type = "boolean";
        } else if (fieldDef.displayType === "LOCATION") {
            column.type = "location";
        } else if (fieldDef.displayType === "PHONE") {
            column.type = "phone";
        } else if (fieldDef.displayType === "EMAIL") {
            column.type = "email";
        } else if (
            fieldDef.displayType === "ID" ||
            fieldDef.displayType === "REFERENCE" ||
            fieldDef.displayType === "STRING" ||
            fieldDef.displayType === "TEXTAREA" ||
            fieldDef.displayType === "MULTIPICKLIST" ||
            fieldDef.displayType === "PICKLIST" ||
            fieldDef.displayType === "LOOKUP"
        ) {
            column.type = "text";
        } else if (fieldDef.displayType === "HTML") {
            column.type = "richtext";
            column.wrapText = false;
            column.hideDefaultActions = true;
        } else if (fieldDef.displayType === "URL") {
            column.type = "url";
            column.typeAttribute = {
                target: "_blank",
            };
        }
        this.columns.push(column);
    }

    isRecordLink(listDef, fieldDef) {
        return fieldDef.displayType === "HYPERLINK_DETAIL" && !listDef.flow;
    }
    isPreviewLink(listDef, fieldDef) {
        return fieldDef.displayType === "FILE_PREVIEW" && !listDef.flow && ((listDef.canPreviewFiles && !listDef.community) || listDef.canViewFileDetails);
    }

    // Sort button has been clicked in the viewer
    handleSort(event) {
        this.sortField = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        // notify parent
        this.dispatchEvent(
            new CustomEvent("viewersort", {})
        );
    }

    // Set a page records in the viewer
    // replace = true -> replace the existing records otherwise, append new records
    @api setRecordsPage(pageRecords, replaceRecords, maxRecordsLoaded, allRecordsLoaded) {
        //console.log("setRecordsPage initial records\n " + JSON.stringify(pageRecords));
        // If first load, set div size and display
        if (replaceRecords) {
            this.clearSelection();
            this.recordsMap = new Map();
            if (this.isTable)
                this.setPageHeight(this.noPaging ? Math.min(this.pageSize, pageRecords.length) : pageRecords.length);
        }
        if (replaceRecords && pageRecords.length == 0) {
            this.records = [];
            this.tilesHeight = 0;
        }
        else {
            const newRecords = [];
            for (const record of pageRecords) {
                // Don't add a record which has already been added by New
                if (!this.hasRecord(record[this.rowKey]))
                    newRecords.push(this.formatRecord(record));
            }
            this.records = replaceRecords ? [...newRecords] : [...this.records.concat(newRecords)];
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
            records = [...this.records]
            records.unshift(newRecord);
            if (this.isTable && this.records.length < this.pageSize)
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
                    if (!data)
                        break;
                }
                if (data && data[fieldTransform.relatedField.fieldPart]) {
                    field = fieldTransform.relatedField.fieldPart;
                    record[fieldTransform.valueField] = data[field];
                }
            }
            if (data && data[field]) {
                if (fieldTransform.percent)
                    data[field] = data[field] / 100;
                if (fieldTransform.hyperlink) {
                    record[fieldTransform.hyperlink.field] = 
                        fieldTransform.hyperlink.url.replace(
                            this.cidConst,
                            parentData[fieldTransform.hyperlink.idField]
                        );
                }
            }
        }
        if (this.isTable)
            return record;
        else {
            // Add record rowKey for retrieving record in record action: edit, delete, refresh...
            let tileRecord = { Id: record[this.rowKey], fields: [], timeZone: this.userTimeZone, currencyCode: this.currencyCode };
            if (this.tileHeaderTemplate) {
                const headerTemplate = this.tileHeaderTemplate;
                tileRecord.header = {
                    isUrl: headerTemplate.hasUrl, value: '',
                    canSelectRows: this.canSelectRows, isMultiSelect: this.isMultiSelect
                };
                if (headerTemplate.hasUrl)
                    tileRecord.header.url = record[headerTemplate.urlField];
                for (const field of this.tileHeaderTemplate.fields) {
                    tileRecord.header.value += tileRecord.header.value.length > 0 ? ' • ' : '';
                    tileRecord.header.value += record[field.name];
                }
                if (headerTemplate.badgeField) {
                    const badgeField = headerTemplate.badgeField;
                    let style = record[badgeField.styleField];
                    if (style.includes('bc:') && style.includes('tc:')) {
                        style = style.replace('bc', 'background-color');
                        style = style.replace('tc', 'color');
                    }
                    else
                        style = "background-color: blue; color: white";
                    const value = record[badgeField.name];
                    tileRecord.header.badgeField = { value: value, style }
                }
                if (headerTemplate.actions.length > 0)
                    tileRecord.header.actions = [...headerTemplate.actions];
                for (const field of this.tileBodyTemplate) {
                    const tileField = {
                        label: field.label,
                        name: field.nameInViewer,
                        value: record[field.name],
                        url: field.isHyperlink ? record[field.nameInViewer] : '',
                        urlValue: field.isUrlLabel ? record[field.urlValue] : '',
                        isHyperlink: field.isHyperlink,
                        isBoolean: field.isBoolean,
                        isDateTime: field.isDateTime,
                        isDate: field.isDate,
                        isTime: field.isTime,
                        isNumber: field.isNumber,
                        isCurrency: field.isCurrency,
                        isPercent: field.isPercent,
                        isPhone: field.isPhone,
                        isHtml: field.isHtml,
                        isEmail: field.isEmail,
                        isLocation: field.isLocation,
                        isText: field.isText,
                        isUrl: field.isUrl,
                        isUrlLabel: field.isUrlLabel,
                        fractionDigits: field.fractionDigits
                    }
                    tileRecord.fields.push(tileField);
                }
            }
            //console.log('record ' + JSON.stringify(tileRecord));
            return tileRecord;
        }
    }

    // Load More button has been clicked OR scroll in datatable
    handleLoadMore() {
        this.dispatchEvent(new CustomEvent('loadmore'));
    }

    // Load All button has been clicked
    handleLoadAll() {
        this.dispatchEvent(new CustomEvent('loadall'));
    }

    // Set page height
    @api setPageHeight(numRecs) {
        const container = this.datatableContainer;
        // 40 = 32 header + 8 hscroll - For community and desktop need to add the width of the row borders
        let height =
            40 +
            numRecs * (this.community ? 37.703 : this.flow ? 29.75 : 29.75) +
            (this.flow ? 0 : numRecs) +
            2;
        container.style.height = height + "px";
    }

    // A datatable row action has been selected
    handleDatatableRowAction(event) {
        this.handleRowAction(event.detail.action.key, event.detail.row.Id);
    }

    // A tile row action has been selected
    handleTileRowAction(event) {
        this.handleRowAction(event.detail.value, event.target.dataset.id)
    }

    handleRowAction(key, id) {
        const row = this.recordsMap.get(id);
        this.dispatchEvent(new CustomEvent('rowaction', { detail: { "key": key, row } }));
    }

    // Notify parent flow of row selection changes
    rowSelectionChanged() {
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedRecords', this.selectedRecords));
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedRecord', this.selectedRecord));
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedRecordsCount', this.selectedRecordsCount));
    }

    // Rows has been selected in the datatable
    handleDatatableRowSelection(event) {
        this._selectedRecords = new Set(event.detail.selectedRows);
        if (this.flow)
            this.rowSelectionChanged();
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
        if (checked)
            selectedRecords.add(row);
        else
            selectedRecords.delete(row);
        this._selectedRecords = selectedRecords;
        // Disable row selection if max has been reached with multi-select mode
        if (this.isMultiSelect) {
            if (checked && this.selectedRecordsCount == this.maxRowSelected)
                this.disableRowSelection(true);
            // Re-enable row selection if no longer max
            else if (!checked && this.selectedRecordsCount == this.maxRowSelected - 1)
                this.disableRowSelection(false);
        }
        if (this.flow)
            this.rowSelectionChanged();
    }

    // Enable/disable row selection in tile
    disableRowSelection(disable) {
        const selectedIds = new Set();
        for (const record of this._selectedRecords) {
            selectedIds.add(record[this.rowKey]);
        }
        for (let selector of this.template.querySelectorAll('.sl-row-selector')) {
            if (!selectedIds.has(selector.dataset.id))
                selector.disabled = disable;
        }
    }

    // Programatically clear selected rows
    @api clearSelection() {
        this.selectedRecordsProgrammatic = [];
        if (!this.isTable) {
            for (let selector of this.template.querySelectorAll('.sl-row-selector')) {
                selector.checked = false;
                selector.disabled = false; // Make sure row selection is re-enabled in case it was disabled
            }
        }
        if (this.flow)
            this.rowSelectionChanged();
    }
}