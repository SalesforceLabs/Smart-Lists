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
        if (this.show) {
            this.setTooltip();
        }
    }

    setTooltip() {
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const cellY = this.cellRect.top - this.containerRect.top;
        const cellX = this.cellRect.left - this.containerRect.left;
        const cellWidth = this.cellRect.width;
        let y;
        let x;
        let nubbinTop;
        let nubbinLeft;
        if (cellY + this.cellRect.height + tooltipRect.height + 12 > this.containerRect.bottom - this.containerRect.top) {
            y = cellY - tooltipRect.height - 12; // 12: 4 margin top + 8 nubbin;
            nubbinTop = false;
        } else {
            y = cellY + this.cellRect.height + 12;  // 12: 4 margin bottom + 8 nubbin
            nubbinTop = true;
        }
        if (cellX + tooltipRect.width <= this.containerRect.right - this.containerRect.left) {
            x = cellX;
            nubbinLeft = true;
        } else {
            x = Math.min(cellX + cellWidth - tooltipRect.width, this.containerRect.right - this.containerRect.left - tooltipRect.width);
            nubbinLeft = false;
        }
        this.tooltip.style.top = y + 'px';
        this.nubbinTop = nubbinTop;
        this.tooltip.style.left = x + 'px';
        this.nubbinLeft = nubbinLeft;
    }
}