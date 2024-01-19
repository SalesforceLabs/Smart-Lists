import { LightningElement, api} from 'lwc';

export default class LabeledUrlEditor extends LightningElement {
    @api value;
    @api max;
    @api required = false;
    rendered = false;

    renderedCallback() {
        if (!this.rendered) {
            this.template.querySelector('lightning-input').focus();
            this.rendered = true;
        }
    }
    
    handleChange(e) {
        e.stopPropagation();
        this.value = e.detail.value;
    }

    @api get validity() {
        return this.template.querySelector('lightning-input').validity;
    }

    @api showHelpMessageIfInvalid() {
        this.template.querySelector('lightning-input').showHelpMessageIfInvalid();
    }
}