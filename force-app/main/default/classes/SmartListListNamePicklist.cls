global with sharing class SmartListListNamePicklist extends VisualEditor.DynamicPickList {
    private static VisualEditor.DataRow defaultValue = new VisualEditor.DataRow('--None--', null);
    private static VisualEditor.DynamicPickListRows picklist;

    global override VisualEditor.DataRow getDefaultValue(){
        return defaultValue;
    }

    global override VisualEditor.DynamicPickListRows getValues() {
        if (picklist == null) {
            picklist = new VisualEditor.DynamicPickListRows();
            VisualEditor.DataRow defaultValue = defaultValue;
            picklist.addRow(defaultValue);
            for (Smart_List_Definition__mdt sld : [SELECT DeveloperName, Label FROM Smart_List_Definition__mdt WHERE Data_Source_Type__c != 'Files' ORDER BY Label]) {
                VisualEditor.DataRow value = new VisualEditor.DataRow(sld.Label, sld.DeveloperName);
                picklist.addRow(value);
            }
        }
        return picklist;
    }
}