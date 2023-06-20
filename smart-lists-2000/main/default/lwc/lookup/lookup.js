import { LightningElement, api } from 'lwc';
import getRecentRecords from '@salesforce/apex/SmartListController.lookupGetRecentRecords';
import searchRecords from '@salesforce/apex/SmartListController.lookupSearchRecords';

import labelLookupPlaceholder from '@salesforce/label/c.LookupPlaceholder';
import labelLookupRecent from '@salesforce/label/c.LookupRecent';
import labelLookupObjectSelector from '@salesforce/label/c.LookupObjectSelector';
import labelLookupNoResults from '@salesforce/label/c.LookupNoResults';
import labelLoading from '@salesforce/label/c.Loading';

const SEARCH_DELAY = 300; // Wait 300 ms after user stops typing then, peform search

const KEY_ARROW_UP = 38;
const KEY_ARROW_DOWN = 40;
const KEY_ENTER = 13;

const VARIANT_LABEL_STACKED = 'label-stacked';
const VARIANT_LABEL_INLINE = 'label-inline';
const VARIANT_LABEL_HIDDEN = 'label-hidden';
const REGEX_SOSL_RESERVED = /(\?|&|\||!|\{|\}|\[|\]|\(|\)|\^|~|\*|:|"|\+|-|\\)/g;
const REGEX_EXTRA_TRAP = /(\$|\\)/g;

export default class Lookup extends LightningElement {
    // Labels
    labels = {
        labelLookupPlaceholder,
        labelLookupRecent,
        labelLookupObjectSelector,
        labelLookupNoResults,
        labelLoading
    }
    // Public properties
    @api variant = VARIANT_LABEL_STACKED;
    @api objects = [];
    @api label = '';
    @api required = false;
    @api disabled = false;
    @api scrollAfterNItems = null;
    @api minSearchTermLength = 2;
    // Template properties
    searchResultsLocalState = [];
    loading = false;
    showDefaultResults = false;
    selectedObject = null;
    recentLabel = '';
    showObjectsSelector = false;
    objectSelectorDescriptiveText = '';
    placeholder = '';
    // Private properties
    _hasFocus = false;
    _isDirty = false;
    _searchTerm = '';
    _cleanSearchTerm;
    _cancelBlur = false;
    _searchThrottlingTimeout;
    _searchResults = [];
    _defaultSearchResults = [];
    _value = {};
    _focusedResultIndex = null;

    connectedCallback() {
        this.showObjectsSelector = this.objects.length > 1;
        this.selectedObject = this.objects[0];
        this.updateObjectSelection();
    }

    renderedCallback() {
        if (this.isListboxOpen) {
            const constainerRect = this.template.querySelector('.sl-container').getBoundingClientRect();
            const listbox = this.template.querySelector('.sl_listbox');
            const listboxRect = listbox.getBoundingClientRect();
            if (listboxRect.height >= constainerRect.height && constainerRect.bottom + listboxRect.height > document.documentElement.clientHeight)
                listbox.style.top = -(listboxRect.height + 4) + "px";
            else
                listbox.style.top = (constainerRect.height) + "px";
        }
    }

    // PUBLIC FUNCTIONS AND GETTERS/SETTERS
    @api get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        this.processSelectionUpdate(false);
    }

    @api
    setSearchResults(results, showDefaultResults) {
        // Reset the spinner
        this.loading = false;
        this.showDefaultResults = showDefaultResults;
        // Clone results before modifying them to avoid Locker restriction
        let resultsLocal = JSON.parse(JSON.stringify(results));
        // Format results
        const cleanSearchTerm = this._searchTerm.replace(REGEX_SOSL_RESERVED, '.?').replace(REGEX_EXTRA_TRAP, '\\$1');
        const regex = new RegExp(`(${cleanSearchTerm})`, 'gi');
        this._searchResults = resultsLocal.map((result) => {
            result.icon = this.selectedObject.iconName;
            // Format title and subtitle
            if (this._searchTerm.length > 0) {
                result.titleFormatted = result.title
                    ? result.title.replace(regex, '<strong>$1</strong>')
                    : result.title;
                result.subtitleFormatted = result.subtitle
                    ? result.subtitle.replace(regex, '<strong>$1</strong>')
                    : result.subtitle;
            } else {
                result.titleFormatted = result.title;
                result.subtitleFormatted = result.subtitle;
            }
            return result;
        });
        // Add local state and dynamic class to search results
        this._focusedResultIndex = null;
        const self = this;
        this.searchResultsLocalState = this._searchResults.map((result, i) => {
            return {
                result,
                state: {},
                get classes() {
                    let cls = 'slds-media slds-media_center slds-listbox__option slds-listbox__option_entity';
                    if (result.subtitleFormatted) {
                        cls += ' slds-listbox__option_has-meta';
                    }
                    if (self._focusedResultIndex === i) {
                        cls += ' slds-has-focus';
                    }
                    return cls;
                }
            };
        });
    }
    @api
    setDefaultResults(results) {
        const resultsObject = JSON.parse(results);
        this._defaultSearchResults = [...resultsObject];
        this.setSearchResults(this._defaultSearchResults, true);
    }
    @api
    blur() {
        this.template.querySelector('input')?.blur();
    }
    // INTERNAL FUNCTIONS
    updateSearchTerm(newSearchTerm) {
        this._searchTerm = newSearchTerm;
        // Compare clean new search term with current one and abort if identical
        const newCleanSearchTerm = newSearchTerm.trim().replace(REGEX_SOSL_RESERVED, '?').toLowerCase();
        if (this._cleanSearchTerm === newCleanSearchTerm) {
            return;
        }
        // Save clean search term
        this._cleanSearchTerm = newCleanSearchTerm;
        // Ignore search terms that are too small after removing special characters
        if (newCleanSearchTerm.replace(/\?/g, '').length < this.minSearchTermLength) {
            this.setSearchResults(this._defaultSearchResults, true);
            return;
        }
        // Apply search throttling (prevents search if user is still typing)
        if (this._searchThrottlingTimeout) {
            clearTimeout(this._searchThrottlingTimeout);
        }
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._searchThrottlingTimeout = setTimeout(() => {
            // Send search event if search term is long enougth
            if (this._cleanSearchTerm.length >= this.minSearchTermLength) {
                // Display spinner until results are returned
                this.loading = true;
                searchRecords({searchTerm : this._cleanSearchTerm, objectName: this.selectedObject.value, titleField: this.selectedObject.titleField, 
                    subtitleField: this.selectedObject.subtitleField})
                .then((result) => {
                    //console.log('Search Result ' + result);
                    this.setSearchResults(JSON.parse(result), false);
                })
                .catch((error) => {
                    console.log("Error " + JSON.stringify(error));
                });
            }
            this._searchThrottlingTimeout = null;
        }, SEARCH_DELAY);
    }
    isSelectionAllowed() {
        return !this.hasSelection();
    }
    hasSelection() {
        return this._value.id !== undefined;
    }
    processSelectionUpdate(isUserInteraction) {
        // Reset search
        this._cleanSearchTerm = '';
        this._searchTerm = '';
        this.setSearchResults([...this._defaultSearchResults], true);
        // Indicate that component was interacted with
        this._isDirty = isUserInteraction;
        // Blur input after single select lookup selection
        if (this.hasSelection()) {
            this._hasFocus = false;
        }
        // If selection was changed by user, notify parent components
        if (isUserInteraction) {
            this.dispatchEvent(new CustomEvent('selectionchange', { detail: this._value }));
        }
    }

    // EVENT HANDLING

    handleInput(event) {
        // Prevent action if selection is not allowed
        if (!this.isSelectionAllowed()) {
            return;
        }
        this.updateSearchTerm(event.target.value);
    }

    handleKeyDown(event) {
        if (this._focusedResultIndex === null) {
            this._focusedResultIndex = -1;
        }
        if (event.keyCode === KEY_ARROW_DOWN) {
            // If we hit 'down', select the next item, or cycle over.
            this._focusedResultIndex++;
            if (this._focusedResultIndex >= this._searchResults.length) {
                this._focusedResultIndex = 0;
            }
            event.preventDefault();
        } else if (event.keyCode === KEY_ARROW_UP) {
            // If we hit 'up', select the previous item, or cycle over.
            this._focusedResultIndex--;
            if (this._focusedResultIndex < 0) {
                this._focusedResultIndex = this._searchResults.length - 1;
            }
            event.preventDefault();
        } else if (event.keyCode === KEY_ENTER && this._hasFocus && this._focusedResultIndex >= 0) {
            // If the user presses enter, and the box is open, and we have used arrows,
            // treat this just like a click on the listbox item
            const selectedId = this._searchResults[this._focusedResultIndex].id;
            this.template.querySelector(`[data-recordid="${selectedId}"]`).click();
            event.preventDefault();
        }
    }

    handleResultClick(event) {
        const recordId = event.currentTarget.dataset.recordid;

        // Save selection
        const selectedItem = this._searchResults.find((result) => result.id === recordId);
        if (!selectedItem) {
            return;
        }
        this._value = selectedItem;

        // Process selection update
        this.processSelectionUpdate(true);
    }

    handleComboboxMouseDown(event) {
        const mainButton = 0;
        if (event.button === mainButton) {
            this._cancelBlur = true;
        }
    }

    handleComboboxMouseUp() {
        this._cancelBlur = false;
        // Re-focus to text input for the next blur event
        this.template.querySelector('input').focus();
    }

    handleFocus() {
        // Prevent action if selection is not allowed
        if (!this.isSelectionAllowed()) {
            return;
        }
        // Get default results if needed
        if (this._defaultSearchResults.length === 0 )
            this.getDefaultResults();
        this._hasFocus = true;
        this._focusedResultIndex = null;
    }

    handleBlur() {
        // Prevent action if selection is either not allowed or cancelled
        if (!this.isSelectionAllowed() || this._cancelBlur) {
            return;
        }
        this._hasFocus = false;
        if (!this.hasSelection())
            this.processSelectionUpdate(false);
    }

    // STYLE EXPRESSIONS
    get isListboxOpen() {
        const isSearchTermValid = this._cleanSearchTerm && this._cleanSearchTerm.length >= this.minSearchTermLength;
        return (
            this._hasFocus &&
            this.isSelectionAllowed() &&
            (isSearchTermValid || this.hasResults || this.newRecordOptions?.length > 0 || this.showDefaultResults)
        );
    }

    get hasResults() {
        return this._searchResults.length > 0;
    }

    get getFormElementClass() {
        return this.variant === VARIANT_LABEL_INLINE
            ? 'slds-form-element slds-form-element_horizontal'
            : 'slds-form-element';
    }

    get getLabelClass() {
        return this.variant === VARIANT_LABEL_HIDDEN
            ? 'slds-form-element__label slds-assistive-text'
            : 'slds-form-element__label';
    }

    get getContainerClass() {
        return 'sl-container slds-combobox_container';
    }

    get getDropdownClass() {
        let css = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ';
        if (this.isListboxOpen) {
            css += 'slds-is-open';
        }
        return css;
    }

    get getInputClass() {
        let css = 'slds-input slds-combobox__input has-custom-height ';
        if (this._hasFocus && this.hasResults) {
            css += 'slds-has-focus ';
        }
        if (this._isDirty && this.required && !this.hasSelection()) {
            css += 'has-custom-error ';
        }
        css += 'slds-combobox__input-value ' + (this.hasSelection() ? 'has-custom-border' : '');
        return css;
    }

    get getComboboxClass() {
        let css = 'slds-combobox__form-element slds-input-has-icon ';
        css += this.hasSelection() ? 'slds-input-has-icon_left-right' : 'slds-input-has-icon_right';
        return css;
    }

    get getSearchIconClass() {
        let css = 'slds-input__icon slds-input__icon_right ';
        css += this.hasSelection() ? 'slds-hide' : '';
        return css;
    }

    get getSelectIconName() {
        return this.hasSelection() ? this._value.icon : 'standard:default';
    }

    get getSelectIconClass() {
        return 'slds-combobox__input-entity-icon ' + (this.hasSelection() ? '' : 'slds-hide');
    }

    get getInputValue() {
        return this.hasSelection() ? this._value.title : this._searchTerm;
    }

    get getInputTitle() {
        return this.hasSelection() ? this._value.title : '';
    }

    get getListboxClass() {
        return (
            'sl_listbox slds-dropdown ' +
            (this.scrollAfterNItems ? `slds-dropdown_length-with-icon-${this.scrollAfterNItems} ` : '') +
            'slds-dropdown_fluid'
        );
    }

    get isInputReadonly() {
        return this.hasSelection();
    }

    // Object selection
    handleSelectObject(event) {
        for (const obj of this.objects) {
            if (obj.value === event.detail.value) {
                this.selectedObject = obj;
                break;
            }
        }
        this._defaultSearchResults = [];
        this.updateObjectSelection();
    }

    updateObjectSelection() {
        this._value = {};
        this.placeholder = this.labels.labelLookupPlaceholder.replace("{0}", this.selectedObject.label);
        this.recentLabel = this.labels.labelLookupRecent.replace("{0}", this.selectedObject.label);
        this.objectSelectorDescriptiveText = this.labels.labelLookupObjectSelector.replace("{0}", this.selectedObject.label);
    }

    getDefaultResults() {
        this.loading = true;
        getRecentRecords({ objectName: this.selectedObject.value, subtitleField: this.selectedObject.subtitleField })
            .then((result) => {
                this.setDefaultResults(result);
                this._searchTerm = '';
            })
            .catch((error) => {
                console.log("Error " + JSON.stringify(error));
            })
            .finally(() => {
                this.loading = false;
            });
    }

    // 
}