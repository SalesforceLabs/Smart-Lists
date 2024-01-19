import { LightningElement, api } from 'lwc';

export default class LabeledUrlViewer extends LightningElement {
    @api value;
    @api url;
    @api target;
}