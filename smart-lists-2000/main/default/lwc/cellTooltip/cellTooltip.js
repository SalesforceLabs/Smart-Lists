import { LightningElement, api } from 'lwc';

export default class CellTooltip extends LightningElement {
    @api value;
    @api typeData;
    @api cellRect;
    @api containerRect;
    @api show; // Used for triggering renderedCallback if previous tooltip with same value
    url;
    target;
    nubbinTop;
    nubbinLeft;
    get tooltipClass() {
        return "sl-tooltip slds-popover slds-popover_tooltip slds-nubbin_" + (this.nubbinTop ? "top-" : "bottom-") + (this.nubbinLeft ? "left" : "right");
    }
    _tooltip;
    get tooltip() {
        if (!this._tooltip)
            this._tooltip = this.template.querySelector(".sl-tooltip");
        return this._tooltip;
    }

    renderedCallback() {
        if (this.show && !this.showing) {
            // Workaround for large tooltip not yet redrawn when renderedCallback is triggered
            if ((this.typeData.type === 'TEXT' || this.typeData.type === 'TEXTAREA' || this.typeData.type === 'LONG_TEXTAREA'  || 
                this.typeData.type === 'EMAIL'  || this.typeData.type === 'URL' || this.typeData.type === 'URL_LABEL') && this.value.length > 50) {
                setTimeout(() => {
                    this.setTooltip();
                }, 150);
            } else
                this.setTooltip();
        }
    }

    setTooltip() {
        const tooltipRect = this.tooltip.getBoundingClientRect();
        let deltaY = this.cellRect.top - this.containerRect.top;
        let y;
        let x;
        let nubbinTop;
        let nubbinLeft;
        if (this.cellRect.top + this.cellRect.height + tooltipRect.height + 8 > this.containerRect.bottom) {
            y = deltaY - tooltipRect.height + 90;
            nubbinTop = false;
        } else {
            y = deltaY + this.cellRect.height + 110;
            nubbinTop = true;
        }
        if (this.cellRect.left + tooltipRect.width + 20 <= this.containerRect.right) {
            x = this.cellRect.left - 20;
            nubbinLeft = true;
        } else {
            x = this.cellRect.left + this.cellRect.width - tooltipRect.width - 8;
            nubbinLeft = false;
        }
        this.tooltip.style.top = y + "px";
        this.nubbinTop = nubbinTop;
        this.tooltip.style.left = x + "px";
        this.nubbinLeft = nubbinLeft;
    }
}