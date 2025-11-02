export const FieldTypes = {
    BOOLEAN: 'BOOLEAN',
    CLICK2DIAL: 'CLICK2DIAL',
    CURRENCY: 'CURRENCY',
    CURRENCY_CONVERTED: 'CURRENCY_CONVERTED',
    CURRENCY_FORMATTED: 'CURRENCY_FORMATTED',
    DATE: 'DATE',
    DATETIME: 'DATETIME',
    EMAIL: 'EMAIL',
    HTML: 'HTML',
    LOCATION: 'LOCATION',
    LONG_TEXTAREA: 'LONG_TEXTAREA',
    LOOKUP: 'LOOKUP',
    MULTIPICKLIST: 'MULTIPICKLIST',
    NUMBER: 'NUMBER',
    PERCENT: 'PERCENT',
    PHONE: 'PHONE',
    PICKLIST: 'PICKLIST',
    RICH_TEXT: 'RICH_TEXT',
    TEXT: 'TEXT',
    TEXTAREA: 'TEXTAREA',
    TIME: 'TIME',
    URL: 'URL',
    URL_LABEL: 'URL_LABEL',
    HYPERLINK_DETAIL: 'HYPERLINK_DETAIL',
    FILE_PREVIEW: 'FILE_PREVIEW'
};


// Returns SmartList field type from the Apex display type
export function getTypeFromApexDisplayType(displayType) {
    switch (displayType) {
        case 'DECIMAL':
        case 'DOUBLE':
        case 'INTEGER':
        case 'LONG':
        case 'NUMBER':
            return 'NUMBER';
        case 'BOOLEAN':
        case 'CLICK2DIAL':
        case 'CURRENCY':
        case 'DATE':
        case 'DATETIME':
        case 'EMAIL':
        case 'HTML':
        case 'LOCATION':
        case 'LONG_TEXTAREA':
        case 'LOOKUP':
        case 'MULTIPICKLIST':
        case 'PERCENT':
        case 'PHONE':
        case 'PICKLIST':
        case 'RICH_TEXT':
        case 'TEXTAREA':
        case 'TIME':
        case 'URL_LABEL':
            return displayType;
        default:
            return 'TEXT';
    }
}

export class Datatype {
    _type;

    constructor(type) {
        this._type = type;
    }

    get type() {
        return this._type;
    }

    get isBoolean() {
        return this._type === FieldTypes.BOOLEAN;
    }
    get isClick2Dial() {
        return this._type === FieldTypes.CLICK2DIAL;
    }
    get isCurrency() {
        return this._type === FieldTypes.CURRENCY;
    }
    get isCurrencyConverted() {
        return this._type === FieldTypes.CURRENCY_CONVERTED;
    }
    get isDate() {
         return this._type === FieldTypes.DATE;
    }
    get isDateTime() {
        return this._type === FieldTypes.DATETIME;
    
    }
    get isEmail() {
        return this._type === FieldTypes.EMAIL;
    }
    get isHtml() {
        return this._type === FieldTypes.HTML;
    }
    get isLabelledUrl() {
        return this._type === FieldTypes.URL_LABEL;
    }
    get isLocation() {
        return this._type === FieldTypes.LOCATION;
    }
    get isLongTextArea() {
        return this._type === FieldTypes.LONG_TEXTAREA;
    }
    get isLookup() {
        return this._type === FieldTypes.LOOKUP;
    }
    get isMultiPicklist() {
        return this._type === FieldTypes.MULTIPICKLIST;
    }
    get isNumber() {
        return this._type === FieldTypes.NUMBER;
    }
    get isPercent() {
        return this._type === FieldTypes.PERCENT;
    }
    get isPhone() {
        return this._type === FieldTypes.PHONE;
    }
    get isPicklist() {
        return this._type === FieldTypes.PICKLIST;
    }
    get isRichText() {
        return this._type === FieldTypes.RICH_TEXT;
    }
    get isText() {
        return this._type === FieldTypes.TEXT;
    }
    get isTextArea() {
        return this._type === FieldTypes.TEXTAREA;
    }
    get isTime() {
        return this._type === FieldTypes.TIME;
    }
    get isUrl() {
        return this._type === FieldTypes.URL;
    }
    get isUrlLabel() {
        return this._type === FieldTypes.URL_LABEL;
    }

    get isNumberInputType() {
        return this.isCurrency || this.isNumber;
    }

    get isTextAreaTypes() {
        return this.isLongTextArea || this.isTextArea;
    }
    get isNonTextType() {
        return this.isBoolean || this.isHtml || this.isRichText;
    }
    get isFilterTextType() {
        return this.isClick2Dial || this.isEmail || this.isPhone || this.isText || this.isUrl;
    }
    get isFilterPicklistType() {
        return this.isMultiPicklist || this.isPicklist;
    }
    get isFilterDateType() {
        return this.isDate || this.isDateTime;
    }
    get isFilterNumberType() {
        return this.isCurrency || this.isNumber || this.isPercent;
    }
    get isFilterRangeType() {
        return this.isFilterDateType || this.isTime || this.isFilterNumberType;
    }

    get inputType() {
        if (this.isCurrency || this.isNumber || this.isPercent)
            return "number";
        else if (this.isDate)
            return "date";
        else if (this.isDateTime)
            return "datetime";
        else if (this.isEmail)
            return "email";
        else if (this.isClick2Dial || this.isPhone)
            return "tel";
        else if (this.isTime)
            return "time";
        else
            return "text";
    }

    get filterInputType() {
        if (this.isFilterNumberType)
            return "number";
        else if (this.isFilterDateType)
            return "date";
        else if (this.isTime)
            return "time";
        else
            return "text";
    }
}