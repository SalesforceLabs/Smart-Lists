public without sharing class SmartListQueryWithoutSharing implements SmartListQueryInterface {
    public List<SObject> soqlQuery(String query) {
        return Database.query(query, AccessLevel.SYSTEM_MODE);
    }

    public List<SObject> soslQuery(String query) {
        List<List<SObject>>searchList = Search.query(query, AccessLevel.SYSTEM_MODE);
        return (List<SObject>) searchList.get(0);
    }
}