import { LightningElement, api } from 'lwc';
import { slComboboxItem } from "./slComboboxItem";

import labelClearAll from "@salesforce/label/c.ClearAll";
import labelErrorMissingValue from "@salesforce/label/c.ErrorMissingValue";
import labelLookupNoResults from "@salesforce/label/c.LookupNoResults";
import labelOptionsSelected from "@salesforce/label/c.OptionsSelected";
import labelRemove from "@salesforce/label/c.Remove";
import labelSearch from "@salesforce/label/c.Search";
import labelSelectAnOption from "@salesforce/label/c.SelectAnOption";
import labelSelectedOptions from "@salesforce/label/c.SelectedOptions";

const VARIANT_LABEL_STACKED = 'label-stacked';
const VARIANT_LABEL_INLINE = 'label-inline';
const VARIANT_LABEL_HIDDEN = 'label-hidden';

const VALUE_SEP = '$$$SEP$$$';

export default class SlAutocompleteCombobox extends LightningElement {
    // COMPONENT PROPERTIES
    _canSet = false;
    _value;
    @api get value() {
        const values = Array.from(this._selectedItemsMap.keys()).map((key) => {
            const parts = key.split(VALUE_SEP);
            return parts[1];
        });
        return values.join(';');
    }
    set value(value) {
        if (value !== this.value) {
            this._value = value;
            if (this._canSet)
                this.setComponent();
        }
    }
    _options;
    @api get options() {
        return this._options;
    }
    set options(value) {
        this._options = value;
        if (value)
            this.setComponent();
    }
    @api parent;
    @api field;
    // Datatable Editor
    @api isDatatableEditor = false;
    @api isFilter = false;
    @api isOperator = false;
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
        labelLookupNoResults,
        labelOptionsSelected,
        labelSearch,
        labelSelectAnOption,
        labelSelectedOptions,
        labelRemove,
    };

    // UI VARIABLES
    get singleSelect() {
        return !this.multiSelect;
    }
    get showSingleSelectInput() {
        return this.singleSelect && this._allItems.length > 5;
    }
    get showPills() {
        return this.multiSelect && this.hasSelectedItems;
    }

    compId = "combobox-id-1";
    // Dropdownn items
    items = [];
    get hasItems() {
        return this.items && this.items.length > 0;
    }
    // Selected items for pills
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
        if (this.isOperator)
            cls += ' sl-operator-button';
        if (this.disabled)
            cls += ' slds-input_faux fix-slds-input_faux slds-is-disabled';
        else
            cls += ' slds-input';
        return cls;
    }
    get buttonIconDivClass() {
        let cls = (this.isOperator) ? '' : 'slds-input__icon-group slds-input__icon-group_right';
        return cls;
    }
    get buttonIconClass() {
        let cls = 'slds-input__icon';
        if (this.isOperator)
            cls += ' sl-operator-button-icon';
        if (this.singleSelect)
            cls += ' sl-single-select-button-icon';
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
        let cls = 'slds-dropdown slds-dropdown_fluid';
        if (this.isFilter)
            cls += ' sl-dropdown-filter';
        if (this.isOperator)
            cls += ' sl-dropdown-operator';
        if (this.singleSelect)
            cls += ' sl-dropdown';
        return cls;
    }
    get inputSingleClass() {
        let cls = 'slds-input sl-single-input';
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
    // Search string in the input
    _searchString = '';
    // Toggle for open/close dropdown
    _isDropdownOpen = false;
    // Component focus flag
    _hasFocus = false;
    // Don't send blur event flag
    _cancelBlur = false;
    // Deferred render actions
    _mustFocusComp = false;
    _mustFocusInput = false;
    _mustScrollToIndex = false;

    // Execute UI updates that can only be executed if the component is rendered
    renderedCallback() {
        // Make listbox visible in Filters Panel if needed
        if (this.parent && this._isDropdownOpen && !this.isDatatableEditor) {
            const parentRect = this.parent.getBoundingClientRect();
            const listboxDiv = this.template.querySelector('.slds-listbox');
            const listboxRect = listboxDiv.getBoundingClientRect();
            if (listboxRect.bottom > parentRect.bottom)
                this.parent.scrollTop += listboxRect.bottom - parentRect.bottom;
        }
        if (this._mustFocusComp) {
            this.focus();
            this._mustFocusComp = false;
        } else if (this._mustFocusInput) {
            this.focusInput();
            this._mustFocusInput = false;
        }
        if (this._mustScrollToIndex) {
            this.scrollToIndex(this._focusIndex);
            this._mustScrollToIndex = false;
        }
    }

    setComponent() {
        const values = this._value ? this._value.split(';') : [];
        const compValue = [];
        const items = [];
        this._selectedItemsMap.clear();
        let index = 0;
        for (const option of this.options) {
            const selected = values.includes(option.value);
            const value = index + VALUE_SEP + option.value;
            const item = new slComboboxItem(value, option.label, selected, false, index++);
            if (selected)
                this._selectedItemsMap.set(value, item);
            items.push(item);
            compValue.push(value);
        }
        this._value = compValue.join(';');
        this._allItems = [...items];
        this.items = [...items];
        this.resetFocusIndex();
        this.focusFirstItem();
        this.refreshSelectedItems();
        this._canSet = true;
    }
    
    // Reset dropdown items when filter cleared
    resetItems() {
        let index = 0;
        const items = [];
        for (const item of this._allItems) {
            item.resetFormattedLabel();
            item.focused = false;
            item.index = index++;
            items.push(item);
        }
        this.items = [...items];
    }

    // Triggers dropdown refresh by updating items
    refreshItems() {
        this.items = [...this.items];
    }
    // Set selectedItems array from map
    refreshSelectedItems() {
        this.selectedItems = [...Array.from(this._selectedItemsMap.values())];
    }

    // BUTTON ACTIONS
    handleButtonClick(event) {
        event.stopPropagation();
        this.clearFilter();
        this.toggleDropdown();
    }

    // INPUT ACTIONS
    // For Single and Multi
    handleInput(event) {
        if (!this._isDropdownOpen)
            this.toggleDropdown();
        this.updateSearchString(event.target.value);
    }

    // Filter items for searchString
    updateSearchString(searchString) {
        this._searchString = searchString;
        const searchStringMatch = searchString ? searchString.toLowerCase() : '';
        this.resetFocusIndex();
        if (searchStringMatch.length > 0 ) {
            const items = [];
            let index = 0;
            for (const item of this._allItems) {
                if (item.label.toLowerCase().includes(searchStringMatch)) {
                    item.formatLabel(searchString);
                    item.focused = false;
                    item.index = index++;
                    items.push(item);
                }
            }
            this.items = [...items];
        } else
            this.resetItems();
        this.focusFirstItem();
    } 

    clearFilter() {
        if (this.showSingleSelectInput && this.inputElement.value) {
            this.inputElement.value = '';
            this.updateSearchString('');
        }
    }

    // Click on multiselect input
    handleInputMultiClick(event) {
        event.stopPropagation();
        this.toggleDropdown();
    }

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
        if (this.showSingleSelectInput)
            this._mustFocusInput = true;
    }

    // Keyboard accessibility for multi https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/
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
                    this.clearFilter();
                this.toggleDropdown();
            } else
                this.clearFilter();
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

    // Keyboard accessibility for single https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
    handleButtonKeyDown(event) {
        const key = this.normalizeKeyValue(event.key);
        if (this._isDropdownOpen) {
            // Enter: select focused item if any and dropdown is open; for singleSelect close dropdown (done in selectItem)
            if (key === 'Enter') {
                event.preventDefault();
                if (this.hasFocusedItem)
                    this.selectItemByIndex(this._focusIndex); 
            }
            // Arrow Down: if items in the list, select next item or go back to first item if last item
            else if (key === 'ArrowDown') {
                event.preventDefault();
                this.focusItemKeyboard(this._focusIndex + 1 < this.items.length ? this._focusIndex + 1 : 0);
            }
            // Arrow Up: if items in the list, select previous item or go back to last item if first item
            else if (key === 'ArrowUp') {
                event.preventDefault();
                this.focusItemKeyboard(this._focusIndex - 1 < 0 ? this.items.length - 1 : this._focusIndex - 1);
            }
            // Escape: close dropdwon and clear input
            else if (key === 'Escape') {
                event.preventDefault();
                this.toggleDropdown();
            }
            // Tab: close dropdown
            else if (key === 'Tab')  {
                this.toggleDropdown();
            }
        } else {
            // Enter, Arrow Down & Space: open dropdown
            if (key === 'Enter' || key === 'ArrowDown' || key === ' ') {
                event.preventDefault();
                this._cancelBlur = true;
                this.toggleDropdown();
            } else if (key === 'Home' || key === 'ArrowUp') {
                event.preventDefault();
                this._cancelBlur = true;
                this.focusFirstItem();
                this.toggleDropdown();
            } else if (key === 'End') {
                event.preventDefault();
                this._cancelBlur = true;
                this.focusLastItem();
                this.toggleDropdown();
            }

        }
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

    // Scroll dropdown to make item visible if needed
    scrollToIndex(index) {
        const itemDiv = this.template.querySelector('DIV [data-index="' + index +'"]');
        const listDiv = this.template.querySelector('.slds-listbox');
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

    // FOCUS/BLUR ACTIONS
    handleCompFocus(event) {
        if (!this.disabled) {
            this._hasFocus = true;
            this.dispatchEvent(new CustomEvent('focus'));
        }
    }

    handleInputMultiBlur(event) {
        if (this._cancelBlur && this.isDatatableEditor)
            return;
        // Blur if focus not on internal
        const isInternal = event.relatedTarget && event.relatedTarget.classList.contains('sl-internal');
        if (!isInternal) {
            this.blurComponent();
        }
    }

    handleButtonBlur(event) {
        if (this._cancelBlur)
            return;
        const isInput = event.relatedTarget && event.relatedTarget.classList.contains('sl-single-input');
        if (!isInput) {
            this.blurComponent();
        }
    }

    handleInputSingleBlur(event) {
        if (this._cancelBlur)
            return;
        // Close the dropdown if input lose focus and focused element is not list option
        const isButton = event.relatedTarget && event.relatedTarget.classList.contains('slds-input_faux');
        //this.showHelpMessageIfInvalid(); // Set required = true and uncomment for testing error state with empty values
        if (!isButton) {
            this.blurComponent();
        }
    }

    blurComponent() {
        if (this._isDropdownOpen)
            this.toggleDropdown();
        this.clearFilter();
        this._hasFocus = false;
        if (this.isDatatableEditor && this._cancelBlur)
            return;
        this.dispatchEvent(new CustomEvent('blur'));
    }
    // LIST ITEM
    handleItemClick(event) {
        this._cancelBlur = true;
        const index = parseInt(event.currentTarget.dataset.index);
        this.focusItemByIndex(index);
        this.selectItemByIndex(index);
        /*if (this.singleSelect)
            this.focus();
        else
            this.focusInput();*/
    }

    // SELECTION MANAGEMENT
    selectItemByIndex(index) {
        this.selectItem(this.items[index]);
    }

    selectItem(item) {
        let mustRefresh = false;
        if (this.multiSelect) {
            // Toggle selected state
            this.updateItemSelectState(item, !item.selected);
            mustRefresh = true;
        } else {
            // Single Select
            // - Don't update selection if item already selected
            // - If not already selected, unselect previous selection if any + select item
            if (!item.selected) {
                if (this.selectedItems.length > 0)
                    this.updateItemSelectState(this.selectedItems[0], false)
                // Select item
                this.updateItemSelectState(item, true)
                mustRefresh = true;
            }
        }
        // Refresh selected items after delete/set
        if (mustRefresh)
            this.refreshSelectedItems();
        if(this.singleSelect) {
            this.clearFilter();
            this.toggleDropdown();
            this.focus();
        } else {
            this.refreshItems();
            this.focusInput();
        }
        this._cancelBlur = false;
        // Update validity state
        this.showHelpMessageIfInvalid();
        const labels = [];
        for (const item of this._selectedItemsMap.values()) {
            labels.push(item.label);
        }
        this.dispatchEvent(
            new CustomEvent('change', { detail: { value: this.value, label: labels.join(';'), field: this.field }, })
        );
    }

    updateItemSelectState(item, flag) {
        if (flag)
            this._selectedItemsMap.set(item.value, item);
        else
            this._selectedItemsMap.delete(item.value);
        item.selected = flag;
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
    handleRemovePill(event) {
        const value = event.currentTarget.dataset.value;
        this._cancelBlur = true;
        this.selectItem(this._selectedItemsMap.get(value));
        this._cancelBlur = false;
        this.focusInput();
    }

    handleClearSelection(event) {
        const values = this._selectedItemsMap.values();
        for (const value of values) {
            this.selectItem(value);
        }
        this.focusInput();
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
        return  this.template.querySelector(this.multiSelect ? '.slds-combobox__input' : '.sl-single-input');
    }

    get compElement() {
        return this.template.querySelector(this.multiSelect ? '.slds-combobox__input' : '.align-button');
    }

    // FOCUS ELEMENTS
    focusInput() {
        this.inputElement?.focus();
    }
    @api focus() {
        this.compElement?.focus();
    }
}