global with sharing class SmartListApexSourceGetPage {
    String scope;
    String filter;
    List<SmartListController.FilterEntry> filterEntries;
    String parentIdField;
    String parentId;
    String sortField;
    String sortDirection; 
    Integer offset;
    Integer pageSize;

    global SmartListApexSourceGetPage withScope(String scope) {
        this.scope = scope;
        return this;
    }

    global String getScope() {
        return this.scope;
    }

    global SmartListApexSourceGetPage withFilter(String filter) {
        this.filter = filter;
        return this;
    }

    global String getFilter() {
        return this.filter;
    }

    global SmartListApexSourceGetPage withFilterEntries(List<SmartListController.FilterEntry> filterEntries) {
        this.filterEntries = filterEntries;
        return this;
    }

    global List<SmartListController.FilterEntry> getFilterEntries() {
        return this.filterEntries;
    }

    global SmartListApexSourceGetPage withParentIdField(String parentIdField) {
        this.parentIdField = parentIdField;
        return this;
    }

    global String getParentIdField() {
        return this.parentIdField;
    }

    global SmartListApexSourceGetPage withParentId(String parentId) {
        this.parentId = parentId;
        return this;
    }

    global String getParentId() { 
        return this.parentId;
    }

    global SmartListApexSourceGetPage withSortField(String sortField) {
        this.sortField = sortField;
        return this;
    }

    global String getSortField() {
        return this.sortField;
    }

    global SmartListApexSourceGetPage withSortDirection(String sortDirection) {
        this.sortDirection = sortDirection;
        return this;
    }

    global String getSortDirection() {
        return this.sortDirection;
    }

    global SmartListApexSourceGetPage withOffset(Integer offset) {
        this.offset = offset;
        return this;
    }

    global Integer getOffset() {
        return this.offset;
    }

    global SmartListApexSourceGetPage withPageSize(Integer pageSize) {
        this.pageSize = pageSize;
        return this;
    }

    global Integer getPageSize() {
        return this.pageSize;
    }
}