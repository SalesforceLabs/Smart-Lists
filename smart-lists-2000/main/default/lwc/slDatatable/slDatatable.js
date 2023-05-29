import { api } from "lwc";
import LightningDatatable from "lightning/datatable";
import richTextDataType from "./richTextDataType.html";
import css from "@salesforce/resourceUrl/SmartList";
import { loadStyle } from "lightning/platformResourceLoader";

export default class SlDatatable extends LightningDatatable {
    static customTypes = {
        // custom type definition
        richtext: {
            template: richTextDataType,
            standardCellLayout: true,
        }
    };

    constructor() {
        super();
        Promise.all([loadStyle(this, css)]).catch((error) => {
            console.error("Error loading datatable css", error);
        });
    }
}