@isTest
public class SmartListControllerTest {
    // Test error: no list passed
    @isTest
    static void testGetInitParametersErrorNoList(){
        boolean  error = false;
        try {
            SmartListController.getListParameters(null, null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
    }

    // Test error: invalid list name
    @isTest
    static void testGetInitParametersErrorInvalidList(){
        boolean  error = false;
        try {
            SmartListController.getListParameters('Invalid', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
    }

    // Test error: list with no fields
    @isTest
    static void testGetInitParametersErrorNoFields(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields = new Smart_List_Field__mdt[] {};
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
    }

    // Test error: list with invalid object
    @isTest
    static void testGetInitParametersErrorInvalidObject(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listDefinition[0].SObject__c = 'Invalid';
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
    }

    // Test error: list with invalid field name
    @isTest
    static void testGetInitParametersErrorInvalidFieldName(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Field_Name__c = 'Invalid';
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
    }

    // Test error: list with invalid relationship name
    @isTest
    static void testGetInitParametersErrorInvalidRelationshipName(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Field_Name__c = 'Invalid.Name';
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
    }

    // Test error: list with invalid related field name
    @isTest
    static void testGetInitParametersErrorInvalidRelatedFieldName(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Field_Name__c = 'Account.Invalid';
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
    }

    // Test error: list with invalid polymorphic relationship
    @isTest
    static void testGetInitParametersErrorInvalidPolymorphicRelationship(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Field_Name__c = 'Owner.Id';
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
    }

    // Test error: list with invalid default sort field
    @isTest
    static void testGetInitParametersErrorInvalidDefaultSortField(){
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Field_Name__c = 'Description';
        SmartListController.listFields[0].Default_Sort_Field__c = true;
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
    }

    // Test error: object not accessible
    @isTest
    static void testGetInitParametersErrorObjectNotAccessible(){
        boolean  error = false;
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id; 
        User u = SmartListTestDataFactory.createTestUser(profileId, null);
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listDefinition[0].SObject__c = 'UserProvisioningRequest';
        System.runAs(u) {
            try {
                SmartListController.getListParameters('List', null, false);
            } catch (Exception e) {
                error = true;
            }
            System.assertEquals(true, error);
        }
    }

    // Test error: unsupported data type
    @isTest
    static void testGetInitParametersErrorUnsupportedDataType(){
        SmartListTestDataFactory.createFilesListDefinition();
        SmartListController.listFields[0].Field_Name__c = 'VersionData';
        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
    }

    @isTest
    static void testGetInitParametersWithDirectParent() {
        SmartListTestDataFactory.createFilesListDefinition();
        Account parentAcc = SmartListTestDataFactory.createAccount('Parent');
        String parmsStr = SmartListController.getListParameters('List', parentAcc.Id, false);
    }

    @isTest
    static void testGetInitParametersWithTileAndIndirectParent() {
        SmartListTestDataFactory.createFilesListDefinition();
        SmartListController.listDefinition[0].Tile_Layout__c = '2x2';
        SmartListController.listDefinition[0].Parent_Object__c = 'Account';
        SmartListController.listDefinition[0].Parent_Key_Field__c = 'ParentId';
        Account parentAcc = SmartListTestDataFactory.createAccount('Parent');
        String parmsStr = SmartListController.getListParameters('List', parentAcc.Id, false);
    }

    @isTest
    static void testGetInitParametersFilesWithoutPermissions(){
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id; 
        User u = SmartListTestDataFactory.createTestUser(profileId, null);
        SmartListTestDataFactory.createFilesListDefinition();

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
    }

    @isTest
    static void testGetInitParametersFilesWithPermissions(){
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id; 
        User u = SmartListTestDataFactory.createTestUser(profileId, null);
        SmartListTestDataFactory.assignCustomPermissions(u, new String[] 
            { 'SmartFilesList_Preview_Files', 'SmartFilesList_Download_Files', 'SmartFilesList_Upload_Files', 'SmartFilesList_View_File_Details',
              'SmartFilesList_Edit_File_Details', 'SmartFilesList_Delete_File', 'SmartFilesList_Upload_New_Version' });
        SmartListTestDataFactory.createFilesListDefinition();

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
    }

    @isTest
    static void testGetInitParametersApex() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_APEX);
        String parmsStr = SmartListController.getListParameters('ListApex', null, false);
        Map<String, Object> parms = (Map<String, Object>)JSON.deserializeUntyped(parmsStr);
        Map<String, Object> fields = (Map<String, Object>)parms.get('fields');
        System.assertEquals(6, fields.size());
    }
    
    @isTest
    static void testGetInitParametersApexInvalidClass() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_APEX);

        SmartListController.listDefinition[0].Data_Provider_Class__c = 'InvalidClass';
        Boolean error = false;
        try {
            SmartListController.getListParameters('ListApex', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
    }
    
    @isTest
    static void testGetInitParametersApexClassWithoutSmartListApexSourceInterface2() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_APEX);

        SmartListController.listDefinition[0].Data_Provider_Class__c = 'SmartListController';
        Boolean error = false;
        try {
            SmartListController.getListParameters('ListApex', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
    }
    
    @isTest
    static void testGetInitParametersSOQLWithoutPermission() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id; 
        User u = SmartListTestDataFactory.createTestUser(profileId, null);
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
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
    }
    
    @isTest
    static void testGetInitParametersSOQLWithPermission() {
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id; 
        User u = SmartListTestDataFactory.createTestUser(profileId, null);
        SmartListTestDataFactory.assignCustomPermissions(u, new String[] { 'SmartFilesList_Delete_File' });
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);

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

        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
    } 

    @isTest
    static void testGetInitParametersErrorOwnerFieldOnObjectWithoutOwner() {
        SmartListTestDataFactory.createListDefinitionForRecordType('User');
        SmartListController.listFields[1].Field_Name__c = 'Owner';

        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
    }  

    @isTest
    static void testGetInitParametersErrorFieldAddTwice() {
        SmartListTestDataFactory.createListDefinitionForRecordType('User');
        SmartListController.listFields[1].Field_Name__c = 'Name';

        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
    }  

    /*@isTest
    static void testGetInitParametersErrorInvalidHyperlinkField() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[0].Hyperlink_to_Detail_Id_Field__c = 'InvalidField';

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

        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
    }

    @isTest
    static void testGetInitParametersErrorInvalidSubtitleField() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[3].Lookup_in_Quick_Filters__c = true;
        SmartListController.listFields[3].Lookup_Subtitle_Field__c = 'InvalidField';

        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
    }

    @isTest
    static void testGetInitParametersErrorInvalidDataTypeOnLookupSubtitle() {
        SmartListTestDataFactory.createListDefinition(SmartListController.DATASOURCE_SOQL_WITH_SHARING);
        SmartListController.listFields[3].Lookup_in_Quick_Filters__c = true;
        SmartListController.listFields[3].Lookup_Subtitle_Field__c = 'AnnualRevenue';

        boolean  error = false;
        try {
            SmartListController.getListParameters('List', null, false);
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);  
    }
    
    @isTest
    static void testGetQuickFilterOperator() {
        List<String> rangeDataTypes = new List<String>{'DATE', 'DATETIME', 'TIME', 'CURRENCY', 'DECIMAL', 'DOUBLE', 'INTEGER', 'LONG', 'PERCENT'};
        List<String> equalDataTypes = new List<String>{'BOOLEAN', 'LOOKUP'};
        List<String> textDataTypes = new List<String>{'EMAIL', 'PHONE', 'TEXT', 'TEXTAREA', 'URL'};
        String operator;
        for (String dataType : rangeDataTypes) {
            operator = SmartListController.getQuickFiltersOperator(dataType, false, true);
            System.assertEquals('>=', operator);
            operator = SmartListController.getQuickFiltersOperator(dataType, false, false);
            System.assertEquals('<=', operator);
        }
        operator = SmartListController.getQuickFiltersOperator('MULTIPICKLIST', false, true);
        System.assertEquals('INCLUDES', operator);
        operator = SmartListController.getQuickFiltersOperator('PICKLIST', false, true);
        System.assertEquals('IN', operator);
        for (String dataType : equalDataTypes) {
            operator = SmartListController.getQuickFiltersOperator(dataType, false, true);
            System.assertEquals('=', operator);
        }
        for (String dataType : textDataTypes) {
            operator = SmartListController.getQuickFiltersOperator(dataType, false, true);
            System.assertEquals('LIKE', operator);
            operator = SmartListController.getQuickFiltersOperator(dataType, true, true);
            System.assertEquals('=', operator);
        }
    }

    @isTest
    static void testGetPageFiles() {
        String profileId = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1].Id; 
        User u = SmartListTestDataFactory.createTestUser(profileId, null);
        
        System.runAs(u) {
            Account acc = SmartListTestDataFactory.createAccount('Test');
			SmartListTestDataFactory.FileData fd1 = SmartListTestDataFactory.createNewFile(acc, 'Test1', 'jpg');
			SmartListTestDataFactory.FileData fd2 = SmartListTestDataFactory.createNewFile(acc, 'Test2', 'jpg');
			SmartListTestDataFactory.FileData fd3 = SmartListTestDataFactory.createNewFile(acc, 'ABC', 'jpg');
            String queryFields = 'Description';
            String sortFields = 'Title';
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
            /*getPage(String dataSourceType, String dataProviderClass, String objectName, String listFilter, String soqlScope, String queryFields, 
        List<FilterEntry> filterEntries, String parentIdField, String parentId, String sortField, String sortDirection, Integer offset, Integer pageSize)*/
            Test.startTest();
            //Test SOQL with records
        	List<ContentVersion> files = (List<ContentVersion>)SmartListController.getPage('Files', null, 'ContentVersion', null, 'everything', queryFields, fes, 
                null, acc.Id, sortFields, sortDirection, offset, pageSize);
            System.assertEquals(2, files.size());
            System.assertEquals(fd1.cvId, files[0].Id);
            System.assertEquals(fd2.cvId, files[1].Id);

            //Test SOQL with records no parent
        	files = (List<ContentVersion>)SmartListController.getPage('Files', null, 'ContentVersion', null, 'everything', queryFields, fes, 
                null, null, sortFields, sortDirection, offset, pageSize);
            System.assertEquals(0, files.size());

            // Test SOQL without records
            Account acc2 = SmartListTestDataFactory.createAccount('Test2');
        	files = (List<ContentVersion>)SmartListController.getPage('Files', null, 'ContentVersion', null, 'everything', queryFields, fes, 
                null, acc2.Id, sortFields, sortDirection, offset, pageSize);
            System.assertEquals(0, files.size());

            // Test DMLException Wrong field
            Boolean error = false;
            try { 
                SmartListController.getPage('Files', null, 'ContentVersion', null, 'everything', 'WrongField', fes, null, acc.Id,
                    sortFields, sortDirection, offset, pageSize);
            } catch(Exception ex) {
            	error = true;
        	}
            System.assertEquals(true, error);

            // Test SOSL
            fes.clear();
            fe1 = new SmartListController.FilterEntry();
            fe1.fieldName = 'SOSLSearch';
            fe1.operator = '=';
            fe1.values = new List<String>();
            fe1.values.add('Test');
            fes.add(fe1);
        	files = (List<ContentVersion>)SmartListController.getPage('Files', null, 'ContentVersion', null, SmartListController.SCOPE_MY, queryFields, fes, null, acc.Id,
                sortFields, sortDirection, offset, pageSize);
            // System.assertEquals(2, files.size()); Can't test: files not yet indexed
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
        fe1.values.add('Child');
        fe1.type = 'text';
        fes.add(fe1);
        System.runAs(director) {
            parentAcc = SmartListTestDataFactory.createAccount('Parent');
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
        // Test mine scope with filters
        System.runAs(director) {
            accs = (List<Account>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Account', 'CreatedById = USERID AND 	ParentId = PARENTID',
                SmartListController.SCOPE_MY, 'Name', fes, 'ParentId', parentAcc.Id, 'Name', 'asc', 0, 10);
            System.assertEquals(2, accs.size()); // 2 director
        }
        // Test mine scope without filters
        System.runAs(director) {
            accs = (List<Account>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Account', null, SmartListController.SCOPE_MY, 
				'Name', null, 'ParentId', parentAcc.Id, 'Name', 'asc', 0, 10);
            System.assertEquals(2, accs.size()); // 2 director
        }
        // Test all scope
        System.runAs(director) {
            accs = (List<Account>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Account', null, SmartListController.SCOPE_ALL,
                'Name', null, 'ParentId', parentAcc.Id, 'Name', 'asc', 0, 10);
            System.assertEquals(4, accs.size()); // 1 ceo + 2 director + 1 csr
        }
        // Test all scope no parent id
        System.runAs(director) {
            accs = (List<Account>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Account', null, SmartListController.SCOPE_ALL, 
                'Name', null, 'ParentId', null, 'Name', 'asc', 0, 10);
            System.assertEquals(0, accs.size());
        }
        // Test team scope
        System.runAs(ceo) {
            accs = (List<Account>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Account', null, SmartListController.SCOPE_MY_TEAM,
                'Name', null, 'ParentId', parentAcc.Id, 'Name', 'asc', 0, 10);
            System.assertEquals(4, accs.size()); // 1 ceo + 2 director + 1 csr
        }        
        // Test subordinate scope with filter
        System.runAs(ceo) {
            accs = (List<Account>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Account', null, SmartListController.SCOPE_MY_SUBORDINATES, 
                'Name, Owner.Name', null, 'ParentId', parentAcc.Id, 'Name', 'asc', 0, 10);
            System.debug('Accounts ' + accs);
            System.assertEquals(2, accs.size()); // 2 director
        }        
        // Test subordinate scope without filter
        System.runAs(ceo) {
            accs = (List<Account>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Account', null, SmartListController.SCOPE_MY_SUBORDINATES, 
                'Name', null, null, null, 'Name', 'asc', 0, 10);
            System.assertEquals(3, accs.size()); // 2 director child + parent
        }
        //  Test subordinate scope without role
        System.runAs(noRole) {
            accs = (List<Account>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Account', null, SmartListController.SCOPE_MY_SUBORDINATES,
                'Name', null, null, null, 'Name', 'asc', 0, 10);
            System.assertEquals(0, accs.size());
        }
        // Test no parents without filter entries
        System.runAs(director) {
            accs = (List<Account>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Account', null, SmartListController.SCOPE_MY, 'Name',
                null, null, null, 'Name', 'asc', 0, 10);
            System.assertEquals(3, accs.size()); // 2 director child + parent
        }
        // Test no parents with filter entries
        System.runAs(director) {
            accs = (List<Account>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Account', null, SmartListController.SCOPE_MY, 
				'Name', fes, null, null, 'Name', 'asc', 0, 10);
            System.assertEquals(2, accs.size()); // 2 director child
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetPageSoqlQueues() {
        List<Group> queues = SmartListTestDataFactory.createCaseQueues();
        Account acc = SmartListTestDataFactory.createAccount('account');
        Case c1 = SmartListTestDataFactory.createCase('case0', queues.get(0).Id);
        Case c2 = SmartListTestDataFactory.createCase('case1', queues.get(1).Id);
        Case c3 = SmartListTestDataFactory.createCase('case2', queues.get(2).Id);
        List<Case> cs;
        // Test no parent
        cs = (List<Case>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Case', null, SmartListController.SCOPE_MY_QUEUES, 'Subject',
                null, null, null, 'Subject', 'asc', 0, 10);
		System.assertEquals(2, cs.size()); // 2 cases assigned to running user
        // Test with parent
        c1.AccountId = acc.Id;
        update c1;
        cs = (List<Case>)SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Case', null, SmartListController.SCOPE_MY_QUEUES, 'Subject',
                null, 'AccountId', acc.Id, 'Subject', 'asc', 0, 10);
        // Test no queues
        SmartListController.getPage(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, 'Account', null, SmartListController.SCOPE_MY_QUEUES, 'Name',
                null, null, null, 'Name', 'asc', 0, 10);
    }
    
    @isTest
    static void testGetPageApex() {
        SmartListController.getPage(SmartListController.DATASOURCE_APEX, 'SmartListTestApexDataSource', 'Account', null, SmartListController.SCOPE_MY, 
                                    'Name', null, 'null', null, 'Name', 'asc', 0, 10);
    }
    @isTest
    static void testGetRecord() {
        Account acc = SmartListTestDataFactory.createAccount('Test');
        Test.startTest();
        // Test OK
        List<Account> accs = (List<Account>)SmartListController.getRecord(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, acc.Id, 'Account', 'Id, Name');
        System.assertEquals(1, accs.size());
        // Test DML Error
        Boolean error = false;
        try {
            SmartListController.getRecord(SmartListController.DATASOURCE_SOQL_WITH_SHARING, null, acc.Id, 'Invalid', 'Id, Name');
        } catch (Exception e) {
            error = true;
        }
        System.assertEquals(true, error);
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
        SmartListController.buildFilter(fes);
    }
    
   @isTest
    static void testRunFlow() {
        Boolean error = false;
        try {
            SmartListController.runFlow('Invalid', null, null);
        } catch (Exception ex) {
            error = true;
        }
        System.assertEquals(true, error);
    }

    @isTest
    static void testApexGetPage() {
        SmartListController.getPage(SmartListController.DATASOURCE_APEX, 'SmartListApexSourceTest', null, null, null, null, null, null, null, null, null, 0, 0);
    }

    @isTest
    static void testApexGetRecord() {
        SmartListController.getRecord(SmartListController.DATASOURCE_APEX, 'SmartListApexSourceTest', null, null, null);
    }

    @isTest(seeAllData=false)
    static void testGetRecentRecords() {
        Account acc1 = SmartListTestDataFactory.createAccount('AccTest1');
        Account acc2 = SmartListTestDataFactory.createAccount('AccTest2');
        List<Account> accs = [SELECT Id FROM Account FOR VIEW];
        Test.startTest();
        String recent = SmartListController.lookupGetRecentRecords('Account', 'Site');
        List<Object> recents = (List<Object>)JSON.deserializeUntyped(recent);
        System.assert(recents.size() >= 2);
        Test.stopTest();
    }

    @isTest
    static void testSearchRecords() {
        Account acc1 = SmartListTestDataFactory.createAccount('AccTest1');
        Account acc2 = SmartListTestDataFactory.createAccount('AccTest2');
        Id[] fixedSearchResults = new Id[] {acc1.Id, acc2.Id};
        Test.setFixedSearchResults(fixedSearchResults);
        Test.startTest();
        SmartListController.lookupSearchRecords('Acc', 'Account', 'Name', null);
        Test.stopTest();
    }
}