// Class without sharing so that guest users can upsert the context record of the list
// This method can only update the record from the list parameters retrieved in with sharing context
// Ref: https://developer.salesforce.com/docs/atlas.en-us.communities_dev.meta/communities_dev/communities_dev_give_guest_users_access_to_update_records.htm
public without sharing class UpsertContext {
    public static void UpsertContext(Context__c context) {
        Upsert context List_ID__c;
    }
}