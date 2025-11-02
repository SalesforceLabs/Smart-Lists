public class SmartListTestDataFactory {
    public static UserRole createUserRole(String name, String parentRoleId) {
        UserRole role = new UserRole(Name = name, ParentRoleId = parentRoleId);
        insert role;
        return role;
    }

    public static User createTestUser(String profileId, String roleId) {
        String orgId = UserInfo.getOrganizationId();  
        String dateString = String.valueof(Datetime.now()).replace(' ','').replace(':','').replace('-','');  
        Integer randomInt = Integer.valueOf(math.rint(math.random()*1000000));  
        String uniqueName = orgId + dateString + randomInt;  
        User testUser = new User(  FirstName = 'FirstName',  
                                LastName = 'LastName',  
                                email = uniqueName + '@test' + orgId + '.org',  
                                Username = uniqueName + '@test' + orgId + '.org',  
                                EmailEncodingKey = 'ISO-8859-1',  
                                Alias = uniqueName.substring(18, 23),  
                                TimeZoneSidKey = 'America/Los_Angeles',  
                                LocaleSidKey = 'en_US',  
                                LanguageLocaleKey = 'en_US',  
                                ProfileId = profileId,  
                                UserRoleId = roleId );  
        insert testUser;  
        return testUser;  
    }
    
    public static void assignCustomPermissions(User u, String[] permissions) {
        PermissionSet ps = new PermissionSet(Name = 'PS', Label = 'PS');
  		insert ps;
        
         PermissionSetAssignment psa = new PermissionSetAssignment(
    		AssigneeId = u.Id,
    		PermissionSetId = ps.Id
  		);
        
        insert psa;        
        List<CustomPermission> perms = [SELECT Id FROM CustomPermission WHERE DeveloperName = :permissions];
        List<SetupEntityAccess> seas = new List<SetupEntityAccess>();
        for (CustomPermission perm : perms) {
			SetupEntityAccess sea = new SetupEntityAccess(ParentId = ps.Id, SetupEntityId = perm.Id);
            seas.add(sea);
        }
        insert seas;
        
    }

    public static void createListDefinition(String type) {
        Smart_List_Definition__mdt listDef = new Smart_List_Definition__mdt();
        listDef.DeveloperName = 'Test';
        listDef.Data_Source_Type__c = type;
        listDef.Data_Provider_Class__c = 'SmartListTestApexDataSource';
        listDef.List_Icon__c = 'standard:case';
        listDef.List_Label__c = '$Label.LookupQueues';
        listDef.Maximum_number_of_records__c = 2000;
        listDef.Number_of_records_per_page__c = 10;
        listDef.Enable_CRUD_Actions__c = true;
        listDef.Parent_Id_Field__c = null;
        listDef.SObject__c = 'Case';
        listDef.SOQL_Default_Scope__c = 'everything';
        listDef.SOQL_Scope_All__c = true;
        listDef.SOQL_Scope_My__c = true;
        listDef.SOQL_Scope_My_Team__c = true;
        listDef.SOQL_Scope_My_Subordinates__c = true;
        listDef.SOQL_Scope_My_Queues__c = true;
        listDef.Default_Sort_Direction__c = 'asc';
        listDef.Display_Quick_Filters_All_the_Time__c = false;
        listDef.Filters_Panel_Layout__c = '	LeftAT';
        listDef.Show_SOSL_Search_in_Quick_Filter__c = false;
        listDef.Max_Row_Selected__c = 2000;
        listDef.Selectable_Rows__c = true;
        listDef.Show_List_Header__c = true;
        listDef.Show_Row_Number_Column__c = false;
        listDef.Row_Number_Start__c = 0;
        listDef.Allowed_Extensions__c = 'jpg';
        SmartListController.listDefinition = new Smart_List_Definition__mdt[] { listDef };

        Smart_List_Field__mdt field1 = new Smart_List_Field__mdt();
        field1.Field_Label__c = '$Label.XYZ';
        field1.Field_Name__c = 'CaseNumber';
        field1.Display_Type__c = 'HYPERLINK_DETAIL';
        field1.Hyperlink_to_Detail_Id_Field__c = 'Id';
        field1.List_Field__c = true;
        field1.Quick_Filters_Field__c = 'Yes if Filterable';
        field1.Sortable_in_List__c = 'Yes if Sortable';
        field1.Default_Sort_Field__c = true;
        Smart_List_Field__mdt field2 = new Smart_List_Field__mdt();
        field2.Field_Label__c = '$Label.XYZ';
        field2.Field_Name__c = 'Subject';
        field2.Display_Type__c = 'STRING';
        field2.List_Field__c = true;
        field2.Quick_Filters_Field__c = 'Yes if Filterable';
        Smart_List_Field__mdt field3 = new Smart_List_Field__mdt();
        field3.Field_Name__c = 'Type';
        field3.Display_Type__c = 'STRING';
        field3.List_Field__c = true;
        field3.Quick_Filters_Field__c = 'Yes if Filterable';
        field3.Display_as_Badge__c = true;
        field3.Badge_Style_Field__c = 'Status';
        Smart_List_Field__mdt field4 = new Smart_List_Field__mdt();
        field4.Field_Name__c = 'Account.Name';
        field4.Display_Type__c = 'STRING';
        field4.List_Field__c = true;
        field4.Quick_Filters_Field__c = 'Yes if Filterable';
        field4.Lookup_in_Quick_Filters__c = true;
        field4.Lookup_Subtitle_Field__c = 'Site';
        field4.URL_Value__c = 'CaseNumber';
        Smart_List_Field__mdt field5 = new Smart_List_Field__mdt();
        field5.Field_Name__c = 'Owner';
        field5.List_Field__c = true;
        field5.Quick_Filters_Field__c = 'Yes if Filterable';
        Smart_List_Field__mdt field6 = new Smart_List_Field__mdt();
        field6.Field_Name__c = 'ClosedDate';
        field6.List_Field__c = true;
        field6.Quick_Filters_Field__c = 'Yes if Filterable';
        SmartListController.listFields = new Smart_List_Field__mdt[] { field1, field2, field3, field4, field5, field6 };

        Smart_List_Filter__mdt filter1 = new Smart_List_Filter__mdt();
        filter1.SOQL_Filter__c = 'Name = \'ABC\'';
        filter1.Filter_Label__c = '$Label.XYZ';
        filter1.Default_Filter__c = true;
        Smart_List_Filter__mdt filter2 = new Smart_List_Filter__mdt();
        filter2.SOQL_Filter__c = 'CreatedById = USERID AND AccountId = PARENTID';
        filter2.Filter_Label__c = '$Label.XYZ';
        filter2.Default_Filter__c = false;
        SmartListController.listFilters = new Smart_List_Filter__mdt[] { filter1, filter2 };     

        Smart_List_Action__mdt action1 = new Smart_List_Action__mdt();
        action1.type__c = 'List Action';
        action1.DeveloperName = 'Action1';
        action1.Action_Label__c = '$Label.XZYZ';
        action1.Category__c = 'Auto-launched Flow';
        action1.Flow_Name__c = 'Flow';
        action1.Refresh_After_Execution__c = 'List';
        action1.Custom_Permission__c = 'SmartFilesList_Delete_File';
        Smart_List_Action__mdt action2 = new Smart_List_Action__mdt();
        action2.type__c = 'Row Action';
        action2.DeveloperName = 'Action2';
        action2.Action_Label__c = '$Label.XZYZ';
        action2.Category__c = 'Auto-launched Flow';
        action2.Flow_Name__c = 'Flow';
        action2.Refresh_After_Execution__c = 'Row';
        SmartListController.listActions = new Smart_List_Action__mdt[] { action1, action2};
    }
    
    public static void createListDefinitionForRecordType(String objectName) {
        Smart_List_Definition__mdt listDef = new Smart_List_Definition__mdt();
        listDef.DeveloperName = 'Test';
        listDef.Data_Source_Type__c = 'SOQL with Sharing';
        listDef.List_Icon__c = 'standard:lead';
        listDef.List_Label__c = '$Label.LookupQueues';
        listDef.Maximum_number_of_records__c = 2000;
        listDef.Number_of_records_per_page__c = 10;
        listDef.Enable_CRUD_Actions__c = true;
        listDef.Parent_Id_Field__c = null;
        listDef.SObject__c = objectName;
        listDef.SOQL_Default_Scope__c = 'everything';
        listDef.SOQL_Scope_All__c = true;
        listDef.SOQL_Scope_My__c = true;
        listDef.SOQL_Scope_My_Team__c = true;
        listDef.Default_Sort_Direction__c = 'asc';
        listDef.Display_Quick_Filters_All_the_Time__c = false;
        listDef.Show_SOSL_Search_in_Quick_Filter__c = false;
        listDef.Max_Row_Selected__c = 2000;
        listDef.Selectable_Rows__c = true;
        listDef.Show_List_Header__c = true;
        listDef.Show_Row_Number_Column__c = false;
        listDef.Row_Number_Start__c = 0;
        listDef.Allowed_Extensions__c = 'jpg';
        SmartListController.listDefinition = new Smart_List_Definition__mdt[] { listDef };

        Smart_List_Field__mdt field1 = new Smart_List_Field__mdt();
        field1.Field_Name__c = 'Name';
        field1.List_Field__c = true;
        field1.Sortable_in_List__c = 'Yes if Sortable';
        field1.Default_Sort_Field__c = true;
        Smart_List_Field__mdt field2 = new Smart_List_Field__mdt();
        field2.Field_Label__c = 'RecordType';
        field2.Field_Name__c = 'RecordType';
        field2.List_Field__c = true;
        SmartListController.listFields = new Smart_List_Field__mdt[] { field1, field2 };
    }
    public static void createAccountListDefinition(String type) {
        Smart_List_Definition__mdt listDef = new Smart_List_Definition__mdt();
        listDef.DeveloperName = 'Test';
        listDef.Data_Source_Type__c = type;
        listDef.Data_Provider_Class__c = null;
        listDef.List_Icon__c = null;
        listDef.List_Label__c = null;
        listDef.Maximum_number_of_records__c = 2000;
        listDef.Number_of_records_per_page__c = 10;
        listDef.Enable_CRUD_Actions__c = true;
        listDef.Parent_Id_Field__c = null;
        listDef.SObject__c = 'Account';
        listDef.SOQL_Default_Scope__c = 'everything';
        listDef.SOQL_Scope_All__c = true;
        listDef.SOQL_Scope_My__c = true;
        listDef.SOQL_Scope_My_Team__c = true;
        listDef.SOQL_Scope_My_Subordinates__c = true;
        listDef.SOQL_Scope_My_Queues__c = true;
        listDef.Default_Sort_Direction__c = 'asc';
        listDef.Display_Quick_Filters_All_the_Time__c = false;
        listDef.Filters_Panel_Layout__c = '	LeftAT';
        listDef.Show_SOSL_Search_in_Quick_Filter__c = false;
        listDef.Max_Row_Selected__c = 2000;
        listDef.Selectable_Rows__c = true;
        listDef.Show_List_Header__c = true;
        listDef.Show_Row_Number_Column__c = false;
        listDef.Row_Number_Start__c = 0;
        listDef.Allowed_Extensions__c = 'jpg';
        SmartListController.listDefinition = new Smart_List_Definition__mdt[] { listDef };

        Smart_List_Field__mdt field1 = new Smart_List_Field__mdt();
        field1.Field_Label__c = '$Label.XYZ';
        field1.Field_Name__c = 'Name';
        field1.Display_Type__c = 'HYPERLINK_DETAIL';
        field1.Hyperlink_to_Detail_Id_Field__c = 'Id';
        field1.List_Field__c = true;
        field1.Quick_Filters_Field__c = 'Yes if Filterable';
        field1.Sortable_in_List__c = 'Yes if Sortable';
        field1.Default_Sort_Field__c = true;
        Smart_List_Field__mdt field2 = new Smart_List_Field__mdt();
        field2.Field_Label__c = '$Label.XYZ';
        field2.Field_Name__c = 'Site';
        field2.Display_Type__c = 'STRING';
        field2.List_Field__c = true;
        field2.Quick_Filters_Field__c = 'Yes if Filterable';
        Smart_List_Field__mdt field3 = new Smart_List_Field__mdt();
        field3.Field_Name__c = 'Type';
        field3.Display_Type__c = 'STRING';
        field3.List_Field__c = true;
        field3.Quick_Filters_Field__c = 'Yes if Filterable';
        field3.Display_as_Badge__c = true;
        field3.Badge_Style_Field__c = 'Rating';
        Smart_List_Field__mdt field4 = new Smart_List_Field__mdt();
        field4.Field_Name__c = 'Parent.Name';
        field4.Display_Type__c = 'STRING';
        field4.List_Field__c = true;
        field4.Quick_Filters_Field__c = 'Yes if Filterable';
        field4.Lookup_in_Quick_Filters__c = true;
        field4.Lookup_Subtitle_Field__c = 'Site';
        field4.URL_Value__c = '	Sic';
        Smart_List_Field__mdt field5 = new Smart_List_Field__mdt();
        field5.Field_Name__c = 'Owner';
        field5.List_Field__c = true;
        field5.Quick_Filters_Field__c = 'Yes if Filterable';
        Smart_List_Field__mdt field6 = new Smart_List_Field__mdt();
        field6.Field_Name__c = 'CreatedDate';
        field6.List_Field__c = true;
        field6.Quick_Filters_Field__c = 'Yes if Filterable';
        SmartListController.listFields = new Smart_List_Field__mdt[] { field1, field2, field3, field4, field5, field6 };

        Smart_List_Filter__mdt filter1 = new Smart_List_Filter__mdt();
        filter1.SOQL_Filter__c = 'Name = \'ABC\'';
        filter1.Filter_Label__c = '$Label.XYZ';
        filter1.Default_Filter__c = true;
        Smart_List_Filter__mdt filter2 = new Smart_List_Filter__mdt();
        filter2.SOQL_Filter__c = 'CreatedById = USERID AND AccountId = PARENTID';
        filter2.Filter_Label__c = '$Label.XYZ';
        filter2.Default_Filter__c = false;
        SmartListController.listFilters = new Smart_List_Filter__mdt[] { filter1, filter2 };     
    }
    
    public static void createCaseListDefinition(String type) {
        Smart_List_Definition__mdt listDef = new Smart_List_Definition__mdt();
        listDef.DeveloperName = 'Test';
        listDef.Data_Source_Type__c = type;
        listDef.Data_Provider_Class__c = null;
        listDef.List_Icon__c = 'standard:case';
        listDef.List_Label__c = '$Label.LookupQueues';
        listDef.Maximum_number_of_records__c = 2000;
        listDef.Number_of_records_per_page__c = 10;
        listDef.Enable_CRUD_Actions__c = true;
        listDef.Parent_Id_Field__c = 'AccountId';
        listDef.SObject__c = 'Case';
        listDef.SOQL_Default_Scope__c = 'everything';
        listDef.SOQL_Scope_All__c = true;
        listDef.SOQL_Scope_My__c = true;
        listDef.SOQL_Scope_My_Team__c = true;
        listDef.SOQL_Scope_My_Subordinates__c = true;
        listDef.SOQL_Scope_My_Queues__c = true;
        listDef.Default_Sort_Direction__c = 'asc';
        listDef.Display_Quick_Filters_All_the_Time__c = false;
        listDef.Filters_Panel_Layout__c = '	LeftAT';
        listDef.Show_SOSL_Search_in_Quick_Filter__c = false;
        listDef.Max_Row_Selected__c = 2000;
        listDef.Selectable_Rows__c = true;
        listDef.Show_List_Header__c = true;
        listDef.Show_Row_Number_Column__c = false;
        listDef.Row_Number_Start__c = 0;
        listDef.Allowed_Extensions__c = 'jpg';
        SmartListController.listDefinition = new Smart_List_Definition__mdt[] { listDef };

        Smart_List_Field__mdt field1 = new Smart_List_Field__mdt();
        field1.Field_Label__c = '$Label.XYZ';
        field1.Field_Name__c = 'CaseNumber';
        field1.Display_Type__c = 'HYPERLINK_DETAIL';
        field1.Hyperlink_to_Detail_Id_Field__c = 'Id';
        field1.List_Field__c = true;
        field1.Quick_Filters_Field__c = 'Yes if Filterable';
        field1.Sortable_in_List__c = 'Yes if Sortable';
        field1.Default_Sort_Field__c = true;
        Smart_List_Field__mdt field2 = new Smart_List_Field__mdt();
        field2.Field_Label__c = '$Label.XYZ';
        field2.Field_Name__c = 'Subject';
        field2.Display_Type__c = 'STRING';
        field2.List_Field__c = true;
        field2.Quick_Filters_Field__c = 'Yes if Filterable';
        Smart_List_Field__mdt field3 = new Smart_List_Field__mdt();
        field3.Field_Name__c = 'Type';
        field3.Display_Type__c = 'STRING';
        field3.List_Field__c = true;
        field3.Quick_Filters_Field__c = 'Yes if Filterable';
        field3.Display_as_Badge__c = true;
        field3.Badge_Style_Field__c = 'Status';
        Smart_List_Field__mdt field4 = new Smart_List_Field__mdt();
        field4.Field_Name__c = 'Account.Name';
        field4.Display_Type__c = 'STRING';
        field4.List_Field__c = true;
        field4.Quick_Filters_Field__c = 'Yes if Filterable';
        field4.Lookup_in_Quick_Filters__c = true;
        field4.Lookup_Subtitle_Field__c = 'Site';
        field4.URL_Value__c = 'CaseNumber';
        Smart_List_Field__mdt field5 = new Smart_List_Field__mdt();
        field5.Field_Name__c = 'Owner';
        field5.List_Field__c = true;
        field5.Quick_Filters_Field__c = 'Yes if Filterable';
        Smart_List_Field__mdt field6 = new Smart_List_Field__mdt();
        field6.Field_Name__c = 'ClosedDate';
        field6.List_Field__c = true;
        field6.Quick_Filters_Field__c = 'Yes if Filterable';
        SmartListController.listFields = new Smart_List_Field__mdt[] { field1, field2, field3, field4, field5, field6 };

        Smart_List_Filter__mdt filter1 = new Smart_List_Filter__mdt();
        filter1.SOQL_Filter__c = 'Name = \'ABC\'';
        filter1.Filter_Label__c = '$Label.XYZ';
        filter1.Default_Filter__c = true;
        Smart_List_Filter__mdt filter2 = new Smart_List_Filter__mdt();
        filter2.SOQL_Filter__c = 'CreatedById = USERID AND AccountId = PARENTID';
        filter2.Filter_Label__c = '$Label.XYZ';
        filter2.Default_Filter__c = false;
        SmartListController.listFilters = new Smart_List_Filter__mdt[] { filter1, filter2 };     

        Smart_List_Action__mdt action1 = new Smart_List_Action__mdt();
        action1.type__c = 'List Action';
        action1.DeveloperName = 'Action1';
        action1.Action_Label__c = '$Label.XZYZ';
        action1.Category__c = 'Auto-launched Flow';
        action1.Flow_Name__c = 'Flow';
        action1.Refresh_After_Execution__c = 'List';
        action1.Custom_Permission__c = 'SmartFilesList_Delete_File';
        Smart_List_Action__mdt action2 = new Smart_List_Action__mdt();
        action2.type__c = 'Row Action';
        action2.DeveloperName = 'Action2';
        action2.Action_Label__c = '$Label.XZYZ';
        action2.Category__c = 'Auto-launched Flow';
        action2.Flow_Name__c = 'Flow';
        action2.Refresh_After_Execution__c = 'Row';
        SmartListController.listActions = new Smart_List_Action__mdt[] { action1, action2};
    }
    
    public static void createFilesListDefinition() {
        Smart_List_Definition__mdt listDef = new Smart_List_Definition__mdt();
        listDef.DeveloperName = 'Test';
        listDef.Data_Source_Type__c = SmartListController.DATASOURCE_FILES;
        listDef.List_Icon__c = 'standard:file';
        listDef.List_Label__c = '$Label.XYZ';
        listDef.Maximum_number_of_records__c = 2000;
        listDef.Number_of_records_per_page__c = 10;
        listDef.Parent_Id_Field__c = null;
        listDef.Enable_CRUD_Actions__c = true;
        listDef.SOQL_Default_Scope__c = 'everything';
        listDef.SOQL_Scope_All__c = true;
        listDef.Default_Sort_Direction__c = 'asc';
        listDef.Display_Quick_Filters_All_the_Time__c = false;
        listDef.Show_SOSL_Search_in_Quick_Filter__c = false;
        listDef.Max_Row_Selected__c = 2000;
        listDef.Selectable_Rows__c = true;
        listDef.Show_List_Header__c = true;
        listDef.Show_Row_Number_Column__c = false;
        listDef.Row_Number_Start__c = 0;
        listDef.Allowed_Extensions__c = 'jpg';
        SmartListController.listDefinition = new Smart_List_Definition__mdt[] { listDef };

        Smart_List_Field__mdt field1 = new Smart_List_Field__mdt();
        field1.Field_Name__c = 'Title';
        field1.Display_Type__c = 'FILE_PREVIEW';
        field1.List_Field__c = true;
        field1.Sortable_in_List__c = 'Yes if Sortable';
        field1.Default_Sort_Field__c = true;
        Smart_List_Field__mdt field2 = new Smart_List_Field__mdt();
        field2.Field_Name__c = 'Description';
        field2.List_Field__c = true;
        SmartListController.listFields = new Smart_List_Field__mdt[] { field1, field2 };
    }

    public static void createApexListDefinition() {
        Smart_List_Definition__mdt listDef = new Smart_List_Definition__mdt();
        listDef.DeveloperName = 'Test';
        listDef.Data_Source_Type__c = SmartListController.DATASOURCE_APEX;
        listDef.Data_Provider_Class__c = 'SmartListTestApexDataSource';
        listDef.List_Icon__c = 'standard:file';
        listDef.List_Label__c = '$Label.XYZ';
        listDef.Maximum_number_of_records__c = 2000;
        listDef.Number_of_records_per_page__c = 10;
        listDef.Parent_Id_Field__c = null;
        listDef.Enable_CRUD_Actions__c = true;
        listDef.SOQL_Default_Scope__c = 'everything';
        listDef.SOQL_Scope_All__c = true;
        listDef.Default_Sort_Direction__c = 'asc';
        listDef.Display_Quick_Filters_All_the_Time__c = false;
        listDef.Show_SOSL_Search_in_Quick_Filter__c = false;
        listDef.Max_Row_Selected__c = 2000;
        listDef.Selectable_Rows__c = true;
        listDef.Show_List_Header__c = true;
        listDef.Show_Row_Number_Column__c = false;
        listDef.Row_Number_Start__c = 0;
        SmartListController.listDefinition = new Smart_List_Definition__mdt[] { listDef };

        Smart_List_Field__mdt field1 = new Smart_List_Field__mdt();
        field1.Field_Name__c = 'Field1';
        field1.Display_Type__c = 'STRING';
        field1.List_Field__c = true;
      	field1.Quick_Filters_Field__c = 'Yes if Filterable';
        field1.Sortable_in_List__c = 'Yes if Sortable';
        field1.Default_Sort_Field__c = true;
        Smart_List_Field__mdt field2 = new Smart_List_Field__mdt();
        field2.Field_Name__c = 'Field2';
        field1.Display_Type__c = 'STRING';
        field2.List_Field__c = true;
        field2.Quick_Filters_Field__c = 'Yes if Filterable';
        SmartListController.listFields = new Smart_List_Field__mdt[] { field1, field2 };
    }

    public class FileData {
        public String cdId;
        public String cvId;
        
        public FileData(String cdId, String cvId) {
            this.cdId = cdId;
            this.cvId = cvId;
        }
    }
    
    public static Account createAccount(String name) {
        Account acc = new Account(Name = name);
        insert acc;
        return acc;
    }
    
    public static Account createChildAccount(String name, String parentId) {
        Account acc = new Account(Name = name, ParentId = parentId);
        insert acc;
        return acc;
    }
    
    public static FileData createNewFile(Account acc, String title, String extension) {
        ContentVersion cv = new ContentVersion(
            Title = title,
            PathOnClient = 'Test.' + extension,
            VersionData = Blob.valueOf('Test Content Data'),
            IsMajorVersion = true
        );
        insert cv;
        
        String cdId = [SELECT Id, Title, LatestPublishedVersionId FROM ContentDocument WHERE LatestPublishedVersionId = :cv.Id LIMIT 1].Id;
        ContentDocumentLink cdl = New ContentDocumentLink();
        cdl.LinkedEntityId = acc.id;
        cdl.ContentDocumentId =cdId;
        cdl.shareType = 'V';
        insert cdl;
        
        return new FileData(cdId, cv.Id);
    }

    public static FileData createNewVersion(String cdId, String title, String extension) {
        ContentVersion cv = new ContentVersion(
            Title = title,
            PathOnClient = 'Test.' + extension,
            VersionData = Blob.valueOf('Test Content Data'),
            ContentDocumentId = cdId
        );
        insert cv;
        
        return new FileData(cdId, cv.Id);
    }
    
    public static Case createCase(String subject, Id ownerId, Id accountId) {
        Case c = new Case(Subject = subject, OwnerId = ownerId, AccountId = accountId);
        insert c;
        return c;
    }
    
    public static List<Group> createCaseQueues() {
        String profileId = [SELECT Id FROM Profile WHERE Name='System Administrator' LIMIT 1].Id;
        //UserRole ceoRole = SmartListTestDataFactory.createUserRole('CEO', null);
        List<Group> result = new List<Group>();
        List<GroupMember> gms = new List<GroupMember>();
        Id userId = UserInfo.getUserId();
        User user1 = SmartListTestDataFactory.createTestUser(profileId, null);
        System.runAs(user1) {
            for (Integer i = 0; i < 3; i++) {
                result.add(new Group(Name='Queue'+i, type='Queue'));
            }
        	insert result;
            gms.add(new GroupMember(GroupId=result.get(0).Id, UserOrGroupId=userId));
            gms.add(new GroupMember(GroupId=result.get(1).Id, UserOrGroupId=userId));
        	insert gms;
        }
        User user2 = SmartListTestDataFactory.createTestUser(profileId, null);
        System.runAs(user2) {
            List<QueuesObject> qsos = new List<QueuesObject>();
            for (Group grp : result) {
                qsos.add(new QueueSObject(QueueID = grp.id, SObjectType = 'Case'));
            }
            insert qsos;
        }
        return result;
    }
}