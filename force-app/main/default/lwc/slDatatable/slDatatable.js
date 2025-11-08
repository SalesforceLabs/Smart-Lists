import LightningDatatable from "lightning/datatable";
import { api } from "lwc";
import cellDataType from "./cellDataType.html";
import cellEditDataType from "./cellEditDataType.html";

export default class SlDatatable extends LightningDatatable {
    static customTypes = {
        // custom type definition
        cell: {
            template: cellDataType,
            editTemplate: cellEditDataType,
            standardCellLayout: true,
            typeAttributes: [
                "type",
                "fieldStyle",
                "url",
                "currencyCode",
                "recordId",
                "relatedRecordId",
                "recordTypeId",
            ],
        },
    };

    scrollableContainerY;
    scrollableContainerX;
    @api get rowHeight1() {
        const row = this.template.querySelector('table tbody tr:nth-child(1)');
        let height;
        if (row)
            height = parseFloat(getComputedStyle(row).getPropertyValue('height'));
        return height;
    }
    @api get rowHeight2() {
        const row = this.template.querySelector('table tbody tr:nth-child(2)');
        let height;
        if (row)
            height = parseFloat(getComputedStyle(row).getPropertyValue('height'));
        return height;
    }
    @api get headerHeight() {
        const header = this.template.querySelector(".slds-cell-fixed");
        let height;
        if (header)
            height = header.scrollHeight; // scrollheight returns the right value when the header label is wrapped
        return height;
    }

    @api get scrollbarWidth() {
        return this.scrollableContainerX.scrollWidth - this.scrollableContainerX.clientWidth;
    }
    @api get scrollbarHeight() {
        return this.scrollableContainerY.scrollHeight - this.scrollableContainerY.clientHeight;
    }

    renderedCallback() {
        super.renderedCallback();
        if (!this.scrollableContainerY) {
            this.scrollableContainerY = this.template.querySelector('.slds-scrollable_y');
            this.scrollableContainerX = this.template.querySelector('.slds-scrollable_x');
        }
    }

    @api scrollTo(startRec) {
        const row = this.template.querySelector(`[data-row-number="${startRec}"]`);
        const parentRect = this.scrollableContainerY.getBoundingClientRect();
        const findMeRect = row.getBoundingClientRect();
        if (findMeRect.top < parentRect.top) {
            if (findMeRect.top + findMeRect.height < parentRect.height) {
                // If element fits by scrolling to the top, then do that
                this.scrollableContainerY.scrollTop = 0;
            } else {
                // Otherwise, top align the element
                this.scrollableContainerY.scrollTop = row.offsetTop;
            }
        } else if (findMeRect.bottom > parentRect.bottom) {
            // bottom align the element
            this.scrollableContainerY.scrollTop += findMeRect.bottom - parentRect.bottom;
        }
    }
}