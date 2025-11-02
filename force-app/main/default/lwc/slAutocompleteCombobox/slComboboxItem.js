export class slComboboxItem {
    constructor(value, label, selected, focused, index) {
        this.value = value;
        this.label = label;
        this.formattedLabel = label;
        this.selected = selected;
        this.focused = focused;
        this.index = index;
    }

    value;
    label
    formattedLabel;
    selected = false;
    focused = false;
    index;
    get classes() {
        let cls = 'sl-prevent-select sl-internal slds-media slds-listbox__option slds-listbox__option_plain slds-media_small';
        if (this.selected)
            cls += ' slds-is-selected';
        if (this.focused)
            cls +=  ' slds-has-focus';
        return cls;
    }

    formatLabel(searchString) {
        const regex = new RegExp(`(${searchString})`, 'gi');
        this.formattedLabel = this.label.replace(regex, '<mark>$1</mark>');
    }

    resetFormattedLabel() {
        this.formattedLabel = this.label;
    }
}