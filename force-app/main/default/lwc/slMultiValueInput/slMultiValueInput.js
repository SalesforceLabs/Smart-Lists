import { LightningElement, api } from 'lwc';

import labelAddValue from "@salesforce/label/c.AddValue";
import labelRemove from "@salesforce/label/c.Remove";

export default class SlMultiValueInput extends LightningElement {
    // COMPONENT PROPERTIES
    @api inputType = 'text';
    @api get value() {
        const vals = [];
        for (const item of this.selectedItems) {
            vals.push(item.value);
        };
        return vals;
    }
    set value(val) {
        const vals = []
        if (val && val.length > 0) {
            for (const item of val) {
                vals.push({ value: item });
            };
        }
        this.selectedItems = [...vals];
        this.inputValue = '';
    }

    // LABELS
    labels = {
        labelAddValue,
        labelRemove,
    };

    // UI VARIABLES
    inputValue = '';
    get addValueDisabled() {
        return !this.inputValue;
    } 

    // Selected items for pills
    selectedItems = [];
    get hasSelectedItems() {
        return this.selectedItems && this.selectedItems.length > 0;
    }

    get showPills() {
        return this.hasSelectedItems;
    }

    // INPUT ACTIONS
    handleInput(event) {
        event.stopPropagation();
        this.inputValue = event.target.value;
    }

    focusInput() {
        this.template.querySelector('.slds-input').focus();
    }

    // Keyboard accessibility
    handleInputKeyDown(event) {
        // Enter: add input value if not null
        if (event.key === 'Enter') {
            event.preventDefault();
            if ( !this.addValueDisabled)
                this.handleClickAddValue();
        }
    }

    handleClickAddValue() {
        this.selectedItems.push({value: this.inputValue});
        this.selectedItems = [...this.selectedItems];
        this.inputValue = '';
        this.focusInput();
        this.dispatchEvent(
            new CustomEvent('change', { detail: { value: this.value } })
        );
    }

    handleRemovePill(event) {
        const value = event.currentTarget.dataset.value;
        const items = [];
        for (const item of this.selectedItems) {
            if (item.value !== value)
                items.push(item);
        };
        this.selectedItems = [...items];
        this.focusInput();
        this.dispatchEvent(
            new CustomEvent('change', { detail: { value: this.value } })
        );
   }
}