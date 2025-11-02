import { LightningElement, api } from 'lwc';
import { slLookupItem } from "./slLookupItem";
import getRecentRecords from '@salesforce/apex/SmartListController.lookupGetRecentRecords';
import searchRecords from '@salesforce/apex/SmartListController.lookupSearchRecords';

import labelClearAll from "@salesforce/label/c.ClearAll";
import labelErrorMissingValue from "@salesforce/label/c.ErrorMissingValue";
import labelOptionsSelected from "@salesforce/label/c.OptionsSelected";
import labelRemove from "@salesforce/label/c.Remove";
import labelSearch from "@salesforce/label/c.Search";
import labelSelectAnOption from "@salesforce/label/c.SelectAnOption";
import labelSelectedOptions from "@salesforce/label/c.SelectedOptions";
import labelLookupPlaceholder from '@salesforce/label/c.LookupPlaceholder';
import labelLookupRecent from '@salesforce/label/c.LookupRecent';
import labelLookupObjectSelector from '@salesforce/label/c.LookupObjectSelector';
import labelLookupNoResults from '@salesforce/label/c.LookupNoResults';
import labelLoading from '@salesforce/label/c.Loading';
import labelClear from "@salesforce/label/c.Clear";

const VARIANT_LABEL_STACKED = 'label-stacked';
const VARIANT_LABEL_INLINE = 'label-inline';
const VARIANT_LABEL_HIDDEN = 'label-hidden';
const SOSL_MIN_CHARS = 2;

//const VALUE_SEP = '$$$SEP$$$';

export default class SlLookup extends LightningElement {
    // COMPONENT PROPERTIES
    // Object types for selecting the records
    @api objects = [];
    _value;
    @api get value() {
        if (this.singleSelect)
            return this._selectedItemsMap.size > 0 ? Array.from(this._selectedItemsMap.values())[0] : [];
        else
            return Array.from(this._selectedItemsMap.values());
    }
    set value(value) {
        if (value !== this.value) {
            const val = JSON.parse(JSON.stringify(value));;
            this._selectedItemsMap.clear();
            if (this.singleSelect) {
                val.focused = false;
                this.updateItemSelectState(val, true, false);
            } else {
                for (const item of val) {
                    item.focused = false;
                    this.updateItemSelectState(item, true, false);
                }
            }
            this._value = val;
            this.refreshSelectedItems();
        }
    }
    @api parent;
    @api field;
    // Datatable Editor
    @api isDatatableEditor = false;
    @api isFilter = false;
    @api label;
    @api required;
    @api disabled = false;
    _multiSelect = false;
    @api get multiSelect() {
        return this._multiSelect;
    }
    set multiSelect(value) {
        this._multiSelect = (value && value.toLowerCase() === 'true');
    }
    @api placeholder;
    _variant = VARIANT_LABEL_STACKED;
    @api get variant() {
        return this._variant;
    }
    set variant(variant) {
        if (variant === VARIANT_LABEL_HIDDEN || variant === VARIANT_LABEL_INLINE || variant === VARIANT_LABEL_STACKED)
            this._variant = variant;
        else
            this._variant = VARIANT_LABEL_STACKED;
    }
    // LABELS
    labels = {
        labelClearAll,
        labelErrorMissingValue,
        labelOptionsSelected,
        labelSearch,
        labelSelectAnOption,
        labelSelectedOptions,
        labelRemove,
        labelLookupNoResults,
        labelLookupPlaceholder,
        labelLookupRecent,
        labelLookupObjectSelector,
        labelLoading,
        labelClear
    };

    // UI VARIABLES
    get singleSelect() {
        return !this.multiSelect;
    }
    get isNotDatatableEditor() {
        return !this.isDatatableEditor;
    }
    get showSelectedItem() {
        return this.singleSelect && this.hasSelectedItems;
    }
    get showDefaultResults() {
        return this._highlightString.length <= SOSL_MIN_CHARS;
    }
    get showPills() {
        return this.multiSelect && this.hasSelectedItems;
    }

    // Dropdownn items
    items = [];
    get hasItems() {
        return this.items && this.items.length > 0;
    }
    // Selected items for dropdown and pills
    selectedItems = [];
    get hasSelectedItems() {
        return this.selectedItems && this.selectedItems.length > 0;
    }

    // aria-activedescendant
    get activedescendant() {
        return this.hasFocusedItem ? this._focusIndex : null;
    }
    // Error
    error = '';
    get hasError() {
        return this.error.length > 0;
    }
    get describedby() {
        return this.hasError ? 'form-error-01' : null;
    }
    // Controls display values
    get buttonLabel() {
        return this.hasSelectedItems ? this.selectedItems[0].label : this.placeholder;
    }
    inputSinglePlaceholder = this.labels.labelSearch;
    get inputMultiPlaceholder() {
         if (this.selectedItems.length > 0 )
            return this.selectedItems.length + ' ' + this.labels.labelOptionsSelected;
        else
            return this.labels.labelSelectAnOption;
    }
    get formElementClass() {
        let cls = 'slds-form-element';
        if (this.variant === VARIANT_LABEL_INLINE)
            cls += ' slds-form-element_horizontal';
        if (this.hasError)
            cls += ' slds-has-error';
        return cls;
    }
    get labelClass() {
        let cls = 'slds-form-element__label';
        if (this.variant === VARIANT_LABEL_HIDDEN)
            cls += ' slds-assistive-text';
        return cls;
    }
    get containerClass() {
        return 'slds-combobox_container' + this.hasSelectedItems ? ' slds-has-selection' : '';
    }
    get dropdownClass() {
        let cls = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ';
        if (this._isDropdownOpen)
            cls += 'slds-is-open';
        return cls;
    }
    get buttonClass() {
        let cls = 'align-button slds-combobox__input slds-combobox__input-value';
        if (this.hasSelectedItems)
            cls += ' has-custom-border';
        if (this.disabled)
            cls += ' slds-input_faux fix-slds-input_faux slds-is-disabled';
        else
            cls += ' slds-input';
        return cls;
    }
    get inputMultiClass() {
        let cls = 'slds-input slds-combobox__input';
        if (this.disabled)
            cls += ' slds-is-disabled';
        else if (this._hasFocus)
            cls += ' slds-has-focus';
        return cls;
    }
    get listboxClass()  {
        let cls = 'slds-dropdown slds-dropdown_fluid slds-dropdown_length-with-icon-5';
        if (this.isFilter)
            cls += ' sl-dropdown-filter';
        if (this.singleSelect)
            cls += ' sl-dropdown';
        return cls;
    }
    get inputClass() {
        let cls = 'slds-input slds-combobox__input slds-combobox__input-value';
        if (this.disabled)
            cls += ' slds-is-disabled';
        else if (this._hasFocus)
            cls += ' slds-has-focus';
        return cls;
    }

    // PRIVATE VARIABLES
    COMBO_NONE = 'none';
    // Non filtered items
    _allItems = [];
    // Selection management
    _selectedItemsMap = new Map();
    // Index of focused item in items[]
    _focusIndex;
    get hasFocusedItem() {
        return this._focusIndex !== -1;
    }
    // Search string in the input (includes wildcards)
    _searchString = '';
    // Search string for highlight in the UI (without wildcards)
    _highlightString = ''
    // Toggle for open/close dropdown
    _isDropdownOpen = false;
    // Component focus flag
    _hasFocus = false;
    // Don't propagate blur event
    _noBlurEvent = false;
    // Deferred render actions
    _mustFocus = false;
    _mustScrollToIndex = false;

    connectedCallback() {
        this.showObjectsSelector = this.objects.length > 1;
        // Initialize objects
        const objects = [];
        for (const obj of this.objects) {
            const objClone = {...obj};
            objClone.defaultResultsLoaded = false;
            objClone.defaultResults = [];
            objects.push(objClone);
        }
        this.objects = [...objects];
        this.selectedObject = this.objects[0];
        this.updateObjectSelection();
    }


    // Execute UI updates that can only be executed if the component is rendered
    renderedCallback() {
        // Make listbox visible in Filters Panel if needed
        if (this.parent && this._isDropdownOpen && this.isFilter) {
            const parentRect = this.parent.getBoundingClientRect();
            const listboxDiv = this.template.querySelector('.slds-dropdown');
            const listboxRect = listboxDiv.getBoundingClientRect();
            if (listboxRect.bottom > parentRect.bottom)
                this.parent.scrollTop += listboxRect.bottom - parentRect.bottom;
        }
        if (this._mustFocus) {
            this.focus();
            this._mustFocus = false;
        }
    }

    // Set selectedItems array from map
    refreshSelectedItems() {
        this.selectedItems = [...Array.from(this._selectedItemsMap.values())];
    }

    // INPUT ACTIONS
    handleInput(event) {
        this.updateSearchString(event.target.value);
    }

    handleInputClick(event) {
        event.stopPropagation();
        if (this.multiSelect && this._isDropdownOpen)
            this.toggleDropdown();
        else
            this.findRecords();
    }
    
    handleInputFocus(event) {
        if (!this.disabled) {
            this._hasFocus = true;
            this.dispatchEvent(new CustomEvent('focus'));
        }
    }

    handleInputBlur(event) {
        // Blur if focus not on internal
        const isInternal = event.relatedTarget && event.relatedTarget.classList.contains('sl-internal');
        if (!isInternal) {
            if (this._isDropdownOpen)
                this.toggleDropdown();
            this.clearSearchString();
            this._hasFocus = false;
            if (this.isDatatableEditor && this._noBlurEvent)
                return;
            this.dispatchEvent(new CustomEvent('blur'));
        }
    }
    
    // SEARCH STRING
    // Store search string data
    setSearchString(searchString) {
        this._searchString = searchString;
        this._highlightString = searchString.replaceAll(/(\*|\?)/gi, '');
    }

    // Retrieve records matching search string for context:
    updateSearchString(searchString) {
        if (this._searchTimeout) {
            clearTimeout(this._searchTimeout);
            this.loading = false;
        }
        this.setSearchString(searchString);
        this.findRecords();
    }

    clearSearchString() {
        if (this.inputElement && this.inputElement.value) {
            this.inputElement.value = '';
            this.setSearchString('');
        }
    }

    // DROPDOWN MANAGEMENT
    handleDropdownMouseDown(event) {
        const mainButton = 0;
        if (event.button === mainButton) {
            this._cancelBlur = true;
        }
    }

    handleDropdownMouseUp() {
        this._cancelBlur = false;
    }

    toggleDropdown() {
        this._isDropdownOpen = !this._isDropdownOpen;
    }

    // Scroll dropdown to make item visible if needed
    scrollToIndex(index) {
        const itemDiv = this.template.querySelector('DIV [data-index="' + index +'"]');
        const listDiv = this.template.querySelector('.slds-dropdown');
        const parentRect = listDiv.getBoundingClientRect();
        const findMeRect = itemDiv.getBoundingClientRect();
        if (findMeRect.top < parentRect.top) {
            if (itemDiv.offsetTop + findMeRect.height < parentRect.height) {
                // If element fits by scrolling to the top, then do that
                listDiv.scrollTop = 0;
            } else {
                // Otherwise, top align the element
                listDiv.scrollTop = itemDiv.offsetTop;
            }
        } else if (findMeRect.bottom > parentRect.bottom) {
            // bottom align the element
            listDiv.scrollTop += findMeRect.bottom - parentRect.bottom;
        }
    }

    // KEYBOARD MANAGEMENT
    handleSelectionKeyDown(event) {
        const key = this.normalizeKeyValue(event.key);
        // Delete: delete selected item
        if (key === 'Delete') {
            this.handleClearSelectionClick(event);
        }
    }

    // Keyboard accessibility https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/
    handleInputKeyDown(event) {
        const key = this.normalizeKeyValue(event.key);
        // Enter: select focused item if any and dropdown is open; for singleSelect close dropdown (done in selectItem)
        if (key === 'Enter') {
            event.preventDefault();
            if  (this._isDropdownOpen &&this.hasFocusedItem)
                this.selectItemByIndex(this._focusIndex, true); 
        }
        // Escape: 
        // multiSelect: close dropdown if open or clear input if value entered
        // single select: close dropdwon and clear input
        else if (key === 'Escape') {
            event.preventDefault();
            if (this._isDropdownOpen) {
                if (this.singleSelect)
                    this.clearSearchString();
                this.toggleDropdown();
            } else
                this.clearSearchString();
        }
        // Arrow Down: if items in the list, select next item or go back to first item if last item
        else if (key === 'ArrowDown') {
            event.preventDefault();
            if (!this._isDropdownOpen) {
                this.focusFirstItem();
                this.toggleDropdown();
            } else
                this.focusItemKeyboard(this._focusIndex + 1 < this.items.length ? this._focusIndex + 1 : 0);
        }
        // Arrow Up: if items in the list, select previous item or go back to last item if first item
        else if (key === 'ArrowUp') {
            event.preventDefault();
            this.focusItemKeyboard(this._focusIndex - 1 < 0 ? this.items.length - 1 : this._focusIndex - 1);
        }
        // Page Down: select next 10th item or or last item if less than 10 items after current item
        else if (key === 'PageDown') {
            event.preventDefault();
            this.focusItemKeyboard(Math.min(this._focusIndex + 10, this.items.length - 1));
        }
        // Page Up: select previous 10 th item or first item if less than 10 items before current item
        else if (key === 'PageUp') {
            event.preventDefault();
            this.focusItemKeyboard(Math.max(this._focusIndex - 10, 0));
        }
        // Tab: if dropwdown open: close dropdown and focus pills
        else if (key === 'Tab' && this._isDropdownOpen)  {
            this.toggleDropdown();
        }
    }

    focusItemKeyboard(index) {
        this.focusItemByIndex(index);
        this.scrollToIndex(index);
    }

    normalizeKeyValue(value) {
        switch (value) {
            case 'Spacebar':
                return ' ';
            case 'Esc':
                return 'Escape';
            case 'Del':
                return 'Delete';
            case 'Left':
                return 'ArrowLeft';
            case 'Right':
                return 'ArrowRight';
            case 'Down':
                return 'ArrowDown';
            case 'Up':
                return 'ArrowUp';
            default:
                return value;
        }
    }

    // LIST ITEM
    handleItemClick(event) {
        this._cancelBlur = true;
        const index = parseInt(event.currentTarget.dataset.index);
        this.focusItemByIndex(index);
        this.selectItemByIndex(index);
    }

    // SELECTION MANAGEMENT
    selectItemByIndex(index) {
        this.selectItem(this.items[index], true);
        if (this.isDatatableEditor)
            this._mustFocus = true;
        else
            this.focus();
        this.toggleDropdown();
        // Update validity state
        this.showHelpMessageIfInvalid();
    }

    selectItem(item, flag) {
        if (this.multiSelect) {
            // Toggle selected state
            this.updateItemSelectState(item, flag, true);
        } else {
            // Single Select: unselect currently selected item
            if (this.selectedItems.length > 0)
                this.updateItemSelectState(this.selectedItems[0], false, false)
            // Select item
            this.updateItemSelectState(item, true, true)
        }
        this.clearSearchString();
        // Refresh selected items after delete/set
        this.refreshSelectedItems();
        this.setDisplayedResults(false);
    }

    updateItemSelectState(item, flag, notify) {
        if (flag) {
            if (item.id)
                this._selectedItemsMap.set(item.id, item);
        } else
            this._selectedItemsMap.delete(item.id);
        item.selected = flag;
        if (notify)
            this.dispatchEvent(
                new CustomEvent('change', { detail: { value: this.value}})
            );
    }

    clearSelection() {
        const items = this._selectedItemsMap.values();
        for (const item of items) {
            item.focused = false;
            this.updateItemSelectState(item, false, true);
        }
        this.refreshSelectedItems();
        this.showHelpMessageIfInvalid();
        this.clearSearchString();
        if (this.singleSelect && !this._isDropdownOpen) {
            if (!this.selectedObject.defaultResultsLoaded)
                this.findRecords();
            else
                this.toggleDropdown();
        } else if (this.multiSelect && this._isDropdownOpen)
            this.toggleDropdown();
    }

    // FOCUS ITEMS MANAGEMENT
    focusItemByIndex(index) {
        if (this.hasFocusedItem) {
            const prevItem = this.items[this._focusIndex];
            prevItem.focused = false;
        }
        const item = this.items[index];
        item.focused = true;
        this._focusIndex = index;
    }

    // Focus the first item whenever the list of items is updated
    focusFirstItem() {
        if (this.items.length > 0) {
            this.focusItemByIndex(0);
            this._mustScrollToIndex = true;
        } else
            this.resetFocusIndex();
    }

    focusLastItem() {
        if (this.items.length > 0) {
            this.focusItemByIndex(this.items.length - 1);
            this._mustScrollToIndex = true;
        } else
            this.resetFocusIndex();
    }

    resetFocusIndex() {
        this._focusIndex = -1;
    }

    // PILLS
    handleRemovePillClick(event) {
        event.stopPropagation();
        this.removePill(event.currentTarget.dataset.id);
    }
    handleRemovePillKeyDown(event) {
        const key = this.normalizeKeyValue(event.key);
        // Enter: select focused item if any and dropdown is open; for singleSelect close dropdown (done in selectItem)
        if (key === 'Delete')
            this.removePill(event.currentTarget.dataset.id);
    }
    removePill(id) {
        this.updateItemSelectState(this._selectedItemsMap.get(id), false, true);
        this.refreshSelectedItems();
        this.focus();
    }

    // CLEAR SELECTION BUTTON
    handleClearSelectionClick(event) {
        event.stopPropagation();
        event.preventDefault();
        // Defer focus on input to renderedCallback when input is visible for single select
        this._mustFocus = true;
        this.clearSelection();
    }

    // VALIDITY
    /**
     * Represents the validity states that an element can be in, with respect to constraint validation.
     * @type {object}
     */
    @api get validity() {
        if (this.required && (!this.hasSelectedItems || this.selectedItems[0].value === this.COMBO_NONE))
            return {invalid: true, valueMissing: true};
        else
            return {valid: true} ;
    }

    /**
     * Returns the valid attribute value (Boolean) on the ValidityState object.
     * @returns {boolean} Indicates whether the combobox has any validity errors.
     */
    @api checkValidity() {
        const isValid = this.validity.valid === true;
        /*if (!isValid) {
            if (this.inputComponent) {
                this.inputComponent.dispatchEvent(
                    new CustomEvent('invalid', { cancellable: true })
                );
            }
        }*/
        return isValid;
    }

    /**
     * Displays the error messages and returns false if the input is invalid.
     * If the input is valid, reportValidity() clears displayed error messages and returns true.
     * @returns {boolean} - The validity status of the combobox.
     */
    @api reportValidity() {
        const valid = this.checkValidity();
        if (valid)
            this.error = '';
        else if (!valid && this.validity.valueMissing)
            this.error = this.labels.labelErrorMissingValue;
        return valid;
    }

    /**
     * Shows the help message if the combobox is in an invalid state.
     */
    @api showHelpMessageIfInvalid() {
        this.reportValidity();
    }

    // ELEMENTS
    get inputElement() {
        return  this.template.querySelector('.slds-combobox__input');
    }

    get compElement() {
        return this.template.querySelector(this.multiSelect ? '.slds-combobox__input' : '.align-button');
    }

    // FOCUS ELEMENTS
    focusInput() {
        this.inputElement?.focus();
    }
    @api focus() {
        this.inputElement?.focus();
    }

    // SEARCH RECORDS
    // Retrieve records for the context
    findRecords() {
        if (this.showDefaultResults) {
            if (!this.selectedObject.defaultResultsLoaded)
                this.getDefaultResults();
            else {
                this._allItems = [...this.selectedObject.defaultResults];
                this.setDisplayedResults(true);
            }
        } else 
            this.search()
    }
    
    // Get default results
    getDefaultResults() {
        if (!this.selectedObject.hasMRU) {
            this.setDefaultResults([]);
            return;
        }
        this.loading = true;
        getRecentRecords({
            objectName: this.selectedObject.value, titleField: this.selectedObject.titleField, subtitleField: this.selectedObject.subtitleField,
            soqlFilter: this.selectedObject.soqlFilter
        })
            .then((result) => {
                this.loading = false;
                this.setDefaultResults(JSON.parse(result));
            })
            .catch((error) => {
                console.log("Error " + JSON.stringify(error));
            })
            .finally(() => {
                this.loading = false;
            });
    
    }

    // Set default results for the selected object
    setDefaultResults(results) {
        this.selectedObject.defaultResultsLoaded = true;
        this.setResults(results, true)
        this.selectedObject.defaultResults = [...this._allItems];
        this.setDisplayedResults(true);
    }

    // SOSL search for search string
    search() {
        // Apply search throttling (prevents search if user is still typing)
        this.loading = true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._searchTimeout = setTimeout(() => {
            // Display spinner until results are returned
            searchRecords({
                searchTerm: this._searchString, objectName: this.selectedObject.value, titleField: this.selectedObject.titleField,
                subtitleField: this.selectedObject.subtitleField, soqlFilter: this.selectedObject.soqlFilter
            })
                .then((result) => {
                    this.setResults(JSON.parse(result));
                    this.setDisplayedResults(true);
                    this.loading = false;
                })
                .catch((error) => {
                    console.log("Error " + JSON.stringify(error));
                });
            this._searchTimeout = null;
        }, 300);
    }

    // Set records into_allItems
    setResults(records) {
        const items = [];
        let index = 0;
        for (const record of records) {
            const item = new slLookupItem(record.id, record.title, record.subtitle, /*selected*/ false, false, this.selectedObject.iconName, index++);
            items.push(item);
        }
        this._allItems = [...items];
    }

    // Build the list of displayable results from _allItems
    setDisplayedResults(openDropdown) {
        this.resetFocusIndex();
        const items = [];
        let index = 0;
        const mustHighlight = this._highlightString.length > 0;
        const searchString = this._highlightString.toLowerCase();
        for (const item of this._allItems) {
            if (this._selectedItemsMap.has(item.id))
                continue;
            if (mustHighlight) {
                if (item.title.toLowerCase().includes(searchString) ||
                    (item.subtitle && item.subtitle.toLowerCase().includes(searchString)))
                    item.formatLabels(this._highlightString);
                else
                    continue;
            } else
                item.resetFormattedLabels();
            item.focused = false;
            item.index = index++;
            items.push(item);
        }
        this.items = [...items];
        this.resetFocusIndex();
        this.focusFirstItem();
        if (openDropdown && !this._isDropdownOpen)
            this.toggleDropdown();
    }


    // OBJECT SELECTION
    handleSelectObject(event) {
        event.stopPropagation();
        for (const obj of this.objects) {
            if (obj.value === event.detail.value) {
                this.selectedObject = obj;
                break;
            }
        }
        this._value = {};
        this.updateObjectSelection();
    }

    updateObjectSelection() {
        this.placeholder = this.labels.labelLookupPlaceholder.replace("{0}", this.selectedObject.label);
        this.recentLabel = this.labels.labelLookupRecent.replace("{0}", this.selectedObject.label);
        if (!this.selectedObject.iconName)
            this.selectedObject.iconName = 'standard:default';
        this.objectSelectorDescriptiveText = this.labels.labelLookupObjectSelector.replace("{0}", this.selectedObject.label);
        if (this.singleSelect && this.isNotDatatableEditor && this.hasSelectedItems)
            this.clearSelection();
    }
}