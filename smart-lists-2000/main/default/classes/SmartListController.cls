global with sharing class SmartListController {
    // Constants for data source types
    public static String DATASOURCE_APEX = 'Apex Data Source';
    public static String DATASOURCE_FILES = 'Files';
    public static String DATASOURCE_SOQL_WITH_SHARING = 'SOQL with Sharing';
    public static String DATASOURCE_SOQL_WITHOUT_SHARING = 'SOQL without Sharing';
    // Constants for special fields names
    public static String OWNER_FIELD = 'Owner';
    public static String RECORDTYPE_FIELD = 'RecordType';
    // Constant for Visbility Scope Filters
    public static String SCOPE_ALL = 'everything';
    public static String SCOPE_MY = 'mine';
    public static String SCOPE_MY_TEAM = 'team';
    public static String SCOPE_MY_SUBORDINATES = 'subordinates';
    // Constants for Display Type
    public static String TYPE_HYPERLINK_DETAIL = 'HYPERLINK_DETAIL';
    public static String TYPE_FILE_PREVIEW = 'FILE_PREVIEW';

    /*
        Translate a custom label by reading the value retrieved in VF Page SmartListLabel
        - label: name of label entered in the custom metadata. Syntax: $Label.myLabel
     */
    public static String getLabel(String label) {
        String result = label;
        if (label != null && label.startsWith('$Label.')) {
            String[] parts = label.split('\\.');
            PageReference ref = Page.SmartListLabel;
            ref.getParameters().putAll(
              new Map<String, String> {
                'lang' => UserInfo.getLanguage(),
                'label' => parts[1]
            });
            Map<String, Object> labelValue;
            if (Test.isRunningTest()) {
                labelValue = new Map<String, Object>();
                labelValue.put('value', 'Label');
            }
            else {
                labelValue = (Map<String, Object>)JSON.deserializeUntyped(ref.getContent().toString());
            }
            result = (String)labelValue.get('value');
        }
        return result;
    }

    /*
        Definition of a Record Type for LWC
        - value: record type Id
        - label: translated value of the record type
     */
    public class RecordTypeDefinition {
        public String value;
        public String label;
        public boolean isDefault;

        public RecordTypeDefinition(Schema.RecordTypeInfo rti) {
            this.value = rti.getRecordTypeId();
            this.label = rti.getName();
            this.isDefault = rti.isDefaultRecordTypeMapping();
        }
    }

    /*
        Definition of a Picklist Value for LWC
        - value: API Name of the value
        - label: translated value

        Picklist values are created for Record Types when the RecordType field is displayed in the Quick Filters
     */
    public class PicklistValue {
        public String value;
        public String label;
        public boolean active;

        public PicklistValue(Schema.PicklistEntry ple) {
            this.value = ple.getValue();
            this.label = ple.getLabel();
            this.active = ple.isActive();
        }

        public PickListValue(Schema.RecordTypeInfo rti) {
            this.value = rti.getRecordTypeId();
            this.label = rti.getName();
            this.active = true;
        }
    }

    /*
        Definition of a Quick Filters Lookup for LWC
        - value: Object API name
        - label: Object plural label
        - subtitleField: field displayed as subtitle of found records by the lookup search
        - iconName: LWC name of the Object icon
     */
    public class Lookup {
        public String value;
        public String label;
        public String titleField;
        public String subtitleField;
        public String iconName;
        public Lookup(String value, String label, String titleField, String subtitleField, String iconName) {
            this.value = value;
            this.label = label;
            this.titleField = titleField;
            this.subtitleField = subtitleField;
            this.iconName = iconName;
        }
    }

    /*
        Returns the SOQL operator for the data type of a field
        - type: data type of the field
        - isEncrypted: true if the field is encrypted
        - isFirst: for range data types, if true, indicates that this is for the lower value of the range
     */
    public static String getQuickFiltersOperator(String type, Boolean isEncrypted, Boolean isFirst) {
        String operator = null;
        if (type == 'DATE' || type == 'DATETIME' || type == 'TIME' || type == 'CURRENCY' || type == 'DECIMAL' || type == 'DOUBLE' || type == 'INTEGER' || type == 'LONG'
         || type == 'PERCENT')
            operator = isFirst ? '>=' : '<=';
        else if (isFirst && type == 'MULTIPICKLIST')
            operator = 'INCLUDES';
        else if (isFirst && type == 'PICKLIST')
            operator = 'IN';
        else if (isFirst)
            operator = (isEncrypted || type == 'BOOLEAN' || type == 'LOOKUP') ? '=' : 'LIKE';
        return operator;
    }

    /*
        Return the icon of an object or standard:default if no icon found
        - objectName: name of the object
     */
    private static String getObjectIcon(String objectName) {
        String iconName = 'standard:default';
        for (TabDefinition td : [SELECT IsCustom, (SELECT Url FROM Icons WHERE ContentType LIKE 'image/svg%') FROM TabDefinition WHERE SobjectName = :objectName]) {
            if (td.Icons.size() > 0) {
                String iconCategory = td.isCustom ? 'custom' : 'standard';
                iconName = iconCategory + ':' + td.Icons.get(0).Url.substringBetween(iconCategory + '/','.svg').substringBefore('_');
            }
        }
        return iconName;
    }

    /*
        Definition of a List Field for LWC
        - label: translated label of the field
        - name: API name of the field displayed in the List. Example: RecordType.Name
        - quickFiltersname: API name of the field used for searching the records in the Quick Filters: Example: RecordTypeId
        - displayType: data type of the field or specifying field rendering option : Hyperkink to Detail, File Preview
        - type: physical data type of the field in the list. SFDC data type or HTML for rendering HTML formatted fields
        - hyperlinkIdField: For Hyperlink to Detail, field of the target object containing the Id of the target record
        - editable: if true, running user can edit the field
        - sortable: if true, the field is sortable in the list
        - filterable: if true, the field is searchable in the Quick Filter
        - listField: if true, the field is displayed in the list
        - displayPositionInList: display rank in the list
        - displayPositionInQuickFilters: display rank in the Quick Filters
        - quickFiltersOperator1: first operator for quickFilters
        - quickFiltersOperator2: first operator for quickFilters
        - editField: for Files list, the field is editable in the Edit Form
        - requiredOnEdit: for Files list, the field is required in the Edit Form even if it's not at the DB level
        - dbRequired: for Files list, the field is required in the Edit Form if it is at the DB level
        - columnWidth: width of the field in pixels
        - wrapText: values are wrapped in the cells if they have more than 1 line
        - displayAsBadge: display as a badge
        - badgeStyleField: API name of the formula field returning the background and text color of the badge
        - tileHeader: display in tile header
        - lookups: list of lookups in Quick Filters
        - picklistValues: picklist values in Quick Filters
    */
    public class FieldDefinition {
        public String label;
        public String name;
        public String quickFiltersName;
        public String displayType;
        public String type;
        public String fractionDigits;
        public String hyperlinkIdField;
        public Boolean editable;
        public Boolean sortable;
        public Boolean filterable;
        public Boolean listField;
        public Integer displayPositionInList;
        public Integer displayPositionInQuickFilters;
        public String quickFiltersOperator1;
        public String quickFiltersOperator2;
        public Boolean editField;
        public Boolean requiredOnEdit;
        public Boolean dbRequired;
        public Integer columnWidth;
        public Boolean wrapText;
        public Boolean displayAsBadge;
        public String badgeStyleField;
        public Boolean tileHeader;
        public List<Lookup> lookups;
        public List<PicklistValue> picklistValues = new List<PicklistValue>();

        // Constructor for creating a LWC field definition for SOQL/Files list 
        public FieldDefinition(Smart_List_Field__mdt slf, GetDfrResult gdr, List<Schema.RecordTypeInfo> rtis, Boolean isExternalObject) {
            // Field label:
            // - if populated: translated value of the custom label
            // - if not populated: translated value of the field in the system
            label = slf.Field_Label__c != null ? getLabel(slf.Field_Label__c) : gdr.dfr.getLabel();
            // RecordType Field: Quick Filters picklist values = Active and not master Record Types
            if (slf.Field_Name__c == RECORDTYPE_FIELD) {
                for (Schema.RecordTypeInfo rti : rtis) {
                    if (rti.isActive() && !rti.isMaster())
                        picklistValues.add(new PicklistValue(rti));
                }
                name = 'RecordType.Name';
                quickFiltersName = 'RecordTypeId';
                type = Schema.DisplayType.PICKLIST.name();
            } 
            // Owner field: lookup with user + optional lookup with queues if object supports queues
            else if (slf.Field_Name__c == OWNER_FIELD) {
                lookups = new List<Lookup>();
                lookups.add(new Lookup('User', gdr.relDsor.getLabelPlural(), gdr.lookupTitleField, slf.Lookup_Subtitle_Field__c, 'standard:user'));
                if (gdr.lookupHasQueue)
                    lookups.add(new Lookup('Queue', System.Label.LookupQueues, gdr.lookupTitleField, null, 'standard:orders'));
                name = 'Owner.Name';
                quickFiltersName = 'OwnerId';
                type = 'LOOKUP';
            } 
            // Object icon for Lookup field: retrieve icon for standard/custom objects
            else if (slf.Lookup_in_Quick_Filters__c) {
                String objectName = gdr.relDsor.getName();
                String iconName = getObjectIcon(objectName);
                lookups = new List<Lookup>();
                lookups.add(new Lookup(objectName, gdr.relDsor.getLabelPlural(), gdr.lookupTitleField, slf.Lookup_Subtitle_Field__c, iconName));
                name = slf.Field_Name__c;
                quickFiltersName = gdr.relDfr.getName();
                type = 'LOOKUP';
            }  else {
                name = slf.Field_Name__c;
                quickFiltersName = slf.Field_Name__c;
                type = gdr.dfr.isHtmlFormatted() ? 'HTML' : gdr.dfr.getType().name();
            }
            fractionDigits = String.valueOf(gdr.dfr.getScale());
            displayType = slf.Display_Type__c == TYPE_HYPERLINK_DETAIL || slf.Display_Type__c == TYPE_FILE_PREVIEW ? slf.Display_Type__c : type;
            hyperlinkIdField = slf.Hyperlink_to_Detail_Id_Field__c;
            editable = gdr.dfr.isUpdateable();
            sortable = (slf.Sortable_in_List__c == null || slf.Sortable_in_List__c == 'Yes if Sortable') && gdr.dfr.isSortable();
            if (isExternalObject && name.contains('.'))
                sortable = false;
            filterable = (slf.Quick_Filters_Field__c == null || slf.Quick_Filters_Field__c == 'Yes if Filterable') && gdr.dfr.isFilterable();
            // Set SOQL operators for quick filters
            if (filterable) {
                quickFiltersOperator1 = getQuickFiltersOperator(type, gdr.dfr.isEncrypted() || isExternalObject, true);
                quickFiltersOperator2 = getQuickFiltersOperator(type, gdr.dfr.isEncrypted() || isExternalObject, false);
            }
            for (Schema.PicklistEntry ple : gdr.dfr.getPicklistValues()) {
                picklistValues.add(new PickListValue(ple));
            }
            listField = slf.List_Field__c;
            displayPositionInList = (Integer)slf.Display_Position__c;
            displayPositionInQuickFilters = slf.Quick_Filters_Field__c == null ? (Integer)slf.Display_Position__c : (Integer)slf.Display_Position_in_Quick_Filters__c;
            editField = slf.File_Edit__c != null;
            requiredOnEdit = slf.File_Edit__c == 'EditableRequired';
            dbRequired = !gdr.dfr.nillable;
            columnWidth = (Integer)slf.Column_Width__c;
            wrapText = slf.Wrap_Text__c;
            displayAsBadge = slf.Display_as_Badge__c;
            badgeStyleField = slf.Badge_Style_Field__c;
            tileHeader = slf.Tile_Header__c;
        }

        // Constructor for creating a LWC field definition for Apex list 
        public FieldDefinition(Smart_List_Field__mdt slf) {
            label = getLabel(slf.Field_Label__c);
            name = slf.Field_Name__c;
            quickFiltersName = slf.Field_Name__c;
            type = slf.Display_Type__c == TYPE_HYPERLINK_DETAIL ? 'STRING' : slf.Display_Type__c;
            fractionDigits = slf.Display_Type__c == 'INTEGER'? '0' : '2';
            displayType = slf.Display_Type__c;
            hyperlinkIdField = slf.Hyperlink_to_Detail_Id_Field__c;
            // Quick_Filters_Field__c, Display_Position_in_Quick_Filters__c, Sortable_in_List__c
            sortable = (slf.Sortable_in_List__c == null && slf.Sortable__c) || slf.Sortable_in_List__c == 'Yes if Sortable';
            filterable = (slf.Quick_Filters_Field__c == null && slf.Filterable__c) || slf.Quick_Filters_Field__c == 'Yes if Filterable';
            // Set SOQL operators for quick filters
            if (filterable) {
                quickFiltersOperator1 = getQuickFiltersOperator(type, false, true);
                quickFiltersOperator2 = getQuickFiltersOperator(type, false, false);
            }
            listField = slf.List_Field__c;
            displayPositionInList = (Integer)slf.Display_Position__c;
            displayPositionInQuickFilters = slf.Quick_Filters_Field__c == null ? (Integer)slf.Display_Position__c : (Integer)slf.Display_Position_in_Quick_Filters__c;
            editField = slf.File_Edit__c != null;
            dbRequired = false;
            columnWidth = (Integer)slf.Column_Width__c;
            wrapText = slf.Wrap_Text__c;
            displayAsBadge = slf.Display_as_Badge__c;
            badgeStyleField = slf.Badge_Style_Field__c;
            tileHeader = slf.Tile_Header__c;
        }

        // Constructor for creating a LWC field definition for target fields of hyperlinks
        public FieldDefinition(GetDfrResult gdr) {
            label = gdr.dfr.getLabel();
            editable = gdr.dfr.isUpdateable();
            listField = false;
            editField = false;
            requiredOnEdit = false;
            dbRequired = !gdr.dfr.nillable;
        }
    }

    /*
        Definition of a custom filter for LWC
        - value: SOQL where clause
        - label: display label of filter in the list
        - defaultFilter: if true, the filter is preselected when the list is displayed for the 1st time
     */
    public class ListFilter {
        public String value;
        public String label;
        public Boolean defaultFilter;

        public ListFilter(Smart_List_Filter__mdt slf) {
            this.value = slf.SOQL_Filter__c;
            this.label = getLabel(slf.Filter_Label__c);
            this.defaultFilter = slf.Default_Filter__c;
        }
    }

    /*
        Definition of a SOQL scope for LWC
        - value: SOQL code of the scope: everything, mine, team
        - label: Translated label of the scope in the list
     */
    public class SoqlScope {
        public String value;
        public String label;
        public SoqlScope(String value, String label) {
            this.value = value;
            this.label = label;
        }
    }

    /*
        Definition of a list action for LWC
        - key: picklist key in LWC
        - label: translated label of the action
        - category: auto-launched or screenflow
        - flowName: API name of the flow
        - modalHeight: Screenflow only: height of the modal dialog
        - refreshList: if true, the list is refreshed after the execution of the flow. For list level actions
        - refreshRow: if true, the row is refreshed after the execution of the flow. For row level actions
    */
    public class ListAction {
        public String key;
        public String label;
        public String category;
        public String flowName;
        public Integer modalHeight;
        public Boolean refreshList;
        public Boolean refreshRow;

        public ListAction(Smart_List_Action__mdt sla) {
            this.key = 'cust_' + sla.DeveloperName;
            this.label = getLabel(sla.Action_Label__c);
            this.category = sla.Category__c;
            this.flowName = sla.Flow_Name__c;
            this.modalHeight = (Integer)sla.Screenflow_Modal_Height__c;
            this.refreshList = sla.Refresh_After_Execution__c == 'List';
            this.refreshRow = sla.Refresh_After_Execution__c == 'Row';
        }
        public ListAction(String key, String label) {
            this.key = 'std_' + key;
            this.label = label;
        }
    }

    /*
        Definition of a list for LWC
        - dataSourceType: type of data source (SOQL with/without Sharing, Files, Apex)
        - displayMode: display mode (Table, Tiles)
        - listIcon: icon of the list
        - listLabel: label of the list
        - maxRecords: maximum number of records displayed in the list
        - pageSize: number of records retrieved by a call to paging for infinite scrolling
        - parentIdField: For child lists (Cases of an Account), API name of the field containing the Id of the parent record (Case.Account)
        - objectName: API name of the object for SOQL lists
        - objectLabel: translated label of the object for SOQL lists
        - recordTypes: list of active record types available for creating records
        - defaultSoqlScope: SOQL name of scope displayed when the list is displayed for the 1st time
        - soqlScopes: list of scopes available in the list
        - defaultSortDirection: default sort direction the list (ASC/DESC)
        - defaultSortField: default sort field of the list
        - displayQuickFiltersAllTheTime: if true, Quick Filters are displayed all the time and can't be closed
        - showSOSLSearchInQuickFilters: if true, the SOSL search input is displayed in the Quick Filters
        - showSOSLSearchInComponent: if true, the SOSL search input is displayed in the component
        - maxRowSelected: maximum number of rows that can be selected at a time in the time
        - showRowNumberColumn: Table Mode - If true, the row number column is displayed as the 1st column of the list
        - showRowNumberStart: Table Mode - First number of the rows counter
        - wrapTextMaxLines: Table Mode - Maximum number of lines displayed in a cell if wrap mode is enabled
        - showRowNumberStart: Table Mode - First number of the rows counter
        - numberOfTilesPerRow: Tiles Mode - Number of tiles displayed in a row
        - numberOfColumnsPerTile: Tiles Mode - Number of fields displayed in a row of tile
        - allowedExtensions: Files list - List of file extensions allowed for file upload/upload new version
        - dontCheckFileExtension: Files list - Running user has Don't Check File Extension permission 
        - dataProviderClass: Apex list - Apex class of the data provider for Apex data sources
        - rowKey: Apex list: Field of the datasource used as a technical key of the records - Other sources: Id
        - community: if true, the list is displayed in a Community
        - userTimeZone: Timezone code used for formatting time and datetime fields for the running user
        - fields: list of fields to display in the list and/or the Quick Filters and/or the File Edit form
        - filters: list of filters of the list
        - standardListActions: list of standard list actions of the list
        - customListActions: list of custom list actions of the list
        - rowActions: list of row actions of the list
        - queryFields: SOQL query for retrieving the records with translated values (built once, re-used everytime a page is loaded)
        - parentId: id of the parent record. For direct relationships, id of the parent record. For indirect relationships,  id determined from the id of the parent record
        - namespace: current Apex namespace (varies dev/package) - used for Upload File New Version URL
     */
    public class ListParameters {
        public String dataSourceType;
        public String displayMode;
        public String dataProviderClass;
        public String listIcon;
        public String listLabel;
        public Integer maxRecords;
        public Integer pageSize;
        public String parentIdField;
        public String objectName;
        public String objectLabel;
        public List<RecordTypeDefinition> recordTypes = new List<RecordTypeDefinition>();
        public String defaultSoqlScope;
        public List<SoqlScope> soqlScopes = new List<SoqlScope>();
        public String defaultSortDirection;
        public String defaultSortField;
        public Boolean displayQuickFiltersAllTheTime;
        public Boolean showSOSLSearchInQuickFilters;
        public Boolean showSOSLSearchInComponent;
        public Integer maxRowSelected;
        public Boolean selectableRows;
        public Boolean showListHeader;
        public Boolean showRowNumberColumn;
        public Integer rowNumberStart;
        public String numberOfTilesPerRow;
        public String numberOfColumnsPerTile;
        public Integer wrapTextMaxLines;
        public String allowedExtensions;
        public Boolean dontCheckFileExtension;
        public String rowKey;
        public Boolean community;
        public String userTimeZone;
        public String currencyCode;
        public Map<String, FieldDefinition> fields = new Map<String, FieldDefinition>();
        public List<ListFilter> filters = new List<ListFilter>();
        public List<ListAction> standardListActions = new List<ListAction>();
        public List<ListAction> customListActions = new List<ListAction>();
        public List<ListAction> rowActions = new List<ListAction>();
        public String queryFields;
        public String parentId;
        public String namespace;

        public ListParameters(Smart_List_Definition__mdt sld, ObjectCacheEntry baseObject, String parentId) {
            dataSourceType = sld.Data_Source_Type__c;
            displayMode = 	sld.Display_Mode__c == null ? 'Table' : sld.Display_Mode__c;
            maxRecords = (Integer)sld.Maximum_number_of_records__c;
            pageSize = (Integer)sld.Number_of_records_per_page__c;
            if (!String.isEmpty(sld.Parent_Id_Field__c) && baseObject != null && !baseObject.fieldExists(sld.Parent_Id_Field__c))
                throw new SmartListException('Invalid Parent Id Field: \'' + sld.Parent_Id_Field__c + '\'');
            parentIdField = sld.Parent_Id_Field__c;
            listIcon = sld.List_Icon__c;
            listLabel = getLabel(sld.List_Label__c);
            objectName = sld.SObject__c;
            if (baseObject != null) {
                // Determine objectLabel based on list type
                Boolean isFiles = sld.Data_Source_Type__c == DATASOURCE_FILES;
                objectLabel = isFiles ? System.Label.File : baseObject.dsor.getLabel();
                listIcon = String.isEmpty(listIcon) ? (isFiles ? 'standard:file' : getObjectIcon(objectName)) : listIcon;
                listLabel = String.isEmpty(sld.List_Label__c) ? (isFiles ? System.Label.Files : baseObject.dsor.getLabelPlural()) : listLabel;
                // Add record types
                List<Schema.RecordTypeInfo> rtis = baseObject.dsor.getRecordTypeInfos();
                for (Schema.RecordTypeInfo rti : rtis) {
                    if (rti.isAvailable() && rti.isActive() && !rti.isMaster()) {
                        recordTypes.add(new RecordTypeDefinition(rti));
                    }
                }
            }
            // Add SOQL scopes
            defaultSoqlScope = sld.SOQL_Default_Scope__c;
            if (sld.SOQL_Scope_All__c)
                soqlScopes.add(new SoqlScope(SCOPE_ALL, System.Label.SOQLScopeAll));
            if (sld.SOQL_Scope_My__c)
                soqlScopes.add(new SoqlScope(SCOPE_MY, System.Label.SOQLScopeMy));
            if (sld.SOQL_Scope_My_Team__c)
                soqlScopes.add(new SoqlScope(SCOPE_MY_TEAM, System.Label.SOQLScopeMyTeam));
            if (sld.SOQL_Scope_My_Subordinates__c)
                soqlScopes.add(new SoqlScope(SCOPE_MY_SUBORDINATES, System.Label.SOQLScopeMySubordinates));
            defaultSortDirection = sld.Default_Sort_Direction__c;
            displayQuickFiltersAllTheTime = sld.Display_Quick_Filters_All_the_Time__c;
            showSOSLSearchInQuickFilters = baseObject != null && baseObject.dsor.isSearchable() && ((sld.Show_SOSL_Search__c == null && sld.Show_SOSL_Search_in_Quick_Filter__c) || (sld.Show_SOSL_Search__c == 'Filters'));
            showSOSLSearchInComponent = (baseObject != null && baseObject.dsor.isSearchable() && sld.Show_SOSL_Search__c == 'Component');
            maxRowSelected = (Integer)sld.Max_Row_Selected__c;
            selectableRows = sld.Selectable_Rows__c;
            showListHeader = sld.Show_List_Header__c;
            showRowNumberColumn = sld.Show_Row_Number_Column__c;
            rowNumberStart = (Integer)sld.Row_Number_Start__c;
            wrapTextMaxLines = sld.Wrap_Text_Max_Lines__c == null ? 3 : (Integer)sld.Wrap_Text_Max_Lines__c;
            if (sld.Tile_Layout__c != null) {
                String[] layoutParts = sld.Tile_Layout__c.split('x');
                numberOfTilesPerRow = layoutParts[0];
                numberOfColumnsPerTile = layoutParts[1];
            }
            allowedExtensions = sld.Allowed_Extensions__c;
            dataProviderClass = sld.Data_Provider_Class__c;
            rowKey = sld.Data_Source_Type__c == DATASOURCE_APEX ? sld.Row_Key__c : 'Id';
            community = Site.getName() != null;
            userTimeZone = UserInfo.getTimeZone().getID();
            currencyCode = UserInfo.getDefaultCurrency();
            this.parentId = parentId;
        }
    }
    
    // SmartList exception
    public class SmartListException extends Exception {}

    /*
        list of Smart_List_Definition__mdt used by the controller
        - Live list: retrieved by SOQL
        - Test class: provided by test class
    */ 
    public static Smart_List_Definition__mdt[] listDefinition {
        get;
        set;
    }
    
    /*
        list of Smart_List_Field__mdt used by the controller
        - Live list: retrieved by SOQL
        - Test class: provided by test class
    */ 
    public static Smart_List_Field__mdt[] listFields {
        get;
        set;
    }

     /*
        list of Smart_List_Filter__mdt used by the controller
        - Live list: retrieved by SOQL
        - Test class: provided by test class
    */ 
    public static Smart_List_Filter__mdt[] listFilters {
        get;
        set;
    }
    
      /*
        list of Smart_List_Action__mdt used by the controller
        - Live list: retrieved by SOQL
        - Test class: provided by test class
    */ 
    public static Smart_List_Action__mdt[] listActions {
        get;
        set;
    }
    
    /*
        Function for retrieving Smart_List_Definition__mdt record (if live list: retrieved by SOQL, if test class: retrieve record provided by test class)
        - listName: name of the list entered in AppBuilder or flow/community setup
    */ 
    public static Smart_List_Definition__mdt[] getListDefinition(String listName) { 
        if ( listDefinition == null )
            return [SELECT Id, Data_Source_Type__c, Data_Provider_Class__c, Default_Sort_Direction__c, List_Icon__c, List_Label__c, 
                        Display_Quick_Filters_All_the_Time__c, Show_SOSL_Search_in_Quick_Filter__c, Show_SOSL_Search__c,
                        Selectable_Rows__c, Max_Row_Selected__c, Maximum_Number_of_Records__c, Number_of_Records_per_Page__c,  Show_List_Header__c,
                        SObject__c, Parent_Id_Field__c,	Enable_CRUD_Actions__c, Enable_New_Record_Action__c, Enable_Edit_Record_Action__c, Enable_Delete_Record_Action__c, 
                        SOQL_Default_Scope__c, SOQL_Scope_All__c, SOQL_Scope_My__c, SOQL_Scope_My_Team__c, 	SOQL_Scope_My_Subordinates__c,
                        Show_Row_Number_Column__c, Row_Number_Start__c, Allowed_Extensions__c, Row_Key__c, Wrap_Text_Max_Lines__c, 
                        Parent_Key_Field__c, Display_Mode__c, Tile_Layout__c
                    FROM Smart_List_Definition__mdt WHERE DeveloperName = :listName];
        else 
            return listDefinition;
    }

    /*
        Function for retrieving Smart_List_Field__mdt records (if live list: retrieved by SOQL, if test class: retrieve records provided by test class)
        - listId: parent list id
    */ 
    public static Smart_List_Field__mdt[] getListFields(Id listId) {
        if (listFields == null)
            return [SELECT Display_Position__c, Display_Type__c, Field_Label__c, Field_Name__c, List_Field__c, Default_Sort_Field__c, 
                        File_Edit__c, Sortable__c, Filterable__c, Column_Width__c, Wrap_Text__c, Display_as_Badge__c, Badge_Style_Field__c, Tile_Header__c,
                        Quick_Filters_Field__c, Display_Position_in_Quick_Filters__c, Hyperlink_to_Detail_Id_Field__c,
                        Sortable_in_List__c, Lookup_in_Quick_Filters__c, Lookup_Subtitle_Field__c
                    FROM Smart_List_Field__mdt WHERE Smart_List_Definition__c = :listId ORDER BY Display_Position__c DESC];
        else
            return listFields;
    }

    /*
        Function for retrieving Smart_List_Filter__mdt records (if live list: retrieved by SOQL, if test class: retrieve records provided by test class)
        - listId: parent list id
    */ 
    public static Smart_List_Filter__mdt[] getListFilters(Id listId) {
        if (listFilters == null)
            return [SELECT Filter_Label__c, SOQL_Filter__c, Default_Filter__c
                    FROM Smart_List_Filter__mdt WHERE Smart_List_Definition__c = :listId ];
        else
            return listFilters;
    }

    /*
        Function for retrieving Smart_List_Action__mdt records (if live list: retrieved by SOQL, if test class: retrieve records provided by test class)
        - listId: parent list id
    */ 
    public static Smart_List_Action__mdt[] getListActions(Id listId) {
        if (listActions == null)
            return [SELECT 	DeveloperName, Display_Position__c, Action_Label__c, Flow_Name__c, 
            Screenflow_Modal_Height__c, Refresh_After_Execution__c, Type__c, Category__c, Custom_Permission__c
                    FROM Smart_List_Action__mdt WHERE Smart_List_Definition__c = :listId ORDER BY Display_Position__c];
        else
            return listActions;
    }

    /*
        Retrieve the list parameters for LWC
        - listName: name of the list in Smart_List_Definition__mdt
        - recordId: if child list, parent id from the LWC
        - flow: running in flow context
     */
    @AuraEnabled
    public static string getListParameters(String listName, String recordId, boolean flow){
        try {
            // Check if list name provided in AppBuilder or community/flow setup
            if (listName == null)
                throw new SmartListException('List Definition missing');
            Smart_List_Definition__mdt[] slds = getListDefinition(listName);
            // Check if list is found
            if (slds.size() == 0)
                throw new SmartListException('List Definition \'' + listName + '\' not found');
            Smart_List_Definition__mdt sld = slds[0];
            Smart_List_Field__mdt[] slfs = getListFields(sld.Id);
            // Check if list has fields
            if (slfs.size() == 0)
                throw new SmartListException('No fields defined');
            // Initialize objects cache
            ObjectsCache objectsCache = new ObjectsCache();
            ObjectCacheEntry baseObject = null;
            if ((sld.Data_Source_Type__c == DATASOURCE_APEX && !String.isBlank(sld.SObject__c)) || 
                sld.Data_Source_Type__c != DATASOURCE_APEX) {
                // Get object data
                sld.SObject__c = sld.Data_Source_Type__c == DATASOURCE_FILES ? 'ContentVersion' : sld.SObject__c;
                baseObject = objectsCache.get(sld.SObject__c);
                // Check if object is valid
                if (baseObject == null)
                    throw new SmartListException('Invalid Object Name: \'' + sld.SObject__c + '\'');
                if (!baseObject.dsor.isAccessible())
                    throw new SmartListException('Object \'' + sld.SObject__c + '\' is not accessible by the current user');
            }
            String parentId = recordId;
            // Child lists: determine the parent id to use with the list for direct/indirect relationships
            if (!String.isBlank(sld.Parent_Key_Field__c) && !String.isBlank(recordId)) {
                ObjectCacheEntry parentObject = objectsCache.get(Id.valueOf(recordId).getSobjectType());
                if (!parentObject.fieldExists(sld.Parent_Key_Field__c))
                    throw new SmartListException('Invalid Parent Key Field: \'' + sld.Parent_Key_Field__c + '\'');
                String query = 'SELECT ' + sld.Parent_Key_Field__c + ' FROM ' + parentObject.dsor.getName() + ' WHERE Id = \'' + recordId + '\'';
                sObject s = Database.query(query);
                parentId = (s.get(sld.Parent_Key_Field__c) == null) ? null : String.valueOf(s.get(sld.Parent_Key_Field__c));
            }
            
            // Determine list parameters for LWC dependending on list type
            ListParameters result = new ListParameters(sld, baseObject, parentId);
            if (sld.Data_Source_Type__c == DATASOURCE_APEX)
                getApexListParameters(sld, slfs, result);
            else {
                getSOQLListParameters(sld, slfs, objectsCache, baseObject, result);
                result.namespace = UserInfo.getOrganizationName() == 'LabsDevFmedioni' ? '' : 'smartlists__';
            }
            // Build list of filters
            for (Smart_List_Filter__mdt slf : getListFilters(sld.Id)) {
                result.filters.add(new ListFilter(slf));
            }
            // Build list of standard actions for SOQL or Apex with Object
            if (sld.Data_Source_Type__c == DATASOURCE_SOQL_WITH_SHARING || sld.Data_Source_Type__c == DATASOURCE_SOQL_WITHOUT_SHARING || 
                (sld.Data_Source_Type__c == DATASOURCE_APEX && baseObject != null)) {
                if (baseObject.dsor.isCreateable() && (sld.Enable_CRUD_Actions__c || sld.Enable_New_Record_Action__c))
                    result.standardListActions.add(new ListAction('new_record', System.label.New));
                if (baseObject.dsor.isUpdateable() && (sld.Enable_CRUD_Actions__c || sld.Enable_Edit_Record_Action__c))
                    result.rowActions.add(new ListAction('edit_record', System.label.Edit));
                if (baseObject.dsor.isDeletable() && (sld.Enable_CRUD_Actions__c || sld.Enable_Delete_Record_Action__c))
                    result.rowActions.add(new ListAction('delete_record', System.label.Delete));
            }
            // Build list of standard actions for Files
            else if (sld.Data_Source_Type__c == DATASOURCE_FILES) {
                if (!flow && !result.community && FeatureManagement.checkPermission('SmartFilesList_Preview_Files')) {
                    result.standardListActions.add(new ListAction('preview_selected_files', System.label.PreviewSelectedFiles));
                    result.rowActions.add(new ListAction('preview_file', System.label.PreviewFile));
                }
                if (FeatureManagement.checkPermission('SmartFilesList_Download_Files')) {
                    result.standardListActions.add(new ListAction('download_selected_files', System.label.DownloadSelectedFiles));
                    result.standardListActions.add(new ListAction('download_all_files', System.label.DownloadAllFiles));
                    result.rowActions.add(new ListAction('download_file', System.label.Download));
                }
                if (FeatureManagement.checkPermission('SmartFilesList_Upload_Files')) {
                    result.standardListActions.add(new ListAction('upload_files', System.label.UploadFiles));
                }
                if (!flow && FeatureManagement.checkPermission('SmartFilesList_View_File_Details')) {
                    result.rowActions.add(new ListAction('view_file_details', System.label.ViewFileDetails));
                }
                if (FeatureManagement.checkPermission('SmartFilesList_Edit_File_Details')) {
                    result.rowActions.add(new ListAction('edit_file_details', System.label.EditFileDetails));
                }
                if (FeatureManagement.checkPermission('SmartFilesList_Delete_File')) {
                    result.rowActions.add(new ListAction('delete_file', System.label.Delete));
                }
                if (/*!result.community &&  */FeatureManagement.checkPermission('SmartFilesList_Upload_New_Version')) {
                    result.rowActions.add(new ListAction('upload_new_version', System.label.UploadNewVersion));
                }
                result.dontCheckFileExtension = FeatureManagement.checkPermission('SmartFilesList_Don_t_check_file_extension');
            }
            // Build list of list actions. If action permitted based on Custom Permission, check if it's available to running user
            for (Smart_List_Action__mdt sla : getListActions(sld.Id)) {
                Boolean canAdd = true;
                if (sla.Custom_Permission__c != null)
                    canAdd = FeatureManagement.checkPermission(sla.Custom_Permission__c);
                if (canAdd && sla.type__c == 'List Action')
                    result.customListActions.add(new ListAction(sla));
                else if (canAdd && sla.type__c == 'Row Action')
                    result.rowActions.add(new ListAction(sla));
            }
            // Return list parameters as JSON to LWC
            return JSON.serialize(result);
        } catch (Exception e) {
            System.debug(e.getMessage() + '###' + e.getStackTraceString());
            throw new AuraHandledException(e.getMessage() + '###' + e.getStackTraceString());
        }
    }

    /*
        Entry of the object cache used for getDr: avoid calling apex several time for the same describe
        - dsor: Apex description of the object
        - dfrMap: Map of Apex descriptions of the fields of the object
     */
    public class ObjectCacheEntry {
        Schema.SObjectType type = null;
        Schema.DescribeSObjectResult dsor;
        Map<String, Schema.SObjectField> dfrMap;

        // Constructor: create entry for a SObject Type
        public ObjectCacheEntry(Schema.SObjectType type) {
            this.type = type;
            if (type != null) {
                this.dsor = type.getDescribe();
                this.dfrMap = dsor.fields.getMap();
            }
        }

        // Check if field exists on the object
        public Boolean fieldExists(String field) {
            return dfrMap.containsKey(field);
        }

        // Describe a field of the object
        public Schema.DescribeFieldResult describeField(String field) {
            return dfrMap.get(field).getDescribe();
        }
    }

    /*
        Objects Cache used for optimizing the validation of the list definition
    */
    public class ObjectsCache {
        Map<Schema.SObjectType, ObjectCacheEntry> objectTypeMap = new Map<Schema.SObjectType, ObjectCacheEntry>();
        Map<String, ObjectCacheEntry> objectNameMap = new Map<String, ObjectCacheEntry>();

        // Retrieve an object from a SObjectType. The object is automatically added to the cache if it wasn't already
        public ObjectCacheEntry get(Schema.SObjectType type) {
            ObjectCacheEntry result = objectTypeMap.get(type);
            if (result == null) {
                result = new ObjectCacheEntry(type);
                objectTypeMap.put(type, result);
                objectNameMap.put(result.dsor.getName(), result);
            }
            return result;
        }

        // Retrieve an object from an object name
        // If the name of the object is invalid, returns null
        // The object is automatically added to the cache if it wasn't already
        public ObjectCacheEntry get(String name) {
            ObjectCacheEntry result = objectNameMap.get(name);
            if (result == null) {
                Type t = Type.forName(name);
                if (t != null) {
                    SObject sobj = (SObject)t.newInstance();
                    result = new ObjectCacheEntry(sobj.getSObjectType());
                    objectTypeMap.put(result.type, result);
                    objectNameMap.put(name, result);
                }
            }
            return result;
        }
    }

    /*
        Build LWC list parameters for a SQOL/Files list type
        - sld: custom metadata of the list definition
        - slfs: list of custom metadata of the fields
        - result: instance of ListParameters used for formatting resulting JSON for LWC
     */
    private static void getSOQLListParameters(Smart_List_Definition__mdt sld, Smart_List_Field__mdt[] slfs, 
        ObjectsCache objectsCache, ObjectCacheEntry baseObject, ListParameters result) {
        // SOQL query
        String queryFields = '';
        // List of fields that need to be added to the SOQL query
        Set<String> additionalFields = new Set<String>();
        List<Schema.RecordTypeInfo> rtis = baseObject.dsor.getRecordTypeInfos();
        Boolean hasRecordType = false;
        Boolean isExternalObject = result.objectName.endsWith('__x');
        // Process list fields
        for (Smart_List_Field__mdt slf : slfs) {
            // Cannot add field twice to the list because will trigger SOQL error
            if (result.fields.containsKey(slf.Field_Name__c))
                throw new SmartListException('Field \'' + slf.Field_Name__c + '\' cannot be added twice');
            if (slf.Field_Name__c == RECORDTYPE_FIELD)
                hasRecordType = true;
            // Get Apex definition of the field
            GetDfrResult gdr = getDfr(slf.Field_Name__c, slf, baseObject, objectsCache);
            if (gdr != null) {
                if (!String.isEmpty(slf.Hyperlink_to_Detail_Id_Field__c))
                    additionalFields.add(slf.Hyperlink_to_Detail_Id_Field__c);
                FieldDefinition fd = new FieldDefinition(slf, gdr, rtis, isExternalObject);
                if (slf.Default_Sort_Field__c) {
                    // Check if default sort field is sortable
                    if (!fd.sortable)
                        throw new SmartListException('Field \'' + slf.Field_Name__c + '\' cannot be the Default Sort Field because it is not sortable');
                    result.defaultSortField = fd.name;
                }
                // Make sure badge style field exists and is added to the query
                if (slf.Display_as_Badge__c) {
                    if (!baseObject.fieldExists(slf.Badge_Style_Field__c))
                        throw new SmartListException('Field \'' + slf.Field_Name__c + '\': Invalid Badge Style field \'' + slf.Badge_Style_Field__c + '\'');
                    additionalFields.add(slf.Badge_Style_Field__c);
                }
                result.fields.put(fd.name, fd);
                String columnName = fd.name;
                // Query picklist fields with toLabel to make sure they are translated in the list
                if (!isExternalObject && (fd.type == Schema.DisplayType.PICKLIST.name() || fd.type == Schema.DisplayType.MULTIPICKLIST.name()))
                    columnName = 'toLabel(' + columnName + ')';
                    queryFields += String.isNotEmpty(queryFields) ? ', ' + columnName : columnName;
                }
        }
        // Trigger error if running user doesn't have access to the fields of the list
        if (result.fields.size() == 0)
            throw new SmartListException('The current users doesn\'t have access to the fields of the list');
        // Add record id to the query: needed for datable key and actions
        if (!result.fields.containsKey('Id'))
            additionalFields.add('Id');
        // Add tech fields for Files
        if (sld.Data_Source_Type__c == DATASOURCE_FILES) {
            if (!result.fields.containsKey('ContentDocumentId'))
                additionalFields.add('ContentDocumentId');
            if (!result.fields.containsKey('ContentSize'))
            additionalFields.add('ContentSize');
        }
        // Add RecordTypeId
        if (!hasRecordType && result.recordTypes.size() > 0 && !result.fields.containsKey('RecordTypeId'))
            additionalFields.add('RecordTypeId');
        // Create LWC field definition for additional fields and add them to the query
        for (String additionalField : additionalFields) {
            if (!result.fields.containsKey(additionalField)) {
                queryFields += ', ' + additionalField;
            }
        }
        result.queryFields = queryFields;
    }

    /*
        Build LWC list parameters for an Apex list type
        - sld: custom metadata of the list definition
        - slfs: list of custom metadata of the fields
        - result: instance of ListParameters used for formatting resulting JSON for LWC
     */
    private static void getApexListParameters(Smart_List_Definition__mdt sld, Smart_List_Field__mdt[] slfs, ListParameters result) {
        Type t = Type.forName(result.dataProviderClass);
        if (t == null)
            throw new SmartListException('The Data Provider Class \'' + result.dataProviderClass + '\' does not exist or is not global');
        try {
            SmartListApexSourceInterface2 queryInterface = (SmartListApexSourceInterface2)t.newInstance();
        } catch (Exception e) {
            throw new SmartListException('The Data Provider Class \'' + result.dataProviderClass + '\' must implement SmartListApexSourceInterface2');
        }
        for (Smart_List_Field__mdt slf : slfs) {
            if (slf.Default_Sort_Field__c)
                    result.defaultSortField = slf.Field_Name__c;
            result.fields.put(slf.Field_Name__c, new FieldDefinition(slf));
        }
    }

    /*
        Result of a call to getDfr
        - dfr: Apex definition of the field
        - relDfr: Apex definition of the related field
        - relDsor: Apex definition of the related object
        - lookupTitleField: API name of the title field of the related object for the lookup
        - lookupHasQueues: true is if dfr = OwnerId and owner on related object can be a queue for the lookup
     */
    public class GetDfrResult {
        Schema.DescribeFieldResult dfr = null;
        Schema.DescribeFieldResult relDfr = null;
        Schema.DescribeSObjectResult relDsor = null;
        String lookupTitleField = null;
        Boolean lookupHasQueue = false;
    }

    /*
        Get the Apex Definition of a field
        - field: name of the field
        - slf: custom metadata definition of the field
        - objectType: SObjectType of the list
        - objectsCache: map of Apex object definition and fields - Avoid describing the same related object several times by caching
     */
    private static GetDfrResult getDfr(String field, Smart_List_Field__mdt slf, ObjectCacheEntry baseObject, ObjectsCache objectsCache) {
        GetDfrResult gdr = new GetDfrResult();
        // Check if related field
        if (field.contains('.')) {
            String[] parts = field.split('\\.');
            ObjectCacheEntry currentOjbect = baseObject;
            ObjectCacheEntry relObject ;
            String hyperlinkIdField = '';
            for (Integer i = 0; i < parts.size() - 1; i++) {
                String relField = parts[i].endsWith('__r') ? parts[i].replace('__r', '__c') : parts[i] + 'Id';
                // Check if invalid relationship name
                if (!currentOjbect.fieldExists(relField))
                    throw new SmartListException('Field \'' + field + '\': The relationship \'' + parts[i] + '\' is invalid');
                gdr.relDfr = currentOjbect.describeField(relField);
                // If target related field is not accessible to the running user, don't add the field to the list
                if (!gdr.relDfr.isAccessible())
                    return null;
                // Check if unsupported polymorphic relationship
                if (gdr.relDfr.isNamePointing() && !(parts[i] == 'Owner' && parts[i + 1] == 'Name'))
                    throw new SmartListException('Field \'' + field + '\': Polymorphic relationships are not supported (' + relField + ')');
                // If target related object is not accessible to the running user, don't add the field to the list
                List <Schema.sObjectType> objects = gdr.relDfr.getReferenceTo();
                relObject = objectsCache.get(objects.get(0));
                gdr.relDsor = relObject.dsor;
                // If target related object is not accessible to the running user, don't add the field to the list
                if (!gdr.relDsor.isAccessible())
                    return null;
                // Check the validity of the related field
                if (i == parts.size() - 2) {
                    checkFieldValidity(parts[i + 1], relObject, gdr, field);
                    hyperlinkIdField += String.isEmpty(hyperlinkIdField) ? relField : '.' + relField;
                } else
                    hyperlinkIdField += String.isEmpty(hyperlinkIdField) ? parts[i] : '.' + parts[i];
                currentOjbect = relObject;
            }
            // Set default HyperlinkId Field for HYPERLINK_DETAIL if needed
            if (slf.Display_Type__c == TYPE_HYPERLINK_DETAIL && String.isEmpty(slf.Hyperlink_to_Detail_Id_Field__c))
                slf.Hyperlink_to_Detail_Id_Field__c = hyperlinkIdField;
            // Check validity of the lookup data if getDfr not called for additional/lookup fields
            if (slf != null && slf.Lookup_in_Quick_Filters__c ) {
                slf.Lookup_in_Quick_Filters__c = true;
                checkLookupValidity(field, slf, relObject, gdr);
            }
        } 
        // Base field
        else {
            // If field is RecordType, check if Record Type are available on the base object and prepare data for checking field validity
            if (field == RECORDTYPE_FIELD) {
                if (!baseObject.fieldExists('RecordTypeId'))
                    throw new SmartListException('Field \'' + field + '\': Record Types are not available on this object');
                    gdr.dfr = baseObject.describeField('RecordTypeId');
                    // If label not populated in Field Definition, populate with Record Type label
                    if (slf != null && String.isEmpty(slf.Field_Label__c)) {
                        ObjectCacheEntry rtObject = objectsCache.get('RecordType');
                        slf.Field_Label__c = rtObject.dsor.getLabel();
                    }
                } 
            // If field is Owner, check if Owner is available 
            else if (field == OWNER_FIELD) {
                if (!baseObject.fieldExists('OwnerId'))
                    throw new SmartListException('Field \'' + field + '\': Record Owner is not available on this object');
                ObjectCacheEntry userObject = objectsCache.get('User');
                gdr.relDsor = userObject.dsor;
                gdr.dfr = baseObject.describeField('OwnerId');
                // Check if owner field supports queues
                gdr.lookupHasQueue = (gdr.dfr.getReferenceTo().size() == 2);
                // If getDfr call not for additional fields
                if (slf != null) {
                    // Check validity of the lookup data
                    slf.Lookup_in_Quick_Filters__c = true;
                    checkLookupValidity(field, slf, userObject, gdr);
                    // If label not populated in Field Definition, populate with Owner label
                    if (String.isEmpty(slf.Field_Label__c)) 
                        slf.Field_Label__c = System.Label.Owner;
                }
            }
            // Other base field
            else {
                checkFieldValidity(field, baseObject, gdr, field);
                // Set HyperlinkId Field for HYPERLINK_DETAIL if needed
                if (slf != null && slf.Display_Type__c == TYPE_HYPERLINK_DETAIL && String.isEmpty(slf.Hyperlink_to_Detail_Id_Field__c))
                    slf.Hyperlink_to_Detail_Id_Field__c = 'Id';
                // Set HyperlinkId Field for FILE_PREVIEW if needed
                else if (slf != null && slf.Display_Type__c == TYPE_FILE_PREVIEW)
                    slf.Hyperlink_to_Detail_Id_Field__c = 'Id';
            }
        }
        // Check lookup 
        return gdr;
    }

    /*
        Check if the field exists on the target object and has a datatype supported by Smart Lists 
        - field: field name
        - entry: ObjectCacheEntry of target object
        - gdr: GetDfrResult for storing field describe
     */
    private static void checkFieldValidity(String field, ObjectCacheEntry entry, GetDfrResult gdr, String mainField) {
        // Check if field exists on the target object
        if (!entry.fieldExists(field))
            throw new SmartListException('Invalid Field Name \'' + mainField + '\'');
        Schema.DescribeFieldResult dfr = entry.describeField(field);
        // Check if field data type is supported
        if (dfr.getType() == Schema.DisplayType.ADDRESS || dfr.getType() == Schema.DisplayType.ANYTYPE ||
            dfr.getType() == Schema.DisplayType.BASE64 || dfr.getType() == Schema.DisplayType.COMPLEXVALUE || 
            dfr.getType() == Schema.DisplayType.DATACATEGORYGROUPREFERENCE ||
            dfr.getType() == Schema.DisplayType.SOBJECT || (dfr.getType() == Schema.DisplayType.TEXTAREA && dfr.isHtmlFormatted()))
            throw new SmartListException('Field \'' + field + '\' has a unnsupported data type \'' + dfr.getType() + '\'');
        gdr.dfr = dfr;
    }

    /*
        Check if a lookup field is valid: subtitle exists and has a supported data type
        Retrieve name field of the target object
        Clear subtitle if not accessible by running user
        - field: field name
        - slf: definition of the field
        - entry: ObjectCacheEntry of the related object
        - gdr: GetDfrResult for storing name field
    */
    private static void checkLookupValidity(String field, Smart_List_Field__mdt slf, ObjectCacheEntry entry, GetDfrResult gdr) {
        // Retrieve name field of the target object
        for (Schema.SObjectField sof : entry.dfrMap.values()) {
            Schema.DescribeFieldResult dfr = sof.getDescribe();
            if (dfr.isNameField()) {
                gdr.lookupTitleField = dfr.getName();
                //System.debug('Field ' + field + ' NameField ' + gdr.lookupTitleField);
                break;
            }
        }
        // Check subtitle validity: exist + string data type
        if (slf.Lookup_Subtitle_Field__c != null) {
            if (!entry.fieldExists(slf.Lookup_Subtitle_Field__c))
                throw new SmartListException('Field \'' + field + '\': Invalid Subtitle \'' + slf.Lookup_Subtitle_Field__c + '\'');
            Schema.DescribeFieldResult dfr = entry.describeField(slf.Lookup_Subtitle_Field__c);
            if (dfr.getType() != Schema.DisplayType.EMAIL && dfr.getType() !=  Schema.DisplayType.PHONE && dfr.getType() != Schema.DisplayType.PICKLIST && dfr.getType() != Schema.DisplayType.STRING)
                throw new SmartListException('Field \'' + field + '\': The Subtitle field \'' + slf.Lookup_Subtitle_Field__c + '\' has an invalid data type. Valid data types Email, Picklist, Phone or Text');
            // Remove subtitle if not accessible by running user
            slf.Lookup_Subtitle_Field__c = dfr.isAccessible() ? slf.Lookup_Subtitle_Field__c : null;
        }
    }
    
    /*
        Quick Filters Entry for a field
        - fieldName: field
        - operator: comparison operator
        - values: values entered in the Quick Filters for the field
        - type: field data type 
     */
    global class FilterEntry {
        @AuraEnabled
        global String fieldName  { get; set; }
        @AuraEnabled
        global String operator  { get; set; }
        @AuraEnabled
        global List<String> values  { get; set; }
        @AuraEnabled
        global String type  { get; set; }
    }
    
    /*
        Get a records page for the list
        - dataSourceType: SOQL, Files, Apex
        - dataProviderClass: for Apex list, class of the dataprovider
        - objectName: base object of the list
        - listFilter: where clause of the selected filter or blank for list without filters
        - soqlScope: selected SOQL scope or blank for list without scopes
        - queryField: fields to add to the SELECT
        - filterEntries: list of filtering criteria entered in the Quick Filters or blank if no filtering criteria in Quick Filters
        - parentIdField: for child list, field of the child object storing the id of the parent record. Blank for non-child list
        - parentId: for child list, id of the parent record. Blank for non-child list
        - sortField: field used for sorting the data
        - sortDirection: ASC, DESC
        - offset: offset of the page in the dataset
        - pageSize: number of records to return for the page
    */
    @AuraEnabled
    public static List<Object> getPage(String dataSourceType, String dataProviderClass, String objectName, String listFilter, String soqlScope, String queryFields, 
        List<FilterEntry> filterEntries, String parentIdField, String parentId, String sortField, String sortDirection, Integer offset, Integer pageSize){
        
        try {
            // Filter variables
            if (!String.isEmpty(listFilter)) {
                if (listFilter.contains('USERID'))
                    listFilter = listFilter.replaceAll('USERID', '\'' + UserInfo.getUserId() + '\'');
                if (listFilter.contains('PARENTID'))
                    listFilter = listFilter.replaceAll('PARENTID', '\'' + parentId + '\'');
            }
            // Calls the query interface for the data source type
            if (dataSourceType == DATASOURCE_APEX) {
                Type t = Type.forName(dataProviderClass);
                SmartListApexSourceInterface2 queryInterface = (SmartListApexSourceInterface2)t.newInstance();
                return queryInterface.getPage(new SmartListApexSourceGetPage().withScope(soqlScope).withFilter(listFilter).withFilterEntries(filterEntries).withParentIdField(parentIdField).withParentId(parentId).withSortField(sortField).withSortDirection(sortDirection).withOffset(offset).withPageSize(pageSize));
            } else
                return getInternalPage(dataSourceType, objectName, listFilter, soqlScope, queryFields, filterEntries, parentIdField, parentId, 
                sortField, sortDirection, offset, pageSize);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage() + '\n' + e.getStackTraceString());
        }
    }

    /*
        get a page for SOQL/Files list
        - dataSourceType: SOQL, Files, Apex
        - objectName: base object of the list
        - listFilter: where clause of the selected filter or blank for list without filters
        - soqlScope: selected SOQL scope or blank for list without scopes
        - queryField: fields to add to the SELECT
        - filterEntries: list of filtering criteria entered in the Quick Filters or blank if no filtering criteria in Quick Filters
        - parentIdField: for child list, field of the child object storing the id of the parent record. Blank for non-child list
        - parentId: for child list, id of the parent record. Blank for non-child list
        - sortField: field used for sorting the data
        - sortDirection: ASC, DESC
        - offset: offset of the page in the dataset
        - pageSize: number of records to return for the page
     */
    public static List<Object> getInternalPage(String dataSourceType, String objectName, String listFilter, String soqlScope, String queryFields, 
    List<FilterEntry> filterEntries, String parentIdField, String parentId, String sortField, String sortDirection, Integer offset, Integer pageSize) {
        String sosl = null;
        String whereClause = String.isEmpty(listFilter) ? '' : '(' + listFilter + ')';
        // For Files, retrieve ContentDocumentIds related to the parent record and add ids to where clause
        if (dataSourceType == DATASOURCE_FILES) {
            String cdIds = '';
            if (parentId == null)
                return new List<SObject>();
            for (ContentDocumentLink cdl : [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :parentId]){
                cdIds += String.isNotEmpty(cdIds) ? ', ' : '';
                cdIds += '\'' + cdl.ContentDocumentId + '\'';
            }
            if (String.isEmpty(cdIds))
                return new List<SObject>();
            whereClause += String.isNotEmpty(whereClause) ? ' AND ' : '';
            whereClause += 'ContentDocumentId IN(' + cdIds + ') AND isLatest = true AND FileType != \'SNOTE\'';
        }
        // For SOQL, add parent id to where clause
        else if (parentIdField != null) {
            if (parentId == null)
                return new List<SObject>();
            whereClause += String.isNotEmpty(whereClause) ? ' AND ' : '';
            whereClause += parentIdField + ' = \'' + parentId + '\'';
        }
        // Quick Filters where clause
        String panelFilter = '';
        if (filterEntries != null && filterEntries.size() > 0) {
            for (FilterEntry fe : filterEntries) {
                if (fe.fieldName == 'SOSLSearch') {
                    Pattern pattern = Pattern.compile('(\\\\|\\\'|\\?|\\&|\\||\\!|\\{|\\}|\\[|\\]|\\(|\\)|\\^|\\~|\\:|\\"|\\+|\\-)');
                    Matcher matcher = pattern.matcher(fe.values[0]);
                    sosl = matcher.replaceAll('\\\\$1');
                    break;
                }
            }
            panelFilter = buildFilter(filterEntries);
        }
        // Where clause
        if (String.isNotEmpty(whereClause)) {
            whereClause = ' WHERE ' + whereClause;
            if (String.isNotEmpty(panelFilter))
                whereClause +=  ' AND ' + panelFilter;
        }
        else if (String.isNotEmpty(panelFilter))
            whereClause = ' WHERE ' + panelFilter;
        // Scope not supported with external objects
        soqlScope = objectName.endsWith('__x') ? '' : soqlScope;
        // My Subordinates Scope
        if (soqlScope == SCOPE_MY_SUBORDINATES) {
            if (UserInfo.getUserRoleId() != null) {
                String subScope = 'Owner.UserRole.ParentRoleId = \'' + UserInfo.getUserRoleId() + '\'';
                if (String.isNotEmpty(whereClause))
                    whereClause += ' AND (' +subScope + ')';
                else
                    whereClause = ' WHERE ' + subScope;
                soqlScope = SCOPE_ALL;
            } else
                return new List<SObject>();
        }
        String scopeClause = String.isEmpty(soqlScope) ? '' : ' USING SCOPE ' + soqlScope;
        // Sort clause
        String sortClause = sortField == null ? '' : ' ORDER BY ' + sortField + ' ' + sortDirection;
        List<SObject> records;
        String className = dataSourceType == DATASOURCE_SOQL_WITH_SHARING || dataSourceType == DATASOURCE_FILES ? 'SmartListQueryWithSharing' : 'SmartListQueryWithoutSharing';
        Type t = Type.forName(className);
        SmartListQueryInterface queryInterface = (SmartListQueryInterface)t.newInstance();
        // SOQL / SOSL
        if (sosl == null) {
            String query = 'SELECT ' + queryFields + ' FROM ' + objectName + scopeClause + ' ' +
                whereClause + sortClause + ' LIMIT ' + pageSize + ' OFFSET ' + offset; 
            System.debug('Query ' + query);
            records = queryInterface.soqlQuery(query);
        } else  {
            if (soqlScope == SCOPE_MY)
                whereClause += ' AND (OwnerId =\'' + UserInfo.getUserId() + '\')';
            String query = 'FIND {' + sosl + '*} IN ALL FIELDS RETURNING ' + objectName  + ' (' + queryFields + 
                whereClause + sortClause + ' LIMIT '+ pageSize + ' OFFSET ' + offset + ')'; 
            System.debug('Query ' + query);
            records = queryInterface.soslQuery(query);
        }
        return records;
    }

    /*
        Build where clause for Quick Filters
        - filterEntries: list of Quick Filters criteria
    */
    global static String buildFilter(List<FilterEntry> filterEntries) {
        String whereClause = '';

        if (filterEntries != null && filterEntries.size() > 0) {
            for (FilterEntry fe : filterEntries) {
                // Don't add SOSL search to where clause
                if (fe.fieldName == 'SOSLSearch')
                    continue;
                String valueStr;
                // Build clause for string fields searched with =
                if (fe.operator == '=' && (fe.type == 'EMAIL' || fe.type == 'LOOKUP' || fe.type == 'PHONE' || fe.type == 'STRING' || fe.type == 'TEXTAREA' || fe.type == 'URL'))
                    valueStr = ' \'' + String.escapeSingleQuotes(fe.values[0]) + '\'';
                // Build clause for boolean fields
                else if (fe.operator == '=')
                    valueStr = ' ' + fe.values[0];
                // Build clause for range fields: number, date, time, datetime
                else if (fe.operator == '>=' || fe.operator == '<=') {
                    if (fe.type == 'TIME')
                        valueStr = ' ' + fe.values[0] + 'Z';
                    else if (fe.type == 'DATETIME') {
                        String[] parts = fe.values[0].split('-');
                        Datetime dt = DateTime.newInstance(Integer.valueOf(parts[0]), Integer.valueOf(parts[1]), 
                                                            Integer.valueOf(parts[2]), fe.operator == '>=' ? 0 : 23, fe.operator == '>=' ? 0 : 59, 
                                                            fe.operator == '>=' ? 0 : 59);
                        valueStr = dt.formatGmt('yyyy-MM-dd\'T\'HH:mm:ss.SSSZ');
                    } else
                        valueStr = ' ' + fe.values[0];
                }
                // Build clause for string fields searched with LIKE
                else if (fe.operator == 'LIKE')
                    valueStr = ' \'%' + String.escapeSingleQuotes(fe.values[0]) + '%\'';
                 // Build clause for string picklist
                 else if (fe.operator == 'IN' || fe.operator == 'INCLUDES') {
                    valueStr = '';
                    for (String value : fe.values) {
                        valueStr += valueStr.length() > 0 ? ', ' : '';
                        valueStr += '\'' + String.escapeSingleQuotes(value) +  + '\'';
                    }
                    valueStr = ' (' + valueStr + ')';
                }
                whereClause += (String.isEmpty(whereClause) ? '' : ' AND ') +  fe.fieldName + ' ' + fe.operator + valueStr;
            }
        }        
        return whereClause;
    }

    /*
        Retrieve a list record from the DB. Used to refresh a row after the execution of a flow action on the row
        - dataSourceType: SOQL, Files, Apex
        - dataProviderClass: for Apex list, class of the dataprovider
        - objectName: base object of the list
        - id: id of the record to retrieve
        - queryField: fields to add to the SELECT
    */
    @AuraEnabled
    public static List<Object> getRecord(String dataSourceType, String dataProviderClass, String id, String objectName, String queryFields){
        try {
            if (dataSourceType == DATASOURCE_APEX) {
                Type t = Type.forName(dataProviderClass);
                SmartListApexSourceInterface2 queryInterface = (SmartListApexSourceInterface2)t.newInstance();
                return queryInterface.getRecord(id);
            } else {
                String query = 'SELECT ' + String.escapeSingleQuotes(queryFields) + ' FROM ' + objectName + ' WHERE Id = :id';
                //System.debug('Query ' + id + ' -> ' + query);
                List<SObject> records =  Database.query(query);
                return records;
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage() + '\n' + e.getStackTraceString());
        }
    }

    /*
        Execute auto-launched flow
        - flowName: API name of the flow
        - records: list of records to be passed to the flow
     */
    @AuraEnabled
    public static Map<String, String> runFlow(String flowName, SObject[] records){
        try {
            Map<String, Object> inputs = new Map<String, Object>();
            inputs.put('records', records);
            Flow.Interview flow = Flow.Interview.createInterview(flowName, inputs);
            flow.start();
            Map<String,String> result = new Map<String,String>();
            result.put('successMsg', (String)flow.getVariableValue('successMsg'));
            result.put('errorMsg', (String)flow.getVariableValue('errorMsg'));
            return result;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage() + '\n' + e.getStackTraceString());
        }
    }

    /*
        Item returned for a lookup search
        - id: record id
        - title: record title value
        - subtitle: record subtitle value
     */
    public class LookupSearchResult {
        public String id;
        public String title;
        public String subtitle;

        public LookupSearchResult(String id, String title, String subtitle) {
            this.id = id;
            this.title = title;
            this.subtitle = subtitle;
        }
    }

    /*
        Get recently viewed records for lookup in Quick Filters
        - objectName: object for recent records
        - subtitleField: API name of the subtitle field 
    */
    @AuraEnabled
    public static String lookupGetRecentRecords(String objectName, String subtitleField) {
        List<LookupSearchResult> results = new List<LookupSearchResult>();
        List<RecentlyViewed> recentRecords = [
            SELECT Id, Name, LastViewedDate
            FROM RecentlyViewed
            WHERE Type = :objectName
            ORDER BY LastViewedDate DESC
            LIMIT 5
        ];
        // Convert recent records into LookupSearchResult
        Map<String, LookupSearchResult> resultsMap = new Map<String, LookupSearchResult>();
        String recIds = '';
        for (RecentlyViewed recentRecord : recentRecords) {
            resultsMap.put(recentRecord.Id, new LookupSearchResult(recentRecord.Id, recentRecord.Name, ''));
            String recId = '\'' + recentRecord.Id + '\'';
            recIds += recIds.length() == 0 ? recId : ', ' + recId;
        }
        // Retrieve subtitle field values and add them to the result
        if (String.isNotEmpty(recIds) && String.isNotEmpty(subtitleField)) {
            String query = 'SELECT Id, ' + subtitleField + ' FROM ' + objectName + ' WHERE Id IN (' + recIds + ')';
            List<SObject> records = Database.query(query);
            for (SObject record : records) {
                LookupSearchResult lsr = resultsMap.get((String)record.get('Id'));
                if (lsr != null)
                    lsr.subtitle = (String)record.get(subtitleField);
            }
        }
        return JSON.serialize(resultsMap.values());
    }

    /*
        SOSL Search for lookup in Quick Filters
        - searchTerm: search string
        - objectName: object to search
        - subtitleField: API name of the subtitle field 
     */
    @AuraEnabled
    public static String lookupSearchRecords(String searchTerm, String objectName, String titleField, String subtitleField) {
        // Execute search query
        String soslObject = objectName == 'Queue' ? 'Group' : objectName;
        String whereClause = objectName == 'Queue' ? ' WHERE Type = \'Queue\' ' : '';
        String orderBy = ' ORDER BY ' + titleField + (String.isEmpty(subtitleField) ? '' : ', ' + subtitleField);
        String query = 'FIND {*' + searchTerm + '*} RETURNING ' + soslObject  + ' (Id, ' + titleField + (String.isEmpty(subtitleField) ? '' : ', ' + subtitleField) + whereClause + orderBy + ' LIMIT 5)';
        //System.debug(query);
        List<List<SObject>> searchResults = Search.query(query);
        // Prepare results
        List<LookupSearchResult> results = new List<LookupSearchResult>();
        // Extract records & convert them into LookupSearchResult
        for (SObject obj : (List<SObject>) searchResults[0]) {
            results.add(new LookupSearchResult(obj.Id, (String)obj.get(titleField), String.isEmpty(subtitleField) ? '' : (String)obj.get(subtitleField)));
        }
        //System.debug(results);
        return JSON.serialize(results);
    }
}