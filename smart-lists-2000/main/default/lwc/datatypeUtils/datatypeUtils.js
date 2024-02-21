export const FieldTypes = {
    BOOLEAN: 'BOOLEAN',
    CURRENCY: 'CURRENCY',
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