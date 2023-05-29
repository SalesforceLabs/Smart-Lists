import { LightningElement, api } from "lwc";

import labelQuickFilters from "@salesforce/label/c.QuickFilters";
import labelClose from "@salesforce/label/c.Close";
import labelClear from "@salesforce/label/c.Clear";
import labelCancel from "@salesforce/label/c.Cancel";
import labelApply from "@salesforce/label/c.Apply";
import labelClearAllFilters from "@salesforce/label/c.ClearAllFilters";
import labelFilterRangeMinError from "@salesforce/label/c.FilterRangeMinError";
import labelFilterRangeMaxError from "@salesforce/label/c.FilterRangeMaxError";
import labelFilterRangeStartError from "@salesforce/label/c.FilterRangeStartError";
import labelFilterRangeEndError from "@salesforce/label/c.FilterRangeEndError";
import labelChecked from "@salesforce/label/c.Checked";
import labelUnchecked from "@salesforce/label/c.Unchecked";
import labelFilterSOSLSearchRecord from "@salesforce/label/c.FilterSOSLSearchRecord";
import labelFilterSOSLSearchFileContent from "@salesforce/label/c.FilterSOSLSearchFileContent";
import labelFilterSOSLSearchTooShortError from "@salesforce/label/c.FilterSOSLSearchTooShortError";
import labelFilterRangeMinLabel from "@salesforce/label/c.FilterRangeMinLabel";
import labelFilterRangeMaxLabel from "@salesforce/label/c.FilterRangeMaxLabel";
import labelFilterRangeStartLabel from "@salesforce/label/c.FilterRangeStartLabel";
import labelFilterRangeEndLabel from "@salesforce/label/c.FilterRangeEndLabel";
import labelShowMore from "@salesforce/label/c.ShowMore";
import labelSelectedSingular from "@salesforce/label/c.SelectedSingular";
import labelSelectedPlural from "@salesforce/label/c.SelectedPlural";
import labelNonSearchableFields from "@salesforce/label/c.SOSLSearchNonSearchableFields";

export default class FilterPanel extends LightningElement {
    //COMPONENT PARAMETERS
    @api initializedContext;
    // Panel can be closed (not displayed all the time)
    @api canClose;
    // Name of the SOSL Search field in values
    @api SOSL_SEARCH_FIELD_NAME = "SOSLSearch";
    MIN_RANGE_SUFFIX = '.min';
    MAX_RANGE_SUFFIX = '.max';
    showPicklistModal = false;

    // LABELS
    labels = {
        labelQuickFilters,
        labelClose,
        labelClear,
        labelCancel,
        labelApply,
        labelClearAllFilters,
        labelFilterSOSLSearchRecord,
        labelFilterSOSLSearchFileContent,
        labelFilterSOSLSearchTooShortError,
        labelFilterRangeMinLabel,
        labelFilterRangeMaxLabel,
        labelFilterRangeStartLabel,
        labelFilterRangeEndLabel,
        labelFilterRangeMinError,
        labelFilterRangeMaxError,
        labelFilterRangeStartError,
        labelFilterRangeEndError,
        labelChecked,
        labelUnchecked,
        labelShowMore,
        labelSelectedSingular,
        labelSelectedPlural,
        labelNonSearchableFields
    };

    // COMPONENT DATA
    // Filter definitions for UI
    filterModel = [];
    @api get hasFilters() {
        return this.filterModel.length > 0;
    }
    // Map of values in the panel
    values;
    // Map of values in the form before click on Apply that are used by click on Cancel
    cancelValues;
    // Set of populated fields in the panel
    filtersWithValue;
    // Maximum number of picklist values displayed in the filter
    PICKLIST_VALUES_MAX = 5;
    // Map of picklist data for first and all values
    picklistsData = new Map();

    // Set of comps with errors
    filtersWithError = new Set();
    // Label and value for checkboxes
    BOOLEAN_CHECKED = "checked";
    BOOLEAN_UNCHECKED = "unchecked";
    booleanOptions = [
        { label: this.labels.labelChecked, value: this.BOOLEAN_CHECKED },
        { label: this.labels.labelUnchecked, value: this.BOOLEAN_UNCHECKED },
    ];
    @api nonSearchableFields;
    @api hasSearchableFieds = false;

    // UI CONTROL
    // If true, panel footer with buttons is displayed
    canShowFooter = false;
    // If true, Cancel button is displayed
    canCancel = false;
    // If true, Clear All button is displayed
    canClearAll = false;
    // If true, Apply button is displayed
    canApply = false;
    // If true, Apply button is disabled
    applyDisabled = false;
    // display/hide picklistValueModal
    showPicklistModal = false;
    // Data for pick list modal
    picklistSelection;

    // Compare filterable fields for sorting by Display Order in Quick Filters
    compareFilterableFields(f1, f2) {
        if (
            f1.displayPositionInQuickFilters > f2.displayPositionInQuickFilters
        )
            return 1;
        else if (
            f1.displayPositionInQuickFilters < f2.displayPositionInQuickFilters
        )
            return -1;
        else return 0;
    }

    // Build the data model and the value structure for the quick filter panel
    @api buildFilterModel(fields, showSOSLSearchInQuickFilters, dataSourceType) {
        const filterModel = [];
        let nonSearchableFields = [];
        const labels = this.labels;
        let fpFields = [];
        for (const fieldName of Object.getOwnPropertyNames(fields)) {
            const field = fields[fieldName];
            if (field.filterable) fpFields.push(field);
            if (field.listField) {
                if (field.type !== 'EMAIL' && field.type !== 'PHONE' && field.type !== 'STRING' && field.type !== 'TEXTAREA' && field.type !== 'URL')
                    nonSearchableFields.push(field.label);
                else if (field.quickFiltersName === 'Owner' || field.quickFiltersName === 'RecordType')
                    nonSearchableFields.push(field.label);
                else
                    this.hasSearchableFieds = true;
            }
        }
        nonSearchableFields = nonSearchableFields.sort((a, b) => a.localeCompare(b));
        const that = this;
        fpFields.sort(this.compareFilterableFields).forEach(function (field) {
            const entry = {
                fieldName: field.quickFiltersName,
                fieldLabel: field.label,
                fieldType: field.type,
                quickFiltersOperator1: field.quickFiltersOperator1,
                quickFiltersOperator2: field.quickFiltersOperator2,
            }
            const type = field.type;
            if (type === "DATE" || type === "DATETIME") {
                entry.inputType = "date";
                entry.isRange = true;
                entry.isNumberRange = false;
            } else if (type === "TIME") {
                entry.inputType = "time";
                entry.isRange = true;
                entry.isNumberRange = false;
            } else if (
                type === "CURRENCY" ||
                type === "DOUBLE" ||
                type === "DECIMAL" ||
                type === "INTEGER" ||
                type === "LONG" ||
                type === "PERCENT"
            ) {
                entry.step = 1 / (10 ** field.fractionDigits);
                entry.isRange = true;
                entry.isNumberRange = true;
            } else if (
                type === "EMAIL" ||
                type === "STRING" ||
                type === "TEXTAREA" ||
                type === "URL"
            ) {
                entry.inputType = "text";
                entry.isSingle = true;
            } else if (type === "MULTIPICKLIST" || type === "PICKLIST") {
                entry.isPicklist = true;
                const firstPicklistValues = [];
                const firstPicklistValueCodes = new Set();
                const allPicklistValues = [];
                field.picklistValues.forEach(function (plValue) {
                    if (plValue.active) {
                        if (firstPicklistValues.length < that.PICKLIST_VALUES_MAX) {
                            firstPicklistValues.push({ value: plValue.value, label: plValue.label });
                            firstPicklistValueCodes.add(plValue.value);
                        }
                        allPicklistValues.push({ value: plValue.value, label: plValue.label });
                    }
                });
                entry.options = [...firstPicklistValues];
                entry.hasMoreValues = allPicklistValues.length > firstPicklistValues.length;
                that.picklistsData.set(field.quickFiltersName, { firstCodes: firstPicklistValueCodes, allValues: allPicklistValues });
            } else if (type === "PHONE") {
                entry.inputType = "tel";
                entry.isSingle = true;
            } else if (type === "BOOLEAN") {
                entry.isBoolean = true;
            } else if (type === "LOOKUP") {
                entry.isLookup = true;
                entry.lookupData = field.lookups;
                entry.clearClass = "slds-col slds-no-flex slds-var-m-left_xx-small sl-clear-input";
                if (entry.lookupData.length > 1)
                    entry.clearClass += " sl-clear-lookup-object-selector";
            }
            if (entry.isRange) {
                entry.minLabel =
                    entry.isNumberRange
                        ? labels.labelFilterRangeMinLabel
                        : labels.labelFilterRangeStartLabel;
                entry.minName = field.quickFiltersName + that.MIN_RANGE_SUFFIX;
                entry.maxLabel =
                    entry.isNumberRange
                        ? labels.labelFilterRangeMaxLabel
                        : labels.labelFilterRangeEndLabel;
                entry.maxName = field.quickFiltersName + that.MAX_RANGE_SUFFIX;
            }
            filterModel.push(entry);
        });
        if (showSOSLSearchInQuickFilters && this.hasSearchableFieds) {
            const label =
                dataSourceType === "Files"
                    ? labels.labelFilterSOSLSearchFileContent
                    : labels.labelFilterSOSLSearchRecord;
            filterModel.unshift({
                fieldName: that.SOSL_SEARCH_FIELD_NAME,
                fieldLabel: label,
                fieldType: "STRING",
                inputType: "text",
                isSosl: true
            });
        }
        this.filterModel = filterModel;
        this.nonSearchableFields = nonSearchableFields.length > 0 ? labelNonSearchableFields.replace('{0}', Array.from(nonSearchableFields).join(", ")) : "";
        // Create initial values
        const values = new Map();
        for (const field of this.filterModel) {
            if (field.isRange) {
                values.set(field.minName, {
                    value: this.emptyValueForType(field.fieldType),
                    initValue: this.emptyValueForType(field.fieldType),
                    filter: field.minName,
                    fieldName: field.fieldName,
                    fieldLabel: field.fieldLabel,
                    fieldType: field.fieldType,
                    range: "min",
                    operator: field.quickFiltersOperator1,
                    checkValidity: true
                });
                values.set(field.maxName, {
                    value: this.emptyValueForType(field.fieldType),
                    initValue: this.emptyValueForType(field.fieldType),
                    filter: field.maxName,
                    fieldName: field.fieldName,
                    fieldLabel: field.fieldLabel,
                    fieldType: field.fieldType,
                    range: "max",
                    operator: field.quickFiltersOperator2,
                    checkValidity: true
                });
            }  else {
                values.set(field.fieldName, {
                    value: this.emptyValueForType(field.fieldType),
                    initValue: this.emptyValueForType(field.fieldType),
                    filter: field.fieldName,
                    fieldName: field.fieldName,
                    fieldLabel: field.fieldLabel,
                    fieldType: field.fieldType,
                    operator: field.quickFiltersOperator1,
                    checkValidity: field.isSosl
                });
            }
        }
        //console.log(JSON.stringify(Array.from(values.values())));
        this.values = values;
        this.cancelValues = new Map();
        this.filtersWithValue = new Set();
    }

    // DATATYPE MANAGEMENT
    emptyValueForType(type) {
        return type.includes("PICKLIST") ? [] : type === "LOOKUP" ? {} : "";
    }

    equalForType(type, value1, value2) {
        if (type === "LOOKUP") {
            if (value1.id !== undefined && value2.id !== undefined && value1.id === value2.id)
                return true;
            else if (value1.id === undefined && value2.id === undefined)
                return true;
            else
                return false;
        } else if (type.includes("PICKLIST")) {
            const v1str = value1.sort();
            const v2str = value2.sort();
            return v1str.toString() === v2str.toString();
        }
        else
            return value1 === value2;
    }

    emptyForType(type, value) {
        if (type === "LOOKUP")
             return JSON.stringify(value) === '{}';
        else if (type.includes("PICKLIST"))
            return value.length === 0;
        else
            return value === "";
    }

    // A picklist value has been selected in the filter panel
    handlePicklistChange(event) {
        const filter = event.target.name;
        // Merge selected values with all values
        const values = event.detail.value;
        const allValues = this.values.get(filter).value;
        // Exclude all first values from allValues in case first values are removed
        const firstCodes = this.picklistsData.get(filter).firstCodes;
        const diff = allValues.filter(x => !firstCodes.has(x));
        const mergedValues = new Set([...values, ...diff]);
        this.processValueChange(filter, Array.from(mergedValues), true);
    }

    // Select Picklist Values button has been clicked
    handleSelectPicklistValues(event) {
        const filter = event.target.name;
        const entry = this.values.get(filter);
        this.picklistSelection = {
            title: entry.fieldLabel,
            field: filter,
            values: this.picklistsData.get(filter).allValues,
            selectedValues: entry.value
        }
        this.showPicklistModal = true;
    }

    // Select Picklist Values Modal has been closed
    handleCloseSelectPicklistValues(event) {
        this.showPicklistModal = false;
        if (event.detail.action == 'apply') {
            this.processValueChange(event.detail.field, event.detail.selections, true);
        }
    }

    // An input value has been updated: Boolean, Currency, Number, Percent, Text, SOSL
    handleInputChange(event) {
        this.processValueChange(event.target.name, event.detail.value, true);
    }
    
    // VALIDITY MANAGEMENR
    // Clear errors on filters
    clearErrors() {
        this.filtersWithError.forEach((filter) => {
            let comp = this.findComp(filter);
            this.clearCompValidity(comp, filter);
        });
    }

    // Set a validity message on comp and display it
    setCompValidity(comp, message, filter) {
        comp.setCustomValidity(message);
        comp.reportValidity();
        if (message)
            this.filtersWithError.add(filter);
        else
            this.filtersWithError.delete(filter);
    }

    // Remove validity message from comp
    clearCompValidity(comp, filter) {
        this.setCompValidity(comp, "", filter);
    }

    // The SOSL search input lost the focus: check value validity
    handleSOSLSearchBlur(event) {
        this.checkSOSLFilterValue(event.target.name);
        this.updateUI();
    }

    // Check SOSL filter value: called by SOSL Filter blur or Apply: return true if valid
    checkSOSLFilterValue(filter) {
        let comp = this.findComp(filter);
        const entry = this.values.get(filter);
        if (entry.value != "" && entry.value.length < 2) {
            this.setCompValidity(comp, this.labels.labelFilterSOSLSearchTooShortError, filter);
            comp.focus();
            return false;
        } else {
            this.clearCompValidity(comp, filter);
            return true;
        }
    }

    // A range input lost the focus: check range value validity
    handleRangeBlur(event) {
        this.checkRangeFilterValue(event.target.name);
        this.updateUI();
    }

    // Check a range filter value: called by range Filter blur or Apply: return true if valid
    checkRangeFilterValue(filter) {
        const comp = this.findComp(filter);
        const valid = comp.checkValidity();
        if (!valid && !comp.validity.customError) {
            comp.focus();
            return false;
        } else
            return this.checkRangeMinMax(comp, filter.includes(this.MIN_RANGE_SUFFIX), filter);
    }

    // Check that min value is not > max value: return true if valid
    checkRangeMinMax(comp, isMin, filter) {
        const inverseFilter = isMin ? filter.replace(this.MIN_RANGE_SUFFIX, this.MAX_RANGE_SUFFIX) : filter.replace(this.MAX_RANGE_SUFFIX, this.MIN_RANGE_SUFFIX);
        // Value is always valid if no inverse value
        if (!this.filtersWithValue.has(inverseFilter))
            return true;
        // Value is always invalid if inverse filter is invalid
        if (this.filtersWithError.has(inverseFilter))
            return false;
        const minEntry = this.values.get(isMin ? filter : inverseFilter);
        const maxEntry = this.values.get(isMin ? inverseFilter : filter);
        if (minEntry.value !== "" && maxEntry.value != "" && 
            this.compareFilterValues(minEntry.value, maxEntry.value, comp.type)) {
                const message = comp.type === "number"
                    ? (isMin ? this.labels.labelFilterRangeMinError : this.labels.labelFilterRangeMaxError)
                    : (isMin ? this.labels.labelFilterRangeStartError: this.labels.labelFilterRangeEndError);
                this.setCompValidity(comp, message, filter);
            if (comp.type === 'number')
                comp.focus();
            return false;
        } else {
            this.clearCompValidity(comp, filter);
            const inverseComp = this.findComp(inverseFilter);
            this.clearCompValidity(inverseComp, inverseFilter);
            return true;
        }
    }

    // Compare filter values for all data types
    compareFilterValues(value1, value2, type) {
        if (type === "number") return Number(value1) > Number(value2);
        else return value1 > value2;
    }

    // A lookup value has been updated
    handleLookupChange(event) {
        this.processValueChange(event.target.name, event.detail, true);
    }

    // Find the component of a filter
    findComp(filter) {
        return this.template.querySelector('[data-name="' + filter + '"]');
    }

    // Set the value of a filter programatically
    setFilterValue(entry) {
        const filter = entry.filter;
        const value = entry.value;
        const comp = this.findComp(filter);
        if (entry.fieldType.includes("PICKLIST")) {
            const hasMore = this.template.querySelector('[data-hasmorename="' + filter + '"]');
            if (hasMore) {
                const firstCodes = this.picklistsData.get(filter).firstCodes;
                // Set the values for the multi checkbox group
                const firstValues = value.filter(x => firstCodes.has(x));
                comp.value = firstValues;
                // Set the label of Show More button
                const diff = value.filter(x => !firstValues.includes(x));
                let label = this.labels.labelShowMore;
                if (diff.length > 0) {
                    const selected = diff.length == 1 ? this.labels.labelSelectedSingular : this.labels.labelSelectedPlural;
                    label += ' (' + diff.length + ' ' + selected + ')';
                }
                hasMore.label = label;
            } else {
                comp.value = value;
            }
        }
        else {
            comp.value = value;
            if (entry.checkValidity)
                this.clearCompValidity(comp);
        }
    }

    // A filter value has been updated either in the UI or by an action: Clear Field, Clear Fields, Cancel
    processValueChange(filter, value, updateUI) {
        const entry = this.values.get(filter);
        // No cancel value found: create a new one if new value is not initial value
        if (!this.cancelValues.has(filter)) {
            if (!this.equalForType(entry.fieldType, value, entry.initValue))
                this.cancelValues.set(filter, entry.value);
        }
        // Cancel value found & cancel value = new value -> remove cancel value from cancelValues
        else {
            const cancelValue = this.cancelValues.get(filter);
            if (this.equalForType(entry.fieldType, value, cancelValue))
                this.cancelValues.delete(filter);
        }
        // Update non fiedsWithValues
        if (this.emptyForType(entry.fieldType, value))
            this.filtersWithValue.delete(filter);
        else
            this.filtersWithValue.add(filter);
        // Set new value
        entry.value = value;
        // Update picklist comps after value change
        if (updateUI && entry.fieldType.includes("PICKLIST"))
            this.setFilterValue(entry);
        // Set filter buttons
        if (updateUI)
            this.updateUI();
    }

    // Set buttons based on UI context
    updateUI() {
        this.canClearAll = this.filtersWithValue.size > 0;
        this.canCancel = this.cancelValues.size > 0;
        this.canApply = this.canCancel || this.canClearAll;
        this.applyDisabled = !this.canCancel || this.filtersWithError.size > 0;
        this.canShowFooter = this.canCancel || this.canClearAll || this.canApply;
    }

    // Clear filter button has been clicked on a field
    handleClearFilter(event) {
        const dataset = event.target.dataset;
        if (dataset.clear) {
            this.clearFilter(dataset.clear, true);
        }
        else if (dataset.clearmin) {
            this.clearFilter(dataset.clearmin, false);
            this.clearFilter(dataset.clearmax, true);
        }
    }

    // Clear Filters button has been clicked: clear filter values
    handleClearFilters() {
        for (const filter of this.filtersWithValue) {
            this.clearFilter(filter, false);
        }
        this.updateUI();
    }

    // Clears filter
    clearFilter(filter, updateUI) {
        const entry = this.values.get(filter);
        this.filtersWithError.delete(filter);
        const value = this.emptyValueForType(entry.fieldType);
        this.processValueChange(filter, value, updateUI);
        this.setFilterValue(entry);
    }

    // Cancel button has been clicked: undo the changes by setting the value to initial value
    handleCancel() {
        const cancelValuesCopy = new Map(this.cancelValues);
        for (const filter of cancelValuesCopy.keys()) {
            const cancelValue = cancelValuesCopy.get(filter);
            this.processValueChange(filter, cancelValue, false);
            this.setFilterValue(this.values.get(filter));
        }
        this.updateUI();
    }

    // Close button has been clicked: notify parent
    handleClose() {
        this.clearErrors();
        this.dispatchEvent(
            new CustomEvent("close")
        );
    }

    // Apply button has been clicked: built filter entries for SOQL and filters string for parent; pass the values to parent
    handleApply(event) {
        if (event)
            event.preventDefault();
        // Loop for checking filters validity
        for (const filter of this.filtersWithValue) {
            if (filter === this.SOSL_SEARCH_FIELD_NAME) {
                if (!this.checkSOSLFilterValue(filter)) {
                    return;
                }
            } else if (filter.endsWith(this.MIN_RANGE_SUFFIX) || filter.endsWith(this.MAX_RANGE_SUFFIX)) {
                if (!this.checkRangeFilterValue(filter))
                    return;
            }
        }
        // Other loop for building the filters and setting init values to current values for Cancel
        // Loop on values instead of filtersWithValue -> need to build filterByFields based on display order and not added to filtersWithValue order 
        // NOTE: Cannot be merged with 1st loop because initValues may become wrong if validation fails and initValue was updated before
        const filterEntries = [];
        let filterByFields = new Set();
        for (const entry of this.values.values()) {
            if (!this.filtersWithValue.has(entry.filter))
                continue;
            let vals = [];
            // Create filter entry for fields with values
            if (entry.value) {
                if (entry.fieldType === "BOOLEAN")
                    vals.push(entry.value === this.BOOLEAN_CHECKED ? "true" : "false");
                else if (
                    entry.fieldType.includes("PICKLIST")
                ) {
                    vals = Array.from(entry.value);
                } else if (entry.fieldType === 'LOOKUP')
                    vals.push(entry.value.id);
                else 
                    vals.push(entry.value);
                filterEntries.push({
                    fieldName: entry.fieldName,
                    operator: entry.operator,
                    values: vals,
                    type: entry.fieldType,
                });
                if (entry.filter != this.SOSL_SEARCH_FIELD_NAME)
                    filterByFields.add(entry.fieldLabel);
                entry.initValue = entry.value;
            }
        }
        this.cancelValues.clear();
        this.updateUI();
        this.dispatchEvent(
            new CustomEvent("apply", {
                detail: {
                    filterEntries: filterEntries,
                    filterByFields: Array.from(filterByFields).join(", ")
                },
            })
        );
    }
}