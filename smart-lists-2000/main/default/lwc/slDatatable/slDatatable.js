import LightningDatatable from "lightning/datatable";
import richTextDataType from "./richTextDataType.html";
import labeledUrlDataType from "./labeledUrlDataType.html";
import labeledUrlEditDataType from "./labeledUrlEditDataType.html";
import picklistDataType from "./picklistDataType.html";
import picklistEditDataType from "./picklistEditDataType.html";
import textDataType from "./textDataType.html";
import textEditDataType from "./textEditDataType.html";
import otherDataType from "./otherDataType.html";
import otherEditDataType from "./otherEditDataType.html";
import css from "@salesforce/resourceUrl/SmartList";
import { loadStyle } from "lightning/platformResourceLoader";

export default class SlDatatable extends LightningDatatable {
    static customTypes = {
        // custom type definition
        richtext: {
            template: richTextDataType,
            standardCellLayout: true,
        },
        labeledurl: {
            template: labeledUrlDataType,
            editTemplate: labeledUrlEditDataType,
            standardCellLayout: true,
            typeAttributes: ["isLookup", "url", "max", "required", "target", "fieldName", "objectName", "objectIcon", "objectLabel",
                "titleField", "subtitleField", "recordId", "targetField", "relatedRecordId"]
        },
        picklist: {
            template: picklistDataType,
            editTemplate: picklistEditDataType,
            standardCellLayout: true,
            typeAttributes: ["objectName", "recordTypeId", "fieldName", "required", "recordId"]
        },
        txt: {
            template: textDataType,
            editTemplate: textEditDataType,
            standardCellLayout: true,
            typeAttributes: ["isText", "isPhone", "isEmail", "isTextArea", "required"]
        },
        other: {
            template: otherDataType,
            editTemplate: otherEditDataType,
            standardCellLayout: true,
            typeAttributes: ["isDate", "isDateTime", "isTime", "isNumber", "fractionDigits", "isCurrency", "currencyCode", "isPercent", "required"]
        }
    };

    constructor() {
        super();
        Promise.all([loadStyle(this, css)]).catch((error) => {
            console.error("Error loading datatable css", error);
        });
    }
}