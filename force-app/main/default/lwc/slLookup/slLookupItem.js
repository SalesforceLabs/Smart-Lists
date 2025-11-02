export class slLookupItem {
    constructor(id, title, subtitle, selected, focused, iconName, index) {
        this.id = id;
        this.title = title;
        this.formattedTitle = title;
        this.subtitle = subtitle;
        this.formattedSubtitle = subtitle;
        this.selected = selected;
        this.focused = focused;
        this.iconName = iconName;
        this.index = index;
    }

    id;
    title
    formattedTitle;
    subtitle;
    formattedSubtitle
    selected = false;
    focused = false;
    iconName;
    index;
    get classes() {
        // slds-media slds-listbox__option slds-listbox__option_entity slds-listbox__option_has-meta
        let cls = 'sl-prevent-select sl-internal slds-media slds-listbox__option slds-listbox__option_plain slds-media_small';
        if (this.selected)
            cls += ' slds-is-selected';
        if (this.subtitle) {
            cls += ' slds-listbox__option_has-meta';
        }
        if (this.focused)
            cls +=  ' slds-has-focus';
        return cls;
    }

    formatLabels(searchString) {
        const regex = new RegExp(`(${searchString})`, 'gi');
        this.formattedTitle = this.title.replace(regex, '<mark>$1</mark>');
        this.formattedSubtitle = this.subtitle ? this.subtitle.replace(regex, '<mark>$1</mark>') : null;
    }

    resetFormattedLabels() {
        this.formattedTitle = this.title;
        this.formattedSubtitle = this.subtitle;
    }
}