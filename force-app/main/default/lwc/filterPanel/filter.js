import labelFilterRangeMinLabel from "@salesforce/label/c.FilterRangeMinLabel";
import labelFilterRangeMaxLabel from "@salesforce/label/c.FilterRangeMaxLabel";
import labelFilterRangeStartLabel from "@salesforce/label/c.FilterRangeStartLabel";
import labelFilterRangeEndLabel from "@salesforce/label/c.FilterRangeEndLabel";
import labelFilterSOSLSearchRecord from "@salesforce/label/c.FilterSOSLSearchRecord";
import labelFilterSOSLSearchFileContent from "@salesforce/label/c.FilterSOSLSearchFileContent";
import labelOperatorIn from "@salesforce/label/c.OperatorIn";
import labelOperatorNotIn from "@salesforce/label/c.OperatorNotIn";
import labelOperatorIsNull from "@salesforce/label/c.OperatorIsNull";
import labelOperatorIsNotNull from "@salesforce/label/c.OperatorIsNotNull";
import labelOperatorBetween from "@salesforce/label/c.OperatorBetween";
import labelOperatorContains from "@salesforce/label/c.OperatorContains";
import labelOperatorDoesNotContain from "@salesforce/label/c.OperatorDoesNotContain";
import labelOperatorStartsWith from "@salesforce/label/c.OperatorStartsWith";
import labelOperatorEquals from "@salesforce/label/c.OperatorEquals";
import labelOperatorNotEqualTo from "@salesforce/label/c.OperatorNotEqualTo";
import labelOperatorGreaterThan from "@salesforce/label/c.OperatorGreaterThan";
import labelOperatorGreaterOrEqual from "@salesforce/label/c.OperatorGreaterOrEqual";
import labelOperatorLessThan from "@salesforce/label/c.OperatorLessThan";
import labelOperatorLessOrEqual from "@salesforce/label/c.OperatorLessOrEqual";

import {
    getTypeFromApexDisplayType,
    Datatype,
    FieldTypes
} from 'c/datatypeUtils';

const labels = {
    labelFilterRangeMinLabel,
    labelFilterRangeMaxLabel,
    labelFilterRangeStartLabel,
    labelFilterRangeEndLabel,
    labelFilterSOSLSearchRecord,
    labelFilterSOSLSearchFileContent,
    labelOperatorIn,
    labelOperatorNotIn,
    labelOperatorIsNull,
    labelOperatorIsNotNull,
    labelOperatorBetween,
    labelOperatorContains,
    labelOperatorDoesNotContain,
    labelOperatorStartsWith,
    labelOperatorEquals,
    labelOperatorNotEqualTo,
    labelOperatorGreaterThan,
    labelOperatorGreaterOrEqual,
    labelOperatorLessThan,
    labelOperatorLessOrEqual
}

// Filter operators codes
const operatorCodes = {
    IN: 'IN',
    NOTIN: 'NOTIN',
    ISNULL: 'ISNULL',
    ISNOTNULL: 'ISNOTNULL',
    BETWEEN: 'BETWEEN',
    LIKE: 'LIKE',
    NOTLIKE: 'NOTLIKE',
    SLIKE: 'SLIKE',
    EQ: 'EQ',
    NE: 'NE',
    GT: 'GT',
    GE: 'GE',
    LT: 'LT',
    LE: 'LE'
}

// Filter operators
const operators = {
    [operatorCodes.IN] : { label: labels.labelOperatorIn, value: operatorCodes.IN },
    [operatorCodes.NOTIN]: { label: labels.labelOperatorNotIn, value: 'NOTIN' },
    [operatorCodes.ISNULL] : { label: labels.labelOperatorIsNull, value: 'ISNULL' },
    [operatorCodes.ISNOTNULL]: { label: labels.labelOperatorIsNotNull, value: 'ISNOTNULL' },
    [operatorCodes.BETWEEN]: { label: labels.labelOperatorBetween, value: 'BETWEEN' },
    [operatorCodes.LIKE]: { label: labels.labelOperatorContains, value: 'LIKE' },
    [operatorCodes.NOTLIKE]: { label: labels.labelOperatorDoesNotContain, value: 'NOTLIKE' },
    [operatorCodes.SLIKE]: { label: labels.labelOperatorStartsWith, value: 'SLIKE' },
    [operatorCodes.EQ]: { label: labels.labelOperatorEquals, value: 'EQ' },
    [operatorCodes.NE]: { label: labels.labelOperatorNotEqualTo, value: 'NE' },
    [operatorCodes.GT]: { label: labels.labelOperatorGreaterThan, value: 'GT' },
    [operatorCodes.GE]: { label: labels.labelOperatorGreaterOrEqual, value: 'GE' },
    [operatorCodes.LT]: { label: labels.labelOperatorLessThan, value: 'LT' },
    [operatorCodes.LE]: { label: labels.labelOperatorLessOrEqual, value: 'LE' }
}

// Range constants
const MIN_RANGE_SUFFIX = '.min';
const MAX_RANGE_SUFFIX = '.max';

// Name of the SOSL Search field in values
const SOSL_SEARCH_FIELD_NAME = 'SOSLSearch';

export class Filter {
    // Properties
    fieldName;
    fieldLabel;
    helptext;
    fieldType;
    operators;
    operator;
    initOperator;
    prevOperator;
    value;
    prevValue;
    inputType;
    isRange;
    isNumberRange;
    isSosl;
    datatype

    // Create a filter from a field
    constructor(field) {
        this.isSosl = field.isSosl ? true : false;
        const type = getTypeFromApexDisplayType(this.isSosl ? FieldTypes.TEXT : field.filtersType);
        this.datatype = new Datatype(type);
        if (this.isSosl) {
            this.fieldName = SOSL_SEARCH_FIELD_NAME;
            this.fieldLabel = field.dataSourceType === 'Files' ? labels.labelFilterSOSLSearchFileContent : labels.labelFilterSOSLSearchRecord;
            this.operator = {value: ''};
            this.initOperator = this.operator;
        } else {
            this.fieldName = this.datatype.isLookup || this.datatype.isPicklist ? field.relatedIdField : field.name;
            this.fieldLabel = field.label;
            this.helptext = field.helptext;
            this.operators = getOperators(this.datatype, field.noLikeFilter);
            this.operator = getDefaultOperator(this.datatype, field.noLikeFilter);
            this.initOperator = this.operator;
        }
        this.fieldType = type;
        if (this.datatype.isFilterDateType) {
            this.inputType = this.datatype.filterInputType;
            this.isRange = true;
            this.isNumberRange = false;
        } else if (this.datatype.isTime) {
            this.inputType = this.datatype.filterInputType;
            this.isRange = true;
            this.isNumberRange = false;
        } else if (this.datatype.isFilterNumberType) {
            this.inputType = this.datatype.filterInputType;
            this.step = 1 / (10 ** field.fractionDigits);
            this.isRange = true;
            this.isNumberRange = true;
        } else if (this.datatype.isFilterTextType) {
            this.inputType = this.datatype.filterInputType;
            this.isSingle = !this.isSosl;
            this.isText = true;
        } else if (this.datatype.isFilterPicklistType) {
            this.isPicklist = true;
            const picklistValues = [];
            field.picklistValues.forEach(function (plValue) {
                if (plValue.active) {
                    picklistValues.push({ value: plValue.value, label: plValue.label });
                }
            });
            this.options = [...picklistValues];
        } else if (this.datatype.isBoolean) {
            this.isBoolean = true;
        } else if (this.datatype.isLookup) {
            this.isLookup = true;
            this.lookupData = field.lookups;
            this.clearClass = 'slds-col slds-no-flex sl-clear-input';
            if (this.lookupData.length > 1)
                this.clearClass += ' sl-clear-lookup-object-selector';
        } else if (this.datatype.isFilterTextType)
            this.isText = true;
        if (this.isRange) {
            this.minLabel =
                this.isNumberRange
                    ? labels.labelFilterRangeMinLabel
                    : labels.labelFilterRangeStartLabel;
                    this.minName = field.name + MIN_RANGE_SUFFIX;
                    this.maxLabel =
                this.isNumberRange
                    ? labels.labelFilterRangeMaxLabel
                    : labels.labelFilterRangeEndLabel;
            this.maxName = field.name + MAX_RANGE_SUFFIX;
            this.checkValidity = true;
        } else {
            this.checkValidity = this.isSosl;
        }
        // Initialize with empty value
        this.value = this.getEmptyValue();
        this.initValue = this.getEmptyValue();
    }

    // VALUE MANAGEMENT
    updateValue(fieldName, value) {
        if (this.isRange) {
            if (fieldName.endsWith(MIN_RANGE_SUFFIX))
                this.value.min = value;
            else if (fieldName.endsWith(MAX_RANGE_SUFFIX))
                this.value.max = value;
            else
                this.value = value;
        } else if (this.isText && !this.hasLikeOperator && !Array.isArray(value))
            this.value = [value];
        else
            this.value = value;
    }


    // Reset filter value to init value -> Cancel button
    reset() {
        this.value = this.isRange ? {...this.initValue} : (this.isLookup || this.isText ? [...this.initValue] : this.initValue);
        this.operator = {...this.initOperator};
    }

    // Set init filter value to value -> Apply button
    apply() {
        //debugger;
        this.initValue = this.isRange ? {...this.value} : (this.isLookup || this.isText ? [...this.value] : this.value);
        this.initOperator = {...this.operator};
    }

    get hasInitState() {
        return this.hasInitOperator && this.hasInitValue;
    }

    get hasValue() {
        return !this.isEqualToValue(this.getEmptyValue());
    }
    get hasNoValue() {
        return !this.hasValue;
    }

    get hasInitValue() {
        return this.isEqualToInitValue(this.value);
    }

    get hasValidSoslValue() {
        if (this.hasNoValue)
            return true;
        const searchValue = this.value[0].replaceAll(/(\*|\?)/gi, '');
        return searchValue.length >= 2;
    }

    get hasValidRange() {
        if (this.value.min === '' || this.value.max === '')
            return true;
        else
            return this.isNumberRange ? Number(this.value.max) > Number(this.value.min) : this.value.max > this.value.min;
    }

    get hasValidValue() {
        if (this.isRange) {
            if (this.hasBetweenOperator)
                return this.value.min !== '' && this.value.max !== '';
            else
                return this.value.min !== '';
        } else
            return this.hasValue;        
    }

    get isActive() {
        return this.hasNullOperator || this.hasValidValue;
    }
    
    // Apply button status rules:
    // - if filter has initial state (same operator, same value), button is disabled
    // Operator rules
    // - null: if operator <> init operator, button is enabled (no value check needed for null operators)
    // - operator change: if operator <> init operator and filter has valid value, button is enabled
    // - value change: if value <> init value and filter has valid value, button is enabled
    get canApply() {
        //debugger;
        if (this.hasInitState)
            return false;
        else if (!this.hasInitOperator) {
            if (this.hasNullOperator)
                return true;
            else 
                return this.hasValidValue;
        }
        else
            return !this.hasInitValue && this.hasValidValue;
    }

    get canCancel() {
        //debugger;
        return !this.hasInitState;
    }

    // OPERATOR MANAGEMENT
    isNullOperator(value) {
        return value === operatorCodes.ISNULL || value === operatorCodes.ISNOTNULL;
    }
    get hasNullOperator() {
        return this.isNullOperator(this.operator.value);
    }
    get hadNullOperator() {
        return this.isNullOperator(this.prevOperator.value);
    }

    get hasEqualOperator() {
        return this.operator.value === operatorCodes.EQ;
    }

    isBetweenOperator(value) {
        return value === operatorCodes.BETWEEN;
    }
    get hasBetweenOperator() {
        return this.isBetweenOperator(this.operator.value);
    }
    get hadBetweenOperator() {
        return this.isBetweenOperator(this.prevOperator.value);
    }

    isLikeOperator(value) {
        return value === operatorCodes.LIKE || value === operatorCodes.NOTLIKE || value === operatorCodes.SLIKE;
    }
    get hasLikeOperator() {
        return this.isLikeOperator(this.operator.value);
    }
    get hadLikeOperator() {
        return this.isLikeOperator(this.prevOperator.value);
    }

    get hasInitOperator() {
        return this.operator.value === this.initOperator.value;
    }

    get hasOperatorUpdate() {
        if (this.initOperator.value === operatorCodes.ISNULL && this.operator.value === operatorCodes.ISNOTNULL)
            return true;
        else if (this.initOperator.value === operatorCodes.ISNOTNULL && this.operator.value === operatorCodes.ISNULL)
            return true;
        else if ((this.initOperator.value === operatorCodes.ISNOTNULL || this.initOperator.value === operatorCodes.ISNULL) && !this.hasNullOperator && !this.hasInitValue)
            return true;
        else if (this.initOperator.value !== operatorCodes.ISNOTNULL && this.initOperator.value !== operatorCodes.ISNULL && this.hasNullOperator)
            return true;
        else
            return false;
    }

    updateOperator(value) {
        this.prevOperator = {...this.operator};
        this.operator = value;
    }

    // DATATYPE MANAGEMENT
    getEmptyValue() {
        return this.isLookup || this.isText ? [] : (this.isRange ? {min: '', max: ''} : '');
    }

    isEqualToValue(value) {
        return this.isEqualTo(this.value, value);
    }

    isEqualToInitValue(value) {
        return this.isEqualTo(this.initValue, value);
    }

    isEqualTo(value1, value2) {
        if (this.isLookup) {
            if (value1.length !== value2.length)
                return false;
            else {
                const v1Arr = [];
                for (const value of value1) {
                    v1Arr.push(value.id);
                }
                const v1str = v1Arr.sort().toString();
                const v2Arr = [];
                for (const value of value2) {
                    v2Arr.push(value.id);
                }
                const v2str = v2Arr.sort().toString();
                return v1str === v2str;
            }
        } else if (this.isPicklist) {
            const v1Arr = value1.split(';');
            const v1str = v1Arr.sort().toString();
            const v2Arr = value2.split(';');
            const v2str = v2Arr.sort().toString();
            return v1str === v2str;
        } else if (this.isText) {
            const v1str = value1.sort().toString();
            const v2str = value2.sort().toString();
            return v1str === v2str;
        }
         else if (this.isRange) {
            return value1.min === value2.min && value1.max === value2.max;
        }
        else
            return value1 === value2;
    }
}

// Operator functions
function getOperators(datatype, noLikeFilter) {
    const result = [];
    if (datatype.isPicklist || datatype.isMultiPicklist || datatype.isLookup) {
        result.push(operators[operatorCodes.IN]);
        result.push(operators[operatorCodes.NOTIN]);
        result.push(operators[operatorCodes.ISNULL]);
        result.push(operators[operatorCodes.ISNOTNULL]);
    } else {
        if (datatype.isFilterRangeType)+
            result.push(operators[operatorCodes.BETWEEN]);
        if (!datatype.isFilterTextType || noLikeFilter)
            result.push(operators[operatorCodes.EQ]);
        if (!datatype.isBoolean) {
            if (datatype.isFilterTextType) {
                if (!noLikeFilter) {
                    result.push(operators[operatorCodes.LIKE]);
                    result.push(operators[operatorCodes.NOTLIKE]);
                    result.push(operators[operatorCodes.SLIKE]);
                }
            }
            else if (!datatype.isDateTime)
                result.push(operators[operatorCodes.NE]);
            result.push(operators[operatorCodes.ISNULL]);
            result.push(operators[operatorCodes.ISNOTNULL]);
            result.push(operators[operatorCodes.GT]);
            result.push(operators[operatorCodes.GE]);
            result.push(operators[operatorCodes.LT]);
            result.push(operators[operatorCodes.LE]);
        }
    }
    return result;
}

function getDefaultOperator(datatype, noLikeFilter) {
    if (datatype.isPicklist || datatype.isMultiPicklist || datatype.isLookup)
        return operators[operatorCodes.IN];
    else if (datatype.isFilterRangeType)
        return operators[operatorCodes.BETWEEN];
    else if (datatype.isFilterTextType && !noLikeFilter)
        return operators[operatorCodes.LIKE];
    else
        return operators[operatorCodes.EQ];
}