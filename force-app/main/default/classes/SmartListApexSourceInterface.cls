global interface SmartListApexSourceInterface {
    List<Map<String, Object>> getPage(String scope, String filter, List<SmartListController.FilterEntry> filterEntries, 
    String sortField, String sortDirection, Integer offset, Integer pageSize);
    
    List<Map<String, Object>>  getRecord(String id);
}