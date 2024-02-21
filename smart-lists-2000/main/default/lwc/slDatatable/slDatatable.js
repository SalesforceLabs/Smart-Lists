import LightningDatatable from "lightning/datatable";
import cellDataType from "./cellDataType.html";
import cellEditDataType from "./cellEditDataType.html";

export default class SlDatatable extends LightningDatatable {
    static customTypes = {
        // custom type definition
        cell: {
            template: cellDataType,
            editTemplate: cellEditDataType,
            standardCellLayout: true,
            typeAttributes: ["type", "fieldStyle", "url", "recordId", "relatedRecordId", "recordTypeId"]
        }
    };
}