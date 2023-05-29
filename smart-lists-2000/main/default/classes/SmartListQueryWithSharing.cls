public with sharing class SmartListQueryWithSharing implements SmartListQueryInterface {
    public List<SObject> soqlQuery(String query) {
        return Database.query(query);
    }

    public List<SObject> soslQuery(String query) {
        List<List<SObject>>searchList = Search.query(query);
        return (List<SObject>) searchList.get(0);
    }
}