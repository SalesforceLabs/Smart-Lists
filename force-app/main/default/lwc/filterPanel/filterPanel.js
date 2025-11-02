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
import labelFilterRangeMissingValue from "@salesforce/label/c.FilterRangeMissingValue";
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
import labelSelectOperator from "@salesforce/label/c.SelectOperator";

import { Filter } from "./filter";

export default class FilterPanel extends LightningElement {
    //COMPONENT PARAMETERS
    @api initializedContext;
    // Panel can be closed (not displayed all the time)
    @api canClose;
    // Max Height in pixels of the filters display window
    @api filtersMaxHeight;
    // Panel width
    @api filtersWidth
    // Panel width
    @api filtersColumns
    // Name of the SOSL Search field in values
    @api SOSL_SEARCH_FIELD_NAME = 'SOSLSearch';
    // Display on the right
    @api displayRight;

    MIN_RANGE_SUFFIX = '.min';
    MAX_RANGE_SUFFIX = '.max';

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
        labelFilterRangeMissingValue,
        labelChecked,
        labelUnchecked,
        labelShowMore,
        labelSelectedSingular,
        labelSelectedPlural,
        labelNonSearchableFields,
        labelSelectOperator
    };

    // Filter operators
    operators = {
        'IN' : { label: 'in', value: 'IN' },
        'NOTIN': { label: 'not in', value: 'NOTIN' },
        'ISNULL' : { label: 'is null', value: 'ISNULL' },
        'ISNOTNULL': { label: 'is not null', value: 'ISNOTNULL' },
        'BETWEEN': { label: 'between', value: 'BETWEEN' },
        'LIKE': { label: 'contains', value: 'LIKE' },
        'NOTLIKE': { label: 'does not contain', value: 'NOTLIKE' },
        'SLIKE': { label: 'starts with', value: 'SLIKE' },
        'EQ': { label: 'equals', value: 'EQ' },
        'NE': { label: 'not equal to', value: 'NE' },
        'GT': { label: 'greater than', value: 'GT' },
        'GE': { label: 'greater or equal', value: 'GE' },
        'LT': { label: 'less than', value: 'LT' },
        'LE': { label: 'less or equal', value: 'LE' }
    }
    // COMPONENT DATA
    // Filter definitions for UI
    filterModel = [];
    @api get hasFilters() {
        return this.filterModel.length > 0;
    }
    // Label and value for checkboxes
    BOOLEAN_CHECKED = 'checked';
    BOOLEAN_UNCHECKED = 'unchecked';
    booleanOptions = [
        { label: this.labels.labelChecked, value: this.BOOLEAN_CHECKED },
        { label: this.labels.labelUnchecked, value: this.BOOLEAN_UNCHECKED },
    ];
    // SOSL search: non searchable fields
    @api nonSearchableFields;
    @api get hasNonSearchableFields() {
        return this.nonSearchableFields.length > 0;
    }
    @api hasSearchableFields = false;

    // STYLING
    get panelClass() {
        return 'slds-panel slds-panel_docked slds-grid slds-grid_vertical sl-filters-panel ' +
            (this.displayRight ? 'slds-panel_docked-right' :  'slds-panel_docked-left sl-filters-panel-left');
    }
    get filtersClass() {
        return 'slds-panel__body slds-grid slds-grow sl-filters-panel-background sl-filters-panel-body ' +
            (this.filtersMaxHeight ? 'sl-filters-panel-maxheight' : 'sl-filters-panel-nomaxheight');
    }
    get filterClass() {
        return 'slds-is-relative slds-col slds-size_1-of-' + this.filtersColumns;
    }

    // UI CONTROL
    // If true, Cancel button is disabled
    cancelDisabled = true;
    // If true, Clear All button is disableed
    clearAllDisabled = true;
    // If true, Apply button is disabled
    applyDisabled = true;
    // Sets for tracking filter states
    filtersUpdated = new Set();
    filtersNonNull = new Set();
    filtersWithError = new Set();
    filtersForApply = new Set();
    filtersActive = new Set();

    setPanel = true;
    @api panelBody;
    renderedCallback() {
        this.template.host.style.setProperty('--sl-filters-panel-width', this.filtersWidth + 'rem');
        this.template.host.style.setProperty('--sl-filters-panel-maxheight', this.filtersMaxHeight + 'px');
        if (this.setPanel) {
                this.panelBody = this.template.querySelector('.slds-panel__body');
            if (this.panelBody) {
                this.setPanel = false;
            }
        }
    }

    // Compare filterable fields for sorting by Display Order in Quick Filters
    compareFilterableFields(f1, f2) {
        if (
            f1.displayPositionInFiltersPanel > f2.displayPositionInFiltersPanel
        )
            return 1;
        else if (
            f1.displayPositionInFiltersPanel < f2.displayPositionInFiltersPanel
        )
            return -1;
        else return 0;
    }

    // Build the data model and the value structure for the Filters Panel
    @api buildFilterModel(fields, showSOSLSearchInQuickFilters, dataSourceType) {
        const filterModel = [];
        let nonSearchableFields = [];
        let hasSearchableFields = false;
        let fpFields = [];
        for (const fieldName of Object.getOwnPropertyNames(fields)) {
            const field = fields[fieldName];
            if (field.filterable) fpFields.push(field);
            if (field.listField) {
                if (field.nonSearchable)
                    nonSearchableFields.push(field.label);
                else
                    hasSearchableFields = true;
            }
        }
        nonSearchableFields = nonSearchableFields.sort((a, b) => a.localeCompare(b));
        fpFields.sort(this.compareFilterableFields).forEach(function (field) {
            filterModel.push(new Filter(field));
        });
        if (showSOSLSearchInQuickFilters && hasSearchableFields) {
            filterModel.unshift(new Filter({isSosl: true, dataSourceType: dataSourceType}));
        }
        this.filterModel = filterModel;
        this.hasSearchableFields = hasSearchableFields;
        this.nonSearchableFields = nonSearchableFields.length > 0 ? labelNonSearchableFields.replace('{0}', Array.from(nonSearchableFields).join(", ")) : "";
        this.filters = {};
        for (const filter of this.filterModel) {
            this.filters[filter.fieldName] = filter;
            // Add range min/max so that they can be retrieved by control name
            if (filter.isRange) {
                this.filters[filter.fieldName] = filter;
                this.filters[filter.minName] = filter;
                this.filters[filter.maxName] = filter;
            }

        }
    }

    // OPERATOR MANAGEMENT
    // Handle operator change
    handleOperatorChange(event) {
        event.stopPropagation();
        this.processOperatorChange(this.getFilter(event.detail.field), event.detail, true);
    }

    // Process operator change: called for operator change in UI or click on Cancel
    // UI update rules for filter input disabled state:
    // - If operator changed from not(null/not null) to null/not null, disable the control
    // - If operator changed null/not null) to not(null/not null), enable the control
    //
    // UI update rules for filter input single/multi value type:
    // - If operator changed from not(like) to like or like to not(like) and filter has value, refresh filterModel to toggle input type switch
    //
    // UI update rules for filter input value:
    // - If operator changed from not(null/not null) to null/not null and filter has value, clear the filter/control
    // - If operator changed from ((not(like) to like) or (like to not(like)) and filter has value, clear the filter/control
    //
    // UI update rules for Cancel button:
    // - If new operator <> init operator, enable Cancel button
    // 
    // UI update rules for Apply button:
    // - If operator changed from not(like) to like or like to like and new operator <> init operator, enable Apply button
    // - If operator changed from not(like) to not(like) and new operator <> init operator and filter has value, enable Apply button
    processOperatorChange(filter, operator, updateButtons) {
        if (filter.operator.value === operator.value)
            return;
        filter.updateOperator(operator);
        // Update Operator Label
        const label = this.template.querySelector('[data-operator="' + filter.fieldName + '"]');
        // Update operator label
        label.innerText = filter.operator.label;
        this.filtersWithError.delete(filter.fieldName);
        this.filtersWithError.delete(filter.minName);
        this.filtersWithError.delete(filter.maxName);
        // From not null to null -> clear filter if had value + disable input
        if (!filter.hadNullOperator && filter.hasNullOperator) {
            if (filter.hasValue)
                this.clearFilter(filter, false);
            this.setDisableStateOnInputComp(filter);
        } 
        // From null to not null -> enable input
        else if (filter.hadNullOperator && !filter.hasNullOperator) {
            this.setDisableStateOnInputComp(filter);
        } 
        // Other operator change on range filter
        // - from between to not between: clear max value
        // - enable/disable max field for between
        else if (filter.isRange) {
            if (filter.hadBetweenOperator && !filter.hasBetweenOperator) {
                const value = filter.value;
                value.max = '';
                this.processValueChange(filter, filter.fieldName, value, false, true);
            }
            this.setDisableStateOnInputComp(filter);
        }
        // From like to not like / not like to like: clear value
        else if ((filter.hadLikeOperator && !filter.hasLikeOperator) || (!filter.hadLikeOperator && filter.hasLikeOperator)) {
            this.clearFilter(filter, false);
        }
        // Trigger filters refresh in UI -> toggle single/multi input
        this.filterModel = [...this.filterModel];
        this.updateButtonsState(filter);
        if (updateButtons) {
            // Make control visible again
            const panelRect = this.panelBody.getBoundingClientRect();
            const control = this.template.querySelector('[data-filter="' + filter.fieldName + '"]');
            // Wait 1ms so that the list can close and we can get the height of the control without the list
            setTimeout(() => {
                const controlRect = control.getBoundingClientRect();
                this.panelBody.scrollTop += controlRect.bottom - panelRect.bottom;
            }, 1);
            // Update panel buttons
            this.updateButtons();
        }
    }

    setDisableStateOnInputComp(filter) {
        setTimeout(() => {
            if (filter.isRange) {
                const compMin = this.findComp(filter.minName);
                compMin.disabled = filter.hasNullOperator;
                const compMax = this.findComp(filter.maxName);
                compMax.disabled = filter.hasNullOperator || !filter.hasBetweenOperator;
            } else {
                const comp = this.findComp(filter.fieldName);
                comp.disabled = filter.hasNullOperator;
            }
            }, 1);
    }


    // FILTERS MANAGEMENT
    // A picklist value has been selected in the filter 
    // panel
    handlePicklistChange(event) {
        // Merge selected values with all values
        const values = event.detail.value ? event.detail.value : '';
        this.handleFilterChange(event.target.name, values);
    }

    // An input value has been updated: Boolean, Currency, Number, Percent, Text, SOSL
    handleInputChange(event) {
        this.handleFilterChange(event.target.name, event.detail.value);
    }

    // A multi value input value has been updated: Text
    handleMultiInputChange(event) {
        this.handleFilterChange(event.target.name, event.detail.value);
    }


    // A lookup value has been updated
    handleLookupChange(event) {
        this.handleFilterChange(event.target.name, event.detail.value);
    }

    handleFilterChange(fieldName, value) {
        this.processValueChange(this.getFilter(fieldName), fieldName, value, true, false);

    }

    // A filter value has been updated either in the UI or by an action: Clear Field, Clear Fields, Cancel
    processValueChange(filter, fieldName, value, updateButtons, updateComp) {
        filter.updateValue(fieldName, value);
        this.updateButtonsState(filter);
        if (updateComp)
            this.setFilterValue(filter);
        // Set filter buttons
        if (updateButtons)
            this.updateButtons();
    }

    // The SOSL search input lost the focus: check value validity
    handleSOSLSearchBlur(event) {
        this.checkSOSLFilterValue(this.getFilter(event.target.name));
        this.updateButtons();
    }

    // Check SOSL filter value: called by SOSL Filter blur or Apply: return true if valid
    checkSOSLFilterValue(filter) {
        let comp = this.findComp(filter.fieldName);
        if (!filter.hasValidSoslValue) {
            this.setCompValidity(comp, this.labels.labelFilterSOSLSearchTooShortError, filter.fieldName);
            comp.focus();
            return false;
        } else {
            this.clearCompValidity(comp, filter.fieldName);
            return true;
        }
    }

    // A range input lost the focus: check range value validity
    handleRangeBlur(event) {
        this.checkRangeFilterValue(this.getFilter(event.target.name), event.target.name);
        this.updateButtons();
    }

    // FILTER VALUE VALIDITY MANAGEMENT
    // Check a range filter value: called by range Filter blur or Apply: return true if valid
    checkRangeFilterValue(filter, fieldName) {
        const comp = this.findComp(fieldName);
        const valid = comp.checkValidity();
        // Focus comp is invalid value
        if (!valid && !comp.validity.customError) {
            comp.focus();
            return false;
        } else
            return this.checkRangeMinMax(comp, filter, fieldName);
    }

    // Check that min value is not > max value: return true if valid
    checkRangeMinMax(comp, filter, fieldName) {
        // No check if operator <> BETWEEN
        if (!filter.hasBetweenOperator)
            return true;
        const isMin = fieldName === filter.minName;
        const inverseFieldName = isMin ? filter.maxName : filter.minName;
        // Value is always valid if no inverse value
        if ((isMin && filter.value.max === '') || (!isMin && filter.value.min === ''))
            return true;
        // Value is always invalid if inverse filter is invalid
        if (this.filtersWithError.has(inverseFieldName))
            return false;
        if (!filter.hasValidRange) {
                const message = filter.isNumberRange
                    ? (isMin ? this.labels.labelFilterRangeMinError : this.labels.labelFilterRangeMaxError)
                    : (isMin ? this.labels.labelFilterRangeStartError: this.labels.labelFilterRangeEndError);
                this.setCompValidity(comp, message, fieldName);
            if (filter.isNumberRange)
                comp.focus();
            return false;
        } else {
            this.clearCompValidity(comp, fieldName);
            const inverseComp = this.findComp(inverseFieldName);
            this.clearCompValidity(inverseComp, inverseFieldName);
            return true;
        }
    }    

    // COMPONENT MANAGEMENT
    // Find UI component for a filter
    findComp(fieldName) {
        return this.template.querySelector('[data-name="' + fieldName + '"]');
    }

    // Set the value of a filter programatically
    
    setFilterValue(filter) {
        if (filter.isRange) {
            this.setFilterCompValue(filter.minName, filter.value.min, filter.checkValidity);
            this.setFilterCompValue(filter.maxName, filter.value.max, filter.checkValidity);
        } else
            this.setFilterCompValue(filter.fieldName, filter.value, filter.checkValidity);
    }

    // Set the value of a filter on a component
    setFilterCompValue(fieldName, value, checkValidity) {
        const comp = this.findComp(fieldName);
        comp.value = value;
        if (checkValidity)
            this.clearCompValidity(comp);
    }

    // Set a validity message on comp and display it
    setCompValidity(comp, message, fieldName) {
        comp.setCustomValidity(message);
        comp.reportValidity();
        if (message)
            this.filtersWithError.add(fieldName);
        else
            this.filtersWithError.delete(fieldName);
    }

    // Remove validity message from comp
    clearCompValidity(comp, fieldName) {
        this.setCompValidity(comp, '', fieldName);
    }

    // Clear errors on filters
    clearErrors() {
        this.filtersWithError.forEach((fieldName) => {
            let comp = this.findComp(fieldName);
            this.clearCompValidity(comp, fieldName);
        });
    }

    // Retrieve a filter from a field name
    getFilter(fieldName) {
        return this.filters[fieldName];
    }

    // PANEL BUTTONS MANAGEMENT
    // Set buttons disabled context for a filter
    updateButtonsState(filter) {
        // Update updated filters: Cancel button
        if (filter.canCancel)
            this.filtersUpdated.add(filter.fieldName);
        else
            this.filtersUpdated.delete(filter.fieldName);
        // Update filters with non null value: Clear Filters button
        if (filter.hasValue)
            this.filtersNonNull.add(filter.fieldName);
        else
            this.filtersNonNull.delete(filter.fieldName);
        if (filter.canApply)
            this.filtersForApply.add(filter.fieldName);
        else
            this.filtersForApply.delete(filter.fieldName);
        if (filter.isActive)
            this.filtersActive.add(filter.fieldName);
        else
            this.filtersActive.delete(filter.fieldName);
    }

    // Set buttons disabled state
    updateButtons() {
        // Set clear filters button
        this.clearFiltersDisabled = this.filtersNonNull.size === 0;
        this.clearAllDisabled = this.filtersNonNull.size === 0;
        this.cancelDisabled = this.filtersUpdated.size === 0;
        // Apply enabled if
        // - ClearAllFilters or fields manually deleted (Clear Filters disabled) after a click to Apply where fields had value (Cancel enabled) OR
        // - filters for Apply without errors
        if (this.clearFiltersDisabled && !this.cancelDisabled)
            this.applyDisabled = false;
        else
            this.applyDisabled = !(this.filtersForApply.size > 0 && this.filtersWithError.size === 0);
    }

    // CLEAR FILTER(S) BUTTON(S)
    // Clear filter button has been clicked on a field
    handleClearFilter(event) {
        const dataset = event.target.dataset;
        if (dataset.clear)
            this.clearFilter(this.getFilter(dataset.clear), true);
        else if (dataset.clearmin)
            this.clearFilter(this.getFilter(dataset.clearmin), true);
    }

    // Clear Filters button has been clicked: clear filter values
    handleClearFilters() {
        const filters = Array.from(this.filtersNonNull);
        for (const fieldName of filters) {
            this.clearFilter(this.getFilter(fieldName), false);
        }
        // Update buttons for clear all state
        this.updateButtons();
    }

    // Clear filter
    clearFilter(filter, updateButtons) {
        this.processValueChange(filter, filter.fieldName, filter.getEmptyValue(), updateButtons, true);
    }

    // CANCEL BUTTON
    // Cancel button has been clicked: undo the changes by setting the value/operator to initial value/operator
    handleCancel() {
        for (const filter of this.filterModel) {
            if (!filter.hasInitValue) {
                this.processValueChange(filter, filter.fieldName, filter.initValue, false, true);
            }
            if (!filter.hasInitOperator) {
                this.processOperatorChange(filter, filter.initOperator, false);
            }
        }
        this.updateButtons();
    }

    // CLOSE BUTTON
    // Close button has been clicked: notify parent
    handleClose() {
        this.clearErrors();
        this.dispatchEvent(
            new CustomEvent('close')
        );
    }

    // APPLY BUTTON
    // Apply button has been clicked:
    // - check filters validity
    // - Create filters list for controller
    // - Seset filter init values to values (Cancel button disabled)
    handleApply(event) {
        if (event)
            event.preventDefault();
        // Loop for checking filters validity
        for (const fieldName of this.filtersUpdated) {
            const filter = this.getFilter(fieldName);
            if (fieldName === this.SOSL_SEARCH_FIELD_NAME) {
                if (!this.checkSOSLFilterValue(filter)) {
                    return;
                }
            } else if (filter.isRange && filter.hasBetweenOperator && filter.hasValue) {
                // Raise error if one of the fields is blank
                if (filter.value.min === '') {
                    const comp = this.findComp(filter.minName);
                    this.setCompValidity(comp, this.labels.labelFilterRangeMissingValue, filter.minName);
                    return;
                } else if (filter.value.max === '') {
                    const comp = this.findComp(filter.maxName);
                    this.setCompValidity(comp, this.labels.labelFilterRangeMissingValue, filter.maxName);
                    return;
                }
                if (!this.checkRangeFilterValue(filter, filter.minName))
                    return;
            }
        }
        // Loop for building the filters and setting init values to current values for Cancel
        const filterEntries = [];
        const filterByFields = new Set();
        for (const filter of this.filterModel) {
            // Set cancel values for filters - active and non active filters -> non active filters for after Clear Filters
            filter.apply();
            if (!this.filtersActive.has(filter.fieldName))
                continue;
            // Build filter entry for active filter
            if (filter.hasNullOperator) {
                filterEntries.push({
                    fieldName: filter.fieldName,
                    operator: filter.operator.value,
                    values: [''],
                    type: filter.fieldType,
                });
            } else if (filter.isRange) {
                if (filter.hasBetweenOperator) {
                    filterEntries.push({
                        fieldName: filter.fieldName,
                        operator: 'GE',
                        values: [filter.value.min],
                        type: filter.fieldType,
                    });
                    filterEntries.push({
                        fieldName: filter.fieldName,
                        operator: 'LE',
                        values: [filter.value.max],
                        type: filter.fieldType,
                    });
                } else if (filter.hasEqualOperator && filter.datatype.isDateTime) {
                    filterEntries.push({
                        fieldName: filter.fieldName,
                        operator: 'GE',
                        values: [filter.value.min],
                        type: filter.fieldType,
                    });
                    filterEntries.push({
                        fieldName: filter.fieldName,
                        operator: 'LE',
                        values: [filter.value.min],
                        type: filter.fieldType,
                    });
                } else {
                    filterEntries.push({
                        fieldName: filter.fieldName,
                        operator: filter.operator.value,
                        values: [filter.value.min],
                        type: filter.fieldType,
                    });
                }
            } else {
                let vals = [];
                if (filter.isBoolean)
                    vals.push(filter.value === this.BOOLEAN_CHECKED ? 'true' : 'false');
                else if (filter.isPicklist) {
                    vals = filter.value.split(';');
                } else if (filter.isLookup) {
                    for (const item of filter.value) {
                        vals.push(item.id);
                    }
                } else if (filter.isText)
                    vals = filter.value;
                else 
                    vals.push(filter.value);
                filterEntries.push({
                    fieldName: filter.fieldName,
                    operator: filter.operator.value,
                    values: vals,
                    type: filter.fieldType,
                });
            }
            if (filter.fieldName != this.SOSL_SEARCH_FIELD_NAME)
                filterByFields.add(filter.fieldLabel);
        }
        //console.log('Apply ' + JSON.stringify(filterEntries));
        this.filtersForApply.clear();
        this.filtersUpdated.clear();
        this.updateButtons();
        this.dispatchEvent(
            new CustomEvent('apply', {
                detail: {
                    filterEntries: filterEntries,
                    filterByFields: Array.from(filterByFields).join(', ')
                },
            })
        );
    }
}