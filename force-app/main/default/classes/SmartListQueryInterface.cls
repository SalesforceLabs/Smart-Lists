public interface SmartListQueryInterface {
    List<SObject> soqlQuery(String query);
    List<SObject> soslQuery(String query);
}