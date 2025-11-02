import { LightningElement, api } from 'lwc';

import SEP from "@salesforce/i18n/number.decimalSeparator";

import getPage from "@salesforce/apex/SmartListController.getPage";

import labelExportToCSV from '@salesforce/label/c.ExportToCSV';
import labelAddRecordId from '@salesforce/label/c.AddRecordId';
import labelExporting from '@salesforce/label/c.Exporting';
import labelClose from '@salesforce/label/c.Close';
import labelCancel from '@salesforce/label/c.Cancel';
import labelExport from '@salesforce/label/c.Export';

export default class ExportToCsvModal extends LightningElement {
    // COMPONENT PROPERTIES
    @api listName;
    // Fields displayed in list
    @api fields;
    // Row key field
    @api rowKey;
    @api isMultiCurrency;
    // Query parameters
    @api parms;

    // UI CONTROL
    exporting = false;

    // LABELS
    labels = {
        labelExportToCSV,
        labelAddRecordId,
        labelExporting,
        labelClose,
        labelExport,
        labelCancel
    }

    _addRecordId = false;
    @api get addRecordId() {
        return this._addRecordId;
    }
    set addRecordId(value) {
        this._addRecordId = value;
    }

    handleAddRecordIdClick(event) {
        event.preventDefault();
        this._addRecordId = !this._addRecordId;
    }

    // Close/Cancel modal
    closeModal() {
        this.notifyParent('cancel');
    }

    handleExport(event) {
        event.preventDefault();
        //console.log('handleExport ' + JSON.stringify(this.parms));
        //Display a spinner to indicate that data is being exported
        this.exporting = true;
        getPage({
            listName: this.listName,
            listFilter: this.parms.listFilter,
            soqlScope: this.parms.soqlScope,
            filterEntries: this.parms.filterEntries,
            parentId: this.parms.parentId,
            sortField: this.parms.sortField,
            sortDirection: this.parms.sortDirection,
            offset: 0,
            pageSize: this.parms.pageSize
        })
            .then((result) => {
                //console.log("handleExport " + JSON.stringify(result));
                const delimiter = SEP ===  ',' ? ';' : ',';
                let csvFile = '';
                const fields = [];
                const header = [];
                if (this._addRecordId) {
                    fields.push({name: this.rowKey, parts: [this.rowKey]});
                    header.push(this.formatCell(this.rowKey));
                }
                let hasCurrencyField = false;
                let hasCurrencyCode = false;
                let lastField;
                for (const fieldName of Object.getOwnPropertyNames(this.fields)) {
                    const field = this.fields[fieldName];
                    if (field.listField && field.displayType !== 'LOCATION') {
                        if (field.displayType === 'CURRENCY')
                            hasCurrencyField = true;
                        if (field.name === 'CurrencyIsoCode')
                            hasCurrencyCode = true;
                        lastField = fieldName;
                        fields.push({name: fieldName, parts: fieldName.split('.') });
                        header.push(this.formatCell(field.label));
                    }
                }
                if (this.isMultiCurrency && hasCurrencyField && !hasCurrencyCode) {
                    header.push(this.formatCell('CurrencyIsoCode'));
                    fields.push({name: 'CurrencyIsoCode', parts: ['CurrencyIsoCode'] });
                    lastField = 'CurrencyIsoCode';
                }
                //console.log('fields ' + JSON.stringify(fields));
                csvFile += header.join(delimiter) + '\n';
                for (const record of result) {
                    for (const field of fields) {
                        const value =  field.parts.reduce((accumulator, currentValue) => accumulator?.[currentValue], record);
                        csvFile += this.formatCell(value);
                        if (field.name !== lastField)
                            csvFile += delimiter;
                    }
                    csvFile += '\n';
                }
                const fileName = this.listName + Date.now() + '.csv';
                const link = this.template.querySelector('.sl-link');
                const url = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvFile);
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                link.click();
                this.exporting = false;
                this.notifyParent('cancel');
            })
            .catch((error) => {
                console.log(error);
                this.notifyParent('error', error);
            }); 
    }

    formatCell(value) {
        let result = value;
        if (typeof result === 'undefined')
            result = '';
        // Escape double quotes of string values and return them between double quotes
        //console.log('value ' + value + ' ' + (typeof value));
        else if (typeof result === 'string') {
            result = result.replaceAll('"', '""');
            result = '"' + result + '"';
        }
        // Set local decimal separator if needed
        else if (typeof result === 'number') {
            const strNumber = result.toString();
            if (strNumber.includes('.') && SEP !== '.')
                result = strNumber.replace('.', SEP);
        }
        return result;
    }

    // Notify parent of the result of the action in the dialog
    notifyParent(action, error) {
        this.dispatchEvent(new CustomEvent('close', { detail: { action: action, error: error } }));
    }
}