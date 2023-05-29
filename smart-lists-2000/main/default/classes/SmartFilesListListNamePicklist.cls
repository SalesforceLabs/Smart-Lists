public with sharing class SmartFilesListListNamePicklist extends VisualEditor.DynamicPickList {
    static String propertyEmpty = '--None--';

    public override VisualEditor.DataRow getDefaultValue(){
        return null;
    }

    public override VisualEditor.DynamicPickListRows getValues() {
        VisualEditor.DynamicPickListRows  picklist = new VisualEditor.DynamicPickListRows();
        VisualEditor.DataRow defaultValue = new VisualEditor.DataRow(propertyEmpty, null);
        picklist.addRow(defaultValue);
        for (Smart_List_Definition__mdt sld : [SELECT DeveloperName, Label FROM Smart_List_Definition__mdt WHERE Data_Source_Type__c = 'Files']) {
            VisualEditor.DataRow value = new VisualEditor.DataRow(sld.Label, sld.DeveloperName);
            picklist.addRow(value);
        }
        return picklist;
    }
}