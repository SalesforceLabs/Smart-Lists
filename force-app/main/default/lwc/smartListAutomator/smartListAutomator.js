import { LightningElement, api, wire } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import SMARTLIST_CHANNEL from '@salesforce/messageChannel/SmartListMC__c';

/**
 * SmartList Automator Component
 * Formats and publishes messages to the SmartListMC LMS channel
 */
export default class SmartListAutomator extends LightningElement {
    // LMS Message Context
    @wire(MessageContext)
    messageContext;

    /**
     * Public API: Publish a REFRESH action
     * @param {String} targetList - Target list name or '*' for all lists
     */
    @api
    publishRefresh(targetList = '*') {
        const message = this.formatMessage(targetList, { type: 'REFRESH' });
        this.publishMessage(message);
    }

    /**
     * Public API: Publish a FILTER action
     * @param {String} targetList - Target list name or '*' for all lists
     * @param {String} filter - Filter value to apply
     */
    @api
    publishFilter(targetList = '*', filter) {
        const message = this.formatMessage(targetList, { 
            type: 'FILTER', 
            filter: filter 
        });
        this.publishMessage(message);
    }

    /**
     * Public API: Publish a SCOPE action
     * @param {String} targetList - Target list name or '*' for all lists
     * @param {String} scope - Scope value to apply (e.g., 'everything', 'mine', 'team')
     */
    @api
    publishScope(targetList = '*', scope) {
        const message = this.formatMessage(targetList, { 
            type: 'SCOPE', 
            scope: scope 
        });
        this.publishMessage(message);
    }

    /**
     * Format a message for publishing
     * @param {String} targetList - Target list name
     * @param {Object} action - Action object
     * @returns {Object} Formatted message
     */
    formatMessage(targetList, action) {
        return {
            list: targetList,
            action: action
        };
    }

    /**
     * Publish message to LMS channel
     * @param {Object} message - Message to publish
     */
    publishMessage(message) {
        if (!this.messageContext) {
            console.error('[SmartListAutomator] MessageContext not available');
            return;
        }

        try {
            publish(this.messageContext, SMARTLIST_CHANNEL, message);
            console.log('[SmartListAutomator] Published message:', JSON.stringify(message));
        } catch (error) {
            console.error('[SmartListAutomator] Error publishing message:', error);
        }
    }
}