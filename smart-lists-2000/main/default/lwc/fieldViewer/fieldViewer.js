import { LightningElement, api } from 'lwc';

import {
    FieldTypes
} from 'c/datatypeUtils';

export default class FieldViewer extends LightningElement {
    // COMPONENT PROPERTIES
    _value;
    @api get value() {
        let val = this._value;
        if ((this.isTextAreaTypes || this.isLongTextArea) && val && !this.wrapText) {
            if (!this.isTooltip)
                val = val.replace(/\n/g, " ");
            if (val.length > 500)
                val = val.slice(0, 500) + "...";
        } else if (this.isPercent && val)
            val = val / 100;
        else if (this.isLocation && !val)
            val = { latitude: null, longitude: null };
        else if (this.iconPosition === this.IconPositionType.HIDEVALUE) // Hack for icon not updated when no value is displayed
            val = null;
        return val;
    }
    set value(val) {
        this._value = val;
    }
    _typeData;
    @api get typeData() {
        return this._typeData;
    }
    set typeData(val) {
        this._typeData = val;
        // Set data for tooltip which is passed after connectedCallback
        if (this.rendered)
            this.setTypeData();
    }
    @api url;
    _fieldStyle;
    @api get fieldStyle() {
        return this._fieldStyle;
    }
    set fieldStyle(val) {
            this._fieldStyle = val;
            // Reset styles values in case of field value update
            this.textColor = '';
            this.focusedLinkColor = '';
            this.iconName = '';
            this.iconColor = '';
            this.iconPosition = '';
            // Update style data after value updated in table
            if (this.rendered && this.hasStyle) {
                this.parseFieldStyle();
                this.setFieldStyle();
            }
    }
    @api context;
    @api wrapText;

    // COMPONENT CONSTANTS
    ContextType = {
        CELL: 'cell',
        TILE: 'tile',
        TOOLTIP: 'tooltip'
    }
    CellAlignmentType = {
        LEFT: 'left',
        RIGHT: 'right',
        CENTER: 'center'
    }
    IconPositionType = {
        LEFT: 'left',
        RIGHT: 'right',
        HIDEVALUE: 'hidevalue'
    }
    StyleTag = {
        TEXT_COLOR: 'tc:',
        FOCUSED_LINK_COLOR: 'flc:',
        ICON_NAME: 'icn:',
        ICON_COLOR: 'icc:',
        ICON_POSITION: 'icp:'
    }

    // COMPONENT VARIABLES
    rendered = false;
    get isTooltip() {
        return this.context === this.ContextType.TOOLTIP;
    }
    get isCell() {
        return this.context === this.ContextType.CELL;
    }
    get linkify() {
        return !this.isTooltip;
    }
    get compClass() {
        return this.isTooltip ? "" : "sl-comp";
    }
    get viewerClass() {
        return this.wrapText ? "sl-viewer sl-viewer-wrap" : "sl-viewer sl-viewer-clip";
    }
    _icon;
    get icon() {
        if (!this._icon)
            this._icon = this.template.querySelector('.sl-icon');
        return this._icon;
    }
    _viewer;
    get viewer() {
        if (!this._viewer)
            this._viewer = this.template.querySelector('.sl-viewer');
        return this._viewer;
    }
    get outputClass() {
        return this.isCell ? "sl-output sl-output-cell" : this.isTooltip ? "sl-output" : "sl-output sl-output-tile slds-hyphenate";
    }
    _output;
    get output() {
        if (!this._output)
            this._output = this.template.querySelector(".sl-output");
        return this._output;
    }
    displayType;
    fractionDigit;
    currencyCode;
    target;
    alignment;
    showTooltip = false;
    get isBoolean() {
        return this.displayType === FieldTypes.BOOLEAN;
    }
    get isCurrency() {
        return this.displayType === FieldTypes.CURRENCY;
    }
    get isDate() {
        return this.displayType === FieldTypes.DATE;
    }
    get isDateTime() {
        return this.displayType === FieldTypes.DATETIME;
    }
    get isEmail() {
        return this.displayType === FieldTypes.EMAIL && !this.isTooltip;
    }
    get isHtml() {
        return this.displayType === FieldTypes.HTML;
    }
    get isLabelledUrl() {
        return (this.displayType === FieldTypes.URL_LABEL) && this.url && !this.isTooltip;
    }
    get isLocation() {
        return this.displayType === FieldTypes.LOCATION;
    }
    get isNumber() {
        return this.displayType === FieldTypes.NUMBER;
    }
    get isPercent() {
        return this.displayType === FieldTypes.PERCENT;
    }
    get isPhone() {
        return this.displayType === FieldTypes.PHONE && !this.isTooltip;
    }
    get isRichText() {
        return this.displayType === FieldTypes.RICH_TEXT;
    }
    get isText() {
        return this.displayType === FieldTypes.TEXT || this.isTextAreaTypes || this.displayType === FieldTypes.PICKLIST ||
            this.displayType === FieldTypes.MULTIPICKLIST ||
            (this.displayType === FieldTypes.URL_LABEL && !this.isLabelledUrl) ||
            (this.displayType === FieldTypes.EMAIL && !this.isEmail) ||
            (this.displayType === FieldTypes.PHONE && !this.isPhone);
    }
    get isTextAreaTypes() {
        return this.displayType === FieldTypes.TEXTAREA || this.displayType === FieldTypes.LONG_TEXTAREA;
    }
    get isTime() {
        return this.displayType === FieldTypes.TIME;
    }
    // Can style viewer
    get hasStyle() {
        return !this.isTooltip && !this.isBoolean && !this.isHtml && !this.isRichText;
    }
    // Can display icon
    get hasIcon() {
        return this.iconName && this.hasStyle;
    }
    get iconLeft() {
        return this.hasIcon && (this.iconPosition === this.IconPositionType.LEFT || (this.iconPosition === this.IconPositionType.HIDEVALUE));
    }
    get iconRight() {
        return this.hasIcon && this.iconPosition === this.IconPositionType.RIGHT;
    }

    @api get hasEllipsis() {
        const horz = this.template.querySelector('.sl-horz').getBoundingClientRect();
        const vert = this.template.querySelector('.sl-vert').getBoundingClientRect();
        const comp = this.iconPosition === this.IconPositionType.HIDEVALUE ? this.icon : this.viewer;
        const compRect = comp.getBoundingClientRect();
        if (this.iconPosition === this.IconPositionType.HIDEVALUE || compRect.width > horz.width || compRect.height > vert.height) {
            const rect = {};
            rect.left = compRect.left;
            rect.top = compRect.top;
            rect.width = horz.width;
            rect.height = vert.height;
            return rect;
        }
        else
            return null;
    }

    // Set types variables from typeData (needed for tooltip instantiated with no value)        
    setTypeData() {
        this.displayType = this.typeData.displayType;
        this.fractionDigits = this.typeData.fractionDigits;
        this.currencyCode = this.typeData.currencyCode;
        this.target = this.typeData.target;
        this.alignment = this.typeData.alignment;
    }

    // Parse dynamic style
    parseFieldStyle() {
        // Set default icon position to cell alignment
        this.iconPosition = this.alignment === this.CellAlignmentType.RIGHT ? this.CellAlignmentType.RIGHT : this.CellAlignmentType.LEFT;
        // Parse cell style
        const styles = this.fieldStyle.split(";");
        for (const style of styles) {
            // Text color
            if (style.startsWith(this.StyleTag.TEXT_COLOR))
                this.textColor = style.replace(this.StyleTag.TEXT_COLOR, '');
            // Focused link color
            else if (style.startsWith(this.StyleTag.FOCUSED_LINK_COLOR))
                this.focusedLinkColor = style.replace(this.StyleTag.FOCUSED_LINK_COLOR, '');
            // Icon color
            else if (style.startsWith(this.StyleTag.ICON_COLOR))
                this.iconColor = style.replace(this.StyleTag.ICON_COLOR, '');
            // Icon position
            else if (style.startsWith(this.StyleTag.ICON_POSITION))
                this.iconPosition = style.replace(this.StyleTag.ICON_POSITION, '');
            // Icon name
            else if (style.startsWith(this.StyleTag.ICON_NAME))
                this.iconName = style.replace(this.StyleTag.ICON_NAME, '');
        }
    }

    // Set dynamic style
    setFieldStyle() {
        const o = this.output;
        const v = this.viewer;
        if (this.textColor) {
            v.style.color = this.textColor;
            v.style.setProperty("--lwc-brandTextLink", this.textColor);
            v.style.setProperty("--lwc-brandTextLinkActive", this.textColor);
            v.style.setProperty("--lwc-colorTextLinkActive", this.textColor);
            v.style.setProperty("--slds-g-link-color-focus", this.textColor);
        }
        if (this.focusedLinkColor) {
            v.style.setProperty("--lwc-brandTextLinkActive", this.focusedLinkColor);
            v.style.setProperty("--lwc-colorTextLinkActive", this.focusedLinkColor);
            v.style.setProperty("--slds-g-link-color-focus", this.focusedLinkColor);
        }
        if (this.iconColor) {
            o.style.setProperty("--slds-c-icon-color-foreground", this.iconColor);
            o.style.setProperty("--slds-c-icon-color-foreground-default", this.iconColor);
        }
    }

    connectedCallback() {
        /*console.log('fieldViewer connectedCallback');
        console.log('   value: ' + this.value);
        console.log('   typeData: ' + JSON.stringify(this.typeData));
        console.log('   url: ' + this.url);
        console.log('   fieldStyle: ' + this.fieldStyle);
        console.log('   context: ' + this.context);*/
        if (this.typeData)
            this.setTypeData();
        // Must read icon in connectedCallback because otherwise it won't be rendered
        if (this.fieldStyle && this.hasStyle)
            this.parseFieldStyle();
    }

    // Apply style if rendered for the 1st time
    renderedCallback() {
        if (!this.rendered) {
            if (this.hasStyle && this.fieldStyle)
                    this.setFieldStyle();
            this.rendered = true;
        }
    }

    // Display tooltip if needed on mouse enter: send event to recordViewer
    handleMouseEnter() {
        if (!this.isCell || this.showTooltip || (!this.value && this.iconPosition !== this.IconPositionType.HIDEVALUE) || this.isBoolean || this.isHtml || this.isRichText)
            return;
        const cellRect = this.hasEllipsis;
        if (cellRect) {
            this.showTooltip = true;
            const detail = {
                show: true, value: this.iconPosition === this.IconPositionType.HIDEVALUE ? this._value : this.value, typeData: this.typeData, cellRect: cellRect
            };
            this.dispatchEvent(new CustomEvent('tooltip', {
                composed: true,
                bubbles: true,
                cancelable: true,
                detail: detail
            }));
        }
    }

    // Hide tooltip if needed: send event to recordViewer
    handleMouseLeave() {
        if (this.showTooltip) {
            this.showTooltip = false;
            const detail = { show: false };
            this.dispatchEvent(new CustomEvent('tooltip', {
                composed: true,
                bubbles: true,
                cancelable: true,
                detail: detail
            }));
        }
    }
}