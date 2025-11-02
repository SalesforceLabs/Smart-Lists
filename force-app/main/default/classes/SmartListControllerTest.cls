@isTest
public class SmartListControllerTest {
    // Test error: no list passed
    @isTest
    static void testGetInitParametersErrorNoList(){
        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters(null, null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }

    // Test error: invalid list name
    @isTest
    static void testGetInitParametersErrorInvalidList(){
        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('Invalid', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }

    // Test error: list with no fields
    @isTest
    static void testGetInitParametersErrorNoFields(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields = new Smart_List_Field__mdt[] {};
            
        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }

    // Test error: list with invalid object
    @isTest
    static void testGetInitParametersErrorInvalidObject(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listDefinition[0].SObject__c = 'Invalid';
        
        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }

    // Test error: list with invalid field name
    @isTest
    static void testGetInitParametersErrorInvalidFieldName(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Field_Name__c = 'Invalid';
        
       	Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }

    // Test error: list with invalid relationship name
    @isTest
    static void testGetInitParametersErrorInvalidRelationshipName(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Field_Name__c = 'Invalid.Name';
        
        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }

    // Test error: list with invalid related field name
    @isTest
    static void testGetInitParametersErrorInvalidRelatedFieldName(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Field_Name__c = 'Account.Invalid';
        
        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }

    // Test error: list with invalid polymorphic relationship
    @isTest
    static void testGetInitParametersErrorInvalidPolymorphicRelationship(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Field_Name__c = 'Owner.Id';
        
        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }

    // Test error: list with invalid default sort field
    @isTest
    static void testGetInitParametersErrorInvalidDefaultSortField(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Field_Name__c = 'Description';
        SmartListController.listFields[0].Default_Sort_Field__c = true;
        
        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }

    // Test error: object not accessible
    @isTest
    static void testGetInitParametersErrorObjectNotAccessible(){
        boolean  error = false;
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id; 
        User u = SmartListTestDataFactory.createTestUser(profileId, null);
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listDefinition[0].SObject__c = 'UserProvisioningRequest';
        
        Test.startTest();
        System.runAs(u) {
            try {
                SmartListController.getListParameters('List', null, false);
            } catch (Exception e) {
                error = true;
            }
            System.assertEquals(true, error);
        }
        Test.stopTest();
    }

    // Test error: unsupported data type
    @isTest
    static void testGetInitParametersErrorUnsupportedDataType(){
        SmartListTestDataFactory.createFilesListDefinition();
        SmartListController.listFields[0].Field_Name__c = 'VersionData';
        
        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('Test', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }
    
    // Test create list context SOQL
    @isTest
    static void testListContextSOQL() {
        SmartListTestDataFactory.createCaseListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
       	SmartListController.getListParameters('Test', null, false);
        List<Context__c> contexts = [SELECT List_ID__c, Data_Source_Type__c, Data_Provider_Class__c, Object_Name__c, Query_Fields__c, Parent_Id_Field__c FROM Context__c];
        //System.debug(contexts);

        Test.startTest();
        Context__c context = contexts.get(0);
        System.assertEquals(1, contexts.size());
        System.assertEquals(SmartListController.DATASOURCE_SOQL_WITH_SHARING, context.Data_Source_Type__c);
        System.assertEquals('Case', context.Object_Name__c);
        System.Assert.isNull(context.Data_Provider_Class__c);
        System.Assert.isTrue(context.Query_Fields__c.contains('CaseNumber'));
        System.Assert.isTrue(context.Query_Fields__c.contains('Subject'));
        System.Assert.isTrue(context.Query_Fields__c.contains('toLabel(Type)'));
        System.Assert.isTrue(context.Query_Fields__c.contains('Account.Name'));
        System.Assert.isTrue(context.Query_Fields__c.contains('Owner.Name'));
        System.Assert.isTrue(context.Query_Fields__c.contains('ClosedDate'));
        System.Assert.isTrue(context.Query_Fields__c.contains('Id'));
        System.Assert.isTrue(context.Query_Fields__c.contains('Status'));
        System.Assert.isTrue(context.Query_Fields__c.contains('AccountId'));
        System.assertEquals('AccountId', context.Parent_Id_Field__c);
        Test.stopTest();
    }

    // Test create list context Apex
    @isTest
    static void testListContextApex() {
        SmartListTestDataFactory.createApexListDefinition();
       	SmartListController.getListParameters('Test', null, false);
        List<Context__c> contexts = [SELECT List_ID__c, Data_Source_Type__c, Data_Provider_Class__c, Object_Name__c, Query_Fields__c, Parent_Id_Field__c FROM Context__c];
        //System.debug(contexts);
        
        Test.startTest();
        Context__c context = contexts.get(0);
        System.assertEquals(1, contexts.size());
        System.assertEquals(SmartListController.DATASOURCE_APEX, context.Data_Source_Type__c);
        System.assertEquals('SmartListTestApexDataSource', context.Data_Provider_Class__c);
        System.Assert.isNull(context.Object_Name__c);
        System.Assert.isNull(context.Query_Fields__c);
        System.Assert.isNull(context.Parent_Id_Field__c);
        Test.stopTest();
    }
    
    @isTest
    static void testGetInitParametersWithDirectParent() {
        SmartListTestDataFactory.createFilesListDefinition();
        Account parentAcc = SmartListTestDataFactory.createAccount('Parent');
        
        Test.startTest();
        String parmsStr = SmartListController.getListParameters('List', parentAcc.Id, false);
        Test.stopTest();
    }

    @isTest
    static void testGetInitParametersWithTileAndIndirectParent() {
        SmartListTestDataFactory.createFilesListDefinition();
        SmartListController.listDefinition[0].Tile_Layout__c = '2x2';
        SmartListController.listDefinition[0].Parent_Object__c = 'Account';
        SmartListController.listDefinition[0].Parent_Key_Field__c = 'ParentId';
        Account parentAcc = SmartListTestDataFactory.createAccount('Parent');
        
        Test.startTest();
        String parmsStr = SmartListController.getListParameters('List', parentAcc.Id, false);
        Test.stopTest();
    }

    @isTest
    static void testGetInitParametersFilesWithoutPermissions(){
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id; 
        User u = SmartListTestDataFactory.createTestUser(profileId, null);
        SmartListTestDataFactory.createFilesListDefinition();

        Test.startTest();
        System.runAs(u) {
            String parmsStr = SmartListController.getListParameters('List', null, false);
            Map<String, Object> parms = (Map<String, Object>)JSON.deserializeUntyped(parmsStr);
            System.assertEquals('ContentVersion', parms.get('objectName'));
            Map<String, Object> fields = (Map<String, Object>)parms.get('fields');
            System.assertEquals(2, fields.size());
            Map<String, Object> titleField = (Map<String, Object>)fields.get('Title');
            System.assertEquals('Title', titleField.get('name'));
            Map<String, Object> descriptionField = (Map<String, Object>)fields.get('Description');
            System.assertEquals('Description', descriptionField.get('name'));
            List<Object> soqlScopes = (List<Object>)parms.get('soqlScopes');
            System.assertEquals(1, soqlScopes.size());
            List<Object> filters = (List<Object>)parms.get('filters');
            System.assertEquals(0, filters.size());
            List<Object> standardListActions = (List<Object>)parms.get('standardListActions');
            System.assertEquals(0, standardListActions.size());
            List<Object> customListActions = (List<Object>)parms.get('customListActions');
            System.assertEquals(0, customListActions.size());    
            List<Object> rowActions = (List<Object>)parms.get('rowActions');
            System.assertEquals(0, rowActions.size());    
        }
        Test.stopTest();
    }

    @isTest
    static void testGetInitParametersFilesWithPermissions(){
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id; 
        User u = SmartListTestDataFactory.createTestUser(profileId, null);
        SmartListTestDataFactory.assignCustomPermissions(u, new String[] 
            { 'SmartFilesList_Preview_Files', 'SmartFilesList_Download_Files', 'SmartFilesList_Upload_Files', 'SmartFilesList_View_File_Details',
              'SmartFilesList_Edit_File_Details', 'SmartFilesList_Delete_File', 'SmartFilesList_Upload_New_Version' });
        SmartListTestDataFactory.createFilesListDefinition();

        Test.startTest();
        System.runAs(u) {
            String parmsStr = SmartListController.getListParameters('List', null, false);
            Map<String, Object> parms = (Map<String, Object>)JSON.deserializeUntyped(parmsStr);
            System.assertEquals('ContentVersion', parms.get('objectName'));
            Map<String, Object> fields = (Map<String, Object>)parms.get('fields');
            System.assertEquals(2, fields.size());
            Map<String, Object> titleField = (Map<String, Object>)fields.get('Title');
            System.assertEquals('Title', titleField.get('name'));
            Map<String, Object> descriptionField = (Map<String, Object>)fields.get('Description');
            System.assertEquals('Description', descriptionField.get('name'));
            List<Object> soqlScopes = (List<Object>)parms.get('soqlScopes');
            System.assertEquals(1, soqlScopes.size());
            List<Object> filters = (List<Object>)parms.get('filters');
            System.assertEquals(0, filters.size());
            List<Object> standardListActions = (List<Object>)parms.get('standardListActions');
            System.assertEquals(4, standardListActions.size());
            List<Object> customListActions = (List<Object>)parms.get('customListActions');
            System.assertEquals(0, customListActions.size());    
            List<Object> rowActions = (List<Object>)parms.get('rowActions');
            System.assertEquals(6, rowActions.size());    
        }
        Test.stopTest();
    }

    @isTest
    static void testGetInitParametersApex() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_APEX);

    	Test.startTest();
        String parmsStr = SmartListController.getListParameters('ListApex', null, false);
        Map<String, Object> parms = (Map<String, Object>)JSON.deserializeUntyped(parmsStr);
        Map<String, Object> fields = (Map<String, Object>)parms.get('fields');
        System.assertEquals(6, fields.size());
        Test.stopTest();
    }
    
    @isTest
    static void testGetInitParametersApexInvalidClass() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_APEX);

        SmartListController.listDefinition[0].Data_Provider_Class__c = 'InvalidClass';
        
        Test.startTest();
        Boolean error = false;
        try {
            SmartListController.getListParameters('ListApex', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }
    
    @isTest
    static void testGetInitParametersApexClassWithoutSmartListApexSourceInterface2() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_APEX);

        SmartListController.listDefinition[0].Data_Provider_Class__c = 'SmartListController';
        
        Test.startTest();
        Boolean error = false;
        try {
            SmartListController.getListParameters('ListApex', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }
    
    @isTest
    static void testGetInitParametersSOQLWithoutPermission() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id; 
        User u = SmartListTestDataFactory.createTestUser(profileId, null);
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        
        Test.startTest();
        System.runAs(u) {
            String parmsStr = SmartListController.getListParameters('List', null, false);
            Map<String, Object> parms = (Map<String, Object>)JSON.deserializeUntyped(parmsStr);
            Map<String, Object> fields = (Map<String, Object>)parms.get('fields');
            System.assertEquals(6, fields.size());
            List<Object> soqlScopes = (List<Object>)parms.get('soqlScopes');
            System.assertEquals(5, soqlScopes.size());
            List<Object> filters = (List<Object>)parms.get('filters');
            System.assertEquals(2, filters.size());
            List<Object> standardListActions = (List<Object>)parms.get('standardListActions');
            System.assertEquals(1, standardListActions.size()); // New
            List<Object> customListActions = (List<Object>)parms.get('customListActions');
            System.assertEquals(0, customListActions.size()); // 0 -> no custom permission
            List<Object> rowActions = (List<Object>)parms.get('rowActions');
            System.assertEquals(2, rowActions.size()); // Edit, custom - Delete not in profile
        }
        // Test will Filters Layout Hyperlink to Detail Id Field not populated 
        SmartListController.listDefinition[0].Filters_Panel_Layout__c = null;
        SmartListController.listFields[0].Hyperlink_to_Detail_Id_Field__c = null;
        System.runAs(u) {
            String parmsStr = SmartListController.getListParameters('List', null, false);
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetInitParametersSOQLWithPermission() {
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id; 
        User u = SmartListTestDataFactory.createTestUser(profileId, null);
        SmartListTestDataFactory.assignCustomPermissions(u, new String[] { 'SmartFilesList_Delete_File' });
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);

        Test.startTest();
        System.runAs(u) {
            String parmsStr = SmartListController.getListParameters('List', null, false);
            Map<String, Object> parms = (Map<String, Object>)JSON.deserializeUntyped(parmsStr);
            List<Object> standardListActions = (List<Object>)parms.get('standardListActions');
            System.assertEquals(1, standardListActions.size()); // New
            List<Object> customListActions = (List<Object>)parms.get('customListActions');
            System.assertEquals(1, customListActions.size()); // 1 -> with custom permission
            List<Object> rowActions = (List<Object>)parms.get('rowActions');
            System.assertEquals(2, rowActions.size());  // Edit, custom - Delete not in profile
        }
        Test.stopTest();
    }
    
    /*@isTest
    static void testGetInitParametersWithRecordTypeFieldOnObjectWithRecordType() {
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id;
        UserRole ceoRole = SmartListTestDataFactory.createUserRole('CEO', null);
        User ceo = SmartListTestDataFactory.createTestUser(profileId, ceoRole.Id);
        
        SmartListTestDataFactory.createListDefinitionForRecordType('Lead');
        String parmsStr;
        System.runAs(ceo) {
        	parmsStr = SmartListController.getListParameters('List', null);
        }
        Map<String, Object> parms = (Map<String, Object>)JSON.deserializeUntyped(parmsStr);
        List<Object> recordTypes = (List<Object>)parms.get('recordTypes');
		System.assertEquals(2, recordTypes.size());    
        Map<String, Object> fields = (Map<String, Object>)parms.get('fields');
        Map<String, Object> rtField = (Map<String, Object>)fields.get('RecordType.Name');
        List<Object> rtPicklistValues = (List<Object>)rtField.get('picklistValues');
		System.assertEquals(2, rtPicklistValues.size());    
    }*/
    
    /*@isTest
    static void testGetInitParametersWithoutRecordTypeFieldOnObjectWithRecordType() {
        SmartListTestDataFactory.createListDefinitionForRecordType('Lead');
        SmartListController.listFields[1].Field_Name__c = 'Owner';

        String parmsStr = SmartListController.getListParameters('List', null);
        Map<String, Object> parms = (Map<String, Object>)JSON.deserializeUntyped(parmsStr);
        List<Object> recordTypes = (List<Object>)parms.get('recordTypes');
		System.assertEquals(2, recordTypes.size());    
    }  */
    
    @isTest
    static void testGetInitParametersErrorRecordTypeFieldOnObjectWithoutRecordType() {
        SmartListTestDataFactory.createListDefinitionForRecordType('User');

        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
        Test.stopTest();
    } 

    @isTest
    static void testGetInitParametersErrorOwnerFieldOnObjectWithoutOwner() {
        SmartListTestDataFactory.createListDefinitionForRecordType('User');
        SmartListController.listFields[1].Field_Name__c = 'Owner';

        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
        Test.stopTest();
    }  

    @isTest
    static void testGetInitParametersErrorFieldAddTwice() {
        SmartListTestDataFactory.createListDefinitionForRecordType('User');
        SmartListController.listFields[1].Field_Name__c = 'Name';
        
        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
        Test.stopTest();
    }  
    
    @isTest
    static void testGetInitParametersErrorParentIdField() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listDefinition[0].Parent_Id_Field__c = 'InvalidField';

        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
        Test.stopTest();
    }

    @isTest
    static void testGetInitParametersErrorParentKeyField() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listDefinition[0].Parent_Key_Field__c = 'InvalidField';
        Account acc = SmartListTestDataFactory.createAccount('Test');

        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', acc.Id, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
        Test.stopTest();
    }

    @isTest
    static void testGetInitParametersErrorDynamicStyleField() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Dynamic_Style_Field__c = 'InvalidField';

        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
        Test.stopTest();
    }

    /*@isTest
    static void testGetInitParametersErrorInvalidHyperlinkField() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Hyperlink_to_Detail_Id_Field__c = 'InvalidField';

        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
    }*/

    @isTest
    static void testGetInitParametersErrorInvalidBadgeStyleField() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[3].Display_as_Badge__c = true;
        SmartListController.listFields[3].Badge_Style_Field__c = 'InvalidField';

        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
        Test.stopTest();
    }

    @isTest
    static void testGetInitParametersErrorInvalidSubtitleField() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[3].Lookup_in_Quick_Filters__c = true;
        SmartListController.listFields[3].Lookup_Subtitle_Field__c = 'InvalidField';

        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
        Test.stopTest();
    }

    @isTest
    static void testGetInitParametersErrorInvalidDataTypeOnLookupSubtitle() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[3].Lookup_in_Quick_Filters__c = true;
        SmartListController.listFields[3].Lookup_Subtitle_Field__c = 'AnnualRevenue';

        Test.startTest();
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
        Test.stopTest();
    }
    
    @isTest
    static void testGetFiltersPanelOperator() {
        List<String> rangeDataTypes = new List<String>{'DATE', 'DATETIME', 'TIME', 'CURRENCY', 'DECIMAL', 'DOUBLE', 'INTEGER', 'LONG', 'PERCENT'};
        List<String> equalDataTypes = new List<String>{'BOOLEAN', 'LOOKUP'};
        List<String> textDataTypes = new List<String>{'EMAIL', 'PHONE', 'TEXT', 'TEXTAREA', 'URL'};
        
        Test.startTest();
        String operator;
        for (String dataType : rangeDataTypes) {
            operator = SmartListController.getFiltersPanelOperator(dataType, false, true);
            System.assertEquals('>=', operator);
            operator = SmartListController.getFiltersPanelOperator(dataType, false, false);
            System.assertEquals('<=', operator);
        }
        operator = SmartListController.getFiltersPanelOperator('MULTIPICKLIST', false, true);
        System.assertEquals('INCLUDES', operator);
        operator = SmartListController.getFiltersPanelOperator('PICKLIST', false, true);
        System.assertEquals('IN', operator);
        for (String dataType : equalDataTypes) {
            operator = SmartListController.getFiltersPanelOperator(dataType, false, true);
            System.assertEquals('=', operator);
        }
        for (String dataType : textDataTypes) {
            operator = SmartListController.getFiltersPanelOperator(dataType, false, true);
            System.assertEquals('LIKE', operator);
            operator = SmartListController.getFiltersPanelOperator(dataType, true, true);
            System.assertEquals('=', operator);
        }
        Test.stopTest();
    }

    @isTest
    static void testGetPageFiles() {
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id; 
        User u = SmartListTestDataFactory.createTestUser(profileId, null);
        
        System.runAs(u) {
            Account acc = SmartListTestDataFactory.createAccount('Test');
        	SmartListTestDataFactory.createFilesListDefinition();
       		SmartListController.getListParameters('Test', acc.Id, false);
			SmartListTestDataFactory.FileData fd1 = SmartListTestDataFactory.createNewFile(acc, 'Test1', 'jpg');
			SmartListTestDataFactory.FileData fd2 = SmartListTestDataFactory.createNewFile(acc, 'Test2', 'jpg');
			SmartListTestDataFactory.FileData fd3 = SmartListTestDataFactory.createNewFile(acc, 'ABC', 'jpg');
            String sortField = 'Title';
            String sortDirection = 'asc';
            Integer offset = 0;
            Integer pageSize = 10;
            List<SmartListController.FilterEntry> fes = new List<SmartListController.FilterEntry>();
            SmartListController.FilterEntry fe1 = new SmartListController.FilterEntry();
            fe1.fieldName = 'Title';
            fe1.operator = 'LIKE';
            fe1.values = new List<String>();
            fe1.values.add('Test');
            fe1.type = 'text';
            fes.add(fe1);
            SmartListController.FilterEntry fe2 = new SmartListController.FilterEntry();
            fe2.fieldName = 'LastModifiedDate';
            fe2.operator = '>=';
            fe2.values = new List<String>();
            fe2.values.add('2000-01-01');
            fe2.type = 'datetime';
            fes.add(fe2);
            SmartListController.FilterEntry fe3 = new SmartListController.FilterEntry();
            fe3.fieldName = 'LastModifiedDate';
            fe3.operator = '<=';
            fe3.values = new List<String>();
            fe3.values.add('2100-01-01');
            fe3.type = 'datetime';
            fes.add(fe3);
            SmartListController.FilterEntry fe4 = new SmartListController.FilterEntry();
            fe4.fieldName = 'IsMajorVersion';
            fe4.operator = '=';
            fe4.values = new List<String>();
            fe4.values.add('true');
            fe4.type = 'boolean';
            fes.add(fe4);
            SmartListController.FilterEntry fe5 = new SmartListController.FilterEntry();
            fe5.fieldName = 'Origin';
            fe5.operator = 'IN';
            fe5.values = new List<String>();
            fe5.values.add('C');
            fe5.type = 'picklist';
            fes.add(fe5);
            SmartListController.FilterEntry fe6 = new SmartListController.FilterEntry();
            fe6.fieldName = 'NegativeRatingCount';
            fe6.operator = '>=';
            fe6.values = new List<String>();
            fe6.values.add('0');
            fe6.type = 'number';
            fes.add(fe6);
            Test.startTest();
            //Test SOQL with records
            List<ContentVersion> files = (List<ContentVersion>)SmartListController.getPage('Test', null, SmartListController.SCOPE_ALL, fes, acc.Id, sortField, sortDirection, offset, pageSize);
            System.assertEquals(2, files.size());
            System.assertEquals(fd1.cvId, files[0].Id);
            System.assertEquals(fd2.cvId, files[1].Id);

            //Test SOQL with records no parent
            files = (List<ContentVersion>)SmartListController.getPage('Test', null, SmartListController.SCOPE_ALL, fes, null, sortField, sortDirection, offset, pageSize);
            System.assertEquals(0, files.size());

            // Test SOQL without records
            Account acc2 = SmartListTestDataFactory.createAccount('Test2');
            files = (List<ContentVersion>)SmartListController.getPage('Test', null, SmartListController.SCOPE_ALL, fes, acc2.Id, sortField, sortDirection, offset, pageSize);
            System.assertEquals(0, files.size());

            // Test SOSL 
            fes.clear();
            fe1 = new SmartListController.FilterEntry();
            fe1.fieldName = 'SOSLSearch';
            fe1.operator = '=';
            fe1.values = new List<String>();
            fe1.values.add('Test');
            fes.add(fe1);
            // Scope = mine for testing extra clause in where
            files = (List<ContentVersion>)SmartListController.getPage('Test', null, SmartListController.SCOPE_MY, fes, acc.Id, sortField, sortDirection, offset, pageSize);
            // System.assertEquals(2, files.size()); Can't test: files not yet indexed

            // Test DMLException Wrong sort field
            Boolean error = false;
            try { 
            	files = (List<ContentVersion>)SmartListController.getPage('Test', null, SmartListController.SCOPE_ALL, fes, acc.Id, 'xyz', sortDirection, offset, pageSize);
            } catch(Exception ex) {
            	error = true;
        	}
            System.assertEquals(true, error);

        	Test.stopTest();
        }
    }

    @isTest
    static void testGetPageSoql() {
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id;
        UserRole ceoRole = SmartListTestDataFactory.createUserRole('CEO', null);
        User ceo = SmartListTestDataFactory.createTestUser(profileId, ceoRole.Id);
        UserRole directorRole = SmartListTestDataFactory.createUserRole('Director', ceoRole.Id);
        User director = SmartListTestDataFactory.createTestUser(profileId, directorRole.Id);
        UserRole csrRole = SmartListTestDataFactory.createUserRole('Director', directorRole.Id);
        User csr = SmartListTestDataFactory.createTestUser(profileId, csrRole.Id);
        User noRole = SmartListTestDataFactory.createTestUser(profileId, null);
        Account parentAcc;
        Account childAccCeo;
        Account childAccDirector1;
        Account childAccDirector2;
        Account grandChildCsr;
        List<Account> accs;
        List<SmartListController.FilterEntry> fes = new List<SmartListController.FilterEntry>();
        SmartListController.FilterEntry fe1 = new SmartListController.FilterEntry();
        fe1.fieldName = 'Name';
        fe1.operator = 'LIKE';
        fe1.values = new List<String>();
        fe1.values.add('Director');
        fe1.type = 'text';
        fes.add(fe1);
        
        System.runAs(director) {
            parentAcc = SmartListTestDataFactory.createAccount('ParentDirector');
            childAccDirector1 = SmartListTestDataFactory.createChildAccount('ChildDirector1', parentAcc.Id);
            childAccDirector2 = SmartListTestDataFactory.createChildAccount('ChildDirector2', parentAcc.Id);
        }
        System.runAs(ceo) {
            childAccCeo = SmartListTestDataFactory.createChildAccount('ChildCeo', parentAcc.Id);
        }
        System.runAs(csr) {
            grandChildCsr = SmartListTestDataFactory.createChildAccount('GrandChildCsr', parentAcc.Id);
        }
        Test.startTest();
        // Test mine scope with predefined filter and filters from panel (Name like Director)
        System.runAs(director) {
            SmartListTestDataFactory.createAccountListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
            SmartListController.getListParameters('Test', null, false);
            // Parent ID added for filter on PARENT ID
            accs = (List<Account>)SmartListController.getPage('Test', 'CreatedById = USERID AND ParentId = PARENTID', SmartListController.SCOPE_MY, fes, parentAcc.Id, 'Name', 'asc', 0, 10);
            System.assertEquals(2, accs.size()); // 2 director -> records with Name like Child for PARENTID
        }
        // Test mine scope without predefined filter and with filters from panel (Name like Director) 
        System.runAs(director) {
            // List already created for mine with filters
            accs = (List<Account>)SmartListController.getPage('Test', null, SmartListController.SCOPE_MY, fes, null, 'Name', 'asc', 0, 10);
            System.assertEquals(3, accs.size()); // 3 director -> parent + 2 childs
        }
        // Test mine scope without predefined filter and with filters from panel (Name like XYZ) 
        System.runAs(director) {
            fes.clear();
            SmartListController.FilterEntry fe2 = new SmartListController.FilterEntry();
            fe2.fieldName = 'Name';
            fe2.operator = 'LIKE';
            fe2.values = new List<String>();
            fe2.values.add('XYZ');
            fe2.type = 'text';
            fes.add(fe2);
            // List already created for mine with filters
            accs = (List<Account>)SmartListController.getPage('Test', null, SmartListController.SCOPE_MY, fes, null, 'Name', 'asc', 0, 10);
            System.assertEquals(0, accs.size()); // 0 -> director records don't have XYZ in name
        }
        // Test mine scope without filters
        System.runAs(director) {
            // List already created for mine without filters
            accs = (List<Account>)SmartListController.getPage('Test', null, SmartListController.SCOPE_MY, null, null, 'Name', 'asc', 0, 10);
            System.assertEquals(3, accs.size()); // 3 director -> parent + 2 childs
        }
        // Test all scope
        System.runAs(director) {
            // List already created for mine with filters
            accs = (List<Account>)SmartListController.getPage('Test', null, SmartListController.SCOPE_ALL, null, null, 'Name', 'asc', 0, 10);
            System.assertEquals(5, accs.size()); // 1 ceo + 1 parent director + 2 childs director + 1 csr
        }
        // Test all scope with parent id
        System.runAs(director) {
            accs = (List<Account>)SmartListController.getPage('Test', 'ParentId = PARENTID', SmartListController.SCOPE_MY, null, parentAcc.Id, 'Name', 'asc', 0, 10);
            System.assertEquals(2, accs.size()); // 2 director -> childs
        }
        // Test ceo: error, no list context
        System.runAs(ceo) {
            Boolean error = false;
            try {
            	accs = (List<Account>)SmartListController.getPage('Test', null, SmartListController.SCOPE_MY_TEAM, null, null, 'Name', 'asc', 0, 10);
            } catch (Exception e) {
                error = true;
            }
            System.assertEquals(true, error);
        }    
        // Test team scope
        System.runAs(ceo) {
            SmartListTestDataFactory.createAccountListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
            SmartListController.getListParameters('Test', null, false);
            accs = (List<Account>)SmartListController.getPage('Test', null, SmartListController.SCOPE_MY_TEAM, null, null, 'Name', 'asc', 0, 10);
            System.assertEquals(5, accs.size()); // 1 ceo + 1 parent director + 2 childs director + 1 csr
        }    
        // Test subordinate scope with filter
        System.runAs(ceo) {
        	accs = (List<Account>)SmartListController.getPage('Test', 'ParentId = PARENTID', SmartListController.SCOPE_MY_SUBORDINATES, null, parentAcc.Id, 'Name', 'asc', 0, 10);
            System.debug('Accounts ' + accs);
            System.assertEquals(2, accs.size()); // 2 director
        }
        // Test subordinate scope without filter
        System.runAs(ceo) {
        	accs = (List<Account>)SmartListController.getPage('Test', null, SmartListController.SCOPE_MY_SUBORDINATES, null, null, 'Name', 'asc', 0, 10);
            System.assertEquals(3, accs.size()); // 2 director child + parent
        }
        //  Test subordinate scope without role
        System.runAs(noRole) {
            SmartListTestDataFactory.createAccountListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
            SmartListController.getListParameters('Test', null, false);
        	accs = (List<Account>)SmartListController.getPage('Test', null, SmartListController.SCOPE_MY_SUBORDINATES, null, null, 'Name', 'asc', 0, 10);
            System.assertEquals(0, accs.size());
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetPageSoqlQueues() {
        // Create 3 queues: user member of 1-2 but not 3
        List<Group> queues = SmartListTestDataFactory.createCaseQueues();
        Account acc1 = SmartListTestDataFactory.createAccount('account');
        Account acc2 = SmartListTestDataFactory.createAccount('account');
        Case c1 = SmartListTestDataFactory.createCase('case0', queues.get(0).Id, acc2.Id);
        Case c2 = SmartListTestDataFactory.createCase('case1', queues.get(1).Id, acc2.Id);
        Case c3 = SmartListTestDataFactory.createCase('case2', queues.get(2).Id, acc2.Id);
        
        SmartListTestDataFactory.createCaseListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.getListParameters('Test', null, false);
        
        List<Case> cs;
        Test.startTest();
        // Test 0 cases assigned to user queues for parent
       	cs = (List<Case>)SmartListController.getPage('Test', null, SmartListController.SCOPE_MY_QUEUES, null, acc1.Id, 'Subject', 'asc', 0, 10);
        /*cs = (List<Case>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Case', null, SmartListController.SCOPE_MY_QUEUES, 'Subject',
                null, null, null, 'Subject', 'asc', 0, 10);*/
		System.assertEquals(0, cs.size()); // 0 cases assigned to running user queue with parent account == acc1
        // Test 2 cases assigned to user queues for parent
        c1.AccountId = acc1.Id;
        update c1;
        c2.AccountId = acc1.Id;
        update c2;
       	cs = (List<Case>)SmartListController.getPage('Test', null, SmartListController.SCOPE_MY_QUEUES, null, acc1.Id, 'Subject', 'asc', 0, 10);
		System.assertEquals(2, cs.size()); // 2 cases assigned to running user queue with parent account == acc1
        Test.stopTest();
    }
    
    @isTest
    static void testGetPageSoqlQueuesNoMembership() {
        Account acc1 = SmartListTestDataFactory.createAccount('account');
		Case c1 = SmartListTestDataFactory.createCase('case0', UserInfo.getUserId(), acc1.Id);
        SmartListTestDataFactory.createCaseListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.getListParameters('Test', null, false);
        
        List<Case> cs;

        Test.startTest();
        cs = (List<Case>)SmartListController.getPage('Test', null, SmartListController.SCOPE_MY_QUEUES, null, acc1.Id, 'Subject', 'asc', 0, 10);
		System.assertEquals(0, cs.size()); // User not assigned to queues
        Test.stopTest();
    }
    
    @isTest
    static void testGetPageApex() {
    	SmartListTestDataFactory.createApexListDefinition();
        SmartListController.getListParameters('Test', null, false);
        
        Test.startTest();
        List<Account> accs = (List<Account>)SmartListController.getPage('Test', null, SmartListController.SCOPE_MY, null, null, 'Name', 'asc', 0, 10);
        Test.stopTest();
    }
    
    @isTest
    static void testGetRecordSOQL() {
        Account acc = SmartListTestDataFactory.createAccount('Test');
       	SmartListTestDataFactory.createAccountListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.getListParameters('Test', null, false);

        Test.startTest();
        // Test OK
        List<Account> accs = (List<Account>)SmartListController.getRecord('Test', acc.Id);
        System.assertEquals(1, accs.size());
        // Test DML Error: wrong fields
        List<Context__c> context = [SELECT Id, Query_Fields__c FROM Context__c LIMIT 1];
        context.get(0).Query_Fields__c = 'Field1,Field2';
        update context;
        
        Boolean error = false;
        try {
        	accs = (List<Account>)SmartListController.getRecord('Test', acc.Id);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }
    
    @isTest
    static void testGetRecordApex() {
        Account acc = SmartListTestDataFactory.createAccount('Test');
        SmartListTestDataFactory.createApexListDefinition();
        SmartListController.getListParameters('Test', null, false);
        
       	Test.startTest();
        List<Account> accs = (List<Account>)SmartListController.getRecord('Test', acc.Id);
        System.assertEquals(null, accs);
        Test.stopTest();
    }

    @isTest
    static void testBuildFilter() {
        // Encrypted string
        SmartListController.FilterEntry fe1 = new SmartListController.FilterEntry();
        fe1.fieldName = 'String';
        fe1.operator = '=';
        fe1.values = new List<String>();
        fe1.values.add('StringValue');
        fe1.type = 'STRING';
        // Time
        SmartListController.FilterEntry fe2 = new SmartListController.FilterEntry();
        fe2.fieldName = 'Time';
        fe2.operator = '>=';
        fe2.values = new List<String>();
        fe2.values.add('17:00:00.000');
        fe2.type = 'time';
        List<SmartListController.FilterEntry> fes = new List<SmartListController.FilterEntry> {fe1, fe2};

        Test.startTest();
        SmartListController.buildFilter(fes);
        Test.stopTest();
    }
    
   @isTest
    static void testRunFlow() {
        Test.startTest();
        Boolean error = false;
        try {
            SmartListController.runFlow('Invalid', null, null);
        } catch (Exception ex) {
            error = true;
        }
        System.assertEquals(true, error);
        Test.stopTest();
    }

    @isTest(seeAllData=false)
    static void testGetRecentRecordsWithoutFilter() {
        Account acc1 = SmartListTestDataFactory.createAccount('AccTest1');
        Account acc2 = SmartListTestDataFactory.createAccount('AccTest2');
        List<Account> accs = [SELECT Id FROM Account FOR VIEW];

        Test.startTest();
        String jsonstr = SmartListController.lookupGetRecentRecords('Account', 'Name', 'Site', null);
        List<Object> recents = (List<Object>)JSON.deserializeUntyped(jsonstr);
        System.assert(recents.size() == 2);
        Test.stopTest();
    }

    @isTest(seeAllData=false)
    static void testGetRecentRecordsWithFilter() {
        Account acc1 = SmartListTestDataFactory.createAccount('AccTest1');
        Account acc2 = SmartListTestDataFactory.createAccount('AccTest2');
        List<Account> accs = [SELECT Id FROM Account FOR VIEW];

        Test.startTest();
        String jsonstr = SmartListController.lookupGetRecentRecords('Account', 'Name', 'Site', 'Name = \'AccTest1\'');
        List<Object> recents = (List<Object>)JSON.deserializeUntyped(jsonstr);
        System.assert(recents.size() == 1);
        Test.stopTest();
    }

    @isTest
    static void testSearchRecordsWithoutFilter() {
        Account acc1 = SmartListTestDataFactory.createAccount('AccTest1');
        Account acc2 = SmartListTestDataFactory.createAccount('AccTest2');
        Id[] fixedSearchResults = new Id[] {acc1.Id, acc2.Id};
        Test.setFixedSearchResults(fixedSearchResults);

        Test.startTest();
        String jsonstr = SmartListController.lookupSearchRecords('Acc', 'Account', 'Name', null, null);
        List<Object> records = (List<Object>)JSON.deserializeUntyped(jsonstr);
        System.assert(records.size() == 2);
        Test.stopTest();
    }
    
    @isTest
    static void testSearchRecordsWithFilter() {
        Account acc1 = SmartListTestDataFactory.createAccount('AccTest1');
        Account acc2 = SmartListTestDataFactory.createAccount('AccTest2');
        Id[] fixedSearchResults = new Id[] {acc1.Id, acc2.Id};
        Test.setFixedSearchResults(fixedSearchResults);

        Test.startTest();
        String jsonstr = SmartListController.lookupSearchRecords('Acc', 'Account', 'Name', null, 'Name = \'AccTest1\'');
        List<Object> records = (List<Object>)JSON.deserializeUntyped(jsonstr);
        System.assert(records.size() == 1);
        Test.stopTest();
    }
}