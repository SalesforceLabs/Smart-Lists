public with sharing class SmartListQueryWithSharing implements SmartListQueryInterface {
    public List<SObject> soqlQuery(String query) {
        return Database.query(query, AccessLevel.USER_MODE);
    }

    public List<SObject> soslQuery(String query) {
        List<List<SObject>>searchList = Search.query(query, AccessLevel.USER_MODE);
        return (List<SObject>) searchList.get(0);
    }
}